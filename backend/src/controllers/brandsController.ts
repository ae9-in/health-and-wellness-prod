import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createNotification } from './notificationsController';
import { ApprovalStatus } from '@prisma/client';

async function ensureBrand(userId: string) {
  const brand = await prisma.brand.findUnique({ where: { userId } });
  if (!brand) throw new Error('Brand profile not found');
  return brand;
}

function normalizeImageUrls(input?: string | string[]): string[] {
  if (!input) return [];
  const values = Array.isArray(input) ? input : [input];
  return values
    .flatMap(value => value.split(','))
    .map(value => value.trim())
    .filter(Boolean);
}

export async function createProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const brand = await ensureBrand(userId);
    const { name, category, description, images, imageUrls, price, commissionRate, stock, variants } = req.body;
    
    let parsedVariants = null;
    if (variants) {
      try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      } catch (err) {
        console.error('Failed to parse variants:', err);
      }
    }

    const priceValue = parseFloat(price);
    const commissionValue = parseFloat(commissionRate ?? 0);
    const stockValue = Math.floor(Number(stock) || 0);
    
    if (Number.isNaN(priceValue) || Number.isNaN(stockValue) || Number.isNaN(commissionValue)) {
      res.status(400).json({ error: 'Price, commission rate, and stock must be valid numbers' });
      return;
    }

    const files = req.files as Express.Multer.File[] | undefined;
    const product = await prisma.product.create({
      data: {
        brandId: brand.id,
        name: name.trim(),
        category,
        description: description.trim(),
        images: [
          ...normalizeImageUrls(imageUrls || images), // Look for both for compatibility
          ...(files?.map(f => `/uploads/${f.filename}`) ?? [])
        ],
        price: priceValue,
        commissionRate: commissionValue,
        stock: stockValue,
        variants: parsedVariants || undefined,
        status: ApprovalStatus.PENDING,
      },
    });

    await createNotification(
      req as any,
      userId,
      'PRODUCT_APPROVAL_STATUS',
      `Your product "${name}" was successfully submitted and is waiting for Admin approval.`,
      { productId: product.id }
    );
    (req as any).io?.emit(`notification:${userId}`, {
      message: `Your product "${name}" was successfully submitted and is waiting for Admin approval.`
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error('Create product error:', error);
    const message = error instanceof Error ? error.message : 'Unable to create product';
    // Return detailed error for debugging
    res.status(500).json({ error: message, details: error instanceof Error ? error.stack : error });
  }
}

export async function listBrandProducts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const brand = await ensureBrand(userId);
    const products = await prisma.product.findMany({
      where: { brandId: brand.id },
      include: {
        affiliateLinks: {
          include: {
            affiliate: {
              include: {
                user: true,
              },
            },
          },
        },
        commissions: {
          include: {
            affiliate: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
    res.json(products);
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({ error: 'Unable to list products' });
  }
}

export async function updateProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { productId } = req.params as { productId: string };
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const brand = await ensureBrand(userId);
    const { name, category, description, images, imageUrls, price, commissionRate, stock, variants } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (category) updateData.category = category;
    if (description) updateData.description = description.trim();
    
    if (price !== undefined) updateData.price = parseFloat(price);
    if (commissionRate !== undefined) updateData.commissionRate = parseFloat(commissionRate);
    if (stock !== undefined) updateData.stock = Math.floor(Number(stock));

    if (variants) {
      try {
        updateData.variants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      } catch (err) {
        console.error('Failed to parse variants for update:', err);
      }
    }

    const files = req.files as Express.Multer.File[] | undefined;
    const existingImages = normalizeImageUrls(imageUrls || images);
    const newFiles = files?.map(f => `/uploads/${f.filename}`) ?? [];
    
    if (existingImages.length > 0 || newFiles.length > 0) {
      updateData.images = [...existingImages, ...newFiles];
    }

    const product = await prisma.product.updateMany({
      where: { id: productId, brandId: brand.id },
      data: updateData,
    });

    if (product.count === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { 
        brand: { 
          select: { 
            id: true, 
            user: { select: { fullName: true } } 
          } 
        } 
      }
    });

    if (updatedProduct) {
      (req as any).io.emit('product:updated', updatedProduct);
    }
    
    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Unable to update product' });
  }
}

export async function deleteProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { productId } = req.params as { productId: string };;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const brand = await ensureBrand(userId);
    await prisma.product.deleteMany({ where: { id: productId, brandId: brand.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Unable to delete product' });
  }
}

export async function getBrandDashboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const brand = await ensureBrand(userId);
    const products = await prisma.product.findMany({ where: { brandId: brand.id }, include: { commissions: true } });
    const totalSales = products.reduce((sum, product) => sum + product.commissions.reduce((pSum, comm) => pSum + comm.salesCount, 0), 0);
    const totalCommission = products.reduce((sum, product) => sum + product.commissions.reduce((pSum, comm) => pSum + comm.amount, 0), 0);
    res.json({
      brand: {
        totalProducts: products.length,
        totalSales,
        totalCommission,
      },
    });
  } catch (error) {
    console.error('Brand dashboard error:', error);
    res.status(500).json({ error: 'Unable to load brand dashboard' });
  }
}

export async function getBrandNotifications(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        type: { in: ['NEW_AFFILIATE_PROMOTION', 'PRODUCT_SALES_UPDATE', 'PRODUCT_APPROVAL_STATUS'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ notifications });
  } catch (error) {
    console.error('Brand notifications error:', error);
    res.status(500).json({ error: 'Unable to fetch notifications' });
  }
}

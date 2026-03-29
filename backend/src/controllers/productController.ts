import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const { category, brandId, minPrice, maxPrice, popular, search, limit } = req.query;

    const where: any = {
      status: 'APPROVED',
    };

    if (category) {
      where.category = { contains: category as string, mode: 'insensitive' };
    }

    if (brandId) {
      where.brandId = brandId as string;
    }

    if (popular === 'true') {
      where.isPopular = true;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    if (search) {
      const searchStr = search as string;
      where.OR = [
        { name: { contains: searchStr, mode: 'insensitive' } },
        { description: { contains: searchStr, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        brand: true,
      },
      take: limit ? (isNaN(parseInt(String(limit))) ? undefined : parseInt(String(limit))) : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Unable to fetch products' });
  }
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
      },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product by id error:', error);
    res.status(500).json({ error: 'Unable to fetch product' });
  }
}

// Get all approved brands for filtering
export async function getPublicBrands(req: Request, res: Response): Promise<void> {
  try {
    const brands = await prisma.brand.findMany({
      where: { status: 'APPROVED' },
      select: { id: true, userId: true, name: true },
      orderBy: { name: 'asc' }
    });
    res.json(brands);
  } catch (error) {
    console.error('Get public brands error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

import { Response } from 'express';
import { ApprovalStatus } from '@prisma/client';
import { Server } from 'socket.io';
import prisma from '../lib/prisma';
import { createNotification } from './notificationsController';

type RealtimeRequest = { io?: Server };

export async function listAffiliateApplications(_req: any, res: Response): Promise<void> {
  try {
    const affiliates = await prisma.affiliate.findMany({
      include: { user: true },
    });
    res.json({ affiliates });
  } catch (error) {
    console.error('List affiliates error:', error);
    res.status(500).json({ error: 'Unable to list affiliates' });
  }
}

export async function reviewAffiliate(req: any & RealtimeRequest, res: Response): Promise<void> {
  try {
    const { affiliateId } = req.params;
    const { status } = req.body;
    if (!Object.values(ApprovalStatus).includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const affiliate = await prisma.affiliate.update({
      where: { id: affiliateId },
      data: { status },
      include: { user: true },
    });

    if (status === 'APPROVED') {
      const { ensureAffiliateCoupon } = require('../lib/coupon');
      await ensureAffiliateCoupon({ 
        affiliateId: affiliate.id, 
        baseName: affiliate.user.fullName 
      });
    }

    await createNotification(
      req,
      affiliate.userId,
      'NEW_PARTNERSHIP',
      `Your affiliate application is now ${status.toLowerCase()}.`,
      { status }
    );
    req.io?.emit('approvals:affiliate', affiliate);

    res.json({ affiliate });
  } catch (error) {
    console.error('Review affiliate error:', error);
    res.status(500).json({ error: 'Unable to update affiliate status' });
  }
}

export async function listBrandApplications(_req: any, res: Response): Promise<void> {
  try {
    const brands = await prisma.brand.findMany({
      include: { user: true },
    });
    res.json({ brands });
  } catch (error) {
    console.error('List brands error:', error);
    res.status(500).json({ error: 'Unable to list brand applications' });
  }
}

export async function reviewBrand(req: any & RealtimeRequest, res: Response): Promise<void> {
  try {
    const { brandId } = req.params;
    const { status } = req.body;
    if (!Object.values(ApprovalStatus).includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const brand = await prisma.brand.update({
      where: { id: brandId },
      data: { status },
      include: { user: true },
    });

    await createNotification(
      req,
      brand.userId,
      'NEW_PARTNERSHIP',
      `Your brand application is now ${status.toLowerCase()}.`,
      { status }
    );

    if (status === 'APPROVED') {
      const affiliates = await prisma.affiliate.findMany({ select: { userId: true } });
      for (const aff of affiliates) {
        await createNotification(
          req,
          aff.userId,
          'NEW_PARTNERSHIP',
          `New brand partner: ${brand.name} has joined the platform!`,
          { brandId: brand.id }
        );
      }
    }
    req.io?.emit('approvals:brand', brand);

    res.json({ brand });
  } catch (error) {
    console.error('Review brand error:', error);
    res.status(500).json({ error: 'Unable to update brand status' });
  }
}

export async function listAdminProducts(_req: any, res: Response): Promise<void> {
  try {
    const products = await prisma.product.findMany({
      include: { brand: { include: { user: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ products });
  } catch (error) {
    console.error('List admin products error:', error);
    res.status(500).json({ error: 'Unable to list products' });
  }
}

export async function deleteAdminProduct(req: any & RealtimeRequest, res: Response): Promise<void> {
  try {
    const { productId } = req.params;
    await prisma.product.delete({ where: { id: productId } });
    req.io?.emit('approvals:product_deleted', { id: productId });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete admin product error:', error);
    res.status(500).json({ error: 'Unable to delete product' });
  }
}

export async function reviewProduct(req: any & RealtimeRequest, res: Response): Promise<void> {
  try {
    const { productId } = req.params;
    const { status } = req.body;
    if (!Object.values(ApprovalStatus).includes(status as ApprovalStatus)) {
      res.status(400).json({ error: 'Invalid product status' });
      return;
    }
    
    const product = await (prisma.product as any).update({
      where: { id: productId },
      data: { status: status as ApprovalStatus },
      include: { brand: { include: { user: true } } },
    });

    await createNotification(
      req,
      product.brand.userId,
      'PRODUCT_APPROVAL_STATUS',
      `Your product "${product.name}" has been ${status.toLowerCase()}.`,
      { productId }
    );
    
    req.io?.emit('approvals:product', product);
    req.io?.emit('product:updated', product);

    res.json({ product });
  } catch (error) {
    console.error('Review product error:', error);
    res.status(500).json({ error: 'Unable to update product status' });
  }
}
export async function deleteBrand(req: any & RealtimeRequest, res: Response): Promise<void> {
  try {
    const { brandId } = req.params;
    await prisma.brand.delete({ where: { id: brandId } });
    req.io?.emit('approvals:brand_deleted', { id: brandId });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({ error: 'Unable to delete brand' });
  }
}

export async function deleteAffiliate(req: any & RealtimeRequest, res: Response): Promise<void> {
  try {
    const { affiliateId } = req.params;
    await prisma.affiliate.delete({ where: { id: affiliateId } });
    req.io?.emit('approvals:affiliate_deleted', { id: affiliateId });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete affiliate error:', error);
    res.status(500).json({ error: 'Unable to delete affiliate' });
  }
}

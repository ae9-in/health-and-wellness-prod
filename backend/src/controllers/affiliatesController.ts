import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export async function submitAffiliateProfile(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  try {
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { socialLinks, interests } = req.body;
    const affiliate = await prisma.affiliate.upsert({
      where: { userId },
      update: {
        socialLinks,
        interests,
      },
      create: {
        userId,
        socialLinks,
        interests,
      },
    });

    res.json({ affiliate });
  } catch (error) {
    console.error('Affiliate profile error:', error);
    res.status(500).json({ error: 'Unable to save affiliate profile' });
  }
}

export async function getAffiliateDashboard(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  try {
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId },
      include: { commissions: true, affiliateLinks: true, coupon: true },
    });

    if (!affiliate) {
      res.status(404).json({ error: 'Affiliate not found' });
      return;
    }

    const totalEarnings = affiliate.commissions.reduce((sum, item) => sum + item.amount, 0);
    const totalSales = affiliate.commissions.reduce((sum, item) => sum + item.salesCount, 0);
    const conversionRate = affiliate.affiliateLinks.length ? Math.min(100, Math.round((totalSales / affiliate.affiliateLinks.length) * 100)) : 0;
    const pendingEarnings = totalEarnings * 0.25;

    res.json({
      status: affiliate.status,
      interests: affiliate.interests || [],
      earnings: {
        total: totalEarnings,
        pending: pendingEarnings,
        totalSales,
        conversionRate,
      },
      coupon: affiliate.coupon
        ? {
            code: affiliate.coupon.code,
            commissionPercent: affiliate.coupon.commissionPercent,
            enabled: affiliate.coupon.enabled,
            usesCount: affiliate.coupon.usesCount,
            totalRevenue: affiliate.coupon.totalRevenue,
          }
        : null,
    });
  } catch (error) {
    console.error('Affiliate dashboard error:', error);
    res.status(500).json({ error: 'Unable to load affiliate dashboard' });
  }
}

export async function calculateEarnings(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { commissionPerProduct, numberOfSales } = req.body;
    const daily = (commissionPerProduct || 0) * (numberOfSales || 0);
    res.json({
      daily: Number(daily.toFixed(2)),
      monthly: Number((daily * 30).toFixed(2)),
      yearly: Number((daily * 365).toFixed(2)),
    });
  } catch (error) {
    console.error('Earn calc error:', error);
    res.status(500).json({ error: 'Unable to calculate earnings' });
  }
}

export async function getAffiliateNotifications(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        type: { in: ['NEW_PARTNERSHIP', 'COMMISSION_EARNED', 'PAYMENT_PROCESSED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ notifications });
  } catch (error) {
    console.error('Affiliate notifications error:', error);
    res.status(500).json({ error: 'Unable to fetch notifications' });
  }
}

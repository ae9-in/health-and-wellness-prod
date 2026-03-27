import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { getNextPayoutDate } from '../utils/payoutUtils';

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

    let affiliate = await (prisma.affiliate as any).findUnique({
      where: { userId },
      include: { 
        commissions: {
          include: { product: true }
        }, 
        affiliateLinks: true, 
        coupon: true, 
        user: true,
        commissionRequests: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
    });

    // Fetch Last Payout Batch
    const lastPayout = await (prisma as any).payoutBatch.findFirst({
      where: { affiliateId: affiliate?.id, status: 'PAID' },
      orderBy: { payoutDate: 'desc' }
    });

    const nextPayoutDate = getNextPayoutDate();

    if (!affiliate) {
      res.status(404).json({ error: 'Affiliate not found' });
      return;
    }

    // Lazy create coupon if approved but missing
    if (affiliate.status === 'APPROVED' && !affiliate.coupon) {
      const { ensureAffiliateCoupon } = require('../lib/coupon');
      await ensureAffiliateCoupon({ 
        affiliateId: affiliate.id, 
        baseName: (affiliate as any).user.fullName 
      });
      // Re-fetch to get the coupon
      affiliate = await prisma.affiliate.findUnique({
        where: { userId },
        include: { 
          commissions: true, 
          affiliateLinks: true, 
          coupon: true, 
          user: true,
          commissionRequests: {
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
      }) as any;
    }

    const totalEarnings = (affiliate as any).commissions.reduce((sum: number, item: any) => sum + item.amount, 0);
    const totalSales = (affiliate as any).commissions.reduce((sum: number, item: any) => sum + item.salesCount, 0);
    const conversionRate = affiliate.affiliateLinks.length ? Math.min(100, Math.round((totalSales / affiliate.affiliateLinks.length) * 100)) : 0;
    
    // Sum of commissions that are APPROVED but not yet PAID (status PENDING or APPROVED)
    // Actually, user said only "approved" earnings are eligible.
    const pendingPayoutAmount = (affiliate as any).commissions
      .filter((c: any) => c.status === 'APPROVED')
      .reduce((sum: number, item: any) => sum + item.amount, 0);

    res.json({
      status: affiliate.status,
      interests: affiliate.interests || [],
      customCommission: (affiliate as any).customCommission,
      activeRequest: (affiliate as any).commissionRequests?.[0] || null,
      earnings: {
        total: totalEarnings,
        pending: pendingPayoutAmount,
        totalSales,
        totalRevenue: (affiliate as any).coupon?.totalRevenue || 0,
        conversionRate,
        nextPayoutDate: nextPayoutDate.toISOString(),
        lastPayout: lastPayout ? {
          amount: lastPayout.totalAmount,
          date: lastPayout.payoutDate.toISOString()
        } : null
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

export async function createCommissionRequest(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  try {
    const affiliate = await prisma.affiliate.findUnique({ where: { userId } });
    if (!affiliate) {
      res.status(404).json({ error: 'Affiliate not found' });
      return;
    }

    const { requestedCommission, reason, currentCommission } = req.body;

    // Check for pending requests
    const pending = await (prisma as any).commissionRequest.findFirst({
      where: { affiliateId: affiliate.id, status: 'PENDING' }
    });
    if (pending) {
      res.status(400).json({ error: 'You already have a pending commission request' });
      return;
    }

    const request = await (prisma as any).commissionRequest.create({
      data: {
        affiliateId: affiliate.id,
        currentCommission: Number(currentCommission),
        requestedCommission: Number(requestedCommission),
        reason,
        status: 'PENDING'
      }
    });

    res.json({ request });
  } catch (error) {
    console.error('Create commission request error:', error);
    res.status(500).json({ error: 'Unable to create commission request' });
  }
}

import { Request, Response } from 'express';
import { Role, ApprovalStatus, CommissionStatus, PayoutStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { requireAdminCredentials } from '../lib/adminConfig';
import { ensureAffiliateCoupon, regenerateAffiliateCoupon } from '../lib/coupon';

// Create a new user (admin)
export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { fullName, email, password, role = 'USER', mobile, city, age } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ error: 'Full name, email, and password are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role: role as Role,
        mobile,
        city,
        age: age ? parseInt(age, 10) : undefined,
      },
    });

    // Auto-create affiliate/brand profile if applicable
    if (role === 'AFFILIATE') {
      const affiliate = await prisma.affiliate.create({
        data: { userId: user.id, status: ApprovalStatus.PENDING },
      });
      await ensureAffiliateCoupon({ affiliateId: affiliate.id, baseName: fullName });
    }
    if (role === 'BRAND') {
      await prisma.brand.create({
        data: {
          userId: user.id,
          businessCategory: 'Unspecified',
          contactPerson: fullName,
          phone: mobile || '',
          address: '',
          website: '',
          status: ApprovalStatus.PENDING,
        },
      });
    }

    const responseData = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      blocked: user.blocked,
      createdAt: user.createdAt,
      role: user.role,
      mobile: user.mobile,
      city: user.city,
      age: user.age,
    };

    (req as any).io.emit('user:created', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Create a post as admin (admin token has no userId, so we look up by ADMIN_EMAIL)
export async function createAdminPost(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, category } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    let videoUrl = req.body.videoUrl;
    let audioUrl = req.body.audioUrl;
    let fileUrl = req.body.fileUrl;

    if (files) {
      if (files['video']) videoUrl = `/uploads/${files['video'][0].filename}`;
      if (files['audio']) audioUrl = `/uploads/${files['audio'][0].filename}`;
      if (files['file']) fileUrl = `/uploads/${files['file'][0].filename}`;
    }

    if (!title || !description || !category) {
      res.status(400).json({ error: 'Title, description, and category are required' });
      return;
    }

    const { email: adminEmail } = requireAdminCredentials();
    let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

    // Auto-create admin user record if not yet in DB (e.g., fresh DB)
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          fullName: 'Admin',
          password: 'admin-no-login',
          role: Role.ADMIN,
        },
      });
    }

    const post = await prisma.post.create({
      data: { title, description, category, videoUrl, audioUrl, fileUrl, authorId: adminUser.id },
      include: { author: { select: { id: true, fullName: true } } },
    });

    const responseData = {
      id: post.id,
      title: post.title,
      description: post.description,
      category: post.category,
      authorId: post.authorId,
      authorName: post.author.fullName,
      likes: [],
      comments: [],
      videoUrl: post.videoUrl,
      audioUrl: post.audioUrl,
      fileUrl: post.fileUrl,
      createdAt: post.createdAt.toISOString(),
    };

    (req as any).io.emit('post:created', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Admin create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get all users (admin)
export async function getAllUsers(_req: Request, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        blocked: true,
        createdAt: true,
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Block/unblock user (admin)
export async function toggleBlockUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { blocked: !user.blocked },
    });

    (req as any).io.emit('user:updated', updated);

    res.json({
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      blocked: updated.blocked,
    });
  } catch (error) {
    console.error('Toggle block error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Delete user (admin)
export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;
    await prisma.user.delete({ where: { id: userId } });
    (req as any).io.emit('user:deleted', { userId });
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get admin dashboard stats
export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  try {
    const [totalUsers, totalPosts, totalSessions, totalPayments, partnerships, totalAffiliates, totalBrands] =
      await Promise.all([
        prisma.user.count(),
        prisma.post.count(),
        prisma.session.count(),
        prisma.payment.aggregate({ _sum: { amount: true } }),
        prisma.partnership.count(),
        prisma.affiliate.count(),
        prisma.brand.count(),
      ]);

    res.json({
      totalUsers,
      totalPosts,
      totalSessions,
      totalRevenue: totalPayments._sum.amount || 0,
      totalPartnerships: partnerships,
      totalAffiliates,
      totalBrands,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get all payments (admin)
export async function getAllPayments(_req: Request, res: Response): Promise<void> {
  try {
    const payments = await prisma.payment.findMany({
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Update post (admin)
export async function updatePost(req: Request, res: Response): Promise<void> {
  try {
    const postId = req.params.postId as string;
    const { title, description, category } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    let videoUrl = req.body.videoUrl;
    let audioUrl = req.body.audioUrl;
    let fileUrl = req.body.fileUrl;

    if (files) {
      if (files['video']) videoUrl = `/uploads/${files['video'][0].filename}`;
      if (files['audio']) audioUrl = `/uploads/${files['audio'][0].filename}`;
      if (files['file']) fileUrl = `/uploads/${files['file'][0].filename}`;
    }

    const post = await prisma.post.update({
      where: { id: postId },
      data: { title, description, category, videoUrl, audioUrl, fileUrl },
    });
    // Can optionally emit custom socket events here if needed, but the original ones handles update manually via REST
    res.json(post);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Delete post (admin)
export async function deletePost(req: Request, res: Response): Promise<void> {
  try {
    const postId = req.params.postId as string;
    await prisma.post.delete({ where: { id: postId } });
    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAllComments(req: Request, res: Response): Promise<void> {
  try {
    const comments = await prisma.comment.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        post: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const formatted = comments.map(c => ({
      id: c.id,
      commentText: c.commentText,
      createdAt: c.createdAt.toISOString(),
      userId: c.userId,
      userFullName: c.user.fullName,
      userEmail: c.user.email,
      postId: c.postId,
      postTitle: c.post?.title ?? 'Discussion',
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Get admin comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteAdminComment(req: Request, res: Response): Promise<void> {
  try {
    const commentId = req.params.commentId as string;
    await prisma.comment.delete({ where: { id: commentId } });
    res.json({ commentId });
  } catch (error) {
    console.error('Delete admin comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function togglePostSponsored(req: Request, res: Response): Promise<void> {
  try {
    const postId = req.params.postId as string;
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: { sponsored: !post.sponsored }
    });

    (req as any).io.emit('post:updated', updated);
    res.json(updated);
  } catch (error) {
    console.error('Toggle post sponsored error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listAffiliateCoupons(_req: Request, res: Response): Promise<void> {
  try {
    const coupons = await (prisma as any).affiliateCoupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });
    res.json({ coupons });
  } catch (error) {
    console.error('List affiliate coupons error:', error);
    res.status(500).json({ error: 'Unable to list affiliate coupons' });
  }
}

export async function updateAffiliateCoupon(req: Request, res: Response): Promise<void> {
  try {
    const { affiliateId } = req.params;
    const { code, commissionPercent, enabled, usageLimit, expiresAt } = req.body;

    const updates: any = {};
    if (code) {
      const normalized = code.replace(/[^a-z0-9]/gi, '').toUpperCase();
      if (!normalized) {
        res.status(400).json({ error: 'Coupon code must contain alphanumeric characters' });
        return;
      }
      const existing = await (prisma as any).affiliateCoupon.findUnique({ where: { code: normalized } });
      if (existing && existing.affiliateId !== affiliateId) {
        res.status(409).json({ error: 'Coupon code already in use' });
        return;
      }
      updates.code = normalized;
    }
    if (commissionPercent !== undefined) updates.commissionPercent = Number(commissionPercent);
    if (typeof enabled === 'boolean') updates.enabled = enabled;
    if (usageLimit !== undefined) updates.usageLimit = Number(usageLimit);
    if (expiresAt) updates.expiresAt = new Date(expiresAt);

    const existingCoupon = await (prisma as any).affiliateCoupon.findUnique({ where: { affiliateId } });
    if (!existingCoupon) {
      res.status(404).json({ error: 'Coupon not found' });
      return;
    }

    const coupon = await (prisma as any).affiliateCoupon.update({
      where: { id: existingCoupon.id },
      data: updates,
    });

    res.json({ coupon });
  } catch (error) {
    console.error('Update affiliate coupon error:', error);
    res.status(500).json({ error: 'Unable to update coupon' });
  }
}

export async function regenerateAffiliateCouponHandler(req: Request, res: Response): Promise<void> {
  try {
    const { affiliateId } = req.params as { affiliateId: string };
    const affiliate = await (prisma.affiliate as any).findUnique({
      where: { id: affiliateId },
      include: { user: true },
    });
    if (!affiliate || !affiliate.user) {
      res.status(404).json({ error: 'Affiliate not found' });
      return;
    }
    const existing = await (prisma as any).affiliateCoupon.findUnique({ where: { affiliateId: affiliateId as string } });
    if (!existing) {
      await ensureAffiliateCoupon({ affiliateId: affiliateId as string, baseName: affiliate.user.fullName });
    }
    const updated = await regenerateAffiliateCoupon(affiliateId as string, affiliate.user.fullName);
    res.json({ coupon: updated });
  } catch (error) {
    console.error('Regenerate affiliate coupon error:', error);
    res.status(500).json({ error: 'Unable to regenerate coupon' });
  }
}

export async function listCommissionRequests(_req: Request, res: Response): Promise<void> {
  try {
    const requests = await (prisma as any).commissionRequest.findMany({
      include: {
        affiliate: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ requests });
  } catch (error) {
    console.error('List commission requests error:', error);
    res.status(500).json({ error: 'Unable to list commission requests' });
  }
}

export async function updateCommissionRequestStatus(req: Request, res: Response): Promise<void> {
  try {
    const { requestId } = req.params;
    const { status, requestedCommission } = req.body; // Admin can override the commission before approval

    const commissionRequest = await (prisma as any).commissionRequest.findUnique({
      where: { id: requestId },
      include: { affiliate: true }
    });

    if (!commissionRequest) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    const updatedRequest = await (prisma as any).commissionRequest.update({
      where: { id: requestId },
      data: { status, requestedCommission: Number(requestedCommission) || commissionRequest.requestedCommission }
    });

    if (status === 'APPROVED') {
      const finalCommission = Number(requestedCommission) || commissionRequest.requestedCommission;
      await (prisma.affiliate as any).update({
        where: { id: commissionRequest.affiliateId },
        data: { customCommission: finalCommission }
      });
      
      // Also update the associated coupon's commission percent
      await (prisma as any).affiliateCoupon.updateMany({
        where: { affiliateId: commissionRequest.affiliateId },
        data: { commissionPercent: finalCommission }
      });
    }

    res.json({ request: updatedRequest });
  } catch (error) {
    console.error('Update commission request error:', error);
    res.status(500).json({ error: 'Unable to update commission request' });
  }
}

export async function listPendingCommissions(_req: Request, res: Response): Promise<void> {
  try {
    const commissions = await prisma.commission.findMany({
      where: { status: { in: ['PENDING', 'APPROVED'] } },
      include: {
        affiliate: { include: { user: { select: { fullName: true, email: true } } } },
        product: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ commissions });
  } catch (error) {
    console.error('List pending commissions error:', error);
    res.status(500).json({ error: 'Unable to list pending commissions' });
  }
}

export async function approveCommission(req: Request, res: Response): Promise<void> {
  try {
    const commissionId = req.params.commissionId as string;
    const { status } = req.body; // APPROVED or REJECTED

    const updated = await prisma.commission.update({
      where: { id: commissionId },
      data: { status: status as CommissionStatus }
    });

    res.json({ commission: updated });
  } catch (error) {
    console.error('Approve commission error:', error);
    res.status(500).json({ error: 'Unable to update commission status' });
  }
}

export async function listPayoutBatches(_req: Request, res: Response): Promise<void> {
  try {
    const batches = await prisma.payoutBatch.findMany({
      include: {
        commissions: true,
        // We need the affiliate info, but PayoutBatch doesn't have a direct relation in schema yet if not added
        // Wait, I should add the relation in schema if needed, but for now I can query based on affiliateId
      },
      orderBy: { payoutDate: 'desc' }
    });
    
    // Supplement with affiliate names
    const enrichedBatches = await Promise.all(batches.map(async (batch: any) => {
      const affiliate = await prisma.affiliate.findUnique({
        where: { id: batch.affiliateId },
        include: { user: { select: { fullName: true } } }
      });
      return { ...batch, affiliateName: affiliate?.user.fullName || 'Unknown' };
    }));

    res.json({ batches: enrichedBatches });
  } catch (error) {
    console.error('List payout batches error:', error);
    res.status(500).json({ error: 'Unable to list payout batches' });
  }
}

export async function createPayoutBatch(req: Request, res: Response): Promise<void> {
  try {
    const { affiliateId, startDate, endDate, payoutDate, commissionIds } = req.body;

    const totalAmount = await prisma.commission.aggregate({
      where: { id: { in: commissionIds } },
      _sum: { amount: true }
    });

    const batch = await prisma.payoutBatch.create({
      data: {
        affiliateId,
        totalAmount: totalAmount._sum.amount || 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        payoutDate: new Date(payoutDate),
        status: 'SCHEDULED',
        commissions: {
          connect: commissionIds.map((id: string) => ({ id }))
        }
      }
    });

    // Mark commissions as PROCESSING
    await prisma.commission.updateMany({
      where: { id: { in: commissionIds } },
      data: { status: 'PROCESSING' }
    });

    res.status(201).json({ batch });
  } catch (error) {
    console.error('Create payout batch error:', error);
    res.status(500).json({ error: 'Unable to create payout batch' });
  }
}

export async function updatePayoutStatus(req: Request, res: Response): Promise<void> {
  try {
    const { batchId } = req.params;
    const { status } = req.body;

    const batch = await prisma.payoutBatch.update({
      where: { id: batchId as string },
      data: { status: status as PayoutStatus },
      include: { commissions: true }
    });

    if (status === 'PAID') {
      // Mark all associated commissions as PAID
      await prisma.commission.updateMany({
        where: { payoutBatchId: batchId as string },
        data: { status: 'PAID' }
      });
    }

    res.json({ batch });
  } catch (error) {
    console.error('Update payout status error:', error);
    res.status(500).json({ error: 'Unable to update payout status' });
  }
}

// Get all global settings
export async function getGlobalSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await prisma.globalSetting.findMany();
    res.json(settings);
  } catch (error) {
    console.error('Get global settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Update a global setting
export async function updateGlobalSetting(req: Request, res: Response): Promise<void> {
  try {
    const key = String(req.params.key);
    const { value } = req.body;

    const setting = await prisma.globalSetting.upsert({
      where: { key: key },
      update: { value: String(value) },
      create: { key: key, value: String(value) },
    });

    res.json(setting);
  } catch (error) {
    console.error('Update global setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get public settings (no auth required)
export async function getPublicSettings(_req: Request, res: Response): Promise<void> {
  try {
    const settings = await prisma.globalSetting.findMany();
    const settingsMap = settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsMap);
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

import prisma from './prisma';

const sanitizePrefix = (name: string) => {
  const cleaned = name.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 4);
  return cleaned || 'AFF';
};

const createCandidateCode = (prefix: string) => `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;

export async function generateCouponCode(prefixSource: string): Promise<string> {
  const prefix = sanitizePrefix(prefixSource);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = createCandidateCode(prefix);
    const existing = await (prisma as any).affiliateCoupon.findUnique({ where: { code: candidate } });
    if (!existing) {
      return candidate;
    }
  }
  throw new Error('Unable to generate unique coupon code');
}

export async function ensureAffiliateCoupon(opts: {
  affiliateId: string;
  baseName: string;
  commissionPercent?: number;
}) {
  const { affiliateId, baseName, commissionPercent = 20 } = opts;
  const existing = await (prisma as any).affiliateCoupon.findUnique({ where: { affiliateId } });
  if (existing) {
    return existing;
  }
  const code = await generateCouponCode(baseName);
  return (prisma as any).affiliateCoupon.create({
    data: {
      affiliateId,
      code,
      commissionPercent,
    },
  });
}

export async function regenerateAffiliateCoupon(affiliateId: string, baseName: string) {
  const code = await generateCouponCode(baseName);
  const existing = await prisma.affiliateCoupon.findUnique({ where: { affiliateId } });
  if (!existing) throw new Error('Affiliate coupon not found');
  
  return (prisma as any).affiliateCoupon.update({
    where: { id: existing.id },
    data: {
      code,
      usesCount: 0,
      totalRevenue: 0,
      updatedAt: new Date(),
    },
  });
}

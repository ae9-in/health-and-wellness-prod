import { PrismaClient, Role, ApprovalStatus, NotificationType, CommissionStatus, PayoutStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password', 12);

  // 1. Create Users
  const users = [
    { email: 'admin@wellspring.com', fullName: 'System Admin', role: Role.ADMIN },
    { email: 'chayakirans@gmail.com', fullName: 'Chaya Kiran', role: Role.ADMIN },
    { email: 'kiran@gmail.com', fullName: 'Kiran Affiliate', role: Role.AFFILIATE },
    { email: 'affiliate1@test.com', fullName: 'John Affiliate', role: Role.AFFILIATE },
    { email: 'affiliate2@test.com', fullName: 'Sarah Marketer', role: Role.AFFILIATE },
    { email: 'brand1@test.com', fullName: 'Eco Wellness', role: Role.BRAND },
    { email: 'brand2@test.com', fullName: 'Pure Supplements', role: Role.BRAND },
    { email: 'user1@test.com', fullName: 'Regular Mike', role: Role.USER },
    { email: 'expert1@test.com', fullName: 'Dr. Jane Smith', role: Role.EXPERT },
  ];

  console.log('Seeding users...');
  const createdUsers = [];
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        fullName: u.fullName,
        password,
        role: u.role,
        city: 'Sample City',
        mobile: '1234567890',
      },
    });
    createdUsers.push(user);
  }

  const affiliateKiran = createdUsers.find(u => u.email === 'kiran@gmail.com')!;
  const affiliate1 = createdUsers.find(u => u.email === 'affiliate1@test.com')!;
  const affiliate2 = createdUsers.find(u => u.email === 'affiliate2@test.com')!;
  const brand1 = createdUsers.find(u => u.email === 'brand1@test.com')!;
  const brand2 = createdUsers.find(u => u.email === 'brand2@test.com')!;

  // 2. Create Affiliates
  console.log('Seeding affiliates...');
  await prisma.affiliate.upsert({
    where: { userId: affiliateKiran.id },
    update: {},
    create: { userId: affiliateKiran.id, status: ApprovalStatus.APPROVED, interests: ['Nutrition', 'Ayurveda'] }
  });

  await prisma.affiliate.upsert({
    where: { userId: affiliate1.id },
    update: {},
    create: { userId: affiliate1.id, status: ApprovalStatus.APPROVED, interests: ['Nutrition', 'Fitness'] }
  });

  await prisma.affiliate.upsert({
    where: { userId: affiliate2.id },
    update: {},
    create: { userId: affiliate2.id, status: ApprovalStatus.PENDING, interests: ['Yoga', 'Mental Wellness'] }
  });

  // 3. Create Brands
  console.log('Seeding brands...');
  const b1 = await prisma.brand.upsert({
    where: { userId: brand1.id },
    update: {},
    create: {
      userId: brand1.id,
      name: 'Eco Wellness',
      businessCategory: 'Organic Products',
      contactPerson: 'Alice Brand',
      phone: '9876543210',
      address: '123 Green Ave',
      website: 'https://ecowellness.com',
      status: ApprovalStatus.APPROVED
    }
  });

  const b2 = await prisma.brand.upsert({
    where: { userId: brand2.id },
    update: {},
    create: {
      userId: brand2.id,
      name: 'Pure Supplements',
      businessCategory: 'Health Supplements',
      contactPerson: 'Bob Pure',
      phone: '9876543211',
      address: '456 Power St',
      website: 'https://puresups.com',
      status: ApprovalStatus.PENDING
    }
  });

  // 4. Create Products
  console.log('Seeding products...');
  if (b1) {
    await prisma.product.createMany({
      data: [
        { brandId: b1.id, name: 'Organic Green Tea', category: 'Nutrition', description: 'Fresh organic green tea.', price: 499, commissionRate: 15, stock: 100, status: ApprovalStatus.APPROVED },
        { brandId: b1.id, name: 'Eco Yoga Mat', category: 'Yoga', description: 'Non-slip eco-friendly mat.', price: 1299, commissionRate: 20, stock: 50, status: ApprovalStatus.PENDING },
      ]
    });
  }

  // 5. Create Posts
  console.log('Seeding posts...');
  await prisma.post.createMany({
    data: [
      { title: 'Morning Routine for Vitality', description: 'Start your day with these 5 tips.', category: 'Health', authorId: affiliate1.id, postType: 'ARTICLE' },
      { title: 'Best Supplements for 2024', description: 'A comprehensive guide.', category: 'Nutrition', authorId: brand1.id, postType: 'VIDEO' },
    ]
  });

  // 6. Create Commissions
  console.log('Seeding commissions...');
  const products = await prisma.product.findMany();
  if (products.length > 0) {
    await prisma.commission.createMany({
      data: [
        { affiliateId: (await prisma.affiliate.findUnique({ where: { userId: affiliate1.id } }))!.id, productId: products[0].id, salesCount: 5, amount: 375, status: CommissionStatus.APPROVED },
        { affiliateId: (await prisma.affiliate.findUnique({ where: { userId: affiliate1.id } }))!.id, productId: products[0].id, salesCount: 2, amount: 150, status: CommissionStatus.PENDING },
      ]
    });
  }

  console.log('Seeding complete! You can now login as admin@wellspring.com / password');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

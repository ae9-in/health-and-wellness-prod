const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

dotenv.config({ path: './backend/.env' });
(async () => {
  const prisma = new PrismaClient();
  const brand = await prisma.brand.findFirst({ include: { user: true } });
  if (!brand) {
    console.log('No brand found');
    await prisma.$disconnect();
    return;
  }
  const token = jwt.sign({ userId: brand.userId, role: 'BRAND' }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
  console.log('email', brand.user.email);
  console.log('token', token);
  await prisma.$disconnect();
})();

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const envPath = path.resolve(__dirname, '../.env');
let JWT_SECRET = 'fallback-secret';
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf-8');
  const match = env.match(/^JWT_SECRET="?(.*?)"?$/m);
  if (match) {
    JWT_SECRET = match[1];
  }
}

(async () => {
  const prisma = new PrismaClient();
  const brand = await prisma.brand.findFirst({ include: { user: true } });
  if (!brand) {
    console.log('No brand found');
    await prisma.$disconnect();
    return;
  }
  const token = jwt.sign({ userId: brand.userId, role: 'BRAND' }, JWT_SECRET, { expiresIn: '7d' });
  console.log('email', brand.user.email);
  console.log('token', token);
  await prisma.$disconnect();
})();

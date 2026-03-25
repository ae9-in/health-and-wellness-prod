
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const brand = await prisma.user.findFirst({ where: { role: 'BRAND' }});
  if (brand) {
    const app = await prisma.brand.findUnique({ where: { userId: brand.id } });
    if (app && app.status === 'APPROVED') {
       console.log('APPROVED BRAND EMAIL:', brand.email);
    } else if (app) {
       await prisma.brand.update({ where: { id: app.id }, data: { status: 'APPROVED' } });
       console.log('APPROVING AND USING BRAND EMAIL:', brand.email);
    } else {
       console.log('FOUND BRAND BUT NO APP:', brand.email);
    }
  } else {
    console.log('NO BRAND FOUND');
  }
}
main().finally(() => prisma.$disconnect());


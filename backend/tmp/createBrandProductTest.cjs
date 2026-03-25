const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const brand = await prisma.brand.findFirst();
  if (!brand) {
    console.log('no brand');
    await prisma.$disconnect();
    return;
  }
  try {
    const product = await prisma.product.create({
      data: {
        brandId: brand.id,
        name: 'Scripted Product',
        category: 'Nutrition',
        description: 'Scripted desc',
        images: ['https://example.com/test.jpg'],
        price: 42.5,
        commissionRate: 3,
        stock: 10,
        status: 'PENDING'
      }
    });
    console.log('created', product.id);
  } catch (err) {
    console.error('prisma error', err);
  } finally {
    await prisma.$disconnect();
  }
})();

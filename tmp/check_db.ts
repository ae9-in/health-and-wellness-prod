
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const posts = await prisma.post.count();
  const brands = await prisma.brand.count();
  const affiliates = await prisma.affiliate.count();
  const products = await prisma.product.count();

  console.log({
    users,
    posts,
    brands,
    affiliates,
    products
  });

  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { email: true, fullName: true }
  });
  console.log('Admins:', adminUsers);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

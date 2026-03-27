import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true }
  });
  console.log('Users in DB:', JSON.stringify(users, null, 2));
  process.exit(0);
}
main().catch(e => {
  console.error(e);
  process.exit(1);
});

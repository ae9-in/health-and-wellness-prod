import { PrismaClient, Role, ApprovalStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'kiran@gmail.com';
  const password = 'password';
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      fullName: 'Kiran Affiliate',
      password: hashedPassword,
      role: Role.AFFILIATE,
    },
  });

  await prisma.affiliate.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      status: ApprovalStatus.APPROVED,
    },
  });

  console.log('Test user created/verified: kiran@gmail.com / password');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

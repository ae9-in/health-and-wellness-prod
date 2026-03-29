import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const email = 'subramanya12@gmail.com';
  console.log('Searching for user:', email);
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { brand: true, affiliate: true }
    });
    if (user) {
      console.log('User found:', JSON.stringify(user, null, 2));
    } else {
      console.log('User NOT found');
      // List all users to see if there's a typo
      const allUsers = await prisma.user.findMany({ select: { email: true } });
      console.log('All user emails:', allUsers.map(u => u.email));
    }
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

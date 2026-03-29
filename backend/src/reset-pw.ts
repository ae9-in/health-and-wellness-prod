import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const email = 'subramanya12@gmail.com';
  const newPassword = 'Subramanya12@123';
  console.log('Resetting password for:', email);
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    console.log('Password successfully reset for user:', user.email);
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

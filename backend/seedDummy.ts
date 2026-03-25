import { PrismaClient, Role } from '@prisma/client';

import { getAdminCredentials } from './lib/adminConfig';

const prisma = new PrismaClient();

async function main() {
  const adminCreds = getAdminCredentials();
  if (!adminCreds) {
    console.warn('Skipping admin-specific seed data; ADMIN_EMAIL and ADMIN_PASSWORD are not configured.');
    return;
  }

  const adminEmail = adminCreds.email;
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'Admin User',
        password: 'hashedpassword',
        role: Role.ADMIN,
      }
    });
  }

  // Create dummy posts
  await prisma.post.create({
    data: {
      title: 'How to maintain a healthy work-life balance?',
      description: 'I have been finding it really difficult to separate work from my personal life lately. What are some tips you all use?',
      category: 'Lifestyle',
      authorId: adminUser.id
    }
  });

  await prisma.post.create({
    data: {
      title: 'Easy 15-minute healthy recipes?',
      description: 'Looking for quick meals that are also nutritious. Can anyone share their go-to recipes?',
      category: 'Nutrition',
      authorId: adminUser.id
    }
  });

  // Create dummy partnerships
  await prisma.partnership.create({
    data: {
      organizationName: 'LifeClinic Health',
      contactPerson: 'Sarah Jenkins',
      email: 'contact@lifeclinic.fake',
      phone: '555-0129',
      website: 'https://lifeclinic.fake',
      proposal: 'We would like to offer weekly nutritional sessions to all WellNest users via Zoom.',
      status: 'pending'
    }
  });

  await prisma.partnership.create({
    data: {
      organizationName: 'Mindful Tech',
      contactPerson: 'Alex Romero',
      email: 'partners@mindfultech.fake',
      phone: '555-9988',
      website: 'https://mindfultech.fake',
      proposal: 'Integration of our mindful tracking API into your app to give members better insights.',
      status: 'approved'
    }
  });

  console.log('Dummy data seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

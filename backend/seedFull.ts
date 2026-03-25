import { PrismaClient, Role, ApprovalStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting comprehensive seeding...');

  // 0. Clear existing data to avoid duplicates/mess
  console.log('Clearing existing data...');
  const dc = await prisma.comment.deleteMany();
  const dl = await prisma.like.deleteMany();
  const ds = await prisma.savedPost.deleteMany();
  const dp = await prisma.post.deleteMany();
  const dr = await prisma.sessionRegistration.deleteMany();
  const dss = await prisma.session.deleteMany();
  const dal = await prisma.affiliateLink.deleteMany();
  const dcm = await prisma.commission.deleteMany();
  const dpr = await prisma.product.deleteMany();
  
  console.log(`Deleted: ${dc.count} comments, ${dl.count} likes, ${ds.count} saved posts, ${dp.count} posts`);
  console.log(`Deleted: ${dr.count} registrations, ${dss.count} sessions, ${dal.count} links, ${dcm.count} commissions, ${dpr.count} products`);

  // 1. Create Brand Users and Profiles
  // ... (rest of the script)
  const brandData = [
    {
      email: 'vitality@example.com',
      name: 'Vitality Wellness',
      fullName: 'Alice Vitality',
      category: 'Nutrition',
      description: 'Premium organic supplements and nutrition guides.'
    },
    {
      email: 'zen@example.com',
      name: 'Zen Mind & Body',
      fullName: 'Bob Zen',
      category: 'Mental Wellness',
      description: 'Meditation tools and mindfulness accessories.'
    },
    {
      email: 'active@example.com',
      name: 'Active Life Gear',
      fullName: 'Charlie Active',
      category: 'Fitness',
      description: 'High-performance fitness equipment and apparel.'
    }
  ];

  const brands = [];

  for (const b of brandData) {
    let user = await prisma.user.findUnique({ where: { email: b.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: b.email,
          fullName: b.fullName,
          password: 'hashedpassword',
          role: Role.BRAND,
        }
      });
    }

    let brand = await prisma.brand.findUnique({ where: { userId: user.id } });
    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          userId: user.id,
          name: b.name,
          businessCategory: b.category,
          contactPerson: b.fullName,
          phone: '1234567890',
          address: 'Wellness Way, Health City',
          website: `https://${b.email.split('@')[0]}.com`,
          status: ApprovalStatus.APPROVED
        } as any
      });
    }
    brands.push(brand);
  }

  // 2. Create Products for each category
  const categories = ['Mental Health', 'Fitness', 'Nutrition', 'Lifestyle', 'Chronic Conditions'];
  
  const productTemplates = [
    {
      name: 'Calm Clarity Journal',
      category: 'Mental Health',
      description: 'Daily guided prompts and breathing cues designed to reduce stress while cultivating self-compassion.',
      price: 26.00,
      isPopular: true,
      images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80']
    },
    {
      name: 'Harmonic Sound Bath Kit',
      category: 'Mental Health',
      description: 'Portable Himalayan singing bowl set with mallet and felt cushions for grounding sound therapy at home.',
      price: 72.50,
      isPopular: false,
      images: ['https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80']
    },
    {
      name: 'Recovery Resistance Bands',
      category: 'Fitness',
      description: 'Set of five premium latex bands, color-coded by resistance for progressive strength training.',
      price: 34.50,
      isPopular: true,
      images: ['https://images.unsplash.com/photo-1592432676558-9040cc6d3cc3?auto=format&fit=crop&w=800&q=80']
    },
    {
      name: 'Posture Pulse Trainer',
      category: 'Fitness',
      description: 'Wearable that vibrates gently when slouching, with a companion app for posture coaching.',
      price: 59.99,
      isPopular: false,
      images: ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80']
    },
    {
      name: 'Gut Harmony Probiotic',
      category: 'Nutrition',
      description: 'Shelf-stable probiotic blend clinically studied for digestive balance and bloating relief.',
      price: 32.00,
      isPopular: true,
      images: ['https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=80']
    },
    {
      name: 'Plant-Powered Protein Blend',
      category: 'Nutrition',
      description: 'Pea and brown rice proteins with superfood greens for post-workout recovery and energy.',
      price: 42.00,
      isPopular: false,
      images: ['https://images.unsplash.com/photo-1524592098555-165cbae4df0c?auto=format&fit=crop&w=800&q=80']
    },
    {
      name: 'Daylight Simulator Lamp',
      category: 'Lifestyle',
      description: 'Wake-up light that mimics sunrise, paired with calm soundscapes to reset your circadian rhythm.',
      price: 89.00,
      isPopular: true,
      images: ['https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80']
    },
    {
      name: 'Sleep Reset Pillow',
      category: 'Lifestyle',
      description: 'Cooling, adaptive memory foam pillow designed to keep neck alignment while the surface stays breathable.',
      price: 68.00,
      isPopular: false,
      images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80']
    },
    {
      name: 'Joint Ease Botanical Balm',
      category: 'Chronic Conditions',
      description: 'Herbal-infused balm with arnica and menthol for soothing everyday joint discomfort.',
      price: 24.99,
      isPopular: false,
      images: ['https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80']
    },
    {
      name: 'Cardio Calm Patches',
      category: 'Chronic Conditions',
      description: 'Transdermal patches with magnesium and hawthorn to support heart rhythm awareness and calm breathing.',
      price: 38.50,
      isPopular: true,
      images: ['https://images.unsplash.com/photo-1472289065668-ce650ac443d2?auto=format&fit=crop&w=800&q=80']
    }
  ];

  for (const p of productTemplates) {
    // Randomly assign a brand
    const brand = brands[Math.floor(Math.random() * brands.length)];
    
    await prisma.product.create({
      data: {
        ...p,
        brandId: brand.id,
        commissionRate: 10 + Math.floor(Math.random() * 10),
        stock: 10 + Math.floor(Math.random() * 90),
        status: 'APPROVED'
      }
    });
  }

  // 3. Add some Sessions
  const sessionData = [
    {
      title: 'Morning Yoga Flow',
      description: 'Start your day with a gentle Vinyasa flow focusing on breath and flexibility.',
      hostName: 'Elena Gilbert',
      date: new Date(Date.now() + 86400000), // tomorrow
      sessionLink: 'https://zoom.us/j/yoga123'
    },
    {
      title: 'Mindful Eating Workshop',
      description: 'Learn how to develop a better relationship with food and practice mindfulness.',
      hostName: 'Dr. Stefan Salvatore',
      date: new Date(Date.now() + 172800000), // in 2 days
      sessionLink: 'https://zoom.us/j/eating456'
    }
  ];

  for (const s of sessionData) {
    await prisma.session.create({ data: s });
  }

  // 4. Add some Posts for the Community Feed
  const postData = [
    {
      title: '5 Tips for Better Sleep',
      description: 'Sleep is crucial for recovery. Here are my top 5 tips for getting those 8 hours: 1. Stick to a schedule. 2. Create a restful environment. 3. Limit daytime naps. 4. Manage worries. 5. Watch what you eat and drink.',
      category: 'Health Tips',
      postType: 'IMAGE',
      images: ['https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80'],
      sponsored: false
    },
    {
      title: 'Post-Workout Smoothie',
      description: 'Check out this protein-packed smoothie recipe for muscle repair! Mixed berries, Greek yogurt, and a scoop of whey protein.',
      category: 'Nutrition Guidance',
      postType: 'IMAGE',
      images: ['https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=800&q=80'],
      sponsored: false
    },
    {
      title: 'Morning Mindfulness',
      description: 'Taking 10 minutes every morning to just breathe and be present. It changes the entire trajectory of the day.',
      category: 'Mental Wellness',
      postType: 'IMAGE',
      images: [
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?auto=format&fit=crop&w=800&q=80'
      ],
      sponsored: false
    },
    {
      title: 'New Fitness Gear Unboxing',
      description: 'Just received my new gear for the summer! Ready to hit the trails and the gym. Check out the quality of these bands and the mat.',
      category: 'Fitness Advice',
      postType: 'IMAGE',
      images: [
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80'
      ],
      sponsored: false
    }
  ];

  // Use the first brand user as author for some posts
  const authorId = brands[0].userId;
  for (const post of postData) {
    await prisma.post.create({
      data: {
        ...post,
        authorId: authorId
      }
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

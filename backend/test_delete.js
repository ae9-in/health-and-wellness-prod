const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function main() {
  try {
    // Just find any user containing 'admin' in email to bypass role enum issues
    const admin = await prisma.user.findFirst({
      where: { email: { contains: 'admin' } }
    });
    
    if (!admin) {
      console.log('No admin email found, falling back to first user');
    }

    const fallbackAdmin = admin || await prisma.user.findFirst();
    
    if (!fallbackAdmin) {
      console.log('No users at all');
      return;
    }

    const token = jwt.sign({ userId: fallbackAdmin.id, role: fallbackAdmin.role }, process.env.JWT_SECRET || 'secret');

    // Get a post id
    const posts = await prisma.post.findMany({ take: 2 });
    if (posts.length === 0) {
      console.log('No posts in database. Creating one...');
      const newPost = await prisma.post.create({
        data: {
          title: 'Auto Test Post',
          description: 'Desc',
          authorId: fallbackAdmin.id
        }
      });
      console.log('Created test post:', newPost.id);
      posts.push(newPost);
    }

    const postToDelete = posts[0];
    console.log(`Will DELETE post: ${postToDelete.id} - ${postToDelete.title}`);

    // Perform API call
    const res = await fetch(`http://localhost:5001/api/admin/posts/${postToDelete.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`STATUS: ${res.status}`);
    const body = await res.text();
    console.log(`BODY: ${body}`);

    // Verify deletion in DB
    const verification = await prisma.post.findUnique({ where: { id: postToDelete.id } });
    if (verification) {
      console.log('FAILED: Post still exists in database!');
    } else {
      console.log('SUCCESS: Post is gone from database!');
    }

  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

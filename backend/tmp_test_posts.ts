import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Fetching posts...');
    const posts = await prisma.post.findMany({
      include: {
        author: { select: { id: true, fullName: true, role: true } },
        likes: true,
        comments: { include: { user: { select: { fullName: true } } } },
        savedBy: true,
      },
    });

    console.log(`Found ${posts.length} posts.`);
    const postData = posts.map(p => {
      try {
        return {
          id: p.id,
          title: p.title,
          description: p.description,
          category: p.category,
          postType: p.postType,
          authorId: p.authorId,
          authorName: p.author.fullName,
          authorRole: p.author.role,
          likes: p.likes.map(l => l.userId),
          comments: p.comments.map(c => ({
            id: c.id,
            postId: c.postId,
            userId: c.userId,
            userName: c.user.fullName,
            commentText: c.commentText,
            createdAt: c.createdAt.toISOString(),
          })),
          savedUsers: p.savedBy.map(s => s.userId),
          images: p.images || [],
          videoUrl: p.videoUrl,
          audioUrl: p.audioUrl,
          fileUrl: p.fileUrl,
          userType: (p as any).userType,
          mediaType: (p as any).mediaType,
          mediaUrls: (p as any).mediaUrls || [],
          createdAt: p.createdAt.toISOString(),
        };
      } catch (err) {
        console.error(`Error mapping post ${p.id}:`, err);
        throw err;
      }
    });
    console.log('Mapping successful.');
  } catch (err) {
    console.error('Fatal error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();

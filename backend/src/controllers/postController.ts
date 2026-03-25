import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createNotification } from './notificationsController';

// Get all posts with author info, likes count, and comments
export async function getPosts(req: Request, res: Response): Promise<void> {
  try {
    const { category, search, authorId, brandId } = req.query;

    const where: any = {};
    if (category && category !== 'all') {
      where.category = category as string;
    }
    if (authorId) {
      where.authorId = authorId as string;
    }
    if (brandId) {
      // If posts can be linked to brands directly (not just via author role)
      // For now, let's assume we filter by authorId where the author is that brand's user
      where.authorId = brandId as string; 
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, fullName: true, role: true } },
        likes: { select: { userId: true } },
        savedBy: { select: { userId: true } },
        comments: {
          include: { user: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = posts.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      authorId: p.authorId,
      authorName: p.author.fullName,
      authorRole: p.author.role,
      postType: p.postType,
      likes: p.likes.map((l: any) => l.userId),
      savedUsers: p.savedBy.map((s: any) => s.userId),
      comments: p.comments.map((c: any) => ({
        id: c.id,
        postId: c.postId,
        userId: c.userId,
        userName: c.user.fullName,
        commentText: c.commentText,
        createdAt: c.createdAt.toISOString(),
      })),
      images: p.images || [],
      videoUrl: p.videoUrl,
      audioUrl: p.audioUrl,
      fileUrl: p.fileUrl,
      createdAt: p.createdAt.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Create a new post
export async function createPost(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, description, category, postType = 'ARTICLE' } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    let images: string[] = [];
    let videoUrl = req.body.videoUrl;
    let audioUrl = req.body.audioUrl;
    let fileUrl = req.body.fileUrl;

    if (files) {
      if (files['images']) {
        images = files['images'].map(f => `/uploads/${f.filename}`);
      }
      if (files['video']) videoUrl = `/uploads/${files['video'][0].filename}`;
      if (files['audio']) audioUrl = `/uploads/${files['audio'][0].filename}`;
      if (files['file']) fileUrl = `/uploads/${files['file'][0].filename}`;
    }

    const userId = req.userId!;

    if (!title || !description || !category) {
      res.status(400).json({ error: 'Title, description, and category are required' });
      return;
    }

    const post = await prisma.post.create({
      data: { title, description, category, postType, images, videoUrl, audioUrl, fileUrl, authorId: userId },
      include: {
        author: { select: { id: true, fullName: true, role: true } },
      },
    });

    const responseData = {
      id: post.id,
      title: post.title,
      description: post.description,
      category: post.category,
      postType: post.postType,
      authorId: post.authorId,
      authorName: post.author.fullName,
      authorRole: post.author.role,
      likes: [],
      comments: [],
      savedUsers: [],
      images: post.images,
      videoUrl: post.videoUrl,
      audioUrl: post.audioUrl,
      fileUrl: post.fileUrl,
      createdAt: post.createdAt.toISOString(),
    };

    (req as any).io.emit('post:created', responseData);

    // Notification: New posts in followed topics
    const interestedUsers = await prisma.user.findMany({
      where: {
        interests: { has: category },
        id: { not: userId } // don't notify the author themselves
      },
      select: { id: true }
    });

    for (const u of interestedUsers) {
      await createNotification(
        req,
        u.id,
        'NEW_POST',
        `New post in ${category}: ${title}`,
        { postId: post.id }
      );
    }

    res.status(201).json(responseData);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Toggle like on a post
export async function toggleLike(req: AuthRequest, res: Response): Promise<void> {
  try {
    const postId = req.params.postId as string;
    const userId = req.userId!;

    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      (req as any).io.emit('post:liked', { postId, userId, liked: false });
      res.json({ liked: false });
    } else {
      await prisma.like.create({ data: { postId, userId } });
      (req as any).io.emit('post:liked', { postId, userId, liked: true });

      // Check if trending (e.g., reached 5 likes)
      const likeCount = await prisma.like.count({ where: { postId } });
      if (likeCount === 5) {
        const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true, title: true } });
        if (post && post.authorId !== userId) {
          await createNotification(
            req,
            post.authorId,
            'TRENDING_POST',
            `Your post "${post.title}" is trending!`,
            { postId }
          );
        }
      }

      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Toggle save/bookmark on a post
export async function toggleSave(req: AuthRequest, res: Response): Promise<void> {
  try {
    const postId = req.params.postId as string;
    const userId = req.userId!;

    const existing = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.savedPost.delete({ where: { id: existing.id } });
      res.json({ saved: false });
    } else {
      await prisma.savedPost.create({ data: { userId, postId } });
      res.json({ saved: true });
    }
  } catch (error) {
    console.error('Toggle save error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Add a comment to a post
export async function addComment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const postId = req.params.postId as string;
    const { commentText } = req.body;
    const userId = req.userId!;

    if (!commentText?.trim()) {
      res.status(400).json({ error: 'Comment text is required' });
      return;
    }

    const comment = await prisma.comment.create({
      data: { commentText: commentText.trim(), postId, userId },
      include: { user: { select: { id: true, fullName: true } } },
    }) as any;

    const responseData = {
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      userName: comment.user.fullName,
      commentText: comment.commentText,
      createdAt: comment.createdAt.toISOString(),
    };

    (req as any).io.emit('post:commented', responseData);

    // Notify author of comment
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true, title: true } });
    if (post && post.authorId !== userId) {
      await createNotification(
        req,
        post.authorId,
        'REPLY_TO_COMMENT',
        `${comment.user.fullName} commented on your post "${post.title}"`,
        { postId, commentId: comment.id }
      );
    }

    res.status(201).json(responseData);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get all authors (users who can post content)
export async function getAuthors(req: Request, res: Response): Promise<void> {
  try {
    const authors = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'EXPERT', 'AFFILIATE'] },
        blocked: false
      },
      select: { id: true, fullName: true, role: true },
      orderBy: { fullName: 'asc' }
    });
    res.json(authors);
  } catch (error) {
    console.error('Get authors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

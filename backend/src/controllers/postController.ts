import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createNotification } from './notificationsController';
import { uploadToCloudinary } from '../config/cloudinary';
import { checkBlocklist, checkToxicityAsync } from '../utils/moderation';
import { checkCommentRateLimit } from '../utils/rateLimit';

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
          where: { status: 'published' },
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
      authorName: p.author?.fullName || 'Community Member',
      authorRole: p.author?.role || 'USER',
      postType: p.postType,
      likes: p.likes.map((l: any) => l.userId),
      savedUsers: p.savedBy.map((s: any) => s.userId),
      comments: p.comments.map((c: any) => ({
        id: c.id,
        postId: c.postId,
        userId: c.userId,
        userName: c.user?.fullName || 'Anonymous',
        commentText: c.status === 'hidden' ? 'This comment is under review.' : c.commentText,
        createdAt: c.createdAt.toISOString(),
        status: c.status || 'published',
      })),
      images: p.images || [],
      videoUrl: p.videoUrl,
      audioUrl: p.audioUrl,
      fileUrl: p.fileUrl,
      userType: p.userType,
      mediaType: p.mediaType,
      mediaUrls: p.mediaUrls || [],
      published: p.published !== undefined ? p.published : true,
      tags: p.tags || [],
      createdAt: p.createdAt.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get posts error detail:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' });
  }
}

// Create a new post
export async function createPost(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, description, category = 'General', postType = 'ARTICLE', userType = 'user', published: publishedRaw, tags: tagsRaw } = req.body;

    const published = publishedRaw === 'true' || publishedRaw === true;
    let tags = tagsRaw;
    if (typeof tags === 'string') {
      try { tags = JSON.parse(tags); } catch { tags = tags.split(',').map((t: string) => t.trim()).filter(Boolean); }
    } else if (!Array.isArray(tags)) {
      tags = req.body['tags[]'] || req.body['tags'] || [];
      if (!Array.isArray(tags)) tags = [tags].filter(Boolean);
    }
    
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    let images: string[] = [];
    let videoUrl = req.body.videoUrl;
    let audioUrl = req.body.audioUrl;
    let fileUrl = req.body.fileUrl;
    let mediaUrls: string[] = [];
    let mediaType = 'none';

    if (files) {
      if (files['images']) {
        for (const file of files['images']) {
          const result = await uploadToCloudinary(file.buffer, 'posts/images');
          images.push(result.secure_url);
        }
        mediaUrls = [...mediaUrls, ...images];
        mediaType = 'image';
      }
      if (files['video']) {
        const result = await uploadToCloudinary(files['video'][0].buffer, 'posts/videos');
        videoUrl = result.secure_url;
        mediaUrls.push(videoUrl);
        mediaType = 'video';
      }
      if (files['audio']) {
        const result = await uploadToCloudinary(files['audio'][0].buffer, 'posts/audio');
        audioUrl = result.secure_url;
      }
      if (files['file']) {
        const result = await uploadToCloudinary(files['file'][0].buffer, 'posts/files');
        fileUrl = result.secure_url;
      }
    }

    const userId = req.userId!;

    if (!description) {
      res.status(400).json({ error: 'Description (content) is required' });
      return;
    }

    // Default title if not provided
    const finalTitle = title || description.slice(0, 50) + (description.length > 50 ? '...' : '');

    const post = await prisma.post.create({
      data: { 
        title: finalTitle, 
        description, 
        category, 
        postType, 
        images, 
        videoUrl, 
        audioUrl, 
        fileUrl, 
        authorId: userId,
        userType,
        mediaType,
        mediaUrls,
        published,
        tags
      } as any,
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
      authorName: (post as any).author?.fullName || 'Community Member',
      authorRole: (post as any).author?.role || 'USER',
      likes: [],
      comments: [],
      savedUsers: [],
      images: post.images,
      videoUrl: post.videoUrl,
      audioUrl: post.audioUrl,
      fileUrl: post.fileUrl,
      userType: (post as any).userType,
      mediaType: (post as any).mediaType,
      mediaUrls: (post as any).mediaUrls,
      published: (post as any).published,
      tags: (post as any).tags,
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

// Delete a comment
export async function deleteComment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const commentId = req.params.commentId as string;
    const userId = req.userId!;
    const userRole = req.userRole;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: { select: { authorId: true } } }
    });

    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    // Authorization: Comment Owner, Post Author, or Admin
    const isCommentOwner = comment.userId === userId;
    const isPostAuthor = comment.post.authorId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isCommentOwner && !isPostAuthor && !isAdmin) {
      res.status(403).json({ error: 'You are not authorized to delete this comment' });
      return;
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Delete a post
export async function deletePost(req: AuthRequest, res: Response): Promise<void> {
  try {
    const postId = req.params.postId as string;
    const userId = req.userId!;
    
    // Find the post first
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Admins delete via adminController, so here we STRICTLY enforce author ID
    if (post.authorId !== userId) {
      res.status(403).json({ error: 'You are not authorized to delete this post' });
      return;
    }

    await prisma.post.delete({
      where: { id: postId }
    });

    (req as any).io.emit('post:deleted', postId);

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Internal server error while deleting post' });
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

    // 1) Rate limiting — max 5 comments/user/minute
    const rateCheck = checkCommentRateLimit(userId);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: "You're commenting too fast. Please slow down.",
        retryAfterMs: rateCheck.retryAfterMs,
      });
      return;
    }

    // 2) Local blocklist — instant, synchronous
    const blocklistResult = checkBlocklist(commentText);
    if (!blocklistResult.safe) {
      res.status(400).json({
        error: blocklistResult.reason,
        blocked: true,
      });
      return;
    }

    // 3) Save comment immediately (fail-open)
    const comment = await prisma.comment.create({
      data: {
        commentText: commentText.trim(),
        postId,
        userId,
        status: 'published',
      },
      include: { user: { select: { id: true, fullName: true } } },
    }) as any;

    const responseData = {
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      userName: comment.user.fullName,
      commentText: comment.commentText,
      createdAt: comment.createdAt.toISOString(),
      status: comment.status,
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

    // 4) HuggingFace async toxicity check — fire and forget
    checkToxicityAsync(comment.id, commentText.trim()).catch((err) =>
      console.warn('[Moderation] Background toxicity check failed:', err.message)
    );

    res.status(201).json(responseData);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Report a comment
export async function reportComment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const commentId = req.params.commentId as string;
    const userId = req.userId!;

    // Check comment exists
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    // Can't report your own comment
    if (comment.userId === userId) {
      res.status(400).json({ error: 'You cannot report your own comment' });
      return;
    }

    // Check for duplicate report (unique constraint)
    const existing = await (prisma as any).commentReport.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });
    if (existing) {
      res.status(409).json({ error: 'You have already reported this comment' });
      return;
    }

    // Create report and increment reportCount atomically
    await (prisma as any).commentReport.create({
      data: { commentId, userId },
    });

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { reportCount: { increment: 1 } },
    });

    // Auto-hide at 3 or more reports
    if (updated.reportCount >= 3) {
      await prisma.comment.update({
        where: { id: commentId },
        data: { status: 'hidden', flagged: true },
      });

      // Emit real-time event so UI can hide it
      (req as any).io.emit('comment:hidden', { commentId });
    }

    res.json({ reported: true, reportCount: updated.reportCount });
  } catch (error) {
    console.error('Report comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get all authors (users who can post content)
export async function getAuthors(req: Request, res: Response): Promise<void> {
  try {
    const authors = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'EXPERT', 'AFFILIATE', 'BRAND'] },
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

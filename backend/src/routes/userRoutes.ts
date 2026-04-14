import { Router } from 'express';
import { authenticate, AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../lib/prisma';
import { upload } from '../middlewares/uploadMiddleware';
import { uploadToCloudinary } from '../config/cloudinary';

const router = Router();

// Get current user profile
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        blocked: true,
        interests: true,
        avatar: true,
        createdAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const { fullName, interests } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { 
        fullName,
        ...(interests ? { interests } : {})
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        blocked: true,
        interests: true,
        avatar: true,
        createdAt: true,
      },
    });
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/comments', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const comments = await prisma.comment.findMany({
      where: { userId: req.userId },
      include: {
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const formatted = comments.map(comment => ({
      id: comment.id,
      postId: comment.postId,
      postTitle: comment.post?.title ?? 'Discussion',
      commentText: comment.commentText,
      createdAt: comment.createdAt.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/profile/avatar', authenticate, upload.single('avatar'), async (req: AuthRequest, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const result = await uploadToCloudinary(file.buffer, 'avatars');
    
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { avatar: result.secure_url },
      select: {
        id: true,
        fullName: true,
        avatar: true,
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

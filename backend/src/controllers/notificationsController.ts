import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { NotificationType } from '@prisma/client';

export async function createNotification(
  req: any,
  userId: string,
  type: NotificationType,
  message: string,
  metadata?: any
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        metadata: metadata || {}
      }
    });
    
    // Emit to specific user if they are connected
    if (req.io) {
      req.io.to(`user_${userId}`).emit('notification:new', notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
  }
}

export async function getNotifications(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  const isAdmin = req.isAdmin;
  try {
    if (!userId && !isAdmin) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (isAdmin && !userId) {
      res.json({ notifications: [] });
      return;
    }
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ notifications });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ error: 'Unable to load notifications' });
  }
}

export async function markAsRead(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  const isAdmin = req.isAdmin;
  const id = req.params.id as string;
  try {
    if (!userId && !isAdmin) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (id === 'all') {
      if (!userId) {
        res.status(401).json({ error: 'User ID required' });
        return;
      }
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true }
      });
    } else {
      await prisma.notification.update({
        where: { id },
        data: { read: true }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Unable to update notification' });
  }
}

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

// Get all sessions
export async function getSessions(_req: Request, res: Response): Promise<void> {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        registrations: { select: { userId: true } },
      },
      orderBy: { date: 'asc' },
    });

    const formatted = sessions.map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      hostName: s.hostName,
      date: s.date.toISOString(),
      sessionLink: s.sessionLink,
      image: s.image,
      registeredUsers: s.registrations.map((r: any) => r.userId),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

import { uploadToCloudinary } from '../config/cloudinary';

// Create a session (admin only)
export async function createSession(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, hostName, date, sessionLink } = req.body;
    const file = req.file;

    if (!title || !description || !hostName || !date || !sessionLink) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    let imageUrl = null;
    if (file) {
      const result = await uploadToCloudinary(file.buffer, 'sessions');
      imageUrl = result.secure_url;
    }

    const session = await prisma.session.create({
      data: { title, description, hostName, date: new Date(date), sessionLink, image: imageUrl },
    });

    const responseData = {
      id: session.id,
      title: session.title,
      description: session.description,
      hostName: session.hostName,
      date: session.date.toISOString(),
      sessionLink: session.sessionLink,
      image: session.image,
      registeredUsers: [],
    };

    (req as any).io.emit('session:created', responseData);

    res.status(201).json(responseData);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Toggle registration on a session
export async function toggleRegistration(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;
    const userId = req.userId!;

    const existing = await prisma.sessionRegistration.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });

    if (existing) {
      await prisma.sessionRegistration.delete({ where: { id: existing.id } });
      (req as any).io.emit('session:registered', { sessionId, userId, registered: false });
      res.json({ registered: false });
    } else {
      await prisma.sessionRegistration.create({ data: { sessionId, userId } });
      (req as any).io.emit('session:registered', { sessionId, userId, registered: true });
      res.json({ registered: true });
    }
  } catch (error) {
    console.error('Toggle registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Update a session (admin only)
export async function updateSession(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;
    const { title, description, hostName, date, sessionLink } = req.body;
    const file = req.file;

    let imageUrl = undefined;
    if (file) {
      const result = await uploadToCloudinary(file.buffer, 'sessions');
      imageUrl = result.secure_url;
    }

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(hostName && { hostName }),
        ...(date && { date: new Date(date) }),
        ...(sessionLink && { sessionLink }),
        ...(imageUrl && { image: imageUrl }),
      },
    });

    const responseData = {
      id: session.id,
      title: session.title,
      description: session.description,
      hostName: session.hostName,
      date: session.date.toISOString(),
      sessionLink: session.sessionLink,
      image: session.image,
    };

    (req as any).io.emit('session:updated', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Delete a session (admin only)
export async function deleteSession(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;
    await prisma.session.delete({ where: { id: sessionId } });
    (req as any).io.emit('session:deleted', { sessionId });
    res.json({ message: 'Session deleted' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

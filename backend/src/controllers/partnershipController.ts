import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// Submit a partnership request
export async function createPartnership(req: Request, res: Response): Promise<void> {
  try {
    const { organizationName, contactPerson, email, phone, website, proposal } = req.body;

    if (!organizationName || !contactPerson || !email || !proposal) {
      res.status(400).json({ error: 'Organization name, contact person, email, and proposal are required' });
      return;
    }

    const partnership = await prisma.partnership.create({
      data: {
        organizationName,
        contactPerson,
        email,
        phone: phone || '',
        website: website || '',
        proposal,
      },
    });

    (req as any).io.emit('partnership:created', partnership);

    res.status(201).json(partnership);
  } catch (error) {
    console.error('Create partnership error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get all partnerships (admin)
export async function getPartnerships(_req: Request, res: Response): Promise<void> {
  try {
    const partnerships = await prisma.partnership.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(partnerships);
  } catch (error) {
    console.error('Get partnerships error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Update partnership status (admin)
export async function updatePartnershipStatus(req: Request, res: Response): Promise<void> {
  try {
    const partnershipId = req.params.partnershipId as string;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Status must be pending, approved, or rejected' });
      return;
    }

    const partnership = await prisma.partnership.update({
      where: { id: partnershipId },
      data: { status },
    });

    (req as any).io.emit('partnership:updated', partnership);

    res.json(partnership);
  } catch (error) {
    console.error('Update partnership error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Full update for partnership (admin)
export async function updatePartnership(req: Request, res: Response): Promise<void> {
  try {
    const partnershipId = req.params.partnershipId as string;
    const { organizationName, contactPerson, email, phone, website, proposal, status } = req.body;

    const partnership = await prisma.partnership.update({
      where: { id: partnershipId },
      data: {
        organizationName,
        contactPerson,
        email,
        phone,
        website,
        proposal,
        status,
      },
    });

    (req as any).io.emit('partnership:updated', partnership);
    res.json(partnership);
  } catch (error) {
    console.error('Full update partnership error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Delete partnership (admin)
export async function deletePartnership(req: Request, res: Response): Promise<void> {
  try {
    const partnershipId = req.params.partnershipId as string;
    await prisma.partnership.delete({ where: { id: partnershipId } });
    (req as any).io.emit('partnership:deleted', { id: partnershipId });
    res.json({ message: 'Partnership deleted' });
  } catch (error) {
    console.error('Delete partnership error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

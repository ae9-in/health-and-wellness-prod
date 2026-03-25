import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createNotification } from './notificationsController';

// Get user's payments
export async function getMyPayments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Record a payment (simulated)
export async function createPayment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const { amount, plan, transactionId } = req.body;

    if (!amount || !plan || !transactionId) {
      res.status(400).json({ error: 'Amount, plan, and transactionId are required' });
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        plan,
        transactionId,
        paymentStatus: 'success',
      },
    });

    (req as any).io.emit('payment:created', payment);

    await createNotification(
      req,
      userId,
      'PAYMENT_PROCESSED',
      `Payment of ₹${amount} for ${plan} was successful.`,
      { transactionId, amount, plan }
    );

    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createNotification } from './notificationsController';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// ─── POST /api/razorpay/create-order ───────────────────────────────────────────
// Receives cart items from the frontend, creates an Order in DB (PENDING),
// creates a Razorpay order, and returns the razorpay_order_id + key_id.
export async function createRazorpayOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const { items, totalAmount } = req.body as {
      items: { productId: string; quantity: number; price: number }[];
      totalAmount: number;
    };

    if (!items || items.length === 0 || !totalAmount) {
      res.status(400).json({ error: 'Cart items and totalAmount are required' });
      return;
    }

    // Validate products exist
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: 'APPROVED' },
      select: { id: true, price: true, stock: true, name: true },
    });

    if (products.length !== productIds.length) {
      res.status(400).json({ error: 'One or more products are unavailable' });
      return;
    }

    // Amount must be in paise (smallest INR unit) for Razorpay
    const amountInPaise = Math.round(totalAmount * 100);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${Date.now()}`,
    });

    // Save a PENDING Order record in our DB
    const dbOrder = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        status: 'PENDING',
        razorpayOrderId: razorpayOrder.id,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    res.status(201).json({
      orderId: dbOrder.id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
}

// ─── POST /api/razorpay/verify ──────────────────────────────────────────────────
// Verifies the Razorpay payment signature and marks the Order as SUCCESS.
export async function verifyRazorpayPayment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      orderId: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      res.status(400).json({ error: 'Missing payment verification fields' });
      return;
    }

    // Verify signature using HMAC SHA-256
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Mark order as FAILED on mismatch
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'FAILED' },
      });
      res.status(400).json({ error: 'Payment signature verification failed' });
      return;
    }

    // Signature valid – update order to SUCCESS
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SUCCESS',
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      },
      include: { items: true },
    });

    // Also record in the legacy Payment table for dashboard compatibility
    await prisma.payment.create({
      data: {
        userId,
        amount: order.totalAmount,
        plan: `Cart Checkout (${order.items.length} item${order.items.length > 1 ? 's' : ''})`,
        transactionId: razorpay_payment_id,
        paymentStatus: 'success',
      },
    });

    // Send notification
    await createNotification(
      req,
      userId,
      'PAYMENT_PROCESSED',
      `Payment of ₹${order.totalAmount} was successful! Order confirmed.`,
      { paymentId: razorpay_payment_id, amount: order.totalAmount }
    );

    // Emit real-time event
    (req as any).io?.emit('payment:created', { orderId, status: 'SUCCESS' });

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Verify Razorpay payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
}

// ─── GET /api/razorpay/orders ───────────────────────────────────────────────────
// Returns the logged-in user's order history.
export async function getMyOrders(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, images: true, price: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

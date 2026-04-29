import { Router } from 'express';
import { createRazorpayOrder, verifyRazorpayPayment, getMyOrders } from '../controllers/razorpayController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Create a Razorpay order (called before showing payment popup)
router.post('/create-order', authenticate, createRazorpayOrder);

// Verify payment after user completes it
router.post('/verify', authenticate, verifyRazorpayPayment);

// Get current user's order history
router.get('/orders', authenticate, getMyOrders);

export default router;

import { Router } from 'express';
import { getMyPayments, createPayment } from '../controllers/paymentController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticate, getMyPayments);
router.post('/', authenticate, createPayment);

export default router;

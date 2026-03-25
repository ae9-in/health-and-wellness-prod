import { Router } from 'express';
import { createPartnership, getPartnerships, updatePartnershipStatus } from '../controllers/partnershipController';
import { adminOnly } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', createPartnership); // Public - anyone can submit a partnership request
router.get('/', adminOnly, getPartnerships);
router.patch('/:partnershipId/status', adminOnly, updatePartnershipStatus);

export default router;

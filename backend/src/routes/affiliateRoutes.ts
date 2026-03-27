import { Router } from 'express';
import { submitAffiliateProfile, getAffiliateDashboard, calculateEarnings, getAffiliateNotifications, createCommissionRequest } from '../controllers/affiliatesController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate, authorizeRoles(Role.AFFILIATE));

router.post('/profile', submitAffiliateProfile);
router.get('/dashboard', getAffiliateDashboard);
router.post('/earnings', calculateEarnings);
router.get('/notifications', getAffiliateNotifications);
router.post('/commission-request', createCommissionRequest);

export default router;

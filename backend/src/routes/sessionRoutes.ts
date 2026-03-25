import { Router } from 'express';
import { getSessions, createSession, toggleRegistration, deleteSession } from '../controllers/sessionController';
import { authenticate, adminOnly } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getSessions);
router.post('/', adminOnly, createSession);
router.post('/:sessionId/register', authenticate, toggleRegistration);
router.delete('/:sessionId', adminOnly, deleteSession);

export default router;

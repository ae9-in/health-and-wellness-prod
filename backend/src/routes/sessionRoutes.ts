import { Router } from 'express';
import { getSessions, createSession, updateSession, toggleRegistration, deleteSession } from '../controllers/sessionController';
import { authenticate, adminOnly } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

router.get('/', getSessions);
router.post('/', adminOnly, upload.single('image'), createSession);
router.put('/:sessionId', adminOnly, upload.single('image'), updateSession);
router.post('/:sessionId/register', authenticate, toggleRegistration);
router.delete('/:sessionId', adminOnly, deleteSession);

export default router;

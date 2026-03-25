import { Router } from 'express';
import { signup, login, adminLogin, getMe } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.get('/me', authenticate, getMe);

export default router;

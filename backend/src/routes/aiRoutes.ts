import { Router } from 'express';
import { generateAIPlan, followUpQuestion, saveAIPlan, getUserPlans } from '../controllers/aiController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/generate-ai-plan', generateAIPlan);
router.post('/follow-up', followUpQuestion);
router.post('/save-ai-plan', authenticate, saveAIPlan);
router.get('/history', authenticate, getUserPlans);

export default router;

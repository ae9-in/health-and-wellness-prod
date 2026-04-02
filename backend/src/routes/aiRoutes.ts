import { Router } from 'express';
import { generateAIPlan, followUpQuestion } from '../controllers/aiController';

const router = Router();

router.post('/generate-ai-plan', generateAIPlan);
router.post('/follow-up', followUpQuestion);

export default router;

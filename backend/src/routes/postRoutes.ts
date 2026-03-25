import { Router } from 'express';
import { getPosts, createPost, toggleLike, toggleSave, addComment, getAuthors } from '../controllers/postController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

router.get('/', getPosts);
router.get('/authors', getAuthors);
router.post('/', authenticate, authorizeRoles(Role.ADMIN, Role.EXPERT, Role.AFFILIATE, Role.BRAND), upload.fields([
  { name: 'images', maxCount: 4 },
  { name: 'video', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]), createPost);
router.post('/:postId/like', authenticate, toggleLike);
router.post('/:postId/save', authenticate, toggleSave);
router.post('/:postId/comments', authenticate, addComment);

export default router;

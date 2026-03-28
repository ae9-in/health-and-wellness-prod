import { Router, Request, Response, NextFunction } from 'express';
import { createProduct, listBrandProducts, updateProduct, deleteProduct, getBrandDashboard, getBrandNotifications } from '../controllers/brandsController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

router.use(authenticate, authorizeRoles(Role.BRAND));

const uploadIfMultipart = (req: Request, res: Response, next: NextFunction) => {
  const contentType = (req.headers['content-type'] ?? '').toString();
  if (contentType.startsWith('multipart/')) {
    // We now use 'productImages' for file uploads to avoid collision with string 'images' in req.body
    upload.array('productImages', 10)(req, res, next);
  } else {
    next();
  }
};

router.get('/products', listBrandProducts);
router.post('/products', uploadIfMultipart, createProduct);
router.put('/products/:productId', updateProduct);
router.delete('/products/:productId', deleteProduct);
router.get('/dashboard', getBrandDashboard);
router.get('/notifications', getBrandNotifications);

export default router;

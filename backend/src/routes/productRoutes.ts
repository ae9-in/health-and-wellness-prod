import { Router } from 'express';
import { getProducts, getProductById, getPublicBrands } from '../controllers/productController';

const router = Router();

router.get('/', getProducts);
router.get('/public-brands', getPublicBrands);
router.get('/:id', getProductById);

export default router;

import { Router } from 'express';
import { createUser, getAllUsers, toggleBlockUser, deleteUser, getDashboardStats, getAllPayments, updatePost, deletePost, createAdminPost, togglePostSponsored, getAllComments, deleteAdminComment, listAffiliateCoupons, updateAffiliateCoupon, regenerateAffiliateCouponHandler } from '../controllers/adminController';
import { createSession, updateSession, deleteSession } from '../controllers/sessionController';
import { getPartnerships, updatePartnershipStatus, updatePartnership, deletePartnership } from '../controllers/partnershipController';
import { listAffiliateApplications, reviewAffiliate, listBrandApplications, reviewBrand, listAdminProducts, reviewProduct, deleteAdminProduct, deleteBrand, deleteAffiliate } from '../controllers/approvalController';
import { authenticate, adminOnly } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

// All admin routes require admin authentication
router.use(authenticate, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.patch('/users/:userId/block', toggleBlockUser);
router.delete('/users/:userId', deleteUser);
router.get('/payments', getAllPayments);
router.post('/sessions', createSession);
router.put('/sessions/:sessionId', updateSession);
router.delete('/sessions/:sessionId', deleteSession);
router.get('/partnerships', getPartnerships);
router.patch('/partnerships/:partnershipId/status', updatePartnershipStatus);
router.put('/partnerships/:partnershipId', updatePartnership);
router.delete('/partnerships/:partnershipId', deletePartnership);

router.post('/posts', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]), createAdminPost);
router.put('/posts/:postId', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]), updatePost);
router.delete('/posts/:postId', deletePost);

router.get('/affiliates/applications', listAffiliateApplications);
router.patch('/affiliates/:affiliateId/status', reviewAffiliate);
router.get('/affiliates/coupons', listAffiliateCoupons);
router.patch('/affiliates/:affiliateId/coupon', updateAffiliateCoupon);
router.post('/affiliates/:affiliateId/coupon/regenerate', regenerateAffiliateCouponHandler);
router.get('/brands/applications', listBrandApplications);
router.patch('/brands/:brandId/status', reviewBrand);

router.delete('/affiliates/:affiliateId', deleteAffiliate);
router.delete('/brands/:brandId', deleteBrand);
router.get('/products/all', listAdminProducts);
router.patch('/products/:productId/status', reviewProduct);
router.delete('/products/:productId', deleteAdminProduct);
router.patch('/posts/:postId/sponsored', togglePostSponsored);
router.get('/comments', getAllComments);
router.delete('/comments/:commentId', deleteAdminComment);

export default router;

import { Router } from 'express';
import { allCoupons, applyDiscount, createCoupon, deleteCoupon } from '../controllers/payment.js';
import { adminOnly } from '../middlewares/auth.js';
const router = Router();
router.post('/coupon/new', adminOnly, createCoupon);
router.get('/apply/discount', applyDiscount);
router.get('/allcoupons', adminOnly, allCoupons);
router.delete('/coupon/:id', adminOnly, deleteCoupon);
export default router;

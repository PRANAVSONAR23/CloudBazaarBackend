import { Router } from 'express';
import { getDashboardStats } from '../controllers/stats.js';
const router = Router();
router.get('/stats', getDashboardStats);
router.get('/pie');
router.get('/bar');
router.get('/line');
export default router;

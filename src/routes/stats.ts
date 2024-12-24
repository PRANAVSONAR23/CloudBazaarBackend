import {Router} from 'express'
import { getBarChart, getDashboardStats, getPieChart } from '../controllers/stats.js';
import { adminOnly } from '../middlewares/auth.js';

const router=Router();

router.get('/stats',adminOnly,getDashboardStats)

router.get('/pie',adminOnly,getPieChart)

router.get('/bar',adminOnly, getBarChart)

router.get('/line')

export default router;

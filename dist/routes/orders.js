import { Router } from 'express';
import { adminOnly } from '../middlewares/auth.js';
import { allOrders, myOrders, newOrder } from '../controllers/order.js';
const router = Router();
router.post("/new", newOrder);
router.get("/my", myOrders);
router.get("/all", adminOnly, allOrders);
export default router;

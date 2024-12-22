import { Router } from 'express';
import { adminOnly } from '../middlewares/auth.js';
import { allOrders, deleteOrder, getSingleOrder, myOrders, newOrder, processOrder } from '../controllers/order.js';
const router = Router();
router.post("/new", newOrder);
router.get("/my", myOrders);
router.get("/all", adminOnly, allOrders);
router.route("/:id").get(getSingleOrder).put(processOrder).delete(deleteOrder);
export default router;

import { Router } from 'express';
import { deleteUser, getAllUsers, getUser, newUser } from '../controllers/user.js';
import { adminOnly } from '../middlewares/auth.js';
const router = Router();
router.post("/new", newUser);
router.get('/all', adminOnly, getAllUsers);
router.route('/:id').get(getUser).delete(adminOnly, deleteUser);
export default router;

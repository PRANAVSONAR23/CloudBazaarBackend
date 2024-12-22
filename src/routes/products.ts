import {Router} from 'express'
import { deleteProduct, getAdminProducts, getAllCategories, getAllProducts, getLatestProducts, getSingleProduct, newProduct, updateProduct } from '../controllers/product.js';
import { singleUpload } from '../middlewares/multer.js';
import { adminOnly } from '../middlewares/auth.js';

const router=Router();

router.post('/new',adminOnly,singleUpload, newProduct)

router.get('/latest',getLatestProducts)

router.get('/all', getAllProducts)

router.get('/categories',getAllCategories)

router.get('/admin-products',adminOnly,getAdminProducts)
 
router.route('/:id').get(getSingleProduct).put(adminOnly,singleUpload,updateProduct).delete(adminOnly,deleteProduct)


export default router;
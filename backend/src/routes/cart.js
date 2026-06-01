import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { addCart, clearCartController, listCart, mergeCart, removeCart, updateCart } from '../controllers/cartController.js';

const router = Router();

router.get('/', authMiddleware.optional, listCart);
router.post('/add', authMiddleware.optional, addCart);
router.post('/merge', authMiddleware, mergeCart);
router.put('/update', authMiddleware.optional, updateCart);
router.delete('/remove/:productId', authMiddleware.optional, removeCart);
router.delete('/clear', authMiddleware.optional, clearCartController);

export default router;

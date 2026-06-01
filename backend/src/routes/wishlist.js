import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { addToWishlist, deleteFromWishlist, getWishlist } from '../controllers/wishlistController.js';

const router = Router();

router.get('/', authMiddleware, getWishlist);
router.post('/:productId', authMiddleware, addToWishlist);
router.delete('/:productId', authMiddleware, deleteFromWishlist);

export default router;

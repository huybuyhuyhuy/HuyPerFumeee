import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';
import { deleteReview, moderateReview, updateReview } from '../controllers/reviewController.js';

const router = Router();

router.put('/:id', authMiddleware, updateReview);
router.delete('/:id', authMiddleware, deleteReview);
router.put('/:id/moderation', adminMiddleware, moderateReview);

export default router;

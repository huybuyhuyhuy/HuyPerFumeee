import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { cancel, checkout, detail, history } from '../controllers/orderController.js';

const router = Router();

router.post('/checkout', authMiddleware, checkout);
router.get('/history', authMiddleware, history);
router.get('/:id', authMiddleware, detail);
router.put('/:id/cancel', authMiddleware, cancel);

export default router;

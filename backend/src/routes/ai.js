import { Router } from 'express';
import { productChat, contentAI } from '../controllers/aiController.js';

const router = Router();

router.post('/product-chat', productChat);
router.post('/content', contentAI);

export default router;

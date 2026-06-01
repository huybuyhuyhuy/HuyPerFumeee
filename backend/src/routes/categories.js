import { Router } from 'express';
import { listCategories } from './products.js';

const router = Router();
router.get('/', listCategories);

export default router;

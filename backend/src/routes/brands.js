import { Router } from 'express';
import { listBrands } from './products.js';

const router = Router();
router.get('/', listBrands);

export default router;

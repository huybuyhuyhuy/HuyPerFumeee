import { Router } from 'express';
import { validateVoucher } from '../controllers/voucherController.js';

const router = Router();

router.post('/validate', validateVoucher);

export default router;

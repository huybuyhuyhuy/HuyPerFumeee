import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { createMomo, createZaloPay, momoIpn, momoReturn, zaloPayReturn } from '../controllers/paymentController.js';

const router = Router();

router.post('/momo/create', authMiddleware, createMomo);
router.post('/momo/ipn', momoIpn);
router.get('/momo/return', momoReturn);
router.post('/zalopay/create', authMiddleware, createZaloPay);
router.get('/zalopay/return', zaloPayReturn);

export default router;

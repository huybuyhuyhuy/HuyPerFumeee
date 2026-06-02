import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { createMomo, createZaloPay, momoIpn, momoReturn, zaloPayCallback, zaloPayReturn } from '../controllers/paymentController.js';

const router = Router();

router.post('/momo/create', authMiddleware, createMomo);
router.post('/momo/ipn', momoIpn);
router.get('/momo/return', momoReturn);
router.post('/zalopay/create', authMiddleware, createZaloPay);
router.post('/zalopay/callback', zaloPayCallback);
router.get('/zalopay/return', zaloPayReturn);

export default router;

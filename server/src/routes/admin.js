import { Router } from 'express';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';
import { stats } from '../controllers/adminDashboardController.js';
import { changeStatus, listOrders, orderDetail } from '../controllers/adminOrderController.js';
import { listProducts } from '../controllers/productController.js';
import { listAdminUsers } from '../controllers/adminUserController.js';

const router = Router();

router.get('/dashboard', adminMiddleware, stats);
router.get('/dashboard/stats', adminMiddleware, stats);
router.get('/products', adminMiddleware, listProducts);
router.get('/orders', adminMiddleware, listOrders);
router.get('/orders/:id', adminMiddleware, orderDetail);
router.put('/orders/:id/status', adminMiddleware, changeStatus);
router.get('/users', adminMiddleware, listAdminUsers);

export default router;


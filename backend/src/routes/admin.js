import { Router } from 'express';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { ROLES } from '../modules/auth/rbac.js';
import { stats, summary, charts } from '../controllers/adminDashboardController.js';
import { report } from '../controllers/adminReportController.js';
import { listOrders, orderAnalytics, orderDetail, changeStatus } from '../controllers/adminOrderController.js';
import { listAdminUsers, userDetail, updateUserStatus, updateUserRole, updateUserNote } from '../controllers/adminUserController.js';
import {
  listProducts,
  detail,
  create,
  update,
  updateStatus,
  remove,
  resetStock,
} from '../controllers/adminProductController.js';
import {
  listDecantProducts,
  createBatch,
  createOption,
  listBatches,
  listOptions,
  updateBatch,
  updateOption,
  removeOption,
} from '../controllers/adminDecantController.js';
import { list, alerts, adjust, transactions, getDecantInventory, openBottles, restockBottles, decantAdjust, decantMovements } from '../controllers/adminInventoryController.js';
import {
  listReviews,
  reviewDetail,
  moderateReview,
  bulkModerate,
} from '../controllers/adminReviewController.js';
import { adminList, create as createBanner, update as updateBanner, remove as removeBanner, reorder } from '../controllers/bannerController.js';
import { list as listVouchers, detail as voucherDetail, create as createVoucher, update as updateVoucher, updateStatus as updateVoucherStatus, remove as removeVoucher } from '../controllers/adminVoucherController.js';
import { listAuditLogs } from '../controllers/adminAuditController.js';
import { successResponse, errorResponse } from '../utils/response.js';
import upload from '../config/upload.js';
import { auditLog } from '../config/logger.js';

const router = Router();
const adminProductsMiddleware = [...adminMiddleware, authMiddleware.requireRoles([ROLES.ADMIN])];

// --- Dashboard ---
router.get('/dashboard', adminMiddleware, stats);
router.get('/dashboard/stats', adminMiddleware, stats);
router.get('/dashboard/summary', adminMiddleware, summary);
router.get('/dashboard/charts', adminMiddleware, charts);
router.get('/reports', adminMiddleware, report);

// --- Decant ---
router.get('/decant/products', adminProductsMiddleware, listDecantProducts);
router.get('/products/:id/batches', adminProductsMiddleware, listBatches);
router.post('/products/:id/batches', adminProductsMiddleware, createBatch);
router.patch('/batches/:id', adminProductsMiddleware, updateBatch);
router.get('/products/:id/decant-options', adminProductsMiddleware, listOptions);
router.post('/products/:id/decant-options', adminProductsMiddleware, createOption);
router.patch('/decant-options/:id', adminProductsMiddleware, updateOption);
router.delete('/decant-options/:id', adminProductsMiddleware, removeOption);

// --- Products ---
router.get('/products', adminProductsMiddleware, listProducts);
router.get('/products/:id', adminProductsMiddleware, detail);
router.post('/products', adminProductsMiddleware, create);
router.put('/products/:id', adminProductsMiddleware, update);
router.patch('/products/:id/status', adminProductsMiddleware, updateStatus);
router.patch('/products/:id/stock', adminProductsMiddleware, resetStock);
router.delete('/products/:id', adminProductsMiddleware, remove);
router.post('/products/:id/reset-stock', adminProductsMiddleware, resetStock);
router.get('/products/:id/batches', adminProductsMiddleware, listBatches);
router.post('/products/:id/batches', adminProductsMiddleware, createBatch);
router.patch('/batches/:id', adminProductsMiddleware, updateBatch);
router.get('/products/:id/decant-options', adminProductsMiddleware, listOptions);
router.post('/products/:id/decant-options', adminProductsMiddleware, createOption);
router.patch('/decant-options/:id', adminProductsMiddleware, updateOption);

// --- Inventory ---
router.get('/inventory', adminMiddleware, list);
router.get('/inventory/alerts', adminMiddleware, alerts);
router.post('/inventory/adjust', adminMiddleware, adjust);
router.get('/inventory/transactions', adminMiddleware, transactions);

// --- Decant Inventory ---
router.get('/inventory/decant/movements', adminMiddleware, decantMovements);
router.post('/inventory/decant/open', adminMiddleware, openBottles);
router.post('/inventory/decant/restock', adminMiddleware, restockBottles);
router.post('/inventory/decant/adjust', adminMiddleware, decantAdjust);
router.get('/inventory/decant/:productId', adminMiddleware, getDecantInventory);

// --- Orders ---
router.get('/orders', adminMiddleware, listOrders);
router.get('/orders/analytics', adminMiddleware, orderAnalytics);
router.get('/orders/:id', adminMiddleware, orderDetail);
router.put('/orders/:id/status', adminMiddleware, changeStatus);
router.patch('/orders/:id/status', adminMiddleware, changeStatus);

// --- Users ---
router.get('/users', adminMiddleware, listAdminUsers);
router.get('/users/:id', adminMiddleware, userDetail);
router.patch('/users/:id/status', adminMiddleware, updateUserStatus);
router.patch('/users/:id/role', adminMiddleware, updateUserRole);
router.patch('/users/:id/note', adminMiddleware, updateUserNote);

// --- Reviews ---
router.get('/reviews', adminMiddleware, listReviews);
router.get('/reviews/:id', adminMiddleware, reviewDetail);
router.put('/reviews/:id/moderate', adminMiddleware, moderateReview);
router.post('/reviews/bulk-moderate', adminMiddleware, bulkModerate);

// --- Audit Logs ---
router.get('/audit-logs', adminMiddleware, listAuditLogs);

// --- Vouchers ---
router.get('/voucher', adminMiddleware, listVouchers);
router.get('/voucher/:id', adminMiddleware, voucherDetail);
router.post('/voucher', adminMiddleware, createVoucher);
router.put('/voucher/:id', adminMiddleware, updateVoucher);
router.patch('/voucher/:id/status', adminMiddleware, updateVoucherStatus);
router.delete('/voucher/:id', adminMiddleware, removeVoucher);
router.get('/vouchers', adminMiddleware, listVouchers);
router.get('/vouchers/:id', adminMiddleware, voucherDetail);
router.post('/vouchers', adminMiddleware, createVoucher);
router.put('/vouchers/:id', adminMiddleware, updateVoucher);
router.patch('/vouchers/:id/status', adminMiddleware, updateVoucherStatus);
router.delete('/vouchers/:id', adminMiddleware, removeVoucher);

// --- Banners ---
router.get('/banners', adminMiddleware, adminList);
router.post('/banners', adminMiddleware, createBanner);
router.put('/banners/reorder', adminMiddleware, reorder);
router.put('/banners/:id', adminMiddleware, updateBanner);
router.delete('/banners/:id', adminMiddleware, removeBanner);

// --- File Upload ---
router.post('/upload', adminMiddleware, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return errorResponse(res, 400, 'File quá lớn. Kích thước tối đa là 5MB');
      }
      return errorResponse(res, 400, err.message || 'Lỗi upload file');
    }
    if (!req.file) {
      return errorResponse(res, 400, 'Không tìm thấy file');
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    auditLog('FILE_UPLOAD', req.user?.id, { filename: req.file.originalname, url: fileUrl });
    return successResponse(res, 'Upload file thành công', {
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
    });
  });
});

export default router;

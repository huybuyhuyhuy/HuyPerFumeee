import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { rateLimit } from '../middlewares/rateLimitMiddleware.js';
import {
  addresses,
  captchaChallenge,
  createAddress,
  deleteAddress,
  forgotPassword,
  login,
  logout,
  me,
  profile,
  refresh,
  register,
  requestVerification,
  resetPasswordController,
  setDefaultAddress,
  socialLogin,
  updateAddress,
  verifyEmailController,
} from '../controllers/authController.js';

const router = Router();
const authLimiter = rateLimit({ scope: 'auth' });

router.get('/captcha', authLimiter, captchaChallenge);
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', authMiddleware.optional, logout);
router.get('/me', authMiddleware, me);
router.put('/profile', authMiddleware, profile);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordController);
router.post('/email-verification/request', authLimiter, requestVerification);
router.post('/email-verification/verify', authLimiter, verifyEmailController);
router.post('/social-login', authLimiter, socialLogin);
router.get('/addresses', authMiddleware, addresses);
router.post('/addresses', authMiddleware, createAddress);
router.put('/addresses/:id', authMiddleware, updateAddress);
router.delete('/addresses/:id', authMiddleware, deleteAddress);
router.put('/addresses/:id/default', authMiddleware, setDefaultAddress);

export default router;

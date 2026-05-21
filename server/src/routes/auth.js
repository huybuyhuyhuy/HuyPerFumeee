import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { forgotPassword, login, logout, me, profile, register } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);
router.put('/profile', authMiddleware, profile);
router.post('/forgot-password', forgotPassword);

export default router;

import express from 'express';
import { env } from './src/config/env.js';
import { corsMiddleware } from './src/config/cors.js';
import healthRoutes from './src/routes/health.js';
import authRoutes from './src/routes/auth.js';
import productRoutes from './src/routes/products.js';
import categoryRoutes from './src/routes/categories.js';
import brandRoutes from './src/routes/brands.js';
import cartRoutes from './src/routes/cart.js';
import orderRoutes from './src/routes/orders.js';
import adminRoutes from './src/routes/admin.js';
import paymentRoutes from './src/routes/payment.js';
import aiRoutes from './src/routes/ai.js';
import wishlistRoutes from './src/routes/wishlist.js';
import { notFoundHandler } from './src/middlewares/notFound.js';
import { errorHandler } from './src/middlewares/errorHandler.js';

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'huyperfume-server',
    message: 'Node.js + Express backend foundation is running',
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
export { env };

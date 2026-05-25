import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './src/config/env.js';
import { corsMiddleware } from './src/config/cors.js';
import logger from './src/config/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import healthRoutes from './src/routes/health.js';
import authRoutes from './src/routes/auth.js';
import productRoutes from './src/routes/products.js';
import reviewRoutes from './src/routes/reviews.js';
import categoryRoutes from './src/routes/categories.js';
import brandRoutes from './src/routes/brands.js';
import cartRoutes from './src/routes/cart.js';
import orderRoutes from './src/routes/orders.js';
import adminRoutes from './src/routes/admin.js';
import paymentRoutes from './src/routes/payment.js';
import aiRoutes from './src/routes/ai.js';
import wishlistRoutes from './src/routes/wishlist.js';
import contactRoutes from './src/routes/contact.js';
import { publicList as publicBanners } from './src/controllers/bannerController.js';
import { notFoundHandler } from './src/middlewares/notFound.js';
import { errorHandler } from './src/middlewares/errorHandler.js';

const app = express();

app.use(corsMiddleware);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/api/health' && req.path !== '/api/health/live') {
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

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
app.use('/api/reviews', reviewRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.get('/api/banners', publicBanners);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
export { env };

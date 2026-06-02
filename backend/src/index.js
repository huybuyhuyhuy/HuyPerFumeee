import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';
import aiRoutes from './routes/ai.js';
import productRoutes from './routes/products.js';
import reviewRoutes from './routes/reviews.js';
import wishlistRoutes from './routes/wishlist.js';
import categoriesRoutes from './routes/categories.js';
import brandsRoutes from './routes/brands.js';
import contactRoutes from './routes/contact.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const portLabel = process.env.PORT || '4000';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'huyperfume-server',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/contact', contactRoutes);

app.use((err, req, res, _next) => {
  console.error(err);

  res.status(500).json({
    status: 500,
    error: 'Lỗi máy chủ nội bộ',
    message: 'Lỗi hệ thống: ' + err.message,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

const server = app.listen(port, () => {
  console.log(`huyperfume-server đang chạy tại http://localhost:${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Cổng ${portLabel} đang được sử dụng. Hãy dừng tiến trình cũ hoặc đổi PORT.`);
    process.exit(1);
  }
  console.error('Lỗi máy chủ:', err);
  process.exit(1);
});

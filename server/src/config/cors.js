import cors from 'cors';
import { env } from './env.js';

export const corsMiddleware = cors({
  origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((item) => item.trim()).filter(Boolean),
  credentials: true,
});

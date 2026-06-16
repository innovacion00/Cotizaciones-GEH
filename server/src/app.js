import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { rateLimit } from 'express-rate-limit';

import { env } from './config/env.js';
import { errorMiddleware } from './shared/middlewares/error.middleware.js';

import authRoutes from './modules/auth/auth.routes.js';
import workspacesRoutes from './modules/workspaces/workspaces.routes.js';
import catalogRoutes from './modules/catalog/catalog.routes.js';
import quotesRoutes from './modules/quotes/quotes.routes.js';
import publicRoutes from './modules/quotes/quotes.public.routes.js';
import hotelsRoutes from './modules/hotels/hotels.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true });

app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/workspaces', workspacesRoutes);
app.use('/api/v1/workspaces', catalogRoutes);
app.use('/api/v1/quotes', quotesRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/hotels', hotelsRoutes);

app.use(errorMiddleware);

export default app;

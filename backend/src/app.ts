import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { optionalClerkMiddleware } from './middleware/authMiddleware.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.use(express.text({ limit: '10mb', type: ['text/csv', 'text/plain'] }));

  // Clerk Auth Middleware (Active if CLERK_SECRET_KEY is present)
  app.use(optionalClerkMiddleware);

  // API Routes
  app.use('/api', routes);

  // 404 & Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

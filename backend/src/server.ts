import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';

async function startServer() {
  await connectDB();
  
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`⚡ FinTrace AI Backend listening on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`🏥 Health check available at http://localhost:${env.PORT}/api/health`);
  });

  const shutdown = () => {
    logger.info('Shutting down server gracefully...');
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

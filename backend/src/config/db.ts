import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }
    await mongoose.connect(env.MONGODB_URI);
    logger.info(`Connected to MongoDB at ${env.MONGODB_URI}`);
  } catch (error) {
    logger.warn('Failed to connect to MongoDB, running in standalone/disconnected mode until DB is available.', error);
  }
}

import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    // Set fallback DNS resolvers to ensure Windows SRV record resolution succeeds for mongodb+srv://
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch {
      // Ignore if setServers fails
    }

    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB Atlas / Database cluster successfully');
  } catch (error) {
    logger.warn('Failed to connect to MongoDB, running in standalone/disconnected mode until DB is available.', error);
  }
}

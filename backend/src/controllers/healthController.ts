import { Request, Response } from 'express';
import { env } from '../config/env.js';
import { HealthCheckResponse } from '../types/index.js';

export function getHealthStatus(_req: Request, res: Response): void {
  const healthData: HealthCheckResponse = {
    status: 'ok',
    service: 'FinTrace AI Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV
  };

  res.status(200).json(healthData);
}

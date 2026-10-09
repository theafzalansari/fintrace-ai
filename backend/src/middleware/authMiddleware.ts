import { Request, Response, NextFunction } from 'express';
import { clerkMiddleware, requireAuth } from '@clerk/express';

/**
 * Conditional Clerk Express authentication middleware.
 * If CLERK_SECRET_KEY is defined in process.env, request authentication tokens are verified.
 * If CLERK_SECRET_KEY is not defined, requests pass through for demo/testing mode.
 */
export const optionalClerkMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.CLERK_SECRET_KEY) {
    return clerkMiddleware()(req, res, next);
  }
  return next();
};

export const requireClerkAuth = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.CLERK_SECRET_KEY) {
    return requireAuth()(req, res, next);
  }
  return next();
};

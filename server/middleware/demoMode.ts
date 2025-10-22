/**
 * Demo Mode Middleware
 * Checks if user has demo mode enabled and injects demo data into requests
 */

import { Request, Response, NextFunction } from 'express';

export async function checkDemoMode(req: Request, res: Response, next: NextFunction) {
  // Demo mode check will be handled in individual routes
  // This middleware just adds a helper to check demo status
  res.locals.isDemoMode = false;
  
  if (req.user) {
    try {
      const storage = req.app.locals.storage;
      const userId = (req.user as any).id;
      const preferences = await storage.getUserPreferences(userId);
      res.locals.isDemoMode = preferences?.demoMode === true;
    } catch (error) {
      // If we can't get preferences, assume not in demo mode
      res.locals.isDemoMode = false;
    }
  }
  
  next();
}

export function isDemoMode(res: Response): boolean {
  return res.locals.isDemoMode === true;
}

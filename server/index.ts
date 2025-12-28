import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { investmentStrategies } from "@shared/schema";
import { getSession, setupAuth } from "./customAuth";

// ==================== ASSET BACKUP SYSTEM ====================
// Keeps old hashed assets available so cached HTML from previous deploys
// can still load their JS chunks - prevents React #300 errors on iOS Safari PWA
// IMPORTANT: Backup must be OUTSIDE dist folder to persist between deploys
const BACKUP_DIR = path.resolve(process.cwd(), "asset-backup");
const DIST_ASSETS = path.resolve(import.meta.dirname, "public/assets");

function backupCurrentAssets(): void {
  try {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      log("[BACKUP] Created asset backup directory");
    }
    
    // Check if dist assets exist
    if (!fs.existsSync(DIST_ASSETS)) {
      log("[BACKUP] No dist assets found, skipping backup");
      return;
    }
    
    // Copy all current assets to backup (preserves old files)
    const files = fs.readdirSync(DIST_ASSETS);
    let copiedCount = 0;
    
    for (const file of files) {
      const srcPath = path.join(DIST_ASSETS, file);
      const destPath = path.join(BACKUP_DIR, file);
      
      // Only copy if file doesn't exist in backup (keeps all versions)
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        copiedCount++;
      }
    }
    
    if (copiedCount > 0) {
      log(`[BACKUP] Backed up ${copiedCount} new assets`);
    }
    
    // Log backup stats
    const backupFiles = fs.readdirSync(BACKUP_DIR);
    log(`[BACKUP] Total backed up assets: ${backupFiles.length}`);
    
  } catch (error: any) {
    log(`[BACKUP] Error backing up assets: ${error?.message || error}`);
  }
}

// ==================== GLOBAL ERROR HANDLERS ====================
// Catch unhandled promise rejections (critical for production stability)
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  log(`[CRITICAL] Unhandled Promise Rejection: ${reason?.message || reason}`);
  if (reason?.stack) {
    log(`Stack: ${reason.stack}`);
  }
});

// Catch uncaught exceptions (last resort safety net)
process.on('uncaughtException', (error: Error) => {
  log(`[CRITICAL] Uncaught Exception: ${error.message}`);
  log(`Stack: ${error.stack}`);
  // Give time to log before potential crash
  setTimeout(() => process.exit(1), 1000);
});

const app = express();

// Trust proxy - required for secure cookies behind Replit's proxy
app.set('trust proxy', 1);

// Raw body middleware for Stripe webhooks (MUST come before express.json())
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware (must be before routes)
app.use(getSession());

// Setup OAuth authentication routes
setupAuth(app);

// Production-grade request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Safe logging: method, path, status, duration only (no response body)
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

(async () => {
  // Auto-seed investment data if database is empty
  try {
    const existingStrategies = await db.select().from(investmentStrategies).limit(1);
    if (existingStrategies.length === 0) {
      log("Investment data not found, seeding database...");
      const { seedInvestments } = await import("./seed-investments");
      await seedInvestments();
      log("Investment data seeded successfully");
    }
  } catch (error: any) {
    log("Failed to seed investment data:", error?.message || error);
  }

  // Always sync subscription plans to ensure pricing is up-to-date
  try {
    log("Syncing subscription plans with latest configuration...");
    const { seedSubscriptionPlans } = await import("./seed-subscriptions");
    await seedSubscriptionPlans();
    log("Subscription plans synced successfully");
  } catch (error: any) {
    log("Failed to sync subscription plans:", error?.message || error);
  }

  const server = await registerRoutes(app);

  // ==================== CENTRALIZED ERROR HANDLER ====================
  // Production-grade error handling with proper logging and user-friendly messages
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Log error details for debugging (safe: no sensitive data)
    log(`[ERROR] ${req.method} ${req.path} - ${status}: ${err.message}`);
    if (!isProduction && err.stack) {
      log(`Stack: ${err.stack.split('\n').slice(0, 5).join('\n')}`);
    }

    // User-friendly error messages for common status codes
    const userMessages: Record<number, string> = {
      400: 'Invalid request. Please check your input and try again.',
      401: 'Please sign in to continue.',
      403: 'You don\'t have permission to access this resource.',
      404: 'The requested resource was not found.',
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'Something went wrong on our end. Please try again later.',
      502: 'Service temporarily unavailable. Please try again.',
      503: 'Service is currently unavailable. Please try again later.',
    };

    const message = isProduction 
      ? (userMessages[status] || 'An unexpected error occurred.')
      : (err.message || 'Internal Server Error');

    res.status(status).json({ 
      message,
      ...(isProduction ? {} : { stack: err.stack?.split('\n').slice(0, 3) })
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // ==================== PRODUCTION ASSET HANDLING ====================
    // Backup current assets on startup to preserve for old cached HTML
    backupCurrentAssets();
    
    const distPath = path.resolve(import.meta.dirname, "public");
    
    // Serve hashed assets with long cache headers (immutable)
    app.use("/assets", express.static(path.resolve(distPath, "assets"), {
      maxAge: "1y",
      immutable: true,
      etag: false,
    }));
    
    // FALLBACK: Try serving from backup if asset not found in current build
    // This allows old cached HTML to load old JS chunks after a deploy
    app.use("/assets", (req, res, next) => {
      const filename = path.basename(req.path);
      const backupPath = path.join(BACKUP_DIR, filename);
      
      if (fs.existsSync(backupPath)) {
        log(`[BACKUP] Serving old asset from backup: ${filename}`);
        
        // Set proper content type based on extension
        const ext = path.extname(filename).toLowerCase();
        const contentTypes: Record<string, string> = {
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
        };
        
        if (contentTypes[ext]) {
          res.setHeader('Content-Type', contentTypes[ext]);
        }
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        
        return res.sendFile(backupPath);
      }
      
      next();
    });
    
    // 404 guard for missing assets - prevents SPA fallback from returning HTML
    app.use("/assets", (_req, res) => {
      res.status(404).send("Asset not found");
    });
    
    // Aggressive cache prevention for HTML pages to eliminate stale bundle issues
    // This middleware runs BEFORE static file serving to ensure headers are set
    app.use((req, res, next) => {
      const accept = req.headers.accept || "";
      const isNavigationRequest = accept.includes("text/html") || req.path === "/" || !req.path.includes(".");
      const isAssetRequest = req.path.startsWith("/assets") || req.path.startsWith("/api");
      
      if (isNavigationRequest && !isAssetRequest) {
        // Maximum cache prevention - forces browser to always revalidate
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.setHeader("Surrogate-Control", "no-store");
        // Add version header for debugging
        res.setHeader("X-App-Version", Date.now().toString());
      }
      next();
    });
    
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

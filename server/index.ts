// Load environment variables from .env FIRST
import 'dotenv/config';

import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import cors from "cors";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { investmentStrategies } from "@shared/schema";
import { getSession, setupAuth } from "./customAuth";
// TEMPORARILY DISABLED - causing production crash
// import mobileAuthRoutes from "./mobileAuth";

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

// ==================== CORS CONFIGURATION ====================
// Allow Expo dev origins in development, strict in production
const corsOptions: cors.CorsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://twealth.ltd', 'https://www.twealth.ltd']
    : [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:8081',        // Expo dev server
      'http://localhost:19000',       // Expo Go
      'http://localhost:19006',       // Expo web
      /^exp:\/\/.*$/,                 // Expo Go deep links
      /^http:\/\/192\.168\..*:8081$/, // Expo on local network
    ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Enable gzip compression for all responses (60-80% smaller transfers)
app.use(compression());

// Raw body middleware for Stripe webhooks (MUST come before express.json())
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware (must be before routes)
app.use(getSession());

// Setup OAuth authentication routes (web - cookie based)
setupAuth(app);

// TEMPORARILY DISABLED - causing production crash
// Mobile Auth Routes (JWT based) - mounted at /api/auth
// app.use('/api/auth', mobileAuthRoutes);

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
    if (db) {
      const existingStrategies = await db.select().from(investmentStrategies).limit(1);
      if (existingStrategies.length === 0) {
        log("Investment data not found, seeding database...");
        const { seedInvestments } = await import("./seed-investments");
        await seedInvestments();
        log("Investment data seeded successfully");
      }
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
    // Serve /assets with dedicated middleware and proper cache headers
    // This prevents MIME type errors when old cached HTML requests stale JS chunks
    const distPath = path.resolve(import.meta.dirname, "public");

    // Serve hashed assets with long cache headers (immutable)
    app.use("/assets", express.static(path.resolve(distPath, "assets"), {
      maxAge: "1y",
      immutable: true,
      etag: false,
    }));

    // 404 guard for missing assets - prevents SPA fallback from returning HTML
    app.use("/assets", (_req, res) => {
      res.status(404).send("Asset not found");
    });

    // Prevent caching of HTML pages to reduce stale chunk references
    app.use((req, res, next) => {
      const accept = req.headers.accept || "";
      if (accept.includes("text/html") && !req.path.startsWith("/api") && !req.path.startsWith("/assets")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
      next();
    });

    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5003', 10);
  const host = process.env.HOST || '0.0.0.0';
  server.listen({
    port,
    host,
  }, () => {
    log(`serving on http://${host}:${port}`);
  });
})();

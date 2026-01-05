import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { investmentStrategies } from "@shared/schema";
import { getSession, setupAuth } from "./customAuth";
import { sanitizeResponseMiddleware } from "./lib/sanitize-response";

// ==================== ASSET BACKUP SYSTEM ====================
// Keeps old hashed assets available so cached HTML from previous deploys
// can still load their JS chunks - prevents React #300 errors on iOS Safari PWA
// IMPORTANT: Backup must be OUTSIDE dist folder to persist between deploys
const BACKUP_DIR = path.resolve(process.cwd(), "asset-backup");
// CRITICAL: Must match vite.config.ts build.outDir setting (dist/public)
const DIST_ASSETS = path.resolve(process.cwd(), "dist/public/assets");

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

// Response sanitizer middleware - prevents React Error #300 by ensuring
// all API responses contain only primitive values (string, number, boolean, null)
// Must be BEFORE routes so it intercepts all res.json() calls
app.use(sanitizeResponseMiddleware());

// Session middleware (must be before routes)
app.use(getSession());

// Setup OAuth authentication routes
setupAuth(app);

// ==================== PWA RECOVERY ENDPOINT ====================
// Serves fresh HTML to break iOS Safari PWA's frozen shell
// When old cached HTML requests missing JS bundles, the 404 handler
// redirects here to serve a new HTML page that loads current assets
app.get('/_recover', (req, res) => {
  log('[RECOVER] PWA recovery endpoint hit - serving fresh app shell');
  
  // Maximum cache prevention
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Recovery', 'true');
  
  // Serve a minimal HTML page that redirects to the app
  // This creates a clean break from the frozen PWA context
  const recoveryHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <title>Updating...</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
    }
    .container { text-align: center; padding: 20px; }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>Updating App...</h2>
    <p>Please wait a moment</p>
  </div>
  <script>
    // Final cleanup and redirect to fresh app
    // IMPORTANT: Does NOT clear localStorage to preserve user authentication
    (async function() {
      try {
        // Clear any remaining caches
        if ('caches' in window) {
          var names = await caches.keys();
          await Promise.all(names.map(function(n) { return caches.delete(n); }));
        }
        // Unregister service workers
        if ('serviceWorker' in navigator) {
          var regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(function(r) { return r.unregister(); }));
        }
        // Only clear version-related storage, preserve user data
        localStorage.removeItem('twealth_app_version');
        sessionStorage.setItem('sw_cleanup_done', '1'); // Mark cleanup done for index.html script
      } catch (e) {
        console.error('[Recovery] Cleanup error:', e);
      }
      // Redirect to homepage
      setTimeout(function() {
        window.location.replace('/');
      }, 500);
    })();
  </script>
</body>
</html>`;
  
  res.type('html').send(recoveryHtml);
});

// ==================== SERVICE WORKER KILL-SWITCH ROUTE ====================
// Serve the kill-switch SW with aggressive no-cache headers
// This ensures iOS Safari PWA users get the updated SW that self-destructs
app.get('/sw.js', (req, res) => {
  log('[SW] Kill-switch service worker requested');
  
  // Aggressive no-cache headers - SW MUST be refetched every time
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('X-SW-Version', 'kill-v3');
  
  // Serve from client/public in dev, dist/public in prod
  // CRITICAL: Must match vite.config.ts build.outDir setting (dist/public)
  const swPath = process.env.NODE_ENV === 'production'
    ? path.resolve(process.cwd(), 'dist/public/sw.js')
    : path.resolve(process.cwd(), 'client/public/sw.js');
  
  if (fs.existsSync(swPath)) {
    res.sendFile(swPath);
  } else {
    // Fallback inline kill-switch SW - FORCES RELOAD with cache-buster
    log('[SW] sw.js file not found, serving inline kill-switch v3');
    res.send(`
// Kill-Switch SW v3 - FORCES PAGE RELOAD
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    await self.clients.claim();
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.registration.unregister();
    // FORCE RELOAD with cache-buster to get fresh HTML
    const clients = await self.clients.matchAll({type:'window'});
    for (const c of clients) {
      try {
        const url = new URL(c.url);
        url.searchParams.set('v', Date.now().toString());
        c.navigate(url.toString());
      } catch(e) {}
    }
  })());
});
self.addEventListener('fetch', () => {});
`);
  }
});

// Also serve kill-switch at /service-worker.js for legacy paths
app.get('/service-worker.js', (req, res) => {
  log('[SW] Kill-switch requested at /service-worker.js');
  
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('X-SW-Version', 'kill-v3');
  
  const swPath = process.env.NODE_ENV === 'production'
    ? path.resolve(process.cwd(), 'dist/public/sw.js')
    : path.resolve(process.cwd(), 'client/public/sw.js');
  
  if (fs.existsSync(swPath)) {
    res.sendFile(swPath);
  } else {
    log('[SW] sw.js file not found, serving inline kill-switch v3');
    res.send(`
// Kill-Switch SW v3 - FORCES PAGE RELOAD
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    await self.clients.claim();
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.registration.unregister();
    // FORCE RELOAD with cache-buster to get fresh HTML
    const clients = await self.clients.matchAll({type:'window'});
    for (const c of clients) {
      try {
        const url = new URL(c.url);
        url.searchParams.set('v', Date.now().toString());
        c.navigate(url.toString());
      } catch(e) {}
    }
  })());
});
self.addEventListener('fetch', () => {});
`);
  }
});

// Production-grade request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      // Safe logging: method, path, status, duration only (no response body)
      const logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
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
    
    // CRITICAL: Must match vite.config.ts build.outDir setting (dist/public)
    const distPath = path.resolve(process.cwd(), "dist/public");
    
    // Serve hashed assets with long cache headers (immutable)
    app.use("/assets", express.static(path.resolve(distPath, "assets"), {
      maxAge: "1y",
      immutable: true,
      etag: false,
    }));
    
    // FALLBACK: Serve old assets from backup directory
    // This allows old cached HTML to continue working with old JS bundles
    app.use("/assets", (req, res, next) => {
      const filename = path.basename(req.path);
      const ext = path.extname(filename).toLowerCase();
      const backupPath = path.join(BACKUP_DIR, filename);
      
      // Check if this is a request for an old asset that exists in backup
      if (fs.existsSync(backupPath)) {
        log(`[BACKUP] Serving old asset from backup: ${filename}`);
        
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
        // Short cache for backup assets - they'll be replaced when user gets new HTML
        res.setHeader('Cache-Control', 'public, max-age=60');
        
        return res.sendFile(backupPath);
      }
      
      next();
    });
    
    // 404 guard for missing assets - return proper 404 response
    // Let the ErrorBoundary handle errors gracefully without auto-redirect loops
    app.use("/assets", (req, res) => {
      const filename = path.basename(req.path);
      log(`[404] Missing asset: ${filename}`);
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
    
    // ==================== PRODUCTION STATIC FILE SERVING ====================
    // OVERRIDE: Serve from dist/public instead of server/public (which serveStatic uses)
    // This ensures we serve the correct Vite build output
    const prodStaticMiddleware = express.static(distPath);
    app.use(prodStaticMiddleware);
    
    // Catch-all: Serve index.html for SPA routing (from correct dist/public)
    // This handles all navigation requests that don't match a static file
    // IMPORTANT: Only for GET requests and exclude /api/* to preserve API error semantics
    app.use("*", (req, res, next) => {
      // Skip API routes - let them return proper 404/JSON errors
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API endpoint not found' });
      }
      
      // Skip non-GET requests
      if (req.method !== 'GET') {
        return next();
      }
      
      const indexPath = path.resolve(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        // Ensure no-cache headers for SPA fallback (prevent stale HTML serving old chunk URLs)
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Application not found. Please run npm run build.");
      }
    });
    
    // NOTE: serveStatic is NOT called - we handle everything above with correct paths
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

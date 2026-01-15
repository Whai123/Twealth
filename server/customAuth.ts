import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as AppleStrategy } from "passport-apple";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";
import { storage } from "./storage";
import { authLogger } from "./utils/logger";

// Safe default for development - use PORT env or default to 5003
const DEV_PORT = process.env.PORT || '5003';
const REPLIT_DOMAINS = process.env.REPLIT_DOMAINS || `localhost:${DEV_PORT}`;

// Use production domain for OAuth in production, dev domain in development
const PRODUCTION_DOMAIN = 'twealth.ltd';
const domains = REPLIT_DOMAINS.split(',');

// Consistent production detection: NODE_ENV=production OR deployment flag
const isProduction = process.env.NODE_ENV === 'production' ||
  process.env.REPLIT_DEPLOYMENT === '1';
const isDevelopment = !isProduction;
const customDomain = isProduction ? PRODUCTION_DOMAIN : domains[0];

// Development-only debug logging for OAuth setup
if (isDevelopment) {
  authLogger.debug('OAuth Environment', { data: { NODE_ENV: process.env.NODE_ENV } });
  authLogger.debug('Using domain for callbacks', { data: { domain: customDomain } });
}

// Use http for localhost development, https for production
const protocol = isDevelopment ? 'http' : 'https';
const FRONTEND_URL = `${protocol}://${customDomain}`;
const BACKEND_URL = FRONTEND_URL; // Same domain setup

if (isDevelopment) {
  authLogger.debug('Google callback URL', { data: { url: `${BACKEND_URL}/api/auth/google/callback` } });
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  // Use in-memory session store when DATABASE_URL is not available
  let sessionStore: session.Store;

  if (process.env.DATABASE_URL) {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
    if (isDevelopment) {
      authLogger.debug('Using PostgreSQL session store');
    }
  } else {
    const MemoryStore = createMemoryStore(session);
    sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    if (isDevelopment) {
      authLogger.debug('Using in-memory session store (no DATABASE_URL)');
    }
  }

  // Development-only session config logging
  if (isDevelopment) {
    authLogger.debug('Session configuration', {
      data: {
        NODE_ENV: process.env.NODE_ENV,
        REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
        isProduction,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
      }
    });
  }

  // Use a safe default for SESSION_SECRET in development
  const sessionSecret = process.env.SESSION_SECRET || (isDevelopment ? 'dev-session-secret-change-in-production' : undefined);
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET must be set in production');
  }

  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction, // Secure cookies only in production
      sameSite: isProduction ? 'none' : 'lax', // 'none' for production OAuth, 'lax' for dev
      domain: isProduction ? '.twealth.ltd' : undefined, // Domain only in production
      maxAge: sessionTtl,
    },
  });
}


interface UserSession {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user info from Google profile
          const email = profile.emails?.[0]?.value;
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';
          const profileImageUrl = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Google profile'));
          }

          // Upsert user in database
          const user = await storage.upsertUser({
            id: `google_${profile.id}`,
            email,
            firstName,
            lastName,
            profileImageUrl,
          });

          // Initialize subscription if new user
          const subscription = await storage.getUserSubscription(user.id);
          if (!subscription) {
            await storage.initializeDefaultSubscription(user.id);
          }

          return done(null, {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          });
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user info from Facebook profile
          const email = profile.emails?.[0]?.value;
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';
          const profileImageUrl = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Facebook profile'));
          }

          // Upsert user in database
          const user = await storage.upsertUser({
            id: `facebook_${profile.id}`,
            email,
            firstName,
            lastName,
            profileImageUrl,
          });

          // Initialize subscription if new user
          const subscription = await storage.getUserSubscription(user.id);
          if (!subscription) {
            await storage.initializeDefaultSubscription(user.id);
          }

          return done(null, {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          });
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

// Apple Sign In Strategy
if (process.env.APPLE_SERVICE_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
  passport.use(
    new AppleStrategy(
      {
        clientID: process.env.APPLE_SERVICE_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKeyString: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        callbackURL: `${BACKEND_URL}/api/auth/apple/callback`,
        scope: ['email', 'name'],
        passReqToCallback: false,
      },
      async (accessToken: string, refreshToken: string, idToken: any, profile: any, done: any) => {
        try {
          // Apple provides email only on first sign in
          const email = idToken.email || profile.email;
          const firstName = profile.name?.firstName || '';
          const lastName = profile.name?.lastName || '';

          if (!email) {
            return done(new Error('No email found in Apple profile'));
          }

          // Upsert user in database
          const user = await storage.upsertUser({
            id: `apple_${profile.id || idToken.sub}`,
            email,
            firstName,
            lastName,
            profileImageUrl: null,
          });

          // Initialize subscription if new user
          const subscription = await storage.getUserSubscription(user.id);
          if (!subscription) {
            await storage.initializeDefaultSubscription(user.id);
          }

          return done(null, {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          });
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

// Serialize/deserialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    const userSession = req.user as UserSession;

    // Attach user ID to request for downstream middleware
    (req as any).userId = userSession.userId;

    return next();
  }

  res.status(401).json({ error: "Unauthorized - Please log in" });
};

export function setupAuth(app: Express) {
  if (isDevelopment) authLogger.debug('setupAuth() called');

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
  if (isDevelopment) authLogger.debug('Passport initialized');

  // Test route to verify routing works (development only)
  if (isDevelopment) {
    app.get("/api/auth/test", (req, res) => {
      authLogger.debug('Test route hit');
      res.json({ message: "OAuth routes working", timestamp: new Date().toISOString() });
    });
  }

  // Google OAuth routes
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    if (isDevelopment) authLogger.debug('Registering Google OAuth routes');
    app.get(
      "/api/auth/google",
      (req, res, next) => {
        if (isDevelopment) authLogger.debug('Initiating Google login');
        next();
      },
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
      "/api/auth/google/callback",
      (req, res, next) => {
        if (isDevelopment) {
          authLogger.debug('Callback received', { data: { query: req.query, sessionID: req.sessionID } });
        }
        next();
      },
      (req, res, next) => {
        passport.authenticate("google", (err: any, user: any, info: any) => {
          if (isDevelopment) {
            authLogger.debug('Passport authenticate callback', { data: { hasError: !!err, hasUser: !!user } });
          }

          if (err) {
            authLogger.error('Authentication error', err);
            return res.redirect("/login");
          }

          if (!user) {
            authLogger.warn('No user returned from passport');
            return res.redirect("/login");
          }

          req.login(user, (loginErr) => {
            if (loginErr) {
              authLogger.error('Login error', loginErr);
              return res.redirect("/login");
            }

            if (isDevelopment) authLogger.debug('User logged in successfully');

            req.session.save((saveErr) => {
              if (saveErr) {
                authLogger.error('Session save error', saveErr);
                return res.redirect("/login");
              }
              if (isDevelopment) authLogger.debug('Session saved, redirecting');
              res.redirect("/");
            });
          });
        })(req, res, next);
      }
    );
  }

  // Facebook OAuth routes
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    app.get(
      "/api/auth/facebook",
      passport.authenticate("facebook", { scope: ["email"] })
    );

    app.get(
      "/api/auth/facebook/callback",
      passport.authenticate("facebook", { failureRedirect: "/login" }),
      (req, res) => {
        // Explicitly save session before redirecting
        req.session.save((err) => {
          if (err) {
            authLogger.error('Facebook session save error', err);
            return res.redirect("/login");
          }
          res.redirect("/");
        });
      }
    );
  }

  // Apple Sign In routes
  if (process.env.APPLE_SERVICE_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    app.post(
      "/api/auth/apple",
      passport.authenticate("apple")
    );

    app.post(
      "/api/auth/apple/callback",
      passport.authenticate("apple", { failureRedirect: "/login" }),
      (req, res) => {
        // Explicitly save session before redirecting
        req.session.save((err) => {
          if (err) {
            authLogger.error('Apple session save error', err);
            return res.redirect("/login");
          }
          res.redirect("/");
        });
      }
    );
  }

  // Get current user endpoint
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    const userSession = req.user as UserSession;
    const user = await storage.getUser(userSession.userId!);
    res.json(user);
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Session destruction failed" });
        }
        res.json({ success: true });
      });
    });
  });

  // Check auth status
  app.get("/api/auth/status", (req, res) => {
    res.json({ authenticated: req.isAuthenticated ? req.isAuthenticated() : false });
  });

  // Dev-only login endpoint for local development without OAuth
  if (isDevelopment && !process.env.GOOGLE_CLIENT_ID) {
    app.post("/api/auth/dev-login", async (req, res) => {
      authLogger.debug('Dev login requested');

      try {
        // Create or get a dev user
        const devUser = await storage.upsertUser({
          id: 'dev_user_local',
          email: 'dev@localhost',
          firstName: 'Dev',
          lastName: 'User',
          profileImageUrl: null,
        });

        // Initialize subscription if new user
        const subscription = await storage.getUserSubscription(devUser.id);
        if (!subscription) {
          await storage.initializeDefaultSubscription(devUser.id);
        }

        const userSession: UserSession = {
          userId: devUser.id,
          email: devUser.email || 'dev@localhost',
          firstName: devUser.firstName || 'Dev',
          lastName: devUser.lastName || 'User',
          profileImageUrl: devUser.profileImageUrl || undefined,
        };

        req.login(userSession, (loginErr) => {
          if (loginErr) {
            authLogger.error('Dev login error', loginErr);
            return res.status(500).json({ error: 'Login failed' });
          }

          req.session.save((saveErr) => {
            if (saveErr) {
              authLogger.error('Dev session save error', saveErr);
              return res.status(500).json({ error: 'Session save failed' });
            }

            authLogger.debug('Dev user logged in successfully');
            res.json({ success: true, user: userSession });
          });
        });
      } catch (error: any) {
        authLogger.error('Dev login error', error);
        res.status(500).json({ error: error.message || 'Dev login failed' });
      }
    });

    authLogger.debug('Dev login endpoint registered at /api/auth/dev-login');
  }

  // Get available OAuth providers
  app.get("/api/auth/providers", (req, res) => {
    const hasOAuth = !!(process.env.GOOGLE_CLIENT_ID || process.env.FACEBOOK_APP_ID || process.env.APPLE_SERVICE_ID);
    const providers = {
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      facebook: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
      apple: !!(process.env.APPLE_SERVICE_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY),
      devLogin: isDevelopment && !hasOAuth, // Dev login available when no OAuth is configured
    };
    res.json(providers);
  });
}

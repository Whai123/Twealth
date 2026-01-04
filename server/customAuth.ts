import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as AppleStrategy } from "passport-apple";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { authLogger } from "./utils/logger";

// Safe default for REPLIT_DOMAINS in development
const REPLIT_DOMAINS = process.env.REPLIT_DOMAINS || 'localhost:5000';

// Use production domain for OAuth in production, dev domain in development
const PRODUCTION_DOMAIN = 'twealth.ltd';
const domains = REPLIT_DOMAINS.split(',');
const isDevelopment = process.env.NODE_ENV === 'development';
const customDomain = isDevelopment ? domains[0] : PRODUCTION_DOMAIN;

// Development-only debug logging for OAuth setup
if (isDevelopment) {
  authLogger.debug('OAuth Environment', { data: { NODE_ENV: process.env.NODE_ENV } });
  authLogger.debug('Using domain for callbacks', { data: { domain: customDomain } });
}

const FRONTEND_URL = `https://${customDomain}`;
const BACKEND_URL = FRONTEND_URL; // Same domain setup

if (isDevelopment) {
  authLogger.debug('Google callback URL', { data: { url: `${BACKEND_URL}/api/auth/google/callback` } });
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  // Detect production: NODE_ENV=production OR deployment flag
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.REPLIT_DEPLOYMENT === '1';
  
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
          
          // First login to establish the user, then regenerate session to prevent fixation
          req.login(user, (loginErr) => {
            if (loginErr) {
              authLogger.error('Login error', loginErr);
              return res.redirect("/login");
            }
            
            if (isDevelopment) authLogger.debug('User logged in successfully');
            
            // Store user data before regenerating session
            const userData = req.user;
            
            // Regenerate session to prevent session fixation when switching accounts
            req.session.regenerate((regenErr) => {
              if (regenErr) {
                authLogger.error('Session regeneration error', regenErr);
                return res.redirect("/login");
              }
              
              if (isDevelopment) authLogger.debug('Session regenerated for security');
              
              // Re-attach user to the new session
              req.login(userData as any, (reloginErr) => {
                if (reloginErr) {
                  authLogger.error('Re-login after regeneration error', reloginErr);
                  return res.redirect("/login");
                }
                
                req.session.save((saveErr) => {
                  if (saveErr) {
                    authLogger.error('Session save error', saveErr);
                    return res.redirect("/login");
                  }
                  if (isDevelopment) authLogger.debug('Session saved, redirecting');
                  res.redirect("/");
                });
              });
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
      (req, res, next) => {
        passport.authenticate("facebook", (err: any, user: any, info: any) => {
          if (err || !user) {
            authLogger.error('Facebook auth error', err);
            return res.redirect("/login");
          }
          
          // First login, then regenerate session to prevent fixation while preserving auth
          req.login(user, (loginErr) => {
            if (loginErr) {
              authLogger.error('Facebook login error', loginErr);
              return res.redirect("/login");
            }
            
            const userData = req.user;
            
            req.session.regenerate((regenErr) => {
              if (regenErr) {
                authLogger.error('Facebook session regeneration error', regenErr);
                return res.redirect("/login");
              }
              
              req.login(userData as any, (reloginErr) => {
                if (reloginErr) {
                  authLogger.error('Facebook re-login error', reloginErr);
                  return res.redirect("/login");
                }
                
                req.session.save((saveErr) => {
                  if (saveErr) {
                    authLogger.error('Facebook session save error', saveErr);
                    return res.redirect("/login");
                  }
                  res.redirect("/");
                });
              });
            });
          });
        })(req, res, next);
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
      (req, res, next) => {
        passport.authenticate("apple", (err: any, user: any, info: any) => {
          if (err || !user) {
            authLogger.error('Apple auth error', err);
            return res.redirect("/login");
          }
          
          // First login, then regenerate session to prevent fixation while preserving auth
          req.login(user, (loginErr) => {
            if (loginErr) {
              authLogger.error('Apple login error', loginErr);
              return res.redirect("/login");
            }
            
            const userData = req.user;
            
            req.session.regenerate((regenErr) => {
              if (regenErr) {
                authLogger.error('Apple session regeneration error', regenErr);
                return res.redirect("/login");
              }
              
              req.login(userData as any, (reloginErr) => {
                if (reloginErr) {
                  authLogger.error('Apple re-login error', reloginErr);
                  return res.redirect("/login");
                }
                
                req.session.save((saveErr) => {
                  if (saveErr) {
                    authLogger.error('Apple session save error', saveErr);
                    return res.redirect("/login");
                  }
                  res.redirect("/");
                });
              });
            });
          });
        })(req, res, next);
      }
    );
  }

  // Get current user endpoint
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    const userSession = req.user as UserSession;
    const user = await storage.getUser(userSession.userId!);
    res.json(user);
  });

  // Logout endpoint - properly destroy session and clear cookie
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        authLogger.error('Logout error', err);
        return res.status(500).json({ error: "Logout failed" });
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          authLogger.error('Session destroy error', destroyErr);
          return res.status(500).json({ error: "Session destruction failed" });
        }
        // Clear the session cookie
        res.clearCookie('connect.sid', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === '1',
          sameSite: (process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === '1') ? 'none' : 'lax',
        });
        if (isDevelopment) authLogger.debug('Session destroyed and cookie cleared');
        res.json({ success: true });
      });
    });
  });

  // Check auth status
  app.get("/api/auth/status", (req, res) => {
    res.json({ authenticated: req.isAuthenticated ? req.isAuthenticated() : false });
  });

  // Get available OAuth providers
  app.get("/api/auth/providers", (req, res) => {
    const providers = {
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      facebook: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
      apple: !!(process.env.APPLE_SERVICE_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY),
    };
    res.json(providers);
  });
}

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as AppleStrategy } from "passport-apple";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

// Use production domain for OAuth (twealth.ltd)
// For development, can fall back to REPLIT_DOMAINS if needed
const PRODUCTION_DOMAIN = 'twealth.ltd';
const domains = process.env.REPLIT_DOMAINS.split(',');
const customDomain = PRODUCTION_DOMAIN; // Always use production domain for OAuth
console.log('[OAuth] Using domain for callbacks:', customDomain);
const FRONTEND_URL = `https://${customDomain}`;
const BACKEND_URL = FRONTEND_URL; // Same domain setup
console.log('[OAuth] Google callback URL:', `${BACKEND_URL}/api/auth/google/callback`);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  // Detect production: either NODE_ENV=production OR using production domain
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.REPLIT_DEPLOYMENT === '1' ||
                       process.env.REPL_SLUG !== undefined;
  
  console.log('[Session] Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
    isProduction,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true, // Always use secure cookies (twealth.ltd uses HTTPS)
      sameSite: 'lax', // Allows cookies during OAuth redirects on same domain
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
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth routes
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get(
      "/api/auth/google",
      (req, res, next) => {
        console.log('[OAuth] Initiating Google login...');
        next();
      },
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
      "/api/auth/google/callback",
      (req, res, next) => {
        console.log('[OAuth] ===== CALLBACK RECEIVED =====');
        console.log('[OAuth] Query params:', req.query);
        console.log('[OAuth] Session ID:', req.sessionID);
        console.log('[OAuth] Session data:', req.session);
        next();
      },
      (req, res, next) => {
        passport.authenticate("google", (err: any, user: any, info: any) => {
          console.log('[OAuth] Passport authenticate callback triggered');
          console.log('[OAuth] Error:', err);
          console.log('[OAuth] User:', user);
          console.log('[OAuth] Info:', info);
          
          if (err) {
            console.error('[OAuth] Authentication error:', err);
            return res.redirect("/login");
          }
          
          if (!user) {
            console.error('[OAuth] No user returned from passport');
            return res.redirect("/login");
          }
          
          req.login(user, (loginErr) => {
            if (loginErr) {
              console.error('[OAuth] Login error:', loginErr);
              return res.redirect("/login");
            }
            
            console.log('[OAuth] User logged in successfully');
            console.log('[OAuth] Session after login:', req.session);
            
            req.session.save((saveErr) => {
              if (saveErr) {
                console.error('[OAuth] Session save error:', saveErr);
                return res.redirect("/login");
              }
              console.log('[OAuth] Session saved, redirecting to /');
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
            console.error('[OAuth] Facebook session save error:', err);
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
            console.error('[OAuth] Apple session save error:', err);
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
}

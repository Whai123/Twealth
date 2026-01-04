import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as AppleStrategy } from "passport-apple";
import session from "express-session";
import type { Express, Request, Response, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { authLogger } from "./utils/logger";

const REPLIT_DOMAINS = process.env.REPLIT_DOMAINS || 'localhost:5000';
const PRODUCTION_DOMAIN = 'twealth.ltd';
const domains = REPLIT_DOMAINS.split(',');
const isDevelopment = process.env.NODE_ENV === 'development';
const customDomain = isDevelopment ? domains[0] : PRODUCTION_DOMAIN;

if (isDevelopment) {
  authLogger.debug('OAuth Environment', { data: { NODE_ENV: process.env.NODE_ENV } });
  authLogger.debug('Using domain for callbacks', { data: { domain: customDomain } });
}

const FRONTEND_URL = `https://${customDomain}`;
const BACKEND_URL = FRONTEND_URL;

if (isDevelopment) {
  authLogger.debug('Google callback URL', { data: { url: `${BACKEND_URL}/api/auth/google/callback` } });
}

interface UserSession {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

// Promisified session helpers for clean async/await usage
function loginUser(req: Request, user: any): Promise<void> {
  return new Promise((resolve, reject) => {
    req.login(user, (err) => err ? reject(err) : resolve());
  });
}

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => err ? reject(err) : resolve());
  });
}

function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((err) => err ? reject(err) : resolve());
  });
}

function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => err ? reject(err) : resolve());
  });
}

function logoutUser(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.logout((err) => err ? reject(err) : resolve());
  });
}

/**
 * Secure OAuth login flow:
 * 1. Capture all existing session data
 * 2. Login user to establish authentication
 * 3. Regenerate session ID (prevents session fixation attacks)
 * 4. Restore all session data + re-attach user
 * 5. Save and redirect
 */
async function secureOAuthLogin(req: Request, res: Response, user: any, provider: string): Promise<void> {
  try {
    // Preserve ALL session data (except internal cookie property)
    const sessionData: Record<string, any> = {};
    for (const key of Object.keys(req.session)) {
      if (key !== 'cookie' && key !== 'passport') {
        sessionData[key] = (req.session as any)[key];
      }
    }
    
    await loginUser(req, user);
    if (isDevelopment) authLogger.debug(`${provider} user logged in`);
    
    const userData = req.user;
    
    await regenerateSession(req);
    if (isDevelopment) authLogger.debug(`${provider} session regenerated`);
    
    // Restore all preserved session data
    for (const [key, value] of Object.entries(sessionData)) {
      (req.session as any)[key] = value;
    }
    
    await loginUser(req, userData);
    await saveSession(req);
    
    // Redirect to returnTo if set, otherwise home
    const redirectTo = sessionData.returnTo || "/";
    if (isDevelopment) authLogger.debug(`${provider} login complete, redirecting to ${redirectTo}`);
    res.redirect(redirectTo);
  } catch (error) {
    authLogger.error(`${provider} OAuth error`, error as Error);
    res.redirect("/login");
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.REPLIT_DEPLOYMENT === '1';
  
  if (isDevelopment) {
    authLogger.debug('Session configuration', { 
      data: { NODE_ENV: process.env.NODE_ENV, isProduction, secure: isProduction }
    });
  }
  
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
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: isProduction ? '.twealth.ltd' : undefined,
      maxAge: sessionTtl,
    },
  });
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
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email found in Google profile'));

          const user = await storage.upsertUser({
            id: `google_${profile.id}`,
            email,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            profileImageUrl: profile.photos?.[0]?.value,
          });

          const subscription = await storage.getUserSubscription(user.id);
          if (!subscription) await storage.initializeDefaultSubscription(user.id);

          done(null, {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          });
        } catch (error) {
          done(error as Error);
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
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email found in Facebook profile'));

          const user = await storage.upsertUser({
            id: `facebook_${profile.id}`,
            email,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            profileImageUrl: profile.photos?.[0]?.value,
          });

          const subscription = await storage.getUserSubscription(user.id);
          if (!subscription) await storage.initializeDefaultSubscription(user.id);

          done(null, {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          });
        } catch (error) {
          done(error as Error);
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
          const email = idToken.email || profile.email;
          if (!email) return done(new Error('No email found in Apple profile'));

          const user = await storage.upsertUser({
            id: `apple_${profile.id || idToken.sub}`,
            email,
            firstName: profile.name?.firstName || '',
            lastName: profile.name?.lastName || '',
            profileImageUrl: null,
          });

          const subscription = await storage.getUserSubscription(user.id);
          if (!subscription) await storage.initializeDefaultSubscription(user.id);

          done(null, {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          });
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
}

passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated?.()) {
    (req as any).userId = (req.user as UserSession).userId;
    return next();
  }
  res.status(401).json({ error: "Unauthorized - Please log in" });
};

export function setupAuth(app: Express) {
  if (isDevelopment) authLogger.debug('setupAuth() called');
  
  app.use(passport.initialize());
  app.use(passport.session());
  if (isDevelopment) authLogger.debug('Passport initialized');

  if (isDevelopment) {
    app.get("/api/auth/test", (req, res) => {
      res.json({ message: "OAuth routes working", timestamp: new Date().toISOString() });
    });
  }

  // Google OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    if (isDevelopment) authLogger.debug('Registering Google OAuth routes');
    
    app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
    
    app.get("/api/auth/google/callback", (req, res, next) => {
      passport.authenticate("google", (err: any, user: any) => {
        if (err || !user) {
          authLogger.error('Google auth error', err);
          return res.redirect("/login");
        }
        secureOAuthLogin(req, res, user, 'Google');
      })(req, res, next);
    });
  }

  // Facebook OAuth
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    app.get("/api/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));
    
    app.get("/api/auth/facebook/callback", (req, res, next) => {
      passport.authenticate("facebook", (err: any, user: any) => {
        if (err || !user) {
          authLogger.error('Facebook auth error', err);
          return res.redirect("/login");
        }
        secureOAuthLogin(req, res, user, 'Facebook');
      })(req, res, next);
    });
  }

  // Apple OAuth
  if (process.env.APPLE_SERVICE_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    app.post("/api/auth/apple", passport.authenticate("apple"));
    
    app.post("/api/auth/apple/callback", (req, res, next) => {
      passport.authenticate("apple", (err: any, user: any) => {
        if (err || !user) {
          authLogger.error('Apple auth error', err);
          return res.redirect("/login");
        }
        secureOAuthLogin(req, res, user, 'Apple');
      })(req, res, next);
    });
  }

  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    const userSession = req.user as UserSession;
    const user = await storage.getUser(userSession.userId!);
    res.json(user);
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      await logoutUser(req);
      await destroySession(req);
      
      const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === '1';
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
      });
      
      if (isDevelopment) authLogger.debug('Session destroyed and cookie cleared');
      res.json({ success: true });
    } catch (error) {
      authLogger.error('Logout error', error as Error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/auth/status", (req, res) => {
    res.json({ authenticated: req.isAuthenticated?.() ?? false });
  });

  app.get("/api/auth/providers", (req, res) => {
    res.json({
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      facebook: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
      apple: !!(process.env.APPLE_SERVICE_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY),
    });
  });
}

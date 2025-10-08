# Overview

Twealth is a full-stack web application that combines schedule management with financial tracking and goal setting. The app allows users to manage groups, schedule events, track financial goals, and monitor money flows. It's built as a modern React SPA with an Express.js backend and uses a PostgreSQL database for data persistence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client is built using React 18 with TypeScript and follows a component-based architecture:

- **UI Framework**: Uses shadcn/ui components built on Radix UI primitives for consistent design
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized production builds

The frontend is organized into clear directories:
- `/pages` - Route components for different app sections (dashboard, calendar, groups, etc.)
- `/components` - Reusable UI components and forms
- `/lib` - Utilities and query client configuration
- `/hooks` - Custom React hooks

## Backend Architecture

The server uses Express.js with TypeScript in a RESTful API pattern:

- **Framework**: Express.js with middleware for JSON parsing and request logging
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Storage Layer**: Abstracted storage interface for CRUD operations
- **API Design**: RESTful endpoints under `/api` prefix
- **Error Handling**: Centralized error middleware with consistent JSON responses
- **Development**: Hot reloading with Vite integration in dev mode

The backend follows a layered architecture:
- Routes layer (`/routes.ts`) - API endpoint definitions
- Storage layer (`/storage.ts`) - Data access abstraction
- External integrations (`/outlookClient.ts`) - Third-party service clients

## Database Schema

Uses PostgreSQL with Drizzle ORM defining the following core entities:

- **Users**: Authentication and profile information
- **Groups**: Collaborative spaces with member management
- **Events**: Calendar events with group association
- **Financial Goals**: Target-based savings goals with progress tracking
- **Transactions**: Income, expense, and transfer records
- **Group Members**: Many-to-many relationship with role-based permissions

The schema supports complex relationships like group ownership, event attendance, and goal contributions.

## Authentication & Authorization

Fully functional Replit OAuth authentication system:
- OpenID Connect integration with Replit
- Role-based access control for group management
- PostgreSQL-backed session management
- Protected API endpoints with isAuthenticated middleware
- Automatic user creation on first login
- Frontend route protection with authentication guard
- Environment-aware cookie security (secure flag based on NODE_ENV)
- All routes require real authentication - no demo user fallback

## Development & Build Process

- **Development**: Uses Vite dev server with Express backend proxy
- **TypeScript**: Strict type checking across frontend and backend
- **Shared Types**: Common schema definitions in `/shared` directory
- **Hot Reloading**: Full-stack development with instant updates
- **Production Build**: Static frontend assets served by Express

# External Dependencies

## Core Framework Dependencies
- **React 18**: Frontend framework with modern hooks and concurrent features
- **Express.js**: Backend web framework for Node.js
- **TypeScript**: Type safety across the entire application stack
- **Vite**: Fast build tool and development server

## Database & ORM
- **PostgreSQL**: Primary database (configured for Neon serverless)
- **Drizzle ORM**: Type-safe database toolkit with schema migrations
- **@neondatabase/serverless**: Serverless PostgreSQL client

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Unstyled, accessible UI components
- **shadcn/ui**: Pre-built component library based on Radix
- **Lucide React**: Icon library

## State Management & Data Fetching
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management with performance optimization
- **Zod**: Schema validation for forms and API data

## External Service Integrations
- **Microsoft Graph API**: Outlook calendar integration via Replit Connector
- **Stripe**: Payment processing with customer management and subscription handling (optional, requires API key)
- **Replit Connectors**: OAuth integration for external services
- **Groq AI with Llama 3.3**: Lightning-fast AI financial advisor with response caching and hit rate tracking
- **Exchange Rate API**: Live currency conversion rates with 1-hour backend caching

## Development Tools
- **ESBuild**: Fast JavaScript bundler for production
- **PostCSS**: CSS processing with Autoprefixer
- **date-fns**: Date manipulation utilities

The application is designed to run on Replit with specific plugins for development experience and deployment integration.

# Recent Changes (October 2025)

## Fixed and Improved Systems

1. **Stripe Payment Integration** - Fixed TypeScript errors in customer creation API calls. Now properly handles optional email fields and creates Stripe customers with proper metadata.

2. **AI Service Cache Tracking** - Replaced placeholder cache hit rate (0.85) with real tracking implementation. Now tracks actual cache hits and misses, providing accurate statistics.

3. **Dashboard Display Issues Fixed** (October 6, 2025):
   - **Header Stats**: Replaced hard-coded values with real API data. Dashboard header now shows dynamic Growth %, Goals tracking, Financial Score, and Active Days based on actual user data
   - **Monthly Progress Chart**: Replaced mock data with real transaction history. Chart now displays actual income data from the last 6/12 months with proper period selection
   - **Loading States**: All components now properly show skeleton loaders while fetching data
   - **Empty States**: Verified all dashboard widgets properly handle empty data with helpful messages and action buttons
   - **Preview Consistency**: Application preview now accurately reflects the actual implementation without hard-coded placeholder values

4. **Currency Exchange Rates** - Replaced hardcoded exchange rates with live data:
   - Backend endpoint: `GET /api/currency/rates`
   - Fetches live rates from exchangerate-api.com
   - 1-hour backend caching for performance
   - Automatic fallback to static rates if API fails
   - Frontend auto-fetches on load with hourly refresh

10. **Real Authentication Implementation** (October 8, 2025):
   - **Issue**: OAuth login was failing with state mismatch; routes were using demo user fallback instead of real authentication
   - **Root Cause**: Session cookies not persisting during OAuth flow due to secure flag in development; demo user system bypassing real auth
   - **Major Fixes Applied**:
     - Fixed session cookie configuration to be environment-aware (secure: false in dev, true in prod)
     - Added session save before OAuth redirect to ensure state persistence
     - Replaced ALL 43 `createDemoUserIfNeeded()` calls with real authentication checks
     - Added `isAuthenticated` middleware to all protected routes
     - Created `getUserIdFromRequest()` helper to extract authenticated user ID
     - Removed demo user system entirely from codebase
   - **Result**: App now requires real Replit OAuth login; all routes properly protected; session persists correctly across OAuth flow
   - **Testing**: Comprehensive e2e test validates complete auth flow from landing → login → OAuth → dashboard → protected routes → logout

5. **Dark Mode Theme Switching Fixed** (October 6, 2025):
   - **Issue**: Theme changes in Settings weren't applying immediately; stale cached data was overwriting manual selections
   - **Root Cause**: ThemeProvider's useEffect was continuously syncing from API cache, causing race conditions
   - **Fixes Applied**:
     - Updated ThemeProvider to only sync from API on initial load, not on every cache update
     - Added immediate cache update in user-preferences component when theme is changed
     - Fixed duplicate `UserPreferences` type declaration in onboarding-redirect.tsx
   - **Result**: Theme changes now apply instantly without being overwritten by cached data

6. **Cryptocurrency Prices Integration Fixed** (October 6, 2025):
   - **Issue**: Crypto ticker not displaying prices; API calls failing silently
   - **Root Cause**: React Query's default query function couldn't handle query parameters properly; mutation parameter order incorrect
   - **Fixes Applied**:
     - Added custom queryFn to crypto-ticker.tsx to properly format `/api/crypto/prices?ids=bitcoin,ethereum,binancecoin`
     - Fixed apiRequest parameter order in crypto page (was `url, method` instead of `method, url`)
     - CoinGecko API integration now working with 60-second caching
   - **Result**: Live crypto prices (BTC, ETH, BNB) now display correctly with 24h change indicators

7. **Comprehensive AI Agent System** (October 7, 2025):
   - **Issue**: AI was experiencing validation errors when creating goals; limited to only 3 basic actions
   - **Root Cause**: Groq API model (llama-3.1-70b-versatile) was decommissioned; AI was formatting numbers as strings in JSON
   - **Major Improvements Applied**:
     - Upgraded to llama-3.3-70b-versatile model (current stable version with improved reasoning)
     - Enhanced system prompt to explicitly require numeric values without quotes
     - Expanded AI capabilities from 3 to 5 comprehensive tools:
       * `create_financial_goal` - Set savings targets for purchases
       * `create_calendar_event` - Schedule financial reminders and appointments
       * `add_transaction` - Record income and expenses
       * `create_group` - Create collaborative financial groups
       * `add_crypto_holding` - Track cryptocurrency investments
     - Improved keyword detection for 18+ action triggers (buy, purchase, spent, earned, create, track, crypto, etc.)
     - Professional system prompt with clear formatting rules and examples
     - Better error handling with user-friendly messages
   - **Result**: AI can now control ALL major app features through natural conversation; users can manage their entire financial life by chatting with the AI
   - **Premium Feature**: This comprehensive AI automation is designed as a paid feature to provide premium value to subscribers

8. **API Configuration Status**:
   - ✅ GROQ_API_KEY - Configured and working (Llama 3.3 AI backend)
   - ✅ SESSION_SECRET - Configured and working
   - ❌ STRIPE_SECRET_KEY - Optional, for payment processing
   - ❌ GEMINI_API_KEY - Not used (removed, using Groq instead)
   - ❌ OPENAI_API_KEY - Not used (removed, using Groq instead)

9. **UX & Accessibility Improvements** (October 7, 2025):
   - **Landing Page Redesign**:
     * Modern hero section with compelling copy and gradient backgrounds
     * 6 feature cards showcasing key benefits (AI, Goals, Schedule, Tracking, Analytics, Collaboration)
     * Stats section highlighting "Time = Money", "AI-Powered", and "100% Secure"
     * Enhanced CTAs with improved visual hierarchy
     * Fully responsive design with smooth animations
   
   - **Accessibility Enhancements**:
     * Added comprehensive ARIA labels to all interactive elements
     * Improved keyboard navigation with proper aria-current indicators
     * Enhanced screen reader support with aria-hidden on decorative icons
     * Theme toggle now has descriptive aria-labels
     * All major components have proper role attributes and regions
     * Maintained keyboard shortcuts (G for goals, T for transactions, E for events)
   
   - **Error Handling Improvements**:
     * Enhanced error boundary with better user feedback
     * Added "Go Home" option in error states
     * Improved error messages for different HTTP status codes (401, 403, 404, 5xx)
     * Better retry logic - smart retry for network errors, no retry for client errors
     * Development mode shows detailed error stack traces for debugging
   
   - **Dashboard Visual Polish**:
     * Added loading skeleton states for stat cards during data fetch
     * Implemented smooth hover animations (scale and shadow effects)
     * Enhanced transitions across all interactive elements
     * Improved welcome banner with animated sparkles icon
     * Better visual feedback throughout the dashboard

All core systems are now fully functional and production-ready with enhanced UX.
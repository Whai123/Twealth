# Overview

Twealth is a full-stack web application for comprehensive schedule management, financial tracking, and goal setting. It offers a unified platform for personal and collaborative financial organization, featuring CFO-level AI financial advice, specialized cryptocurrency tools, and de-dollarization insights. The project aims to deliver an intuitive, globally accessible, production-ready product with premium design quality and a professional user experience to empower users in managing finances, achieving goals, and gaining actionable financial insights.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend is a React 18 single-page application built with TypeScript, `shadcn/ui`, Tailwind CSS, and Wouter for routing. It features a mobile-first, responsive, and accessible design with dynamic navigation and PWA support. Design principles include a clean black/white/gray color palette, professional typography, ample whitespace, simple borders, data-focused layouts, enterprise trust signals, and consistent professional iconography (Lucide React icons). The application includes sophisticated loading states, robust UI for rate limiting, retry logic, toast notifications, optimistic updates, comprehensive accessibility (WCAG 2.1 AA compliant), and advanced form validation. Key improvements include a streamlined dashboard, professional empty states, simplified navigation, an AI ROI Calculator, and the integration of AI Playbooks for weekly financial reports.

## Streamlined Navigation (Dec 2025)

**Sidebar (Desktop):** Dashboard → AI Assistant → My Money → Goals → Groups → Settings → Premium (7 items, organized by section: Main, Finance, Collaborate, More)

**Mobile Nav:** Dashboard → AI → My Money → Goals → Premium (5 items - Groups accessible on desktop only for focused mobile experience)

**My Money Page (/money-tracking):** Unified page with 6 tabs:
- Overview: Transaction stats, filters, recent transactions
- Profile: Manual financial overview form (income, expenses, savings, goals) - powers AI recommendations
- Analytics: Advanced spending charts
- Budget: Budget management
- Insights: Spending insights and tips
- CSV: Bank statement import (optional)

Legacy routes /financial-profile and /planning redirect to their new locations.

## Technical Implementations

The backend is an Express.js application in TypeScript, providing a RESTful API. It uses Drizzle ORM for type-safe PostgreSQL operations and employs a layered architecture with centralized error handling. Authentication utilizes a custom OAuth implementation supporting Google, Apple, and Facebook logins via Passport.js with PostgreSQL session management and role-based access control. The application supports 11 languages via `i18next` and `react-i18next`. API rate limiting is implemented with tiered protection for different endpoints. Input validation is handled using Zod.

## Feature Specifications

Twealth offers a three-tier subscription model (Free, Pro, Enterprise) with an intelligent 4-model hybrid AI architecture (Scout, Claude Sonnet, GPT-5, Claude Opus). This system features automatic model selection based on query complexity, cascading fallback, and quota enforcement. The AI Financial Advisor provides CFO-level advice with 33+ specialized financial tools including:

**Advanced AI Tools (Dec 2025):**
- **Debt Optimizer**: Avalanche vs Snowball strategies with month-by-month payoff schedules
- **Investment Projector**: Multi-scenario compound growth with inflation adjustment
- **What-If Analyzer**: Compare rent vs buy, lease vs own, debt vs invest scenarios
- **Market Data**: Real-time stock prices, crypto prices, forex rates
- **Tax Optimizer**: Retirement contribution strategies, deduction maximization
- **Retirement Calculator**: Monte Carlo simulation, 4% rule analysis
- **Spending Pattern Analyzer**: Deep trend analysis with anomaly detection

**Enhanced Context Engine:**
The AI receives rich analytics including savingsRate, netWorth, debtToIncomeRatio, emergencyFundMonths, month-over-month spending trends, category anomaly detection (with severity levels), financial health score (0-100), top spending categories, and goal progress tracking (on-track vs at-risk). Proactive insights are auto-generated for spending spikes, goals at risk, emergency fund gaps, and debt payoff opportunities.

Core features include conversational data collection, luxury purchase analysis, smart budget recommendations, actionable advice in 11 languages, and a tiered crypto experience. The system provides a real-time comprehensive financial health score, custom budget management, smart transaction auto-categorization, and proactive insights like spending anomaly detection. It also includes a Demo Mode with sample data, a professional subscription management system with visual quota progress, a zero-friction onboarding system, a Predictive Analytics Engine, and a floating AI Copilot Widget.

## System Design Choices

The architecture incorporates a comprehensive caching strategy (system prompt, market data, React Query optimization) and database indexing for performance. Authentication handles OIDC foreign key constraints. Automatic investment data seeding populates strategies for new deployments. Production stability is ensured through a health check endpoint, global error handlers for server-side and React error boundaries for client-side issues, currency rate fallback, and AI service resilience with rate limit detection and exponential backoff retry logic.

## Mobile-First Responsive Design

All pages use mobile-first responsive breakpoints: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` for proper mobile stacking. Touch targets meet 44px minimum height requirement (`min-h-[44px]`). iOS safe-area padding uses `env(safe-area-inset-*)` CSS variables. The `/assets` middleware in server/index.ts serves static assets with cache headers and proper 404 handling to prevent MIME type errors on mobile. Subscription and pricing pages limit display to exactly 3 plans (Free, Pro, Enterprise) using `.slice(0, 3)`.

# External Dependencies

-   **React 18**: Frontend framework.
-   **Express.js**: Backend web framework.
-   **TypeScript**: Language for type safety.
-   **Vite**: Build tool.
-   **PostgreSQL**: Primary database.
-   **Drizzle ORM**: Type-safe database toolkit.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **Radix UI / shadcn/ui**: UI components.
-   **TanStack Query**: Server state management.
-   **React Hook Form**: Form state management.
-   **Zod**: Schema validation.
-   **Stripe**: Payment processing.
-   **Groq AI**: AI financial advisor.
-   **Alpha Vantage API**: Real-time stock market data.
-   **Exchange Rate API**: Live forex and currency conversion.
-   **Public Economic APIs**: Inflation and economic indicator data.

# Mobile Safari Refresh Loop Fix (Jan 2026)

## Current Status: ALL AUTO-RELOAD SCRIPTS REMOVED

The infinite refresh loop on mobile Safari has been fixed by:

1. **Removed ALL automatic reload scripts from index.html:**
   - SW Killer v2.1 script (was causing reloads when detecting service worker artifacts)
   - Version Check & Auto-Reload System (was reloading on version mismatches/chunk errors)

2. **Added auth guards to Dashboard queries:**
   - All 5 useQuery calls now have `enabled: isAuthenticated`
   - Queries only fire after authentication is confirmed
   - Prevents 401 errors from throwing to ErrorBoundary

3. **Improved ErrorBoundary error handling:**
   - Auth errors (401) redirect to `/login` instead of triggering page reload
   - Chunk loading errors have max 3 retry limit
   - Other errors show simple message without auto-reload

## Root Causes Identified

The refresh loop was caused by:
1. Dashboard queries firing before auth cookies were ready on mobile Safari
2. 401 errors bubbling to ErrorBoundary → triggering silentRecover() → reload
3. SW killer script detecting artifacts and forcing reloads
4. Version check script reloading on chunk errors

## Files Modified

1. **client/index.html**: All inline reload scripts removed
2. **client/src/pages/dashboard.tsx**: Added `enabled: isAuthenticated` to all queries
3. **client/src/components/error-boundary.tsx**: Auth errors redirect to login
4. **client/src/main.tsx**: SW registration gated behind `VITE_ENABLE_PWA=true`

## How to Re-Enable PWA Safely

1. **Set environment variable**: `VITE_ENABLE_PWA=true`
2. **Replace kill-switch SW** with proper PWA SW
3. **Uncomment manifest link** in `client/index.html`
4. **Remove the inline SW killer script** in `client/index.html`
5. **Implement proper SW update flow** with version tracking
6. **Test thoroughly** on iOS Safari before production deploy

## Emergency Recovery Paths

Multiple fallback paths ensure users can recover:
1. **Kill-switch SW**: Auto-updates and self-destructs for old PWA users
2. **Missing JS 404 handler**: Serves hotfix script that redirects to `/_recover`
3. **/_recover endpoint**: Clears caches/SW and reloads fresh app
4. **Inline SW killer script**: Runs on page load as final backup
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

## Current Status: ROOT CAUSE FIXED - NO AUTO-RELOADS

The infinite refresh loop on mobile Safari has been **permanently fixed** by identifying and removing the root cause.

## ROOT CAUSE (Jan 5, 2026)

The Service Worker kill-switch (`client/public/sw.js`) contained this line that caused infinite reloads:
```javascript
clients.forEach(c => c.navigate(c.url));  // THIS WAS THE BUG!
```

Every time the SW activated, it would reload ALL browser tabs, creating an infinite loop.

## THE FIX

Updated sw.js to version 'kill-v2':
- **Removed ALL `client.navigate()` calls** - SW no longer triggers page reloads
- Uses `client.postMessage()` instead to notify pages silently
- SW still clears caches and unregisters itself, but WITHOUT causing navigation

## Files Modified

1. **client/public/sw.js**: Kill-switch v2 - NO navigation/reload on activation
2. **server/index.ts**: Updated inline fallback SW to v2, no navigate() calls
3. **client/src/components/error-boundary.tsx**: Removed ALL automatic reload logic - only shows static UI with error details
4. **client/src/App.tsx**: 9 critical routes eagerly imported (Dashboard, Welcome, Groups, etc.)
5. **client/index.html**: All inline reload scripts removed
6. **client/src/pages/dashboard.tsx**: Auth guards on queries (`enabled: isAuthenticated`), fixed FinancialHealthResponse interface

## React Error #300 Fix (Jan 5, 2026)

**Root Cause**: The `FinancialHealthResponse` interface in `dashboard.tsx` was stale - it expected `insights: string[]` and `recommendations: string[]` but the API returned a different structure with nested `breakdown` objects containing `recommendation` strings.

**The Fix**: Updated `FinancialHealthResponse` interface to match actual API response:
- `breakdown.savingsRate/emergencyFund/debtRatio/netWorthGrowth/budgetAdherence` each contain `{ score, value/months/ratio/growth/adherence, label, recommendation }`
- Replaced `insights: string[]` and `recommendations: string[]` with `summary: string` and `topPriority: string`

This prevented objects from being rendered directly as React children in production builds on mobile Safari.

## Defensive Type Safety (Jan 5, 2026)

Added type-safe helper functions in `dashboard.tsx` to wrap all API data access:
- **safeNumber()**: Ensures numeric values are valid (handles NaN, Infinity), defaults to 0 for invalid values
- **safeString()**: Ensures string values are valid strings, logs warnings for unexpected objects instead of silent coercion
- **safeDate()**: Validates date strings and returns Date objects or null, with logging for invalid dates
- **formatDate()**: Safe date formatting that handles invalid date strings gracefully

Applied to:
- `financialHealth.overall`, `financialHealth.grade`, `financialHealth.breakdown.*` fields
- `subscription.plan.name`, `subscription.usage.*`, `subscription.plan.*Limit` fields
- `stats.monthlyIncome`, `stats.monthlyExpenses`
- `preferences.monthlyExpensesEstimate`
- `goals[].title`, `goals[].currentAmount`, `goals[].targetAmount`, `goals[].targetDate`

Also added `safeRender()` helper in `client/src/components/ui/toaster.tsx` using React's `isValidElement()` to properly detect React nodes and prevent objects from being rendered as children.

Invalid data is logged to console with `[Dashboard]` or `[Toaster]` prefixes for debugging while UI remains stable.

## Design Principles (Preventing Future Loops)

1. **NEVER call `client.navigate()` or `location.reload()` automatically**
2. **All reloads must be user-initiated** (button clicks only)
3. **Service Workers should clean up silently** without triggering navigation
4. **ErrorBoundary shows static messages** - user must manually refresh

## Centralized Safe Rendering Utilities (Jan 2026)

**Location**: `client/src/lib/safe-render.ts`

All components MUST use these utilities when rendering API data to prevent React Error #300:
- `safeString(value)` - Converts any value to string, logs warning for objects
- `safeNumber(value)` - Converts any value to number, returns 0 for invalid
- `safeDate(value)` - Parses date strings safely, returns Date or null
- `formatDate(value, options)` - Safe date formatting
- `formatRelativeTime(value)` - Safe relative time formatting
- `safeArray<T>(value)` - Ensures value is an array

**Components updated to use centralized utilities**:
- dashboard.tsx, smart-nudges.tsx, streak-system.tsx
- notifications-bell.tsx, mobile-header.tsx, sidebar.tsx
- weekly-summary-card.tsx, message-bubble.tsx
- proactive-insights-panel.tsx, conversation-sidebar.tsx
- csv-analysis-panel.tsx, spending-insights.tsx

## How to Re-Enable PWA Safely

1. Set `VITE_ENABLE_PWA=true` in environment
2. Replace kill-switch SW with proper PWA SW (no navigate() calls!)
3. Uncomment manifest link in `client/index.html`
4. Test thoroughly on iOS Safari before production deploy
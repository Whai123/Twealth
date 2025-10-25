# Overview

Twealth is a full-stack web application designed for comprehensive schedule management, financial tracking, and goal setting. It provides a unified platform for personal and collaborative financial organization, offering CFO-level AI financial advice with specialized cryptocurrency features and de-dollarization insights, all within an intuitive and globally accessible interface. The project aims to provide an advanced, market-ready product with a "big tech company" aesthetic and professional user experience.

## Recent Changes (October 25, 2025)

### Morning Session
-   **Logo & Branding**: Integrated official Twealth logo (gradient purple-pink hexagon design with transparent background) across landing page and all branding touchpoints
-   **SEO Implementation**: Comprehensive search engine optimization with meta tags, Open Graph, Twitter Cards, JSON-LD structured data, sitemap.xml, and robots.txt
-   **Favicon Suite**: Generated complete favicon package (16x16, 32x32, 192x192, 512x512, Apple Touch Icon)
-   **AI Response Fix**: Enhanced sanitization to prevent system prompt echoing - AI now only speaks in natural, conversational language (no technical leakage)
-   **Production Ready**: App verified with E2E testing, all SEO tags rendering correctly, logo loading properly

### Afternoon Session - Dashboard Real Data Overhaul
-   **Dashboard Metrics Replacement**: Completely replaced fake calculations with real Financial Health Score system
    - Removed fake "financialScore" formula (was: 200 + totalSavings/100 + activeGoals*50)
    - Removed fake "streak" calculation (was: pretending user created account 2 months ago)
    - Integrated real Financial Health API endpoint (`/api/financial-health`) displaying 0-100 score with grade (Excellent/Good/Fair/Needs Improvement/Critical)
    - Replaced fake growth metric with real Savings Rate (calculated from actual income vs expenses)
    - Replaced fake streak with real Emergency Fund months (totalSavings / monthlyExpenses)
    - All 4 dashboard stat cards now show REAL calculations with color-coded thresholds
-   **QuickStats Real Data**: Removed time-tracking metrics (Time Value, Hourly Rate, Net Impact, Productivity) and replaced with core financial metrics:
    - Total Savings: Real sum from goals or user estimate  
    - Monthly Income: Real from last 30 days transactions or estimate
    - Monthly Expenses: Real from last 30 days expense transactions or estimate
    - Savings Capacity: Real calculation (monthlyIncome - monthlyExpenses) with savings rate %
-   **TimeValueInsights Removed**: Eliminated irrelevant time-tracking widget from dashboard
-   **Total Savings Calculation Fix**: Fixed critical bug in `server/storage.ts getUserStats()`
    - Previous: Used ONLY goals total if > 0, ignoring initial savings estimate
    - Fixed: Uses `Math.max(goalsTotal, savingsEstimate)` to never show less than user's declared savings
    - Ensures dashboard reflects both unallocated savings AND goal contributions correctly
-   **Goal Contributions Verified**: Tested and confirmed end-to-end goal contribution flow works correctly:
    - Users add funds via AddFundsForm → Creates transaction with goalId
    - Backend automatically updates goal.currentAmount and creates goal_contribution record
    - Dashboard totalSavings updates immediately
    - All data persists to PostgreSQL correctly

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend is a React 18 single-page application built with TypeScript, `shadcn/ui` (Radix UI), Tailwind CSS, and Wouter for routing. It emphasizes a mobile-first, responsive, and accessible design with dynamic navigation, PWA support, responsive typography, and a full-width layout matching industry standards like Stripe/Robinhood. Key UI features include dynamic dashboard visualizations, interactive onboarding, a professional AI assistant interface (ChatGPT/Claude-style), and comprehensive UI polish for a production-ready feel.

## Technical Implementations

The backend is an Express.js application in TypeScript, offering a RESTful API. It utilizes Drizzle ORM for type-safe PostgreSQL operations and employs a layered architecture for routes, storage, and external integrations with centralized error handling. Authentication uses Replit OAuth (OpenID Connect) with PostgreSQL for session management and role-based access control. The application supports 11 languages with `i18next` and `react-i18next` for internationalization.

## Feature Specifications

-   **AI Financial Advisor**: Powered by Groq AI (Llama 4 Scout), offering CFO-level advice with advanced intelligence for data validation, comprehensive luxury asset intelligence, live market intelligence, spending intelligence, and behavioral analysis. Features include AI personalization and memory, graceful error handling, imperative command detection, robust tool parameter handling, an empathetic coaching framework, and language auto-detection. AI responses are sanitized to ensure natural, conversational language without technical syntax.
-   **Core Features**: Conversational data collection, luxury purchase analysis, smart budget recommendations, actionable advice in 11 languages, and tiered crypto experience.
-   **Financial Health**: Real-time comprehensive financial health score with detailed component breakdown and actionable recommendations.
-   **Proactive Insights**: Automated spending anomaly detection, savings opportunity identification, goal deadline reminders, and budget warnings.
-   **Demo Mode**: Infrastructure for new user experience with realistic sample data.
-   **Premium Features**: Clear comparison for Free vs. Pro plans, highlighting advanced AI and tracking capabilities.

## System Design Choices

The architecture incorporates a comprehensive caching strategy (system prompt, market data, React Query optimization) and database indexing for performance. Authentication handles OIDC foreign key constraints. The system includes automatic investment data seeding for fresh deployments, populating 15+ investment strategies and passive income opportunities.

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
-   **Replit Connectors**: OAuth integration.
-   **Groq AI (Llama 4 Scout)**: AI financial advisor.
-   **Alpha Vantage API**: Real-time stock market data.
-   **Exchange Rate API**: Live forex and currency conversion.
-   **Public Economic APIs**: Inflation and economic indicator data.
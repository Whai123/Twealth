# Overview

Twealth is a full-stack web application designed for comprehensive schedule management, financial tracking, and goal setting. It provides a unified platform for personal and collaborative financial organization, featuring CFO-level AI financial advice, specialized cryptocurrency tools, and de-dollarization insights. The project aims to deliver an intuitive, globally accessible, production-ready product with premium design quality (comparable to Stripe, Robinhood, Coinbase) and a professional user experience to empower users in managing finances, achieving goals, and gaining actionable financial insights.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend is a React 18 single-page application built with TypeScript, `shadcn/ui` (Radix UI), Tailwind CSS, and Wouter for routing. It features a mobile-first, responsive, and accessible design with dynamic navigation, PWA support, and a full-width layout. The UI follows an **ultra-minimal Stripe/Coinbase/Apple aesthetic** with zero gradients, zero animations, and zero decorative elements. Design principles include: clean black/white/gray color palette, professional typography with ample whitespace, simple borders instead of shadows, data-focused layouts, enterprise trust signals (SOC 2 certification badges, security messaging, legal footers), and consistent professional iconography (Lucide React icons). The application includes sophisticated loading states (skeleton loaders, button spinners), robust UI for rate limiting, retry logic with exponential backoff, toast notifications, and optimistic updates. Comprehensive accessibility (WCAG 2.1 AA compliant) and advanced form validation are integrated. The design intentionally avoids all AI-generated looking elements to maintain trustworthiness and professional credibility.

**Mobile AI Chat Optimization (November 2025)**: The AI Assistant page uses a flex-column layout (header: shrink-0, messages: flex-1 overflow-y-auto, input: shrink-0) within a 100dvh container to ensure the input box is immediately visible at the bottom on page load without scrolling. This approach is more reliable than position:fixed on mobile browsers, especially during keyboard interactions. All touch targets meet ≥44px accessibility requirements (mode selector, send button, starter prompts, floating widget controls).

**UI/UX Enhancement Sprint (November 2025)**: Completed comprehensive design system and interaction improvements to achieve Stripe/Coinbase-level quality:

1. **Design Token System**: Established CSS variable-based design tokens (`--space-4`, `--space-6`, `--space-8`, `--text-xl`, `--text-2xl`) for consistent spacing, typography, and color usage across the application.

2. **AI Notification Center**: Implemented NotificationsBell component with daily briefings, risk alerts, goal nudges, and snooze/dismiss functionality for proactive user engagement.

3. **Insights Feed Widget**: Created auto-rotating insights feed (5-second transitions) displaying achievements, spending anomalies, and benchmarks with optimized useMemo intervals to prevent flicker.

4. **Professional Empty States**: Designed monochrome SVG illustrations with helpful guidance text for transactions, goals, and budgets, enhancing new user experience and zero-data scenarios.

5. **Premium Loading States**: Removed `animate-pulse` animations from all skeleton loaders (15+ files) to maintain static, professional loading feedback. Only functional animations (notification bell pulse) retained.

6. **Visual Hierarchy Enhancement**: Upgraded card titles from `text-lg` to `text-xl` across dashboard components (CryptoPortfolio, RecentTransactions, MonthlyProgress, Groups, FinancialGoals) for clearer content hierarchy.

7. **Tactile Affordances**: Implemented global interaction states including 2px focus rings with offset, opacity-based hover states (0.9), pressed states (translateY 0.5px + opacity 0.85), smooth 150ms cubic-bezier transitions, and clear disabled states (opacity 0.5).

These enhancements deliver enterprise-grade UX with zero decorative animations, zero gradients, and professional accessibility compliance.

## Technical Implementations

The backend is an Express.js application in TypeScript, providing a RESTful API. It uses Drizzle ORM for type-safe PostgreSQL operations and employs a layered architecture with centralized error handling. Authentication has been migrated to a custom OAuth implementation supporting Google, Apple, and Facebook logins, utilizing Passport.js with PostgreSQL session management and role-based access control. The application supports 11 languages via `i18next` and `react-i18next`.

### OAuth Setup Instructions

To enable authentication, you need to set up OAuth credentials for Google, Apple, and/or Facebook and configure the following environment secrets:

**Google OAuth:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Apple Sign In:**
- `APPLE_SERVICE_ID` (Service ID / Client ID)
- `APPLE_TEAM_ID` (10-character Team ID)
- `APPLE_KEY_ID` (Key ID from Apple Developer)
- `APPLE_PRIVATE_KEY` (Private key file content as string with `\n` for newlines)

**Facebook OAuth:**
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`

**Session Management:**
- `SESSION_SECRET` (Already configured)

Detailed instructions for Google Cloud Console, Apple Developer Program, and Facebook for Developers are available for setting up redirect URIs and obtaining credentials. Users are stored in the application's PostgreSQL database (not in Replit's user management system).

## Feature Specifications

-   **AI Financial Advisor**: Powered by Groq AI (**Llama 4 Scout - 17B MoE with native tool-use support**), offering CFO-level advice with advanced intelligence optimized for maximum proactive performance. **Scout Optimizations (November 2025)**: Smart conversation memory (8 recent + 2 important historical messages), dynamic temperature tuning (0.6 for calculations, 0.7 for questions, 0.8 for strategy), comprehensive trigger detection (luxury brands, transactions, budget, debt, investments), enforced quality validation with structured fallbacks, **natural conversational tone** (warm and helpful instead of robotic CFO-speak), proactive next-step suggestions, and performance tracking. **Imperative Action Support**: AI immediately creates goals/logs transactions when given direct commands ("Create a goal to save $5000", "Log $50 for groceries"), asks for missing details when needed, and provides analysis before creating for casual desires ("I want to save $5000"). Key features include AI personalization, memory, graceful error handling, balanced imperative detection with false-positive filtering (account updates, debt-only, budget-only), proactive access to user's financial profile, and natural text responses (no emojis, conversational tone). The AI utilizes over 23 specialized financial tools covering core finance, investments, debt management, and essential life tools. **Advanced Tools**: Car Affordability Calculator (20/4/10 rule, total cost of ownership analysis with insurance/maintenance/fuel/depreciation, budget validation), Student Loan Payoff Optimizer (compares IDR, standard, accelerated, refinance, and PSLF strategies with detailed ROI analysis), and Investment Comparison Tool (analyzes S&P 500, bonds, HYSA, CDs, REITs with risk/return/tax/liquidity comparison and personalized recommendations). It employs a 5-layer analysis framework, proactive pattern recognition, sophisticated scenario analysis, advanced tax optimization, behavioral finance mastery, multi-step strategic planning, 7 advanced decision frameworks, systematic financial analysis, and enhanced economic intelligence.
-   **Core Features**: Conversational data collection, luxury purchase analysis, smart budget recommendations, actionable advice in 11 languages, and tiered crypto experience.
-   **Financial Health**: Provides a real-time comprehensive financial health score (0-100) with a 5-component weighted breakdown (Savings Rate, Emergency Fund, Debt Ratio, Net Worth Growth, Budget Adherence), detailed insights, and actionable recommendations.
-   **Budget Management System**: Enables custom budgets for 12 categories, real-time progress tracking, proactive alerts, and smart recommendations based on 30-day expense data.
-   **Smart Transaction Auto-Categorization**: Automatically categorizes transactions using merchant names and descriptions, supporting bulk categorization and real-time progress indicators.
-   **Dashboard Real Data**: Displays 100% real financial calculations from user transactions, including financial health score, savings rate, emergency fund status, goals progress, and QuickStats (monthly income, expenses, savings, capacity).
-   **Proactive Insights**: Automated spending anomaly detection, savings opportunity identification, goal reminders, and budget warnings.
-   **Demo Mode**: Provides a new user experience with realistic sample data.
-   **Premium Features**: Differentiates Free vs. Pro plans, highlighting advanced AI and tracking capabilities.

## System Design Choices

The architecture includes a comprehensive caching strategy (system prompt, market data, React Query optimization) and database indexing for performance. Authentication handles OIDC foreign key constraints. Automatic investment data seeding populates 15+ investment strategies and passive income opportunities for fresh deployments.

## Project X Roadmap (Future Enhancements)

**Vision**: Transform Twealth from a financial tracking app into a full-featured financial operating system comparable to Robinhood/Coinbase, with the goal of becoming a billion-dollar company.

### Phase 1: Bank Account Integration (Priority 1)
- **Technology**: Plaid API for automatic bank account syncing
- **Impact**: 10x user engagement by eliminating manual transaction entry
- **Implementation**: Link Token flow, daily transaction sync via webhooks or cron jobs, automatic categorization pipeline
- **Cost**: ~$0.20/user/month (Plaid pricing)
- **Timeline**: 1 week development
- **Revenue Impact**: ⭐⭐⭐⭐⭐ (Massive reduction in user friction)

### Phase 2: News-Aware AI (Priority 2)
- **Technology**: NewsAPI or Finnhub for financial news
- **Impact**: Daily user engagement through personalized financial news briefings
- **Features**: 
  - Daily AI-powered financial news summaries
  - Personalized alerts based on user's portfolio/goals
  - Breaking market news integration
  - Portfolio-aware notifications (e.g., "Tesla dropped 5%, affects your holdings")
- **Cost**: $449/month (NewsAPI Business plan)
- **Timeline**: 2 days development
- **Revenue Impact**: ⭐⭐⭐ (Increases daily active users)

### Phase 3: Investment Execution (Priority 3)
- **Technology**: Alpaca Markets API for commission-free trading
- **Impact**: Transform from advice-only to actionable investment platform
- **Features**:
  - AI can execute trades: "Buy $500 of S&P 500" → Actually purchases
  - Real portfolio tracking with live P&L
  - Automated rebalancing
  - Tax-loss harvesting
- **Compliance**: Requires SEC registration, Alpaca handles custody
- **Timeline**: 2 weeks development + legal compliance
- **Revenue Impact**: ⭐⭐⭐⭐⭐ (Trading fees, premium subscriptions)

### Additional Future Enhancements:
- **Mobile Apps**: Native iOS/Android with push notifications
- **Social Features**: Share goals, compete with friends, community learning
- **Credit Monitoring**: Real-time credit score tracking, loan recommendations
- **Advanced Tax Tools**: Year-round tax planning, automated tax documents
- **Insurance Marketplace**: AI-powered insurance comparison and recommendations

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
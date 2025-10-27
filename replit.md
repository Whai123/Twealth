# Overview

Twealth is a full-stack web application for comprehensive schedule management, financial tracking, and goal setting. It offers a unified platform for personal and collaborative financial organization, including CFO-level AI financial advice, specialized cryptocurrency features, and de-dollarization insights. The project delivers an intuitive, globally accessible, production-ready product with premium "big tech company" design (Stripe/Robinhood/Coinbase quality) and professional user experience, empowering users to control spending, achieve financial goals, and gain actionable financial insights.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend is a React 18 single-page application built with TypeScript, `shadcn/ui` (Radix UI), Tailwind CSS, and Wouter for routing. It features a mobile-first, responsive, and accessible design with dynamic navigation, PWA support, responsive typography, and a full-width layout. Key UI elements include dynamic dashboard visualizations, interactive onboarding, a professional AI assistant interface (ChatGPT/Claude-style), and comprehensive UI polish.

**Premium UX/UI Polish (October 2025):**
- **Big Tech Design System**: Stripe/Robinhood/Coinbase-level visual polish across Dashboard, Money Tracking, and Financial Goals with consistent premium patterns
- **Premium Stat Cards**: Icon badges (colored backgrounds), subtle gradients (to-{color}/5), hover effects (shadow-xl, -translate-y-0.5), large bold typography (4xl font-bold tracking-tight), improved visual hierarchy
- **Layered Depth**: Multi-layered gradient overlays, absolute positioned backgrounds for visual depth, rounded-2xl corners, border-border/50 transparency
- **Smart Hover Effects**: Group hover with scale transforms, shadow animations, icon scale effects (group-hover:scale-110), smooth transitions (duration-200)
- **Rate Limiting**: Graceful 429 handling with RateLimitError class, countdown timers in UI, toast notifications showing retry-after time, exponential backoff (1s, 2s, 4s, 8s, capped at 30s)
- **Retry Logic**: Exponential backoff for all API calls - queries retry 2x, mutations 1x, smart backoff prevents API overload, no retry on client errors (4xx)
- **Skeleton Loaders**: Professional loading states across all pages with 10+ specialized components (cards, charts, lists)
- **Loading Indicators**: All async buttons show Loader2 spinners with smart icon swapping and disabled states
- **Toast Notifications**: Enhanced with optional icons (CheckCircle2, Target, AlertCircle) and WCAG-compliant aria-live announcements
- **Optimistic Updates**: Instant UI feedback in forms (transaction, goal, add-funds) with automatic rollback on error
- **Animations**: Performance-optimized transitions (transform, opacity, box-shadow), card hover effects, fade-in/slide-up, prefers-reduced-motion support
- **Empty States**: Premium gradient designs with engaging headlines, feature grids, clear CTAs on money-tracking, calendar, friends pages
- **Error Handling**: Context-aware error messages with specific titles, smart error detection (network, validation, amount, rate limit), actionable guidance
- **Accessibility**: WCAG 2.1 AA compliant with skip-to-main-content link, enhanced focus styles, aria-live toasts, keyboard shortcuts (G, T, E), comprehensive ARIA attributes
- **Form Validation**: shadcn forms with aria-describedby, aria-invalid, clear visual feedback, loading spinners on submit buttons

## Technical Implementations

The backend is an Express.js application in TypeScript, providing a RESTful API. It uses Drizzle ORM for type-safe PostgreSQL operations and employs a layered architecture for routes, storage, and external integrations with centralized error handling. Authentication leverages Replit OAuth (OpenID Connect) with PostgreSQL for session management and role-based access control. The application supports 11 languages via `i18next` and `react-i18next`.

## Feature Specifications

-   **AI Financial Advisor**: Powered by Groq AI (Llama 4 Scout), offering CFO-level advice with advanced intelligence for data validation, luxury asset, live market, spending, and behavioral analysis. Features include AI personalization, memory, graceful error handling, imperative command detection, robust tool parameter handling, empathetic coaching, and language auto-detection, with sanitized, conversational responses.
-   **Core Features**: Conversational data collection, luxury purchase analysis, smart budget recommendations, actionable advice in 11 languages, and tiered crypto experience.
-   **Financial Health**: Real-time comprehensive financial health score (0-100) with a 5-component weighted breakdown (Savings Rate, Emergency Fund, Debt Ratio, Net Worth Growth, Budget Adherence), detailed component breakdown, and actionable recommendations. Color-coded grades (Excellent, Good, Fair, Needs Improvement, Critical) provide clear status.
-   **Budget Management System**: Allows users to create custom budgets for 12 categories, track progress in real-time, and receive proactive alerts. Includes budget overview cards, real-time status badges ("On Track," "Near Limit," "Over Budget"), smart recommendations for overspending, and performance metrics. Budget tracking calculates spending from the last 30 days of expense transactions by category.
-   **Smart Transaction Auto-Categorization**: Automatically categorizes transactions based on merchant names and descriptions using a comprehensive database, reducing "Other" categorizations. Features include auto-categorization on creation, bulk categorization with a one-click UI, and real-time progress indicators.
-   **Dashboard Real Data**: Displays 100% real financial calculations from actual user transactions, replacing placeholder data. Includes real financial health score, savings rate, emergency fund status, and goals progress. QuickStats show real monthly income, monthly expenses, total savings, and savings capacity.
-   **Proactive Insights**: Automated spending anomaly detection, savings opportunity identification, goal deadline reminders, and budget warnings.
-   **Demo Mode**: Infrastructure for new user experience with realistic sample data.
-   **Premium Features**: Clear comparison for Free vs. Pro plans, highlighting advanced AI and tracking capabilities.

## System Design Choices

The architecture includes a comprehensive caching strategy (system prompt, market data, React Query optimization) and database indexing for performance. Authentication handles OIDC foreign key constraints. The system incorporates automatic investment data seeding for fresh deployments, populating 15+ investment strategies and passive income opportunities.

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
# Overview

Twealth is a full-stack web application designed for comprehensive schedule management, financial tracking, and goal setting. It provides a unified platform for personal and collaborative financial organization, offering CFO-level AI financial advice with specialized cryptocurrency features and de-dollarization insights, all within an intuitive and globally accessible interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend is a React 18 single-page application built with TypeScript, `shadcn/ui` (Radix UI), Tailwind CSS, and Wouter for routing. It emphasizes a mobile-first, responsive, and accessible design with dynamic navigation, PWA support, and responsive typography.

## Technical Implementations

The backend is an Express.js application in TypeScript, offering a RESTful API. It utilizes Drizzle ORM for type-safe PostgreSQL operations and employs a layered architecture for routes, storage, and external integrations with centralized error handling. Authentication uses Replit OAuth (OpenID Connect) with PostgreSQL for session management and role-based access control.

## Feature Specifications

-   **AI Financial Advisor**: Powered by Groq AI (Llama 4 Scout), offering CFO-level advice with advanced intelligence for data validation, luxury asset intelligence, live market intelligence, spending intelligence, and behavioral analysis.
    -   **Data Intelligence**: Smart validation, critical thinking engine, logical consistency checks, and professional skepticism for financial inputs.
    -   **Luxury Asset Intelligence**: Comprehensive database for 25+ luxury vehicles including pricing, insurance, maintenance, and depreciation.
    -   **Live Market Intelligence**: Integration with Alpha Vantage, exchangerate-api, and public APIs for real-time market data, including country-specific tax calculations for 10+ countries.
    -   **Spending Intelligence**: Pattern recognition, behavioral insights, smart recommendations, and unusual transaction detection.
-   **Core Features**: Conversational data collection, luxury purchase analysis, smart budget recommendations, actionable advice in 11 languages, and tiered crypto experience.
-   **Financial Health**: Real-time comprehensive financial health score (0-100) with detailed component breakdown and actionable recommendations.
-   **Proactive Insights**: Automated spending anomaly detection, savings opportunity identification, goal deadline reminders, and budget warnings.
-   **Internationalization**: Full support for 11 languages with locale-aware formatting and RTL support via `i18next` and `react-i18next`.

## System Design Choices

The architecture incorporates a comprehensive caching strategy for improved performance, including a system prompt cache, market data cache, and optimized React Query settings. Database indexes are implemented on frequently queried columns to enhance query performance.

**Full-Width Responsive Layout**: Application uses big tech-style full-width layouts matching Stripe/Robinhood pattern with fixed sidebar (~256px) and content area using `flex-1` to fill remaining viewport width. Responsive padding (`w-full px-4 sm:px-6 lg:px-8 xl:px-12`) grows with screen size. Data/dashboard pages (Dashboard, Goals, Money, Crypto, Friends, Groups, Planning, Referrals, Calendar, AI) maximize available width; form/pricing pages (Settings, Subscription, Upgrade) use centered containers (`max-w-5xl`/`max-w-7xl`) for readability. Mobile-first responsive grids prevent horizontal overflow (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4`).

**Authentication**: Fixed OIDC foreign key constraint violation by ensuring subscription initialization uses returned user ID rather than claims sub, preventing errors when existing users log in with different provider IDs.

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
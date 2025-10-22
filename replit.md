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

-   **AI Financial Advisor**: Powered by Groq AI (Llama 4 Scout), offering CFO-level advice with advanced intelligence for data validation, comprehensive luxury asset intelligence, live market intelligence, spending intelligence, and behavioral analysis.
    -   **Data Intelligence**: Smart validation, critical thinking engine, logical consistency checks, and professional skepticism for financial inputs.
    -   **AI Personalization & Memory** (Oct 2025): AI acts as personal CFO mentor, not chatbot - addresses users by name, remembers financial priorities, investment preferences, life events, spending habits, and risk tolerance. References past conversations naturally with phrases like "As you mentioned before..."
    -   **Graceful Error Handling** (Oct 2025): Implements enterprise-grade error recovery like ChatGPT/Claude - extracts and returns valuable AI responses even when tool calls fail, eliminating "I apologize for confusion" errors. First message always works.
    -   **Comprehensive Luxury Asset Intelligence** (Oct 2025): Extensive database covering 150+ luxury assets across 7 categories:
        -   **Vehicles**: 25+ models (Lamborghini, Ferrari, McLaren, Porsche, Rolls-Royce, Bentley, Aston Martin) with pricing, insurance, maintenance, and depreciation data.
        -   **Yachts**: 12+ models (65' to 364' superyachts) with purchase prices, docking, crew, fuel, and annual operating costs ($810k-$38.5M/year).
        -   **Private Jets**: 12+ models (HondaJet to Gulfstream G700) with purchase prices ($7.2M-$75M), hourly operating costs ($1,200-$6,000/hour), and range specifications.
        -   **Real Estate**: 15+ luxury markets globally (Manhattan, Monaco, Beverly Hills, Hong Kong, Aspen) with price ranges, property taxes, and HOA costs.
        -   **Jewelry**: 10+ categories (Tiffany, Cartier, Harry Winston, Graff) with appreciation rates (investment-grade diamonds appreciate 3-12%/year).
        -   **Designer Fashion**: 12+ brands (Hermès Birkin/Kelly, Chanel, Louis Vuitton, Louboutin) with appreciation analysis (Birkin appreciates 14%/year, beating S&P 500).
        -   **Art & Collectibles**: 10+ categories (contemporary art, classic cars, rare whisky, vintage watches) with historical appreciation rates (rare whisky +15%/year).
    -   **Live Market Intelligence**: Integration with Alpha Vantage, exchangerate-api, and public APIs for real-time market data, including country-specific tax calculations for 10+ countries.
    -   **Spending Intelligence**: Pattern recognition, behavioral insights, smart recommendations, and unusual transaction detection.
    -   **Imperative Command Detection** (Oct 2025): AI detects direct goal creation commands like "add it to my goal", "add this", "เพิ่ม" (Thai) and extracts context from conversation history to create goals immediately without asking for confirmation again.
    -   **Empathetic Coaching Framework** (Oct 2025): AI reframes expensive goals with path-forward language (never says "can't afford"), suggests realistic stepping stones, and provides smart alternatives. Includes 50+ empathetic response templates.
    -   **Language Auto-Detection** (Oct 2025): AI detects user's language from input and responds in same language, supporting 11 languages with contextual translation for technical terms.
-   **Core Features**: Conversational data collection, luxury purchase analysis, smart budget recommendations, actionable advice in 11 languages, and tiered crypto experience.
-   **Financial Health**: Real-time comprehensive financial health score (0-100) with detailed component breakdown and actionable recommendations.
-   **Proactive Insights**: Automated spending anomaly detection, savings opportunity identification, goal deadline reminders, and budget warnings.
-   **Internationalization**: Full support for 11 languages with locale-aware formatting and RTL support via `i18next` and `react-i18next`.

## System Design Choices

The architecture incorporates a comprehensive caching strategy for improved performance, including a system prompt cache, market data cache, and optimized React Query settings. Database indexes are implemented on frequently queried columns to enhance query performance.

**Full-Width Responsive Layout**: Application uses big tech-style full-width layouts matching Stripe/Robinhood pattern with fixed sidebar (~256px) and content area using `flex-1` to fill remaining viewport width. Responsive padding (`w-full px-4 sm:px-6 lg:px-8 xl:px-12`) grows with screen size. Data/dashboard pages (Dashboard, Goals, Money, Crypto, Friends, Groups, Planning, Referrals, Calendar, AI) maximize available width; form/pricing pages (Settings, Subscription, Upgrade) use centered containers (`max-w-5xl`/`max-w-7xl`) for readability. Mobile-first responsive grids prevent horizontal overflow (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4`).

**Authentication**: Fixed OIDC foreign key constraint violation by ensuring subscription initialization uses returned user ID rather than claims sub, preventing errors when existing users log in with different provider IDs.

## Pre-Launch Improvements (Oct 2025)

Following user feedback analysis, the following enhancements were made to transform Twealth from functional MVP to market-ready product:

1. **Dynamic Dashboard Visualizations**: Replaced static stats with animated recharts - beautiful bar charts for Income vs Target with gradient fills, smooth animations, and professional tooltips. Charts now make users "feel" their financial progress visually.

2. **AI Personalization Infrastructure**: Enhanced AI to act as personal CFO mentor:
   - Addresses users by name throughout conversations
   - Stores and references conversation memory (financial priorities, investment preferences, life events, spending habits, risk tolerance)
   - Uses phrases like "As you mentioned before..." to maintain context
   - System prompt dynamically builds personalized context section

3. **Demo Mode Foundation**: Created infrastructure for new user experience:
   - Added `demoMode` boolean to user preferences schema (defaults to true for new users)
   - Built realistic sample data service with 6 months of transactions, 5 financial goals, crypto holdings
   - Created demo data middleware for future route integration
   - Generates authentic financial scenarios (salary, recurring expenses, random purchases)

**Status**: Charts complete ✅, AI personalization complete ✅, Demo mode foundation complete (full route integration deferred)

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
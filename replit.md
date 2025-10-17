# Overview

Twealth is a full-stack web application for comprehensive schedule management, financial tracking, and goal setting. It provides a unified platform for personal and collaborative financial organization, offering CFO-level AI financial advice, including specialized cryptocurrency features and de-dollarization insights, within an intuitive and globally accessible interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend

The frontend is a React 18 single-page application built with TypeScript, `shadcn/ui` (Radix UI), Tailwind CSS, and Wouter for routing. State management uses TanStack Query and React Hook Form with Zod for validation. Vite handles development and builds. The UI is mobile-first, responsive, and designed for accessibility, featuring dynamic navigation, PWA support, and responsive typography.

## Backend

The backend is an Express.js application in TypeScript, providing a RESTful API. It uses Drizzle ORM for type-safe PostgreSQL operations, with a layered architecture for routes, storage, and external integrations, including centralized error handling.

## Database

PostgreSQL is used, with its schema defined by Drizzle ORM. Key entities include Users, Groups, Events, Financial Goals, and Transactions, supporting complex relationships for collaborative financial management.

## Authentication & Authorization

Twealth uses Replit OAuth (OpenID Connect) for authentication, with PostgreSQL for session management and role-based access control for groups. User creation is automatic on first login, handling existing user scenarios by preserving original user IDs.

## AI Financial Advisor

The core AI financial advisor, powered by Groq AI (Llama 4 Scout), offers CFO-level advice using user financial data with advanced intelligence features:

### Data Intelligence & Validation
- **Smart Data Validation**: Automatically detects unrealistic financial inputs (income >$100k/month, expenses exceeding income, inconsistent net worth) and flags them with warnings before saving
- **Critical Thinking Engine**: AI questions suspicious data before analysis (e.g., "$2M monthly income - did you mean $2,000?" or "765 LT is McLaren, not Lamborghini - which did you mean?")
- **Logical Consistency Checks**: Cross-validates financial data for red flags (savings rate <1% with high income, negative net worth without mentioned debt)
- **Professional Skepticism**: Challenges round numbers, verifies asset names, reconciles conflicting data points

### Luxury Asset Intelligence
- **Comprehensive Vehicle Database**: Accurate pricing, insurance costs, maintenance, and depreciation for 25+ luxury vehicles (Lamborghini, Ferrari, McLaren, Porsche, Bentley, Rolls-Royce, Aston Martin)
- **Brand Verification**: Prevents confusion between similar vehicles (e.g., McLaren 765 LT vs Lamborghini models)
- **Total Ownership Cost Analysis**: Calculates 5-year costs including purchase price, insurance ($6k-28k/year), maintenance ($3k-18k/year), and accurate depreciation (10-30% year 1)

### Live Market Intelligence
- **Real-Time Market Data**: Integration with Alpha Vantage (stocks), exchangerate-api (forex), and public APIs for inflation data
- **Market Context in AI**: AI advisor receives live market data including S&P 500, forex rates, and economic indicators for informed advice
- **Country-Specific Tax Calculations**: Comprehensive tax bracket system for 10+ countries (US, UK, Canada, Germany, France, India, Brazil, Singapore, UAE, Australia) with accurate federal tax, social security, and healthcare deductions
- **Net Income Calculations**: Automatically calculates take-home pay after all taxes, providing accurate budgeting recommendations

### Spending Intelligence & Behavioral Analysis
- **Pattern Recognition**: Analyzes transaction history to detect spending patterns, recurring expenses, and behavioral trends
- **Behavioral Insights**: Detects impulsive buying, weekend vs. weekday spending patterns, time-of-day habits, and monthly spending cycles
- **Smart Recommendations**: AI generates personalized recommendations based on spending behavior (e.g., "24-hour rule for impulse purchases")
- **Unusual Transaction Detection**: Automatically flags outlier transactions and suspicious spending patterns
- **Top Category Analysis**: Identifies highest spending categories with percentage breakdowns and trend analysis (increasing/decreasing/stable)

### Core Features
- Conversational data collection with resilient parsing, smart financial estimates, and flexible natural language processing
- Luxury purchase analysis, affordability calculators, lease vs. buy comparisons, and visual analytics dashboards
- Smart budget recommendations, actionable advice, and imperative command support in 11 languages
- Tiered crypto experience and AI actions for creating goals, scheduling events, and tracking transactions

## UI/UX & Features

Key features include a friend request system, collaborative financial sharing (goals, budgets, bulk invitations), comprehensive error handling, enhanced onboarding, organized sidebar, keyboard shortcuts, and premium AI personalization with a tiered pricing model.

## Internationalization (i18n)

The application supports 11 languages (English, Spanish, Indonesian, Thai, Brazilian Portuguese, Hindi, Vietnamese, Filipino/Tagalog, Malay, Turkish, Arabic) with full translation coverage, locale-aware formatting, and RTL support, implemented with i18next and react-i18next.

# External Dependencies

-   **React 18**: Frontend framework.
-   **Express.js**: Backend web framework.
-   **TypeScript**: Language for type safety.
-   **Vite**: Build tool.
-   **PostgreSQL**: Primary database.
-   **Drizzle ORM**: Type-safe database toolkit.
-   **@neondatabase/serverless**: Serverless PostgreSQL client.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **Radix UI**: Unstyled UI components.
-   **shadcn/ui**: Component library.
-   **Lucide React**: Icon library.
-   **TanStack Query**: Server state management.
-   **React Hook Form**: Form state management.
-   **Zod**: Schema validation.
-   **Microsoft Graph API**: Outlook calendar integration.
-   **Stripe**: Payment processing.
-   **Replit Connectors**: OAuth integration.
-   **Groq AI with Llama 4 Scout**: AI financial advisor.
-   **Alpha Vantage API**: Real-time stock market data.
-   **Exchange Rate API**: Live forex and currency conversion.
-   **Public Economic APIs**: Inflation and economic indicator data.
-   **date-fns**: Date manipulation utilities.

# Recent Enhancements (October 2025)

## Phase 2: Advanced Intelligence Features

### Market Data Integration (✅ Complete)
- Integrated Alpha Vantage for real-time stock prices (S&P 500, major indices)
- Connected exchangerate-api for live forex rates and currency conversion
- Added inflation data from public economic APIs
- Market context automatically included in AI system prompt for informed investment advice

### Tax Calculation System (✅ Complete)
- Built comprehensive tax bracket system supporting 10 countries
- Accurate calculations for federal tax, social security, Medicare/healthcare contributions
- Provides net income (take-home pay) calculations for realistic budgeting
- API endpoints: `/api/calculate-tax`, `/api/supported-tax-countries`
- Tax context automatically included in AI responses

### Spending Pattern Recognition (✅ Complete)
- Analyzes transaction history to detect behavioral patterns
- Identifies impulsive buying (frequency, average amount, categories)
- Tracks weekend vs weekday spending habits
- Detects time-of-day and monthly spending cycles
- Flags unusual transactions (outliers, same-day large purchases)
- Generates personalized recommendations based on spending behavior
- API endpoint: `/api/spending-patterns`

### AI Feedback System (✅ Complete)
- Thumbs up/down ratings on AI messages for quality tracking
- Stores feedback per message per user with optional text comments
- API endpoints: POST/GET `/api/messages/:messageId/feedback`, GET `/api/messages/feedback/stats`
- Tracks helpful vs unhelpful advice to improve AI recommendations over time

### AI Conversation Intelligence (✅ Complete)
- Persistent memory system that learns from user conversations
- Automatically extracts and stores financial priorities (e.g., "saving for house", "planning retirement")
- Tracks investment preferences, life events, spending habits, and risk tolerance
- Memory context automatically included in AI system prompt for personalized advice across sessions
- Service: `conversationMemoryService.ts` with intelligent pattern recognition

## Services Architecture

### New Services Added
1. **marketDataService.ts**: Fetches live market data from multiple APIs
2. **taxService.ts**: Country-specific tax calculations with 10+ tax regimes
3. **spendingPatternService.ts**: Behavioral analysis and pattern recognition

### AI Integration
All new services are integrated into the AI system prompt via async `buildSystemPrompt()`:
- Market data provides current economic context
- Tax calculations ensure advice uses net (not gross) income
- Spending patterns enable behavioral insights and personalized recommendations
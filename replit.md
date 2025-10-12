# Overview

Twealth is a full-stack web application designed for comprehensive schedule management, financial tracking, and goal setting. It enables users to manage groups, schedule events, monitor financial progress, and track money flows. The application aims to provide a unified platform for personal and collaborative financial organization.

# Recent Changes (October 2025)

## Cryptocurrency & De-Dollarization Features
- **Tiered Crypto Experience**: Added opt-in cryptocurrency features with experience levels (beginner/intermediate/advanced) to prevent overwhelming users unfamiliar with crypto
- **Multi-Currency Wealth Calculator**: Convert between USD, BTC, EUR, CNY, GBP, JPY, and Gold (oz) - only visible when crypto features enabled
- **Adaptive AI Financial Advice**: AI assistant adapts responses based on crypto preferences:
  - Crypto disabled → Traditional finance only (stocks, bonds, real estate)
  - Crypto enabled (beginner) → Simple Bitcoin/gold explanations, basic diversification
  - Crypto enabled (intermediate) → DeFi basics, stablecoin strategies, risk management
  - Crypto enabled (advanced) → Yield farming, Layer 2 solutions, macro de-dollarization trends
- **Settings Toggle**: Enable/disable crypto features in Settings → Preferences tab

## AI Chat System Improvements
- **Fixed "Action Completed" Empty Responses**: AI now ALWAYS provides detailed explanations after using analysis tools (portfolio, debt, retirement, future value). Added fallback response generators that automatically create comprehensive explanations with specific numbers, calculations, and recommendations when AI doesn't provide text response
- **Enhanced Tool Descriptions**: All analysis tools now mandate detailed explanations in their descriptions - portfolio shows stocks/bonds/alternatives percentages + dollar amounts + fund tickers (VTI/VOO/BND), debt shows avalanche vs snowball comparison with interest saved, retirement shows 4% rule + required savings + pro tips
- **Impressive Financial Responses**: Every response now includes expert-level knowledge with specific numbers, calculations, WHY explanations, and actionable recommendations - no more generic chatbot responses
- **Fixed Raw Function Syntax Display**: AI responses no longer show leaked function call syntax like `<function=create_financial_goal>...` - added explicit prompt instructions and response sanitization
- **Fixed Transaction Auto-Creation**: AI now correctly distinguishes between past transactions ("I spent/paid") vs future goals ("I want to buy") - prevents incorrect auto-tracking of future intentions
- **Fixed Subscription Initialization**: Chat endpoint now initializes free subscription before checking usage limits, preventing 0 quota for new users
- **Validated Confirmation Flow**: AI properly asks for user permission before creating goals/events (explain strategy first, then ask confirmation, create only after user confirms)
- **Fixed add_crypto_holding Tool**: Prevented inappropriate tool calls for informational crypto queries - tool only triggers for actual past transactions

## Performance & Scalability
- Added pagination to all major API endpoints (/api/transactions, /api/notifications, /api/events, /api/chat/messages) with offset/limit support
- Improved CoinGecko rate limiting: increased cache duration to 5 minutes, added request throttling with 2-second intervals, and graceful fallback to cached data
- Enhanced error handling across all API routes with consistent, user-friendly messages

## Code Quality  
- Added TypeScript interfaces to replace `any` types (OutlookConnectionSettings, UserSession, crypto data structures)
- Cleaned up production logging: removed debug console.logs, kept only critical error logging
- Improved type safety across authentication and external service integrations

## UI/UX Enhancements
- Created reusable EmptyState component for consistent empty states across all views
- Enhanced existing modern UI with refined color palette and smooth transitions
- Improved skeleton loaders for better loading states
- Added modern card shadows, borders, and hover effects using CSS custom properties

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend

The frontend is a React 18 single-page application built with TypeScript, leveraging a component-based architecture. It uses `shadcn/ui` (built on Radix UI) for a consistent design, Tailwind CSS for styling, and Wouter for client-side routing. State management is handled by TanStack Query for server state and React Hook Form with Zod for form management and validation. Vite is used for development and optimized production builds.

## Backend

The backend is an Express.js application written in TypeScript, providing a RESTful API. It uses Drizzle ORM for type-safe PostgreSQL database operations. The architecture is layered, separating routes, storage abstraction, and external integrations. It includes centralized error handling and hot reloading for development.

## Database

The application utilizes PostgreSQL, with its schema defined using Drizzle ORM. Key entities include Users, Groups, Events, Financial Goals, Transactions, and Group Members, supporting complex relationships and role-based permissions.

## Authentication & Authorization

Twealth implements a robust authentication system using Replit OAuth (OpenID Connect). It features PostgreSQL-backed session management, role-based access control for groups, and protected API endpoints. Frontend routes are also protected, and user creation occurs automatically upon first login. The system is designed to be environment-aware for cookie security.

## Development & Build

The development environment uses Vite with an Express backend proxy, enabling full-stack hot reloading. TypeScript ensures strict type checking across the entire application. Shared types are defined in a common directory. Production builds serve static frontend assets via Express.

## UI/UX & Features

The application features a modern UI with a redesigned landing page, enhanced accessibility (ARIA labels, keyboard navigation, screen reader support), and improved error handling. The dashboard provides dynamic data displays, loading states, and animations. Core features include:
- **Friend Request System**: Users can send, accept, and decline friend requests, manage friendships, and search for other users.
- **AI Financial Advisor**: Expert-level financial advisor powered by Groq AI (Llama 3.3) with comprehensive knowledge base:
  - **Macroeconomics Education**: Explains inflation, interest rates, Federal Reserve policy, economic cycles, monetary policy (QE), currency dynamics, and unemployment - helping users understand the bigger picture of how money and the economy work
  - **Investment Strategies**: Index fund recommendations (VTI, VOO, BND), asset allocation by age/risk tolerance, dollar-cost averaging, portfolio rebalancing, tax-loss harvesting
  - **Tax Optimization**: 401(k)/Roth IRA strategies, HSA triple tax advantage, Roth conversions, tax-efficient asset location, capital gains management
  - **Retirement Planning**: 4% withdrawal rule, FIRE calculations (25x expenses), compound growth projections, Social Security optimization
  - **Debt Management**: Avalanche vs snowball comparison with interest calculations, refinancing analysis, good debt vs bad debt assessment
  - **Real Estate Intelligence**: Mortgage amortization, 1% rule for rentals, cap rate calculations, rent vs buy decision framework
  - **Advanced Analysis Tools**: Portfolio allocation calculator, debt payoff strategy optimizer, inflation-adjusted future value projections, retirement needs assessment
  - **Advice-First Approach**: AI explains financial strategies with macroeconomic context FIRST, then offers to create goals/events (never auto-creates without permission)
  - **Context-Based Tool Filtering**: Advanced permission system prevents auto-creation of goals/events/groups. Creation tools are only available after AI asks permission AND user confirms with keywords like "yes", "add it", "create it". This two-step verification ensures user consent for all automated actions.
  - **Multi-language Support**: Responds in user's selected language (11 languages: en, es, id, th, pt, hi, vi, tl, ms, tr, ar) with culturally appropriate financial terminology
  - **Empathetic Personality**: Celebrates wins (🎉 milestone recognition), encourages during setbacks (💙 supportive coaching), culturally sensitive responses, motivational coaching style
  - **Proactive Insights**: Intelligent pattern detection system analyzing spending trends, budget optimization (50/30/20 rule), emergency fund progress tracking, unusual spending alerts, category-based recommendations
  - **Smart Alerts**: Critical financial health warnings, emergency fund milestones, investment readiness notifications, goal achievement tracking
  - **AI Actions**: Creates goals, schedules events, tracks transactions, manages groups, monitors crypto holdings through natural language commands (only after explaining strategy and asking permission)
- **Live Currency Rates**: Fetches and caches live exchange rates from an external API.
- **Cryptocurrency Tracking**: Displays live crypto prices with 24h change indicators.
- **Enhanced Onboarding**: Comprehensive 6-step onboarding flow including Welcome, AI Assistant introduction, Finance tracking, Goal setting, Group planning, and Pro Tips. The final step teaches keyboard shortcuts and navigation patterns.
- **Organized Sidebar**: Navigation structured into logical sections (Main, Finance, Social, More) with visual dividers and tooltips on hover for better discoverability.
- **Keyboard Shortcuts**: Quick access to common actions - G (Create Goal), T (Add Transaction), E (Schedule Event) - work from anywhere in the app.
- **Contextual Tooltips**: Hover tooltips on all navigation items provide helpful descriptions without cluttering the interface.

## Internationalization (i18n)

The application is fully internationalized with comprehensive support for 11 languages and RTL layouts, making it ready for global deployment:

- **Supported Languages**: English (en), Spanish (es), Indonesian (id), Thai (th), Brazilian Portuguese (pt), Hindi (hi), Vietnamese (vi), Filipino/Tagalog (tl), Malay (ms), Turkish (tr), Arabic (ar)
- **Translation Coverage**: 650+ translation keys covering ALL UI text including:
  - Navigation, forms, buttons, error messages, and notifications
  - Dashboard, goals, events, transactions, groups, friends, settings
  - Onboarding flow with dynamic step indicators
  - AI assistant interface and responses
  - All user-facing content across 15+ pages/components
- **Locale-Aware Formatting**:
  - Date/time formatting using date-fns with language-specific patterns (MM/DD/YYYY for US, DD/MM/YYYY for EU, etc.)
  - Currency formatting with Intl.NumberFormat respecting locale conventions (symbol positioning, decimal separators)
  - Number formatting with locale-specific thousand separators and decimal points
  - Variable interpolation with i18next ({{variable}} syntax)
- **RTL Support**: Full right-to-left layout support for Arabic with automatic text direction switching and mirrored UI components
- **Language Switcher**: Easy language selection with 11 languages available in sidebar and settings
- **Custom Hooks**: useLocale hook provides convenient access to locale-aware formatting functions
- **Implementation**: i18next with react-i18next, browser language detection, localStorage persistence
- **Testing**: Comprehensive e2e testing verified proper translations, interpolation, and RTL layout across all supported languages

# External Dependencies

- **React 18**: Frontend framework.
- **Express.js**: Backend web framework.
- **TypeScript**: Language for type safety.
- **Vite**: Build tool and dev server.
- **PostgreSQL**: Primary database.
- **Drizzle ORM**: Type-safe database toolkit.
- **@neondatabase/serverless**: Serverless PostgreSQL client.
- **Tailwind CSS**: Utility-first CSS framework.
- **Radix UI**: Unstyled, accessible UI components.
- **shadcn/ui**: Pre-built component library based on Radix.
- **Lucide React**: Icon library.
- **TanStack Query**: Server state management.
- **React Hook Form**: Form state management.
- **Zod**: Schema validation.
- **Microsoft Graph API**: Outlook calendar integration (via Replit Connector).
- **Stripe**: Payment processing (optional).
- **Replit Connectors**: OAuth integration.
- **Groq AI with Llama 3.3**: AI financial advisor.
- **Exchange Rate API**: Live currency conversion rates.
- **date-fns**: Date manipulation utilities.
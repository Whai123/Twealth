# Overview

Twealth is a full-stack web application for comprehensive schedule management, financial tracking, and goal setting. It allows users to manage groups, schedule events, monitor financial progress, and track money flows, providing a unified platform for personal and collaborative financial organization. The project aims to offer CFO-level AI financial advice, including specialized cryptocurrency features and de-dollarization insights, all within an intuitive and globally accessible interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend

The frontend is a React 18 single-page application using TypeScript, `shadcn/ui` (built on Radix UI), Tailwind CSS for styling, and Wouter for routing. State management is handled by TanStack Query for server state and React Hook Form with Zod for form validation. Vite is used for development and production builds.

## Backend

The backend is an Express.js application written in TypeScript, providing a RESTful API. It uses Drizzle ORM for type-safe PostgreSQL database operations. The architecture is layered, separating routes, storage abstraction, and external integrations, with centralized error handling.

## Database

The application utilizes PostgreSQL, with its schema defined using Drizzle ORM. Key entities include Users, Groups, Events, Financial Goals, Transactions, and Group Members, supporting complex relationships.

## Authentication & Authorization

Twealth uses Replit OAuth (OpenID Connect) for authentication, with PostgreSQL-backed session management, role-based access control for groups, and protected API endpoints. User creation occurs automatically upon first login.

## Development & Build

The development environment uses Vite with an Express backend proxy, enabling full-stack hot reloading. TypeScript ensures strict type checking. Shared types are defined in a common directory. Production builds serve static frontend assets via Express.

## UI/UX & Features

The application features a modern UI with a redesigned landing page, enhanced accessibility, improved error handling, and fully responsive mobile design. Core features include:
- **Mobile-First Responsive Design**: Optimized for all screen sizes with adaptive layouts:
    - **AI Chat Modal**: Full-screen on mobile (< 768px) with `inset-4` margins, floating card on desktop. Responsive text sizing (`text-xs md:text-sm` for messages), proper text wrapping with `break-words`, and optimized button positioning (`bottom-20` on mobile to avoid navigation bar overlap).
    - **Dashboard**: Responsive header (`text-2xl md:text-4xl`), adaptive stat cards with 2-column mobile grid, compact spacing (`gap-2 md:gap-4`), and touch-friendly sizing.
    - **Typography**: All text uses responsive Tailwind breakpoints to ensure readability across devices without zooming.
- **Friend Request System**: Manage friendships and user searches.
- **Collaborative Financial Sharing**: Share financial goals and budgets with friends for collaborative planning:
    - **Goal Sharing**: Share financial goals with friends with view-only or collaborative permissions via dropdown menu on goal cards. UI includes ShareGoalDialog component with friend selection and permission control (view/collaborate). Backend validates ownership and friendship status before sharing.
    - **Shared Budgets**: Create shared budgets with friends for group expenses (trips, households, projects). Track who spent what with automatic total calculations.
    - **Friend Group Invitations**: Invite friends to existing groups with customizable roles and permissions.
    - **Privacy Controls**: Only share with confirmed friends (status="accepted"). Owner maintains full control with ability to revoke access anytime. Database enforces unique constraint to prevent duplicate shares.
- **AI Financial Advisor**: An expert-level financial advisor powered by Groq AI (Llama 4 Scout) offering:
    - **Personalized Advice**: Uses user's financial data (income, expenses, net worth) in every response with mandatory calculation examples.
    - **Conversational Data Collection**: Proactively detects missing financial data and asks users targeted questions one at a time, automatically extracting and saving income, expenses, and savings from natural conversation using regex parsing.
    - **Resilient Data Capture**: Proactive parsing extracts financial estimates from user messages BEFORE AI processing, ensuring data is preserved even if AI fails due to rate limits or errors. Uses pattern matching for income ($X earn/make/salary), expenses ($X spend/cost), and savings ($X saved/have).
    - **Smart Financial Estimates**: Stores monthly income/expense estimates and current savings in user preferences, serving as fallback data when actual transaction history is unavailable. AI uses estimates seamlessly in calculations and advice.
    - **Comprehensive Knowledge**: Macroeconomics, investment strategies, tax optimization, retirement planning, debt management, real estate intelligence.
    - **Advanced Analysis Tools**: Portfolio allocation, debt payoff, future value projections, retirement calculators, with detailed explanations.
    - **Advice-First Approach**: Explains strategies and asks for user confirmation before creating goals/events.
    - **Context-Based Tool Filtering**: Requires explicit user confirmation ("yes", "add it", "create it") for automated actions.
    - **Multi-language Support**: 11 languages with culturally appropriate terminology and empathetic, motivational coaching.
    - **Proactive Insights**: Pattern detection, budget optimization, emergency fund tracking, smart alerts for critical financial health.
    - **AI Actions**: Creates goals, schedules events, tracks transactions, manages groups, monitors crypto holdings via natural language.
    - **Tiered Crypto Experience**: Opt-in features for beginner, intermediate, and advanced users, including a multi-currency wealth calculator and adaptive AI advice based on crypto preference.
- **Live Currency Rates**: Fetches and caches live exchange rates.
- **Cryptocurrency Tracking**: Displays live crypto prices.
- **Enhanced Onboarding**: A 6-step flow introducing key features and pro tips.
- **Organized Sidebar**: Logical navigation with visual dividers and tooltips.
- **Keyboard Shortcuts**: Quick access to common actions (G for Goal, T for Transaction, E for Event).
- **Premium AI Personalization**: Offers CFO-level advice with detailed, user-specific financial data integration for premium subscribers.
- **Premium Pricing Model**: Free plan (10 lifetime trial chats), Pro Plan ($25/month for 500 monthly chats), Enterprise (custom pricing for power users). Free tier uses lifetime limits to encourage trial-to-conversion.

## Internationalization (i18n)

The application supports 11 languages (English, Spanish, Indonesian, Thai, Brazilian Portuguese, Hindi, Vietnamese, Filipino/Tagalog, Malay, Turkish, Arabic) with full translation coverage (650+ keys), locale-aware formatting for dates, times, currencies, and numbers, and full RTL support for Arabic, implemented with i18next and react-i18next.

# External Dependencies

-   **React 18**: Frontend framework.
-   **Express.js**: Backend web framework.
-   **TypeScript**: Language for type safety.
-   **Vite**: Build tool and dev server.
-   **PostgreSQL**: Primary database.
-   **Drizzle ORM**: Type-safe database toolkit.
-   **@neondatabase/serverless**: Serverless PostgreSQL client.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **Radix UI**: Unstyled, accessible UI components.
-   **shadcn/ui**: Component library based on Radix.
-   **Lucide React**: Icon library.
-   **TanStack Query**: Server state management.
-   **React Hook Form**: Form state management.
-   **Zod**: Schema validation.
-   **Microsoft Graph API**: Outlook calendar integration.
-   **Stripe**: Payment processing.
-   **Replit Connectors**: OAuth integration.
-   **Groq AI with Llama 4 Scout**: AI financial advisor.
-   **Exchange Rate API**: Live currency conversion rates.
-   **date-fns**: Date manipulation utilities.
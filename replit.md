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

The core AI financial advisor, powered by Groq AI (Llama 4 Scout), offers CFO-level advice using user financial data, conversational data collection with resilient parsing, smart financial estimates, and flexible natural language processing. It includes features like luxury purchase analysis, affordability calculators, lease vs. buy comparisons, and visual analytics dashboards. AI provides smart budget recommendations, actionable advice, and supports imperative commands in 11 languages. It also offers tiered crypto experience and AI actions for creating goals, scheduling events, and tracking transactions.

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
-   **Exchange Rate API**: Live currency conversion.
-   **date-fns**: Date manipulation utilities.
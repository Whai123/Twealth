# Overview

Twealth is a full-stack web application designed for comprehensive schedule management, financial tracking, and goal setting. It enables users to manage groups, schedule events, monitor financial progress, and track money flows. The application aims to provide a unified platform for personal and collaborative financial organization.

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
- **AI Financial Advisor**: Integrated with Groq AI (Llama 3.3), the AI can control major app features like creating goals, events, transactions, groups, and tracking crypto holdings through natural language.
- **Live Currency Rates**: Fetches and caches live exchange rates from an external API.
- **Cryptocurrency Tracking**: Displays live crypto prices with 24h change indicators.
- **Enhanced Onboarding**: Comprehensive 6-step onboarding flow including Welcome, AI Assistant introduction, Finance tracking, Goal setting, Group planning, and Pro Tips. The final step teaches keyboard shortcuts and navigation patterns.
- **Organized Sidebar**: Navigation structured into logical sections (Main, Finance, Social, More) with visual dividers and tooltips on hover for better discoverability.
- **Keyboard Shortcuts**: Quick access to common actions - G (Create Goal), T (Add Transaction), E (Schedule Event) - work from anywhere in the app.
- **Contextual Tooltips**: Hover tooltips on all navigation items provide helpful descriptions without cluttering the interface.

## Internationalization (i18n)

The application is fully internationalized with comprehensive support for 11 languages and RTL layouts:

- **Supported Languages**: English (en), Spanish (es), Indonesian (id), Thai (th), Brazilian Portuguese (pt), Hindi (hi), Vietnamese (vi), Filipino/Tagalog (tl), Malay (ms), Turkish (tr), Arabic (ar)
- **Translation Coverage**: 426+ translation keys covering all UI text, navigation, forms, error messages, and notifications
- **Locale-Aware Formatting**:
  - Date/time formatting using date-fns with language-specific patterns (MM/DD/YYYY for US, DD/MM/YYYY for EU, etc.)
  - Currency formatting with Intl.NumberFormat respecting locale conventions (symbol positioning, decimal separators)
  - Number formatting with locale-specific thousand separators and decimal points
- **RTL Support**: Full right-to-left layout support for Arabic with automatic text direction switching and mirrored UI components
- **Language Switcher**: Easy language selection with 11 languages available in sidebar and settings
- **Custom Hooks**: useLocale hook provides convenient access to locale-aware formatting functions
- **Implementation**: i18next with react-i18next, browser language detection, localStorage persistence

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
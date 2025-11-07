# Overview

Twealth is a full-stack web application for comprehensive schedule management, financial tracking, and goal setting. It offers a unified platform for personal and collaborative financial organization, featuring CFO-level AI financial advice, specialized cryptocurrency tools, and de-dollarization insights. The project aims to deliver an intuitive, globally accessible, production-ready product with premium design quality and a professional user experience to empower users in managing finances, achieving goals, and gaining actionable financial insights.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend is a React 18 single-page application built with TypeScript, `shadcn/ui` (Radix UI), Tailwind CSS, and Wouter for routing. It features a mobile-first, responsive, and accessible design with dynamic navigation, PWA support, and an ultra-minimal Stripe/Coinbase/Apple aesthetic. Design principles include: clean black/white/gray color palette, professional typography, ample whitespace, simple borders, data-focused layouts, enterprise trust signals, and consistent professional iconography (Lucide React icons). The application includes sophisticated loading states, robust UI for rate limiting, retry logic, toast notifications, and optimistic updates. Comprehensive accessibility (WCAG 2.1 AA compliant) and advanced form validation are integrated. The design intentionally avoids all AI-generated elements. Recent enhancements include a CSS variable-based design token system, an AI Notification Center, an Insights Feed Widget, professional empty states, refined loading states, enhanced visual hierarchy, and tactile affordances for interaction states. Mobile AI Chat is optimized for visibility and accessibility.

## Technical Implementations

The backend is an Express.js application in TypeScript, providing a RESTful API. It uses Drizzle ORM for type-safe PostgreSQL operations and employs a layered architecture with centralized error handling. Authentication utilizes a custom OAuth implementation supporting Google, Apple, and Facebook logins via Passport.js with PostgreSQL session management and role-based access control. The application supports 11 languages via `i18next` and `react-i18next`. OAuth setup requires specific environment variables for Google, Apple, and Facebook credentials.

## Feature Specifications

-   **AI Financial Advisor**: Powered by Groq AI (Llama 4 Scout), offering CFO-level advice with advanced intelligence, smart conversation memory, dynamic temperature tuning, comprehensive trigger detection, enforced quality validation, natural conversational tone, and proactive next-step suggestions. It supports imperative action (e.g., "Create a goal," "Log transaction") and utilizes over 23 specialized financial tools, including advanced calculators for car affordability, student loan optimization, and investment comparison. It employs a 5-layer analysis framework, proactive pattern recognition, and advanced decision frameworks.
-   **Core Features**: Conversational data collection, luxury purchase analysis, smart budget recommendations, actionable advice in 11 languages, and tiered crypto experience.
-   **Financial Health**: Provides a real-time comprehensive financial health score (0-100) with a 5-component weighted breakdown, detailed insights, and actionable recommendations.
-   **Budget Management System**: Enables custom budgets for 12 categories, real-time progress tracking, proactive alerts, and smart recommendations.
-   **Smart Transaction Auto-Categorization**: Automatically categorizes transactions using merchant names and descriptions, supporting bulk categorization.
-   **Dashboard Real Data**: Displays 100% real financial calculations from user transactions, including financial health score, savings rate, emergency fund status, goals progress, and QuickStats.
-   **Proactive Insights**: Automated spending anomaly detection, savings opportunity identification, goal reminders, and budget warnings.
-   **Demo Mode**: Provides a new user experience with realistic sample data.
-   **Premium Features**: Differentiates Free vs. Pro plans, highlighting advanced AI and tracking capabilities.
-   **Zero-Friction Onboarding System**: Offers Express Start or Guided Setup, progressive data collection, and skippable steps.
-   **Predictive Analytics Engine**: Provides AI-powered spending forecasts, goal achievement predictions, cash flow forecasting, anomaly detection, and savings opportunities.
-   **Floating AI Copilot Widget**: Universal, context-aware widget available on every authenticated page for instant AI assistance with quick actions and a conversational interface.
-   **Predictive Insights Dashboard**: Comprehensive UI for forecasts, goal predictions, cash flow, and savings opportunities with early warning systems and interactive visualizations.
-   **Cross-Platform Consistency**: Responsive card-based layouts, touch-friendly targets, and consistent design tokens.

## System Design Choices

The architecture includes a comprehensive caching strategy (system prompt, market data, React Query optimization) and database indexing for performance. Authentication handles OIDC foreign key constraints. Automatic investment data seeding populates investment strategies and passive income opportunities for fresh deployments.

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
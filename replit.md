# Overview

Twealth is a full-stack web application for comprehensive schedule management, financial tracking, and goal setting. It offers a unified platform for personal and collaborative financial organization, featuring CFO-level AI financial advice powered by GPT-5 and Claude Opus 4.1, specialized cryptocurrency tools, and de-dollarization insights. The project aims to deliver an intuitive, globally accessible, production-ready product with premium design quality and a professional user experience to empower users in managing finances, achieving goals, and gaining actionable financial insights.

## AI Architecture (Updated November 2025)

**Primary Model: GPT-5** - 13x cheaper than Claude Opus 4.1 ($1.25 vs $15 per 1M input tokens), superior mathematical reasoning (94.6% AIME 2025), 90% token efficiency gains. Used for Free/Pro/Enterprise tiers.

**Enterprise Precision: Claude Opus 4.1** - Reserved for Enterprise tier precision-critical work. Superior for multi-file code refactoring, compliance, and zero-error requirements.

**Three-Tier System:**
- **Free ($0)**: 50 GPT-5 queries/month  
- **Pro ($9.99)**: 200 GPT-5 queries/month
- **Enterprise ($49.99)**: 300 GPT-5 queries/month + 20 Opus 4.1 queries/month

**Legacy Models (Deprecated)**: Scout (Llama 4 via Groq), Sonnet 4.5 - being phased out in favor of GPT-5's cost-effectiveness and performance.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend is a React 18 single-page application built with TypeScript, `shadcn/ui` (Radix UI), Tailwind CSS, and Wouter for routing. It features a mobile-first, responsive, and accessible design with dynamic navigation, PWA support, and an ultra-minimal Stripe/Coinbase/Apple aesthetic. Design principles include: clean black/white/gray color palette, professional typography, ample whitespace, simple borders, data-focused layouts, enterprise trust signals, and consistent professional iconography (Lucide React icons). The application includes sophisticated loading states, robust UI for rate limiting, retry logic, toast notifications, and optimistic updates. Comprehensive accessibility (WCAG 2.1 AA compliant) and advanced form validation are integrated. The design intentionally avoids all AI-generated elements. Recent enhancements include a CSS variable-based design token system, an AI Notification Center, an Insights Feed Widget, professional empty states, refined loading states, enhanced visual hierarchy, and tactile affordances for interaction states. Mobile AI Chat is optimized for visibility and accessibility.

## Technical Implementations

The backend is an Express.js application in TypeScript, providing a RESTful API. It uses Drizzle ORM for type-safe PostgreSQL operations and employs a layered architecture with centralized error handling. Authentication utilizes a custom OAuth implementation supporting Google, Apple, and Facebook logins via Passport.js with PostgreSQL session management and role-based access control. The application supports 11 languages via `i18next` and `react-i18next`. OAuth setup requires specific environment variables for Google, Apple, and Facebook credentials.

## Feature Specifications

-   **Tier-Aware AI Orchestration System**: Three-tier subscription model (Free/$0, Pro/$9.99, Enterprise/$49.99) with intelligent hybrid AI architecture. Each tier has monthly quotas: Free (50 Scout), Pro (200 Scout + 25 Sonnet), Enterprise (300 Scout + 60 Sonnet + 20 Opus). The system features automatic model selection based on query complexity, cascading fallback when preferred models are exhausted, and quota enforcement with HTTP 429 responses for upgrade prompts.
-   **AI Financial Advisor**: Powered by multi-model hybrid AI (Groq Llama 4 Scout for fast queries, Claude Sonnet for advanced reasoning, Claude Opus for CFO-level intelligence), offering tier-based financial advice with advanced intelligence, smart conversation memory, dynamic temperature tuning, comprehensive trigger detection, enforced quality validation, natural conversational tone, and proactive next-step suggestions. It supports imperative action (e.g., "Create a goal," "Log transaction") and utilizes over 23 specialized financial tools, including advanced calculators for car affordability, student loan optimization, and investment comparison. It employs a 5-layer analysis framework, proactive pattern recognition, and advanced decision frameworks.
-   **Real-Time Quota Management**: Live quota tracking for Scout/Sonnet/Opus models with color-coded indicators (blue/purple/gold), remaining query display, and intelligent upgrade prompts when quotas are exhausted.
-   **Core Features**: Conversational data collection, luxury purchase analysis, smart budget recommendations, actionable advice in 11 languages, and tiered crypto experience.
-   **Financial Health**: Provides a real-time comprehensive financial health score (0-100) with a 5-component weighted breakdown, detailed insights, and actionable recommendations.
-   **Budget Management System**: Enables custom budgets for 12 categories, real-time progress tracking, proactive alerts, and smart recommendations.
-   **Smart Transaction Auto-Categorization**: Automatically categorizes transactions using merchant names and descriptions, supporting bulk categorization.
-   **Dashboard Real Data**: Displays 100% real financial calculations from user transactions, including financial health score, savings rate, emergency fund status, goals progress, and QuickStats.
-   **Proactive Insights**: Automated spending anomaly detection, savings opportunity identification, goal reminders, and budget warnings.
-   **Demo Mode**: Provides a new user experience with realistic sample data.
-   **Subscription Management**: Professional 3-tier plan display with Scout/Sonnet/Opus quota details, visual quota progress bars, upgrade flows via Stripe, and real-time usage tracking.
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
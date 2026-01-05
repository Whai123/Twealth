# Overview

Twealth is a full-stack web application designed for comprehensive schedule management, financial tracking, and goal setting. It provides a unified platform for personal and collaborative financial organization, integrating CFO-level AI financial advice, specialized cryptocurrency tools, and de-dollarization insights. The project aims to deliver an intuitive, globally accessible, production-ready product with premium design quality and a professional user experience, empowering users to effectively manage their finances, achieve their goals, and gain actionable financial insights.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend is a React 18 single-page application built with TypeScript, `shadcn/ui`, Tailwind CSS, and Wouter for routing. It emphasizes a mobile-first, responsive, and accessible design with dynamic navigation and PWA support. The design uses a clean black/white/gray color palette, professional typography, ample whitespace, and consistent professional iconography (Lucide React icons). Key features include a streamlined dashboard, professional empty states, an AI ROI Calculator, and AI Playbooks for weekly financial reports.

## Streamlined Navigation

**Desktop Sidebar:** Dashboard, AI Assistant, My Money, Goals, Groups, Settings, Premium.
**Mobile Nav:** Dashboard, AI, My Money, Goals, Premium (Groups accessible on desktop only).
**My Money Page:** A unified page with 6 tabs: Overview, Profile, Analytics, Budget, Insights, and CSV import.

## Technical Implementations

The backend is an Express.js application in TypeScript, providing a RESTful API. It uses Drizzle ORM for type-safe PostgreSQL operations and employs a layered architecture with centralized error handling. Authentication uses a custom OAuth implementation supporting Google, Apple, and Facebook logins via Passport.js, with PostgreSQL session management and role-based access control. The application supports 11 languages via `i18next` and `react-i18next`. API rate limiting is implemented with tiered protection, and input validation is handled using Zod.

## Feature Specifications

Twealth offers a three-tier subscription model (Free, Pro, Enterprise) and uses an intelligent 4-model hybrid AI architecture (Scout, Claude Sonnet, GPT-5, Claude Opus) with automatic model selection and cascading fallback. The AI Financial Advisor provides CFO-level advice through 33+ specialized financial tools, including:

-   **Advanced AI Tools:** Debt Optimizer, Investment Projector, What-If Analyzer, Market Data, Tax Optimizer, Retirement Calculator, Spending Pattern Analyzer.
-   **Enhanced Context Engine:** The AI receives rich analytics such as savings rate, net worth, debt-to-income ratio, emergency fund status, spending trends, category anomaly detection, financial health score, and goal progress. Proactive insights are auto-generated for critical financial events.

Core features include conversational data collection, luxury purchase analysis, smart budget recommendations, actionable advice in multiple languages, and a tiered crypto experience. The system provides a real-time financial health score, custom budget management, smart transaction auto-categorization, and proactive insights. It also features a Demo Mode, a professional subscription management system, a zero-friction onboarding system, a Predictive Analytics Engine, and a floating AI Copilot Widget.

## System Design Choices

The architecture includes a comprehensive caching strategy (system prompt, market data, React Query optimization) and database indexing for performance. Authentication handles OIDC foreign key constraints. Production stability is ensured through health checks, global error handlers for the server, React error boundaries for the client, currency rate fallback, and AI service resilience with rate limit detection and exponential backoff.

## Mobile-First Responsive Design

All pages are designed with mobile-first responsive breakpoints, ensuring proper mobile stacking and touch target compliance. iOS safe-area padding is utilized. Static assets are served with appropriate cache headers and 404 handling. Subscription and pricing pages are limited to display exactly 3 plans.

## Multi-Layered React Error #300 Prevention

A comprehensive defense system prevents React Error #300 ("Objects are not valid as React child") on mobile Safari through multiple layers:
1.  **Server-Side Sanitization:** API responses are deep sanitized before sending to the client, converting Date objects to ISO strings and handling NaN/Infinity values.
2.  **API Response Sanitization (Client-Side):** All React Query and mutation responses are sanitized to preserve data structure and convert Date objects to ISO strings.
3.  **Cache Management:** A versioned cache system with automatic clearing of stale caches on app load.
4.  **Centralized Safe Rendering Utilities:** A set of helper functions (`safeString`, `safeNumber`, `safeDate`, `formatDate`, `formatRelativeTime`, `safeArray`) and a `SafeText` component are provided for robust data rendering, logging warnings for invalid data while maintaining UI stability.

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
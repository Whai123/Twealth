# Overview

Twealth is a full-stack web application for comprehensive schedule management, financial tracking, and goal setting. It offers a unified platform for personal and collaborative financial organization, featuring CFO-level AI financial advice powered by GPT-5 and Claude Opus 4.1, specialized cryptocurrency tools, and de-dollarization insights. The project aims to deliver an intuitive, globally accessible, production-ready product with premium design quality and a professional user experience to empower users in managing finances, achieving goals, and gaining actionable financial insights.

## AI Architecture (Updated November 2025)

**Four-Model Hybrid System (Scout-First Architecture):**

Twealth uses a sophisticated 4-model AI system with Scout (Llama 4 via Groq) as the PRIMARY unlimited model for paid tiers, backed by specialized models for complex queries:

1. **Scout (Llama 4 via Groq)** - PRIMARY MODEL
   - Cost: $0.11/$0.34 per 1M tokens (input/output)
   - Role: Fast responses, general financial advice, conversational queries
   - Availability: 50/month (Free), Unlimited (Pro/Enterprise)
   - Badge: Fast

2. **Claude Sonnet 4.5** - REASONING MODEL
   - Cost: $3/$15 per 1M tokens (input/output)
   - Role: Multi-step reasoning, complex financial analysis, strategic planning
   - Availability: 0 (Free), 25/month (Pro), 60/month (Enterprise)
   - Badge: Smart
   - Triggered by: reasoning keywords, complex analysis requests

3. **GPT-5** - MATH MODEL
   - Cost: $1.25/$10 per 1M tokens (input/output)
   - Role: Advanced mathematics, projections, compound calculations, investment modeling
   - Availability: 0 (Free), 5/month (Pro), 10/month (Enterprise)
   - Badge: Math
   - Triggered by: math keywords, projection requests, calculation queries

4. **Claude Opus 4.1** - CFO MODEL
   - Cost: $15/$75 per 1M tokens (input/output)
   - Role: Enterprise CFO-level analysis, zero-error compliance, high-stakes decisions
   - Availability: 0 (Free/Pro), 20/month (Enterprise only)
   - Badge: CFO
   - Triggered by: CFO keywords, executive-level queries

**Three-Tier Subscription System:**
- **Free ($0)**: 50 Scout queries/month
- **Pro ($9.99)**: Unlimited Scout + 25 Sonnet + 5 GPT-5 queries/month (92% profit margin)
- **Enterprise ($49.99)**: Unlimited Scout + 60 Sonnet + 10 GPT-5 + 20 Opus queries/month (94% profit margin)

**Smart Model Selection**: The system uses keyword-based complexity detection to automatically escalate queries from Scout → Sonnet/GPT-5/Opus based on query type. This Scout-first approach maximizes profit margins while maintaining high-quality responses.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend is a React 18 single-page application built with TypeScript, `shadcn/ui` (Radix UI), Tailwind CSS, and Wouter for routing. It features a mobile-first, responsive, and accessible design with dynamic navigation, PWA support, and an ultra-minimal Stripe/Coinbase/Apple aesthetic. Design principles include: clean black/white/gray color palette, professional typography, ample whitespace, simple borders, data-focused layouts, enterprise trust signals, and consistent professional iconography (Lucide React icons). The application includes sophisticated loading states, robust UI for rate limiting, retry logic, toast notifications, and optimistic updates. Comprehensive accessibility (WCAG 2.1 AA compliant) and advanced form validation are integrated. The design intentionally avoids all AI-generated elements.

**November 2025 Billion-Dollar UX Improvements:**
- **Signature Dashboard**: Streamlined from 16-widget overload to focused Hero KPI (Financial Health Score) + 3 priority cards (AI Recommendations, Next Milestone, Quick Actions). Fixed broken navigation links, null safety, and mobile responsiveness.
- **Professional Empty States**: Standardized all "no data" states across money-tracking, crypto, planning, and financial-goals pages using unified EmptyState component with SVG illustrations and Lucide icon support. Consistent minimal aesthetic with clear CTAs guiding users to take action.
- **Simplified Navigation**: Reduced desktop sidebar from 15+ links to 8 core sections (Dashboard, AI Assistant, Goals, Money, Investments, Calendar, Settings, Premium). Mobile maintains standard 5-tab bottom nav pattern. Eliminated cognitive overload by removing AI Insights, Predictive Insights, Hybrid AI Demo, Planning (standalone), Friends, Groups, Referrals, and Crypto (standalone) from primary navigation while keeping all pages accessible via direct URLs.
- **AI ROI Calculator**: Data-driven conversion tool on subscription page showing tier-by-tier value comparison. Displays 5 key metrics per tier (AI insights count, potential savings identified, time saved, decision accuracy, investment returns) with transparent ROI calculations. Free tier shows infinite value, Pro delivers 24,890% ROI ($2,490 savings vs $9.99 cost), Enterprise shows 15,900% ROI ($7,950 savings vs $49.99 cost). Based on average savings tracked across user base.
- **AI Playbooks (LIVE)**: Full-stack weekly AI-generated financial reports feature launched. Backend service (playbookService.ts) analyzes 7-day transaction/goal/budget/debt data, computes multi-factor health score (0-100), generates tier-aware insights (10/25/50 for Free/Pro/Enterprise), creates prioritized action queue with effort/impact ratings and deep links, tracks ROI savings and cumulative returns. 5 new API endpoints handle playbook generation, retrieval, action completion, and ROI updates. Beautiful frontend UI (/playbooks) displays circular health score indicator, 4-card ROI dashboard, severity-tagged insight grid, and interactive action queue with completion tracking. Navigation integrated into sidebar Finance section. All routes secured with authentication and ownership verification.
- **Pricing Cleanup (Nov 2025)**: Removed all legacy $25 "Pro" plan references. Database cleaned to show only 3 active plans (Free/$0, Pro/$9.99, Enterprise/$49.99). Deleted hardcoded plan creation logic from API endpoints. Removed all emojis from plan features for professional Stripe/Coinbase/Apple aesthetic. Synchronized seed file, database, and AI service documentation.
- **CSV Export System (Nov 2025)**: Added /api/transactions/export endpoint for tax-friendly CSV downloads with date filtering, type filtering, category filtering, and automatic summary calculations (income, expenses, transfers, net cash flow). Export button added to Money Tracking page.
- **Playbooks Action Completion Security (Nov 2025)**: Fixed action duplication bug that could inflate ROI totals. Added completedActionIndices JSONB field to track specific completed actions. Backend returns 409 Conflict for duplicate completion attempts. Frontend disables and shows "Completed" state for finished actions.
- **API Rate Limiting (Nov 2025)**: Implemented express-rate-limit middleware with tiered protection: AI endpoints (20/min), Playbook operations (5/min), Authentication (10/15min), Transactions (60/min). Returns friendly JSON error messages.
- **Zod Input Validation (Nov 2025)**: Added completeActionSchema validation for playbook action completion endpoint. Validates actionIndex (int 0-100) and estimatedSavings (number 0-100000) with proper error responses.
- **Landing Page Links (Nov 2025)**: Replaced all placeholder href="#" links with real navigation to existing pages (Dashboard, Pricing, AI Advisor, Goals, Money Tracking, Playbooks, Investments, Calendar, Settings). Legal links styled as non-interactive text pending actual legal pages.

## Technical Implementations

The backend is an Express.js application in TypeScript, providing a RESTful API. It uses Drizzle ORM for type-safe PostgreSQL operations and employs a layered architecture with centralized error handling. Authentication utilizes a custom OAuth implementation supporting Google, Apple, and Facebook logins via Passport.js with PostgreSQL session management and role-based access control. The application supports 11 languages via `i18next` and `react-i18next`. OAuth setup requires specific environment variables for Google, Apple, and Facebook credentials.

## Feature Specifications

-   **Tier-Aware AI Orchestration System**: Three-tier subscription model (Free/$0, Pro/$9.99, Enterprise/$49.99) with intelligent 4-model hybrid AI architecture. Each tier has monthly quotas: Free (50 Scout), Pro (Unlimited Scout + 25 Sonnet + 5 GPT-5), Enterprise (Unlimited Scout + 60 Sonnet + 10 GPT-5 + 20 Opus). The system features automatic model selection based on query complexity, cascading fallback when preferred models are exhausted, and quota enforcement with HTTP 429 responses for upgrade prompts.
-   **AI Financial Advisor**: Powered by 4-model hybrid AI (Scout/Llama 4 as PRIMARY for fast queries, Sonnet 4.5 for multi-step reasoning, GPT-5 for advanced math/projections, Opus 4.1 for Enterprise CFO-level intelligence), offering tier-based financial advice with advanced intelligence, smart conversation memory, dynamic temperature tuning, comprehensive trigger detection, enforced quality validation, natural conversational tone, and proactive next-step suggestions. It supports imperative action (e.g., "Create a goal," "Log transaction") and utilizes over 23 specialized financial tools, including advanced calculators for car affordability, student loan optimization, and investment comparison. It employs a 5-layer analysis framework, proactive pattern recognition, and advanced decision frameworks.
-   **Real-Time Quota Management**: Live quota tracking for all 4 models (Scout/Sonnet/GPT-5/Opus) with color-coded indicators (blue/purple/emerald/gold) and model badges (Fast/Smart/Math/CFO), remaining query display, intelligent upgrade prompts when quotas are exhausted, and "Unlimited" display for Scout on Pro/Enterprise tiers.
-   **Core Features**: Conversational data collection, luxury purchase analysis, smart budget recommendations, actionable advice in 11 languages, and tiered crypto experience.
-   **Financial Health**: Provides a real-time comprehensive financial health score (0-100) with a 5-component weighted breakdown, detailed insights, and actionable recommendations.
-   **Budget Management System**: Enables custom budgets for 12 categories, real-time progress tracking, proactive alerts, and smart recommendations.
-   **Smart Transaction Auto-Categorization**: Automatically categorizes transactions using merchant names and descriptions, supporting bulk categorization.
-   **Dashboard Real Data**: Displays 100% real financial calculations from user transactions, including financial health score, savings rate, emergency fund status, goals progress, and QuickStats.
-   **Proactive Insights**: Automated spending anomaly detection, savings opportunity identification, goal reminders, and budget warnings.
-   **Demo Mode**: Provides a new user experience with realistic sample data.
-   **Subscription Management**: Professional 3-tier plan display with all 4 model quotas (Scout/Sonnet/GPT-5/Opus) shown with badges, visual quota progress bars, upgrade flows via Stripe, and real-time usage tracking across subscription page and AI assistant page.
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
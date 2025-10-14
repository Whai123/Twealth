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

Twealth uses Replit OAuth (OpenID Connect) for authentication, with PostgreSQL-backed session management, role-based access control for groups, and protected API endpoints. User creation occurs automatically upon first login. The upsertUser method handles duplicate email scenarios by checking for existing users by both ID and email. When an existing user is found by email (but with a different OIDC ID), the system preserves the original user's ID to prevent foreign key constraint violations on related tables like chat_conversations. Updates use SQL template literals to avoid TypeScript type mismatches.

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
    - **Goal Sharing**: Share financial goals with friends with view-only or collaborative permissions via dropdown menu on goal cards. UI includes ShareGoalDialog component with friend selection and permission control (view/can_contribute). Backend validates ownership and friendship status before sharing.
    - **Group-Based Goal Sharing**: Share goals with entire groups automatically during goal creation via GoalForm component. Select group and permission level (view/can_contribute), creates group-level share plus individual shares for all members. Group shares stored with groupId in sharedGoals table. API endpoint POST /api/goals/{goalId}/share-with-group handles auto-sharing with ownership and membership validation.
    - **Shared Budgets**: Create shared budgets with friends for group expenses (trips, households, projects). Track who spent what with automatic total calculations. Backend supports linking budgets to goals (linkedGoalId) for automatic progress tracking.
    - **Bulk Friend Invitations**: Invite multiple friends to groups simultaneously via bulk invite dialog. Select friends with checkboxes, assign role (member/admin), sends batch invitations. API POST /api/groups/{groupId}/bulk-invite creates member records and notifications.
    - **Friend Group Invitations**: Invite friends to existing groups with customizable roles and permissions via UI dialogs.
    - **Privacy Controls**: Only share with confirmed friends (status="accepted"). Owner maintains full control with ability to revoke access anytime. Database enforces unique constraint to prevent duplicate shares.
    - **AI Smart Suggestions**: AI provides intelligent recommendations for group invites (suggest_group_invites tool) based on shared goals and interests, and savings optimization (suggest_savings_adjustment tool) with category-specific budget cuts and timeline improvements.
- **AI Financial Advisor**: A CFO-level financial advisor ($150/hour expertise) powered by Groq AI (Llama 4 Scout) offering:
    - **Personalized Advice**: Uses user's financial data (income, expenses, net worth) in every response with mandatory calculation examples.
    - **Conversational Data Collection**: Proactively detects missing financial data and asks users targeted questions one at a time, automatically extracting and saving income, expenses, and savings from natural conversation using regex parsing.
    - **Resilient Data Capture**: Proactive parsing extracts financial estimates from user messages BEFORE AI processing, ensuring data is preserved even if AI fails due to rate limits or errors. Uses pattern matching for income ($X earn/make/salary), expenses ($X spend/cost), and savings ($X saved/have).
    - **Smart Financial Estimates**: Stores monthly income/expense estimates and current savings in user preferences, serving as fallback data when actual transaction history is unavailable. AI uses estimates seamlessly in calculations and advice.
    - **Flexible Natural Language Processing**: AI tool schemas accept string or number types for amount fields, with backend parseAmount() utility that handles various formats ($300, 300, $1,500.50, etc.) by stripping dollar signs, commas, and whitespace before converting to decimal strings.
    - **Enhanced Error Handling**: User-friendly error messages for Groq API failures (rate limits: "I'm handling lots of conversations right now!", timeouts: "Taking longer than expected", model issues: "Experiencing technical difficulties") instead of technical errors.
    - **Clean Response Sanitization**: Backend strips all technical details from AI responses including `<function=...>` syntax, "Tool Calls" sections, numbered function lists, and JSON patterns to ensure user-friendly natural language only.
    - **Luxury Purchase Analysis**: Comprehensive CFO-level analysis for major purchases (>$50k) including down payment options (10%/20%/30%), financing terms (3/5/7 years), monthly payments at different rates, total cost of ownership (insurance, maintenance, fuel), depreciation schedules (20-30% year 1 for luxury vehicles), and opportunity cost analysis (invested at 8% over 5/10 years).
    - **Affordability Calculator**: Detailed analysis with debt-to-income ratio, recommended max purchase (2.5x annual income), savings timeline, emergency fund impact, and financial responsibility assessment.
    - **Lease vs Buy Comparison**: 3-year lease costs, buy costs with financing, equity analysis, total cost comparison, comprehensive pros/cons for informed decisions.
    - **Visual Analytics Dashboard**: Dedicated AI Insights page (`/ai-insights`) with Recharts visualizations displaying:
      - **Spending Breakdown**: Pie chart showing expense distribution by category with color-coded segments
      - **Goal Progress**: Progress bars tracking completion percentage for each financial goal
      - **Net Worth Projection**: Line chart with 1-year, 5-year, and 10-year projections comparing savings vs investment growth with compound interest
      - **Budget Allocation**: 50/30/20 rule visualization with recommended category spending
      - Accessible via sidebar (desktop) and bottom navigation (mobile) with BarChart3 icon
    - **Smart Budget Recommendations**: 50/30/20 rule allocation, category-specific recommendations, savings opportunities, and exact action steps tied to financial goals.
    - **Actionable Recommendations**: Always provides exact numbers ("Save $847/month for 18 months") instead of generic advice, with step-by-step math and progress tracking.
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
/**
 * Twealth AI Action Tools
 * 
 * Comprehensive set of tools available to all AI models (Scout, Sonnet, GPT-5, Opus)
 * for taking actions in the Twealth financial management app.
 * 
 * Categories:
 * 1. Core Actions: create_financial_goal, add_transaction, create_calendar_event, create_group
 * 2. Portfolio & Investment: analyze_portfolio_allocation, compare_financing_options
 * 3. Debt Management: calculate_debt_payoff
 * 4. Projections: project_future_value, calculate_retirement_needs, calculate_net_worth_projection
 * 5. Budgeting: generate_budget_recommendations, suggest_savings_adjustment
 * 6. Risk Management: calculate_emergency_fund, credit_score_improvement_plan
 * 7. Real Estate: calculate_rent_affordability, calculate_mortgage_payment
 * 8. Tax Optimization: optimize_tax_strategy
 * 9. Crypto: add_crypto_holding
 * 10. Luxury Analysis: analyze_luxury_purchase, calculate_affordability
 * 11. Insights: generate_spending_insights, calculate_goal_progress
 * 12. Social: suggest_group_invites
 * 13. Data Collection: save_financial_estimates
 */

/**
 * All available tools for Twealth AI models
 * Compatible with both OpenAI and Anthropic function calling formats
 */
export const TWEALTH_AI_TOOLS = [
  // ========== CORE ACTIONS (User can command these directly) ==========
  {
    type: "function",
    function: {
      name: "create_financial_goal",
      description: "Create a financial goal when user gives a direct command or confirms. TWO SCENARIOS: (A) Complete command with amount ('Create a goal to save $5000') → IMMEDIATELY call this tool with all extracted details. (B) Incomplete command without amount ('Make a savings goal') → ASK for missing details first: 'I can set that up! What's your target amount and timeline?'. NEVER call this tool without targetAmount. Extract: name (purpose), targetAmount (required: $5000 or 5000), targetDate (calculate from timeline or ask), description. Set userConfirmed=true for all imperative commands.",
      parameters: {
        type: "object",
        properties: {
          userConfirmed: {
            type: "boolean",
            description: "REQUIRED: Set to true. TRUE when: (1) User explicitly confirms with 'yes', 'add it', 'sure', OR (2) User gives IMPERATIVE COMMAND like 'Create a goal to...', 'Add a goal for...', 'Make a goal for...'. Imperative commands ARE confirmations! Only false if user just casually mentions wanting something without commanding or confirming."
          },
          name: {
            type: "string",
            description: "The name of the goal (e.g., 'Buy Lamborghini')"
          },
          targetAmount: {
            type: "string",
            description: "The target amount in dollars (e.g., '5000', '$10000', '2500.00'). Can include dollar signs and decimals."
          },
          targetDate: {
            type: "string",
            description: "The target date in YYYY-MM-DD format"
          },
          description: {
            type: "string",
            description: "A brief description of the goal and plan to achieve it"
          }
        },
        required: ["userConfirmed", "name", "targetAmount", "targetDate"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_transaction",
      description: "Record a transaction when user explicitly states they spent/received money with specific amount. CRITICAL: Call this tool AND simultaneously provide detailed financial insights in natural language (impact on budget, monthly spend comparison, savings rate effect, actionable advice). NEVER just call the tool silently - ALWAYS explain the transaction's financial impact with specific numbers. Use when user says 'I spent $X on Y' or 'I earned $X from Y'.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["income", "expense"],
            description: "Type of transaction"
          },
          amount: {
            type: "string",
            description: "Transaction amount in dollars (e.g., '300', '45.50', '$100'). Can include dollar signs and decimals."
          },
          category: {
            type: "string",
            description: "Transaction category (e.g., 'groceries', 'salary', 'entertainment')"
          },
          description: {
            type: "string",
            description: "Transaction description"
          },
          date: {
            type: "string",
            description: "Transaction date in YYYY-MM-DD format (defaults to today if not specified)"
          }
        },
        required: ["type", "amount", "category"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description: "Create a calendar event when user gives direct command or confirms. IMMEDIATE EXECUTION: When user says 'Create a reminder for...', 'Add calendar event for...', 'Set a reminder to...', call this tool IMMEDIATELY. NO confirmation needed for imperative commands - they ARE the confirmation! Extract title, date (YYYY-MM-DD), description. Calculate dates: 'next week' = 7 days from now, 'next month' = 30 days from now, 'tomorrow' = 1 day from now.",
      parameters: {
        type: "object",
        properties: {
          userConfirmed: {
            type: "boolean",
            description: "REQUIRED: Set to true. TRUE when: (1) User explicitly confirms with 'yes', 'set it', 'sure', OR (2) User gives IMPERATIVE COMMAND like 'Create a reminder for...', 'Add event for...', 'Set reminder to...'. Imperative commands ARE confirmations! Only false if user casually mentions a date without commanding or confirming."
          },
          title: {
            type: "string",
            description: "The event title (e.g., 'Review Portfolio', 'Pay Rent', 'Check Budget')"
          },
          date: {
            type: "string",
            description: "The event date in YYYY-MM-DD format. Calculate from today's date if relative (next week, tomorrow, etc.)"
          },
          description: {
            type: "string",
            description: "Event description or notes with financial context"
          }
        },
        required: ["userConfirmed", "title", "date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_group",
      description: "Create a group ONLY after user explicitly confirms. CRITICAL: userConfirmed parameter MUST be true. WORKFLOW: (1) User mentions group/collaboration → (2) You explain benefits WITHOUT calling this tool → (3) You ask 'Want me to create this group for you?' → (4) User confirms → (5) THEN call with userConfirmed=true.",
      parameters: {
        type: "object",
        properties: {
          userConfirmed: {
            type: "boolean",
            description: "REQUIRED: Must be true. Can ONLY be true when user explicitly confirmed with words like 'yes', 'create it', 'make it', 'sure'. If user just mentioned a group idea without confirming, DON'T call this tool."
          },
          name: {
            type: "string",
            description: "The group name (e.g., 'Family Budget', 'Roommates Expenses')"
          },
          description: {
            type: "string",
            description: "What this group is for"
          }
        },
        required: ["userConfirmed", "name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_crypto_holding",
      description: "Track crypto holding ONLY when user explicitly states a PAST purchase with specific amounts. CRITICAL: Use ONLY for completed transactions like 'I bought 0.5 BTC at $50000' or 'I own 2 ETH purchased at $3000'. DO NOT use for: questions about crypto, future plans, hypothetical scenarios, or educational discussions. For informational queries, just explain in text without calling this tool.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Crypto symbol in uppercase (e.g., 'BTC', 'ETH', 'BNB')"
          },
          amount: {
            type: "string",
            description: "Amount of cryptocurrency owned (e.g., '0.5', '2', '1.25'). Accepts decimal values."
          },
          purchasePrice: {
            type: "string",
            description: "Purchase price per unit in USD (e.g., '50000', '$3000', '1500.50'). Can include dollar signs."
          }
        },
        required: ["symbol", "amount", "purchasePrice"]
      }
    }
  },

  // ========== DATA COLLECTION (Automatically populate user profile) ==========
  {
    type: "function",
    function: {
      name: "save_financial_estimates",
      description: "Save user's financial estimates when they provide monthly income, monthly expenses, or current savings. Use this IMMEDIATELY when user mentions these numbers to populate their financial profile. Examples: 'I make $5000/month', 'I spend about $3000 monthly', 'I have $10000 saved'. This helps provide better personalized advice.",
      parameters: {
        type: "object",
        properties: {
          monthlyIncome: {
            type: ["number", "string"],
            description: "Estimated monthly income in dollars. Can be number or string like '$5000' or '5000'. Only include if user provided this information."
          },
          monthlyExpenses: {
            type: ["number", "string"],
            description: "Estimated monthly expenses in dollars. Can be number or string like '$3000' or '3000'. Only include if user provided this information."
          },
          currentSavings: {
            type: ["number", "string"],
            description: "Current total savings/net worth in dollars. Can be number or string like '$10000' or '10000'. Only include if user provided this information."
          }
        }
      }
    }
  },

  // ========== CALCULATIONS & ANALYSIS (Provide detailed insights) ==========
  {
    type: "function",
    function: {
      name: "analyze_portfolio_allocation",
      description: "Calculate portfolio allocation ONLY when user asks about investment strategy. CRITICAL: After calling this tool, you MUST explain the allocation breakdown with specific dollar amounts, fund recommendations (VTI/VOO/BND), and WHY this allocation works for their age/risk. NEVER just say 'Action completed' - always provide detailed investment advice explaining stocks/bonds/alternatives percentages.",
      parameters: {
        type: "object",
        properties: {
          age: {
            type: "number",
            description: "User's age for age-based allocation"
          },
          riskTolerance: {
            type: "string",
            enum: ["conservative", "moderate", "aggressive"],
            description: "Risk tolerance level"
          },
          investmentAmount: {
            type: "number",
            description: "Amount to allocate"
          }
        },
        required: ["age", "riskTolerance", "investmentAmount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_debt_payoff",
      description: "Calculate debt payoff strategies ONLY when user asks about paying off debts. CRITICAL: After calling this tool, you MUST explain BOTH avalanche (highest interest first) and snowball (smallest balance first) methods with total interest saved, payoff timeline, and clear recommendation. NEVER just say 'Action completed' - provide detailed comparison and advice.",
      parameters: {
        type: "object",
        properties: {
          debts: {
            type: "array",
            description: "Array of debts with balance and interest rate",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                balance: { type: "number" },
                interestRate: { type: "number" },
                minPayment: { type: "number" }
              }
            }
          },
          extraPayment: {
            type: "number",
            description: "Extra monthly payment amount available"
          }
        },
        required: ["debts", "extraPayment"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_emergency_fund",
      description: "Calculate the ideal emergency fund size based on monthly expenses, income stability, and life situation. Provides detailed breakdown of 3-6 months of expenses, risk-adjusted recommendations, and actionable savings plan. Use when user asks 'How much should I keep in my emergency fund?' or mentions emergency savings.",
      parameters: {
        type: "object",
        properties: {
          monthlyExpenses: {
            type: "number",
            description: "User's monthly expenses in dollars"
          },
          incomeStability: {
            type: "string",
            enum: ["very_stable", "stable", "variable", "unstable"],
            description: "Income stability level. very_stable = salaried government/corporate, stable = salaried private sector, variable = freelance/commission, unstable = gig economy/seasonal"
          },
          dependents: {
            type: "number",
            description: "Number of financial dependents (children, elderly parents, etc.)"
          },
          hasInsurance: {
            type: "boolean",
            description: "Whether user has health/disability insurance"
          }
        },
        required: ["monthlyExpenses", "incomeStability"]
      }
    }
  }
];

/**
 * Get tools array for AI model function calling
 * Returns tool definitions in the format expected by OpenAI/Anthropic APIs
 */
export function getTwealthTools(): typeof TWEALTH_AI_TOOLS {
  return TWEALTH_AI_TOOLS;
}

/**
 * Get Twealth app feature list for AI identity/branding
 * Used in system prompts to help AI answer "what can Twealth do?"
 */
export function getTwealthFeatureList(): string {
  return `
**TWEALTH APP FEATURES YOU CAN HELP WITH:**

Core Actions:
- Create & track financial goals with progress monitoring
- Record transactions (income/expenses) with auto-categorization
- Set calendar reminders for financial events
- Create groups for shared budgeting (family, roommates, friends)
- Track cryptocurrency holdings & portfolio

Financial Planning:
- Budget creation & optimization (50/30/20 rule)
- Emergency fund calculation (3-6 months expenses)
- Debt payoff strategies (avalanche vs snowball)
- Retirement planning (4% rule, required savings)
- Portfolio allocation recommendations

Analysis & Insights:
- Spending pattern analysis by category
- Goal progress tracking with timeline projections
- Net worth projections with compound growth
- Luxury purchase affordability analysis
- Tax optimization strategies

Advanced Tools:
- Mortgage payment calculator with amortization
- Rent affordability using 30% rule
- Credit score improvement plans
- Investment comparison (rent vs buy, lease vs own)
- Future value projections with compound interest

Social & Collaboration:
- Share goals with friends & family
- Group budget management
- Friend invitation suggestions based on shared goals
`.trim();
}

/**
 * Get Twealth identity section for system prompts
 * Used to brand all AI models as "Twealth AI"
 */
export function getTwealthIdentity(): string {
  return `
You are **Twealth AI**, the intelligent financial advisor built into Twealth - a comprehensive wealth management platform that helps users take control of their finances.

${getTwealthFeatureList()}

**When users ask "what can Twealth do?" or "what are you?":**
- Introduce yourself as "I'm Twealth AI, your personal financial advisor"
- List 5-7 key capabilities (goals, transactions, budgeting, AI advice, crypto, etc.)
- Emphasize you can TAKE ACTIONS (create goals, log transactions, analyze finances)
- Mention the 4-model hybrid AI system (Scout for speed, Sonnet for reasoning, GPT-5 for math, Opus for CFO-level analysis)

**Your Tone:**
- Professional but friendly - like a knowledgeable friend who's also a CFO
- Proactive - suggest actions the user can take
- Data-driven - always provide specific numbers and calculations
- Action-oriented - use the available tools to help users achieve their financial goals
`.trim();
}

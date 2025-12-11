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
      description: "Create a financial goal IMMEDIATELY when user gives a command with target amount. JUST DO IT - no confirmation needed! Examples that should IMMEDIATELY create goal: 'Set a goal to buy a house for 5 million baht' → call with name='Buy House', targetAmount='5000000', targetDate=next year. 'I want to save $10000 by December' → call immediately. Only ask for details if amount is genuinely missing. For timeline: 'next year' = 1 year from now, 'in 2 years' = 2 years from now. ALWAYS set userConfirmed=true for any imperative command.",
      parameters: {
        type: "object",
        properties: {
          userConfirmed: {
            type: "boolean",
            description: "Always set to true for any goal creation command. The user's imperative statement IS their confirmation."
          },
          name: {
            type: "string",
            description: "Short goal name extracted from user request (e.g., 'Buy House', 'Emergency Fund', 'Vacation')"
          },
          targetAmount: {
            type: "string",
            description: "Target amount as number string. Convert currencies: 5 million baht = 5000000. Remove currency symbols."
          },
          targetDate: {
            type: "string",
            description: "Target date in YYYY-MM-DD format. Calculate: 'next year' = add 1 year, 'in X months' = add X months to today."
          },
          description: {
            type: "string",
            description: "Brief description of the goal"
          }
        },
        required: ["name", "targetAmount", "targetDate"]
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
      description: "Create a calendar event IMMEDIATELY when user gives a command. JUST DO IT! Examples: 'Remind me to pay rent next week' → create immediately. Calculate dates: 'next week' = 7 days, 'tomorrow' = 1 day, 'next month' = 30 days.",
      parameters: {
        type: "object",
        properties: {
          userConfirmed: {
            type: "boolean",
            description: "Always set to true for any event creation command."
          },
          title: {
            type: "string",
            description: "The event title"
          },
          date: {
            type: "string",
            description: "Date in YYYY-MM-DD format. Calculate relative dates from today."
          },
          description: {
            type: "string",
            description: "Event description"
          }
        },
        required: ["title", "date"]
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
  },

  // ========== ADVANCED DEBT OPTIMIZER ==========
  {
    type: "function",
    function: {
      name: "optimize_debt_payoff",
      description: "Advanced debt optimizer comparing Avalanche (highest interest first) vs Snowball (smallest balance first) strategies. Calculates detailed payoff schedules, total interest savings, payoff dates, and provides month-by-month breakdown. Use when user wants to optimize debt repayment or asks 'what's the best way to pay off my debt?'",
      parameters: {
        type: "object",
        properties: {
          debts: {
            type: "array",
            description: "Array of debts to optimize",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Debt name (e.g., 'Credit Card', 'Car Loan')" },
                balance: { type: "number", description: "Current balance in dollars" },
                interestRate: { type: "number", description: "Annual interest rate as percentage (e.g., 18.9 for 18.9%)" },
                minimumPayment: { type: "number", description: "Minimum monthly payment" }
              },
              required: ["name", "balance", "interestRate", "minimumPayment"]
            }
          },
          extraMonthlyBudget: {
            type: "number",
            description: "Extra money available per month beyond minimum payments"
          },
          includeSchedule: {
            type: "boolean",
            description: "Whether to generate detailed month-by-month payoff schedule"
          }
        },
        required: ["debts", "extraMonthlyBudget"]
      }
    }
  },

  // ========== INVESTMENT PROJECTOR ==========
  {
    type: "function",
    function: {
      name: "project_investment_growth",
      description: "Project investment growth with compound interest over time. Calculates future value with multiple scenarios (conservative/moderate/aggressive returns), includes inflation adjustment, and shows year-by-year breakdown. Use when user asks 'how much will my investment grow?' or wants retirement projections.",
      parameters: {
        type: "object",
        properties: {
          initialAmount: {
            type: "number",
            description: "Starting investment amount in dollars"
          },
          monthlyContribution: {
            type: "number",
            description: "Monthly contribution amount"
          },
          years: {
            type: "number",
            description: "Investment time horizon in years"
          },
          expectedReturn: {
            type: "number",
            description: "Expected annual return as percentage (e.g., 7 for 7%). If not provided, will show conservative/moderate/aggressive scenarios."
          },
          includeInflationAdjusted: {
            type: "boolean",
            description: "Whether to include inflation-adjusted (real) values assuming 3% inflation"
          }
        },
        required: ["initialAmount", "monthlyContribution", "years"]
      }
    }
  },

  // ========== WHAT-IF SCENARIO ANALYZER ==========
  {
    type: "function",
    function: {
      name: "analyze_financial_scenario",
      description: "Analyze 'what-if' financial scenarios comparing different choices. Examples: 'Should I pay off debt or invest?', 'Should I buy or rent?', 'Should I lease or buy a car?'. Provides detailed comparison with numbers, ROI, and clear recommendation.",
      parameters: {
        type: "object",
        properties: {
          scenarioType: {
            type: "string",
            enum: ["debt_vs_invest", "buy_vs_rent", "lease_vs_buy", "save_vs_spend", "early_retire", "custom"],
            description: "Type of scenario to analyze"
          },
          scenario1: {
            type: "object",
            description: "First option details",
            properties: {
              name: { type: "string", description: "Option name" },
              upfrontCost: { type: "number", description: "Initial cost" },
              monthlyCost: { type: "number", description: "Monthly cost/payment" },
              duration: { type: "number", description: "Duration in months" },
              returnRate: { type: "number", description: "Expected return or appreciation rate %" }
            }
          },
          scenario2: {
            type: "object",
            description: "Second option details",
            properties: {
              name: { type: "string", description: "Option name" },
              upfrontCost: { type: "number", description: "Initial cost" },
              monthlyCost: { type: "number", description: "Monthly cost/payment" },
              duration: { type: "number", description: "Duration in months" },
              returnRate: { type: "number", description: "Expected return or appreciation rate %" }
            }
          },
          additionalContext: {
            type: "string",
            description: "Additional context about user's situation"
          }
        },
        required: ["scenarioType"]
      }
    }
  },

  // ========== REAL-TIME MARKET DATA ==========
  {
    type: "function",
    function: {
      name: "get_stock_price",
      description: "Get real-time stock price and key metrics for any publicly traded company. Use when user asks about stock prices, market performance, or wants to analyze a specific stock. Returns current price, daily change, 52-week range, market cap, and P/E ratio.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Stock ticker symbol (e.g., 'AAPL', 'GOOGL', 'TSLA')"
          },
          includeAnalysis: {
            type: "boolean",
            description: "Whether to include brief analysis and key metrics"
          }
        },
        required: ["symbol"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_crypto_price",
      description: "Get real-time cryptocurrency price and market data. Use when user asks about Bitcoin, Ethereum, or other crypto prices. Returns current price in USD, 24h change, market cap, and trading volume.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Crypto symbol (e.g., 'BTC', 'ETH', 'BNB', 'SOL', 'XRP')"
          },
          includeTrend: {
            type: "boolean",
            description: "Whether to include 7-day and 30-day price trends"
          }
        },
        required: ["symbol"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_forex_rate",
      description: "Get current exchange rate between two currencies. Use when user asks about currency conversion or forex rates. Returns current rate, daily change, and conversion calculator.",
      parameters: {
        type: "object",
        properties: {
          fromCurrency: {
            type: "string",
            description: "Source currency code (e.g., 'USD', 'EUR', 'THB', 'GBP')"
          },
          toCurrency: {
            type: "string",
            description: "Target currency code"
          },
          amount: {
            type: "number",
            description: "Optional amount to convert"
          }
        },
        required: ["fromCurrency", "toCurrency"]
      }
    }
  },

  // ========== FINANCIAL HEALTH ASSESSMENT ==========
  {
    type: "function",
    function: {
      name: "assess_financial_health",
      description: "Generate comprehensive financial health assessment based on user's data. Calculates health score (0-100), identifies strengths and weaknesses, and provides prioritized action items. Use when user asks 'how am I doing financially?' or wants a financial checkup.",
      parameters: {
        type: "object",
        properties: {
          includeDetailedBreakdown: {
            type: "boolean",
            description: "Whether to include detailed breakdown of each health metric"
          },
          focusArea: {
            type: "string",
            enum: ["overall", "savings", "debt", "investing", "emergency_fund", "goals"],
            description: "Specific area to focus assessment on"
          }
        }
      }
    }
  },

  // ========== SPENDING PATTERN ANALYZER ==========
  {
    type: "function",
    function: {
      name: "analyze_spending_patterns",
      description: "Deep analysis of user's spending patterns over time. Identifies trends, anomalies, recurring expenses, and opportunities to save. Use when user asks 'where is my money going?' or wants spending insights.",
      parameters: {
        type: "object",
        properties: {
          timeframe: {
            type: "string",
            enum: ["last_month", "last_3_months", "last_6_months", "last_year"],
            description: "Time period to analyze"
          },
          focusCategory: {
            type: "string",
            description: "Specific category to deep-dive (e.g., 'dining', 'entertainment', 'shopping')"
          },
          compareToAverage: {
            type: "boolean",
            description: "Whether to compare spending to national/regional averages"
          }
        }
      }
    }
  },

  // ========== TAX OPTIMIZATION ==========
  {
    type: "function",
    function: {
      name: "calculate_tax_optimization",
      description: "Calculate tax optimization strategies including retirement contributions, deductions, and tax-efficient investment strategies. Estimates potential tax savings and provides actionable recommendations.",
      parameters: {
        type: "object",
        properties: {
          annualIncome: {
            type: "number",
            description: "Annual gross income in dollars"
          },
          filingStatus: {
            type: "string",
            enum: ["single", "married_filing_jointly", "married_filing_separately", "head_of_household"],
            description: "Tax filing status"
          },
          currentRetirementContribution: {
            type: "number",
            description: "Current annual retirement contribution (401k/IRA)"
          },
          hasHSA: {
            type: "boolean",
            description: "Whether user has access to HSA"
          },
          state: {
            type: "string",
            description: "State of residence (for state tax considerations)"
          }
        },
        required: ["annualIncome", "filingStatus"]
      }
    }
  },

  // ========== RETIREMENT READINESS ==========
  {
    type: "function",
    function: {
      name: "calculate_retirement_readiness",
      description: "Comprehensive retirement readiness calculator. Determines if user is on track for retirement, calculates required savings rate, and projects retirement income. Uses 4% rule and Monte Carlo simulation for accuracy.",
      parameters: {
        type: "object",
        properties: {
          currentAge: {
            type: "number",
            description: "Current age"
          },
          targetRetirementAge: {
            type: "number",
            description: "Desired retirement age"
          },
          currentSavings: {
            type: "number",
            description: "Current retirement savings (401k, IRA, etc.)"
          },
          monthlyContribution: {
            type: "number",
            description: "Current monthly retirement contribution"
          },
          desiredMonthlyIncome: {
            type: "number",
            description: "Desired monthly income in retirement (in today's dollars)"
          },
          expectedSocialSecurity: {
            type: "number",
            description: "Expected monthly Social Security benefit (optional)"
          }
        },
        required: ["currentAge", "targetRetirementAge", "currentSavings", "monthlyContribution"]
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
**TWEALTH AI - YOUR CFO-LEVEL FINANCIAL ADVISOR**

🎯 Core Actions:
- Create & track financial goals with smart progress monitoring
- Record transactions with intelligent auto-categorization
- Set reminders for bills, payments, and financial events
- Create groups for family/roommate shared budgeting
- Track cryptocurrency holdings with real-time pricing

📊 Proactive Insights (AI automatically detects):
- Spending spikes and category anomalies
- Goals at risk of missing deadlines
- Emergency fund gaps
- Debt payoff opportunities
- Achievement milestones (savings rate, net worth)

💰 Advanced Financial Planning:
- Debt optimizer: Avalanche vs Snowball with month-by-month schedules
- Investment projector: Multi-scenario compound growth calculations
- Retirement readiness: Monte Carlo simulation, 4% rule analysis
- Tax optimization: Contribution strategies, deduction maximization
- What-if scenarios: Rent vs Buy, Lease vs Own, Debt vs Invest

📈 Real-Time Market Intelligence:
- Stock prices with key metrics (P/E, market cap, 52-week range)
- Crypto prices with 24h/7d/30d trends
- Forex rates with live conversion
- Market context for investment decisions

🏦 Financial Health Assessment:
- Comprehensive health score (0-100)
- Savings rate analysis
- Debt-to-income ratio tracking
- Emergency fund months calculation
- Net worth tracking and projections

🔍 Spending Pattern Analysis:
- Month-over-month trend detection
- Category breakdown with percentages
- Anomaly detection (unusual spending)
- Personalized savings recommendations
`.trim();
}

/**
 * Get Twealth identity section for system prompts
 * Used to brand all AI models as "Twealth AI"
 */
export function getTwealthIdentity(): string {
  return `
You are **Twealth AI**, the most advanced AI financial advisor - a CFO-level intelligence that helps users master their finances with data-driven insights and proactive guidance.

${getTwealthFeatureList()}

**Your Intelligence Level:**
You are powered by a 4-model hybrid AI system that automatically selects the best model for each task:
- 🚀 Scout (Llama 4): Lightning-fast for quick questions and daily tasks
- 🧠 Sonnet (Claude): Deep reasoning for investment strategy and debt optimization
- 📐 GPT-5: Advanced math for projections, simulations, and compound calculations
- 👔 Opus (Claude): CFO-level analysis for major financial decisions

**When users ask "what can Twealth do?" or "what are you?":**
- Introduce yourself: "I'm Twealth AI - your personal CFO powered by 4 AI models"
- Highlight: "I proactively analyze your finances and alert you to opportunities and risks"
- Emphasize: "I can take actions - create goals, log transactions, calculate projections, and more"
- Mention: "I have access to real-time market data for stocks, crypto, and forex"

**Your Tone:**
- Expert but approachable - like having a brilliant CFO friend who genuinely cares
- Proactive - don't wait to be asked, offer insights based on the user's data
- Data-obsessed - always provide specific numbers, percentages, and calculations
- Action-oriented - use tools to help users achieve goals, don't just give advice
- Contextually aware - reference the user's actual financial situation in responses

**Proactive Behavior:**
- When you see concerning data (high spending, goals at risk), mention it naturally
- Suggest next steps after every interaction ("Would you like me to...")
- Use the user's analytics data to personalize every response
- Celebrate wins (savings milestones, debt payoffs, goals achieved)
`.trim();
}

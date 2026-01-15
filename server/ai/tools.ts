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
  {
    type: "function",
    function: {
      name: "create_budget_category",
      description: "Create or update a monthly budget limit for a spending category. IMMEDIATELY call this when user says things like 'Set my food budget to $500', 'I want to limit entertainment to $200/month', 'Create a budget for groceries at $400'. This helps track spending against limits and improve their Behavior score in the Twealth Index.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "The spending category to set budget for (e.g., 'food', 'dining', 'entertainment', 'shopping', 'transportation', 'groceries')"
          },
          monthlyLimit: {
            type: "number",
            description: "Monthly spending limit in dollars for this category"
          },
          alertThreshold: {
            type: "number",
            description: "Optional percentage (0-100) at which to alert user (e.g., 80 means alert at 80% spent). Defaults to 80."
          }
        },
        required: ["category", "monthlyLimit"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_user_profile",
      description: "Update user's financial profile with key information. Call this when user shares: monthly income ('I make $8000/month'), employment type ('I'm a freelancer'), age ('I'm 35'), or emergency fund target. This data improves Twealth Index accuracy and enables personalized advice.",
      parameters: {
        type: "object",
        properties: {
          monthlyIncome: {
            type: "number",
            description: "User's monthly gross income in dollars"
          },
          monthlyExpenses: {
            type: "number",
            description: "User's estimated monthly expenses"
          },
          emergencyFund: {
            type: "number",
            description: "Current emergency fund amount in dollars"
          },
          age: {
            type: "number",
            description: "User's age (for retirement projections)"
          },
          employmentType: {
            type: "string",
            enum: ["salaried", "freelance", "business_owner", "retired", "unemployed"],
            description: "Type of employment affecting income stability"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_recurring_expense",
      description: "Track a recurring expense or subscription. Call when user mentions subscriptions like 'I pay $15/month for Netflix', 'My gym membership is $50', 'rent is $2000/month'. This helps identify spending patterns and subscription creep.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the recurring expense (e.g., 'Netflix', 'Gym Membership', 'Rent')"
          },
          amount: {
            type: "number",
            description: "Amount per period in dollars"
          },
          frequency: {
            type: "string",
            enum: ["weekly", "monthly", "quarterly", "yearly"],
            description: "How often this expense recurs"
          },
          category: {
            type: "string",
            description: "Category for this expense (e.g., 'entertainment', 'fitness', 'housing')"
          },
          isEssential: {
            type: "boolean",
            description: "Whether this is an essential expense (rent, utilities) or discretionary (streaming, gym)"
          }
        },
        required: ["name", "amount", "frequency", "category"]
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
  },

  // ========== FIRE (Financial Independence) CALCULATOR ==========
  {
    type: "function",
    function: {
      name: "calculate_fire_number",
      description: "Calculate Financial Independence (FIRE) numbers including FI number, Coast FIRE, Lean FIRE, and Fat FIRE milestones. Uses the 4% safe withdrawal rate and provides detailed roadmap to financial independence. Use when user asks about 'FIRE', 'financial independence', 'early retirement', or 'when can I retire?'",
      parameters: {
        type: "object",
        properties: {
          annualExpenses: {
            type: "number",
            description: "Current annual living expenses in dollars"
          },
          currentAge: {
            type: "number",
            description: "User's current age"
          },
          currentSavings: {
            type: "number",
            description: "Current total invested assets (retirement + taxable)"
          },
          annualSavings: {
            type: "number",
            description: "Annual amount being saved/invested"
          },
          targetRetirementAge: {
            type: "number",
            description: "Traditional retirement age for Coast FIRE calculation (default 65)"
          },
          expectedReturn: {
            type: "number",
            description: "Expected annual investment return percentage (default 7%)"
          }
        },
        required: ["annualExpenses", "currentAge", "currentSavings", "annualSavings"]
      }
    }
  },

  // ========== INSURANCE NEEDS ANALYZER ==========
  {
    type: "function",
    function: {
      name: "analyze_insurance_needs",
      description: "Calculate life insurance, disability insurance, and umbrella liability insurance needs based on income, dependents, debts, and assets. Provides coverage recommendations with specific dollar amounts. Use when user asks about insurance needs, life insurance amount, or protecting their family.",
      parameters: {
        type: "object",
        properties: {
          annualIncome: {
            type: "number",
            description: "Annual gross income in dollars"
          },
          spouseIncome: {
            type: "number",
            description: "Spouse's annual income (0 if N/A)"
          },
          totalDebts: {
            type: "number",
            description: "Total outstanding debts (mortgage, loans, etc.)"
          },
          dependentsCount: {
            type: "number",
            description: "Number of financial dependents (children, elderly parents)"
          },
          youngestDependentAge: {
            type: "number",
            description: "Age of youngest dependent (for years of coverage calculation)"
          },
          currentLifeInsurance: {
            type: "number",
            description: "Current life insurance coverage amount"
          },
          hasDisabilityInsurance: {
            type: "boolean",
            description: "Whether user has disability insurance through employer"
          }
        },
        required: ["annualIncome", "totalDebts", "dependentsCount"]
      }
    }
  },

  // ========== ASSET LOCATION OPTIMIZER ==========
  {
    type: "function",
    function: {
      name: "optimize_asset_location",
      description: "Optimize asset location across tax-advantaged and taxable accounts for maximum tax efficiency. Determines which investments to hold in 401(k)/IRA vs taxable accounts. Uses tax-efficient fund placement principles. Use when user asks about 'where to hold investments', 'tax-efficient investing', or 'asset location'.",
      parameters: {
        type: "object",
        properties: {
          taxableAccountValue: {
            type: "number",
            description: "Value of taxable brokerage accounts"
          },
          traditionalRetirementValue: {
            type: "number",
            description: "Value of traditional 401(k)/IRA accounts"
          },
          rothAccountValue: {
            type: "number",
            description: "Value of Roth 401(k)/IRA accounts"
          },
          targetStockAllocation: {
            type: "number",
            description: "Target stock allocation percentage (e.g., 80 for 80% stocks)"
          },
          hasMuniBonds: {
            type: "boolean",
            description: "Whether to consider municipal bonds for taxable account"
          },
          marginalTaxRate: {
            type: "number",
            description: "User's marginal tax rate percentage"
          }
        },
        required: ["taxableAccountValue", "traditionalRetirementValue", "targetStockAllocation"]
      }
    }
  },

  // ========== ROTH CONVERSION ANALYZER ==========
  {
    type: "function",
    function: {
      name: "analyze_roth_conversion",
      description: "Analyze Roth IRA conversion strategies including Roth conversion ladder for early retirement, optimal conversion amounts based on tax brackets, and multi-year conversion planning. Use when user asks about 'Roth conversion', 'backdoor Roth', 'Roth ladder', or 'converting IRA to Roth'.",
      parameters: {
        type: "object",
        properties: {
          traditionalIRABalance: {
            type: "number",
            description: "Current traditional IRA/401(k) balance"
          },
          currentAnnualIncome: {
            type: "number",
            description: "Current annual taxable income"
          },
          filingStatus: {
            type: "string",
            enum: ["single", "married_filing_jointly", "married_filing_separately", "head_of_household"],
            description: "Tax filing status"
          },
          yearsUntilRetirement: {
            type: "number",
            description: "Years until planned retirement"
          },
          expectedRetirementIncome: {
            type: "number",
            description: "Expected annual income in retirement (excluding traditional IRA withdrawals)"
          },
          stateTaxRate: {
            type: "number",
            description: "State income tax rate percentage (0 for no state tax)"
          }
        },
        required: ["traditionalIRABalance", "currentAnnualIncome", "filingStatus", "yearsUntilRetirement"]
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
**TWEALTH AI - YOUR PERSONAL CFO & EXPERT FINANCIAL ADVISOR**

🎯 **Core Financial Actions:**
- Create & track financial goals with AI-powered progress monitoring
- Record transactions with intelligent auto-categorization  
- Set reminders for bills, payments, and financial events
- Create groups for family/roommate shared budgeting
- Track cryptocurrency holdings with real-time pricing
- **NEW:** Create budget categories with spending limits
- **NEW:** Track recurring expenses and subscriptions

📊 **Proactive AI Intelligence (Automatically Detects):**
- Spending spikes >20% and category anomalies
- Goals at risk of missing deadlines (with catch-up plans)
- Emergency fund gaps (<3 months warning)
- Debt payoff opportunities with interest savings
- Achievement milestones (celebrate wins!)
- Portfolio drift requiring rebalancing
- Tax-loss harvesting opportunities

💰 **Expert Financial Planning (CFP® Level):**
- Emergency fund calculator with income stability weighting
- Debt optimizer: Avalanche vs Snowball with detailed schedules
- Retirement readiness: 4% rule, Monte Carlo simulations
- FIRE calculator: FI number, Coast FIRE, Lean/Fat FIRE milestones
- Roth conversion analysis: Optimal conversion strategies
- Social Security optimization: Claiming age breakeven analysis
- Tax optimization: Asset location, Roth vs Traditional

📈 **Investment Analysis (CFA® Level):**
- Portfolio allocation with Modern Portfolio Theory
- Risk metrics: Sharpe ratio, Sortino ratio, max drawdown analysis
- Factor investing guidance: Size, value, momentum tilts
- Rebalancing alerts with tax-efficient execution guidance
- International diversification recommendations
- Alternative investments: REITs, commodities allocation

📈 **Real-Time Market Intelligence:**
- Stock prices with P/E, market cap, 52-week range
- Crypto prices with 24h/7d/30d trends
- Forex rates with live conversion
- Market context for informed decisions

🧠 **Behavioral Finance Protection:**
- Loss aversion awareness
- Recency bias correction
- FOMO/panic selling prevention
- Overconfidence checks

🏦 **Financial Health Dashboard:**
- Comprehensive health score (0-100) with breakdown
- Savings rate analysis with improvement targets
- Debt-to-income ratio monitoring
- Net worth tracking and projections
- Emergency fund months calculation
`.trim();
}

/**
 * Get Twealth identity section for system prompts
 * Used to brand all AI models as "Twealth AI"
 */
export function getTwealthIdentity(): string {
  return `
You are **Twealth AI**, the world's most advanced AI financial advisor - combining CFP® (Certified Financial Planner) and CFA® (Chartered Financial Analyst) level expertise with cutting-edge AI capabilities. You serve as a personal CFO who proactively guides users toward financial success.

${getTwealthFeatureList()}

---

## 🎓 YOUR EXPERT QUALIFICATIONS

**Certified Financial Planner (CFP®) Competencies:**
- Retirement planning: 4% rule, sequence of returns risk, Roth conversion ladders
- Tax optimization: Tax-loss harvesting, asset location, Roth vs Traditional analysis
- Estate planning: Beneficiary designations, trust considerations, gifting strategies
- Insurance analysis: Life, disability, liability coverage calculations
- Education planning: 529 plans, Coverdell ESAs, financial aid optimization
- Social Security: Optimal claiming strategies, spousal benefits, breakeven analysis

**Chartered Financial Analyst (CFA®) Investment Expertise:**
- Modern Portfolio Theory: Efficient frontier, diversification, correlation analysis
- Risk metrics: Sharpe ratio, Sortino ratio, max drawdown, beta, alpha
- Asset allocation: Strategic vs tactical, factor investing (size, value, momentum)
- Fixed income: Duration, convexity, yield curve analysis, credit risk
- Alternative investments: REITs, commodities, private equity considerations
- International diversification: Currency risk, developed vs emerging markets

**Behavioral Finance Awareness:**
You recognize and gently correct common cognitive biases:
- Loss aversion: "Losses feel 2x worse than equivalent gains"
- Anchoring bias: Past prices don't determine future value
- Recency bias: Recent performance ≠ future performance
- Mental accounting: Money is fungible - treat it consistently
- Overconfidence: Diversification beats stock-picking for most investors
- FOMO/panic selling: Emotions are the enemy of returns

---

## 🧠 YOUR INTELLIGENCE ARCHITECTURE

A 4-model hybrid AI system that auto-selects the best model for each task:
- 🚀 **Gemini Flash 2.0**: Lightning-fast for daily questions and quick calculations
- 🧠 **Claude Sonnet 4.5**: Deep reasoning for investment strategy and debt optimization  
- 📐 **GPT-5**: Advanced math for projections, Monte Carlo simulations, compound calculations
- 👔 **Claude Opus 4.1**: CFO-level analysis for major financial decisions ($50K+)

---

## 📊 EXPERT FINANCIAL FRAMEWORKS YOU APPLY

**The Financial Order of Operations:**
1. Emergency fund (1 month expenses minimum)
2. Employer 401(k) match (free money - NEVER leave on table)
3. High-interest debt payoff (>7% APR)
4. Emergency fund to 3-6 months
5. Max retirement accounts (401k, IRA)
6. HSA if available (triple tax advantage)
7. Taxable investing / Pay extra on mortgage

**FIRE Movement Analysis:**
- FI Number = Annual Expenses × 25 (based on 4% rule)
- Coast FIRE = Amount needed now to retire normally with $0 more saved
- Barista FIRE = Part-time work covers expenses, investments grow
- Lean FIRE = Minimal lifestyle, ~$40K/year expenses
- Fat FIRE = Full lifestyle, $100K+ year expenses

**Investment Policy Statement (IPS) Structure:**
- Risk tolerance assessment (time horizon, loss tolerance, income stability)
- Asset allocation targets with rebalancing bands (±5%)
- Tax-efficient fund placement (bonds in tax-advantaged, stocks in taxable)
- Withdrawal strategy in retirement (Roth conversion ladder, 72(t))

---

## 🚨 PROACTIVE INTELLIGENCE TRIGGERS

You automatically detect and alert for:
| Trigger | Your Response |
|---------|---------------|
| Spending spike >20% vs avg | Alert with category breakdown and budget impact |
| Emergency fund <3 months | High-priority recommendation with savings plan |
| Debt-to-income >36% | Critical alert with payoff strategies |
| Savings rate <15% | Improvement plan with specific dollar amounts |
| Goal behind schedule | Catch-up calculation with required increase |
| Portfolio drift >5% | Rebalancing recommendation |
| Tax-loss opportunity | Harvesting suggestion with wash sale warning |
| Approaching retirement | Sequence of returns risk discussion |

---

## 💬 EXPERT RESPONSE FORMAT

For complex questions, structure your response:

\`\`\`
[Concise executive summary - 1-2 sentences]

**Analysis:**
[Your expert CFP/CFA-level analysis with specific numbers]

---CALCULATION---
title: [Calculation name]
items:
- [Line item]: $[amount]
- *[Key insight]*: [highlighted value]
result: [Final result with dollar amount]

---INSIGHT---
type: [opportunity|warning|milestone]
title: [Brief insight title]
message: [Specific actionable insight based on their data]

---EXPERT-NOTE---
framework: [Framework used - e.g., Modern Portfolio Theory, 4% Rule]
assumptions: [Key assumptions made]
risks: [Potential downsides to consider]

---SUGGESTIONS---
1. [Strategic follow-up question]
2. [Alternative approach to explore]
3. [Proactive next step]
\`\`\`

---

## 🎯 YOUR CORE BEHAVIORS

1. **Expert but Approachable**: Use technical terms but explain them in plain English
2. **Data-Obsessed**: Always cite specific numbers, percentages, and projections
3. **Action-Oriented**: Use tools to execute, don't just advise
4. **Proactive**: Spot opportunities and risks before the user asks
5. **Bias-Aware**: Gently correct behavioral finance mistakes
6. **Personalized**: Reference the user's actual financial data in every response
7. **Comprehensive**: Consider tax implications, risk factors, and alternatives
8. **Humble**: Acknowledge uncertainty and recommend professional advice for complex situations

**When introducing yourself:**
"I'm Twealth AI - your personal CFO with CFP and CFA-level expertise, powered by 4 AI models. I proactively analyze your finances, execute actions, and provide institutional-grade insights. How can I help optimize your financial life today?"
`.trim();
}

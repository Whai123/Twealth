import Groq from "groq-sdk";
import crypto from 'crypto';
import { LUXURY_VEHICLES, findVehicle, calculateTotalOwnershipCost } from './luxuryAssets';
import { marketDataService } from './marketDataService';
import { taxService } from './taxService';
import { spendingPatternService } from './spendingPatternService';
import { systemPromptCache } from './services/systemPromptCache';
import { detectLanguage, calculateInvestmentPlans, calculateRealisticTimeline } from './financialCalculations';

// Using Groq with Llama 4 Scout (17B MoE) for fast, powerful CFO-level AI with native tool-use
const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY || "" 
});

// Cost optimization: In-memory cache for AI responses
interface CacheEntry {
  response: string;
  timestamp: number;
  tokenCount: number;
}

class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 1000;
  private hits = 0;
  private misses = 0;

  private generateCacheKey(message: string, context: Partial<UserContext>): string {
    // Create a stable hash for similar queries and contexts
    // CRITICAL: Include userId AND subscription tier to prevent cross-user/tier data leakage
    const normalizedMessage = message.toLowerCase().trim();
    const contextKey = JSON.stringify({
      userId: context.userId || 'anonymous', // User isolation - required for privacy
      tier: context.subscriptionTier || 'free', // Tier isolation - different advice per tier
      savingsRange: this.getSavingsRange(context.totalSavings || 0),
      incomeRange: this.getIncomeRange(context.monthlyIncome || 0),
      activeGoals: context.activeGoals || 0
    });
    return crypto.createHash('md5').update(normalizedMessage + contextKey).digest('hex');
  }

  private getSavingsRange(amount: number): string {
    if (amount < 1000) return 'low';
    if (amount < 10000) return 'medium';
    if (amount < 50000) return 'high';
    return 'very-high';
  }

  private getIncomeRange(amount: number): string {
    if (amount < 30000) return 'low';
    if (amount < 80000) return 'medium';
    if (amount < 150000) return 'high';
    return 'very-high';
  }

  get(message: string, context: Partial<UserContext>): string | null {
    const key = this.generateCacheKey(message, context);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    
    this.hits++;
    return entry.response;
  }

  set(message: string, context: Partial<UserContext>, response: string, tokenCount: number): void {
    const key = this.generateCacheKey(message, context);
    
    // Cleanup old entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      tokenCount
    });
  }

  getStats(): { size: number; hitRate: number; hits: number; misses: number; totalRequests: number } {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;
    
    return {
      size: this.cache.size,
      hitRate,
      hits: this.hits,
      misses: this.misses,
      totalRequests
    };
  }
}

const responseCache = new ResponseCache();

export interface UserContext {
  userId?: string;
  userName?: string; // User's first name for personalization
  subscriptionTier?: 'free' | 'pro' | 'enterprise'; // User's subscription tier for cache isolation
  totalSavings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  activeGoals: number;
  language?: string; // User's preferred language (en, es, id, th, pt, hi, vi, tl, ms, tr, ar)
  cryptoEnabled?: boolean; // Whether user has enabled crypto features
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced'; // User's financial experience level
  conversationMemory?: {
    financialPriorities?: string[];
    investmentPreferences?: string[];
    lifeEvents?: { event: string; timeframe?: string }[];
    spendingHabits?: string[];
    riskTolerance?: string;
    lastUpdated?: string;
  }; // User's conversation history and preferences
  impossibleGoalWarning?: string; // Backend pre-validation flag when goal is mathematically impossible
  recentTransactions: Array<{
    amount: number;
    category: string;
    description: string;
    date: string;
  }>;
  upcomingEvents: Array<{
    title: string;
    date: string;
    estimatedValue: number;
  }>;
  financialProfile?: {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
    totalSavings: number;
    savingsGoal: number;
    emergencyFund: number;
  };
  expenseCategories?: Array<{
    category: string;
    monthlyBudget: number;
  }>;
  debts?: Array<{
    name: string;
    balance: number; // Current amount owed (same as remainingAmount)
    originalAmount?: number; // Original total debt amount
    remainingAmount: number; // Current balance (alias for clarity)
    totalAmount: number; // Original or current balance for backward compatibility
    monthlyPayment: number;
    interestRate: number; // APR as percentage
    minimumPayment?: number;
  }>;
  assets?: Array<{
    name: string;
    type: string;
    value: number; // Current value
    currentValue: number; // Alias for clarity
    purchasePrice?: number; // Original purchase price
  }>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ToolCall {
  name: string;
  arguments: any;
}

// Define available tools for the AI agent
const TOOLS = [
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
      name: "project_future_value",
      description: "Calculate future value with compound interest ONLY when user asks about long-term growth projections. CRITICAL: After calling this tool, you MUST explain the power of compounding with specific numbers - show future value (nominal), inflation-adjusted real value, total invested, and total growth percentage. Demonstrate why starting early matters. NEVER just say 'Action completed'.",
      parameters: {
        type: "object",
        properties: {
          principal: {
            type: "number",
            description: "Starting amount"
          },
          monthlyContribution: {
            type: "number",
            description: "Monthly contribution amount"
          },
          annualReturn: {
            type: "number",
            description: "Expected annual return percentage (e.g., 8 for 8%)"
          },
          years: {
            type: "number",
            description: "Number of years to project"
          },
          inflationRate: {
            type: "number",
            description: "Annual inflation rate percentage (e.g., 3 for 3%)"
          }
        },
        required: ["principal", "monthlyContribution", "annualReturn", "years"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_retirement_needs",
      description: "Calculate retirement needs ONLY when user asks about retirement planning. CRITICAL: After calling this tool, you MUST explain the 4% rule, target amount needed (annual expenses × 25), required monthly savings, years to retirement, and whether they're on track. Include pro tips like 401(k) matching, Roth IRA benefits, and Social Security optimization. NEVER just say 'Action completed'.",
      parameters: {
        type: "object",
        properties: {
          currentAge: {
            type: "number",
            description: "Current age"
          },
          retirementAge: {
            type: "number",
            description: "Desired retirement age"
          },
          annualExpenses: {
            type: "number",
            description: "Expected annual expenses in retirement"
          },
          currentSavings: {
            type: "number",
            description: "Current retirement savings"
          }
        },
        required: ["currentAge", "retirementAge", "annualExpenses", "currentSavings"]
      }
    }
  },
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
      name: "analyze_luxury_purchase",
      description: "CALL IMMEDIATELY when user mentions luxury items: Lamborghini, Ferrari, Porsche, Tesla, McLaren, Bentley, Rolls Royce, mansion, yacht, private jet. Triggers: 'want to buy', 'wanna buy', 'afford', 'can I get', 'looking to purchase'. Provides: down payment (10%/20%/30%), financing (3/5/7yr), monthly cost, insurance, maintenance, depreciation, opportunity cost. MUST call this tool first, then explain results with user's income/savings context.",
      parameters: {
        type: "object",
        properties: {
          itemName: {
            type: "string",
            description: "Name of the luxury item (e.g., 'McLaren 765 LT', 'Beverly Hills Mansion', 'Yacht')"
          },
          purchasePrice: {
            type: "number",
            description: "Purchase price in dollars"
          },
          itemType: {
            type: "string",
            enum: ["vehicle", "real-estate", "luxury-item"],
            description: "Type of luxury purchase"
          }
        },
        required: ["itemName", "purchasePrice", "itemType"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_affordability",
      description: "Call for major purchase affordability questions. Calculates: debt-to-income ratio, max affordable price (2.5x annual income), savings timeline, emergency fund impact. After calling, explain with user's income/savings data. Triggers: 'can I afford', 'should I buy', 'is it responsible'.",
      parameters: {
        type: "object",
        properties: {
          purchasePrice: {
            type: "number",
            description: "Total purchase price in dollars"
          },
          userMonthlyIncome: {
            type: "number",
            description: "User's monthly income"
          },
          userMonthlySavings: {
            type: "number",
            description: "User's monthly savings amount"
          }
        },
        required: ["purchasePrice", "userMonthlyIncome", "userMonthlySavings"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "compare_financing_options",
      description: "Lease vs buy comparison for vehicles and major purchases. CRITICAL: After calling this tool, you MUST explain: 3-year lease costs with monthly payments, buy costs with financing (down payment + monthly payments), equity analysis (what you own vs owe), total cost comparison over 3/5 years, and pros/cons of each option. Provide clear recommendation based on user's financial situation. NEVER just say 'Action completed'.",
      parameters: {
        type: "object",
        properties: {
          itemName: {
            type: "string",
            description: "Name of the item (e.g., 'Tesla Model S', 'Porsche 911')"
          },
          purchasePrice: {
            type: "number",
            description: "Purchase price in dollars"
          },
          itemType: {
            type: "string",
            enum: ["vehicle", "real-estate", "luxury-item"],
            description: "Type of purchase"
          }
        },
        required: ["itemName", "purchasePrice", "itemType"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_spending_insights",
      description: "Call when user asks about spending patterns. Provides: top 3 categories with percentages/amounts, trends, budget warnings, actionable recommendations. After calling, explain with specific numbers. Triggers: 'analyze spending', 'where does my money go', 'spending review', 'budget analysis'.",
      parameters: {
        type: "object",
        properties: {
          transactionData: {
            type: "array",
            description: "Array of recent transactions to analyze",
            items: {
              type: "object",
              properties: {
                amount: { type: "number" },
                category: { type: "string" },
                description: { type: "string" },
                date: { type: "string" }
              }
            }
          },
          timeframe: {
            type: "string",
            enum: ["week", "month", "year"],
            description: "Time period to analyze"
          }
        },
        required: ["transactionData", "timeframe"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_goal_progress",
      description: "Track detailed progress toward a financial goal ONLY when user asks about goal status, progress tracking, or 'am I on track?'. CRITICAL: After calling this tool, you MUST explain: exact progress percentage with visual representation (e.g., '42% complete - almost halfway!'), money still needed with breakdown, months remaining vs months needed at current pace, on-track status with specific verdict (ahead by X months/on track/behind by X months), adjustment recommendations with exact numbers ('Increase contribution by $347/month to stay on track'), milestone achievements (25%/50%/75%/100% markers with dates). NEVER just say 'Action completed' - provide motivational progress update.",
      parameters: {
        type: "object",
        properties: {
          goalName: {
            type: "string",
            description: "Name of the financial goal (e.g., 'McLaren 765 LT', 'House Down Payment')"
          },
          targetAmount: {
            type: "number",
            description: "Target amount for the goal in dollars"
          },
          currentAmount: {
            type: "number",
            description: "Current amount saved toward goal in dollars"
          },
          targetDate: {
            type: "string",
            description: "Target completion date in YYYY-MM-DD format"
          },
          monthlyContribution: {
            type: "number",
            description: "Current monthly contribution amount in dollars"
          }
        },
        required: ["goalName", "targetAmount", "currentAmount", "targetDate", "monthlyContribution"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_net_worth_projection",
      description: "Project future net worth with compound growth ONLY when user asks about wealth building, long-term projections, or 'where will I be in X years?'. CRITICAL: After calling this tool, you MUST explain: current net worth baseline, 1-year projection with monthly breakdown, 5-year projection showing compound effect, 10-year projection demonstrating long-term wealth building, detailed breakdown of savings vs investment growth portions, specific recommendations to accelerate growth (increase savings rate by X%, invest Y% in stocks, reduce expenses by $Z). Show the power of compounding with actual numbers. NEVER just say 'Action completed'.",
      parameters: {
        type: "object",
        properties: {
          currentNetWorth: {
            type: "number",
            description: "Current total net worth in dollars"
          },
          monthlyIncome: {
            type: "number",
            description: "Monthly income in dollars"
          },
          monthlyExpenses: {
            type: "number",
            description: "Monthly expenses in dollars"
          },
          investmentReturn: {
            type: "number",
            description: "Expected annual investment return percentage (default 8%)",
            default: 8
          }
        },
        required: ["currentNetWorth", "monthlyIncome", "monthlyExpenses"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_budget_recommendations",
      description: "Generate smart budget optimization recommendations ONLY when user asks about budgeting help, spending optimization, or 'how should I allocate my money?'. CRITICAL: After calling this tool, you MUST explain: recommended budget allocation using 50/30/20 rule (50% needs, 30% wants, 20% savings) or custom allocation based on their specific goals, category-by-category breakdown with current vs recommended amounts and exact dollar differences, identified savings opportunities with specific amounts ('Reduce dining from $600 to $400 = $200/month saved'), specific actionable steps with numbers ('Cut subscription services by $50, redirect to emergency fund. Cancel gym membership $80, use free park workouts'). Tie recommendations to their stated financial goals. NEVER just say 'Action completed'.",
      parameters: {
        type: "object",
        properties: {
          monthlyIncome: {
            type: "number",
            description: "Monthly income in dollars"
          },
          currentSpending: {
            type: "object",
            description: "Current spending breakdown by category with amounts",
            additionalProperties: {
              type: "number"
            }
          },
          financialGoals: {
            type: "array",
            description: "Array of financial goals to optimize budget for",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                targetAmount: { type: "number" },
                monthlyContribution: { type: "number" }
              }
            }
          }
        },
        required: ["monthlyIncome", "currentSpending"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "suggest_group_invites",
      description: "Suggest which friends to invite to a financial group based on shared goals, interests, and financial collaboration potential. CRITICAL: After calling this tool, you MUST explain: why each friend is a good match (shared goals, similar financial timeline, complementary skills), specific collaboration opportunities ('Sarah has an investment goal too - you could share research and split index fund fees'), benefits of inviting each person with concrete examples, suggested roles ('Make David a contributor since he's experienced with budgeting'), specific invitation message suggestions. Provide personalized reasoning for each suggested friend. NEVER just say 'Action completed'.",
      parameters: {
        type: "object",
        properties: {
          groupName: {
            type: "string",
            description: "Name of the group to invite friends to"
          },
          groupPurpose: {
            type: "string",
            description: "Purpose of the group (e.g., 'Investment Club', 'Vacation Savings', 'Household Budget')"
          },
          availableFriends: {
            type: "array",
            description: "List of available friends with their financial interests",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                sharedGoals: {
                  type: "array",
                  items: { type: "string" },
                  description: "Financial goals they have in common with user"
                },
                financialInterests: {
                  type: "array",
                  items: { type: "string" },
                  description: "Their financial interests or expertise areas"
                }
              }
            }
          },
          maxInvites: {
            type: "number",
            description: "Maximum number of friends to suggest (default 5)",
            default: 5
          }
        },
        required: ["groupName", "groupPurpose", "availableFriends"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "suggest_savings_adjustment",
      description: "Analyze current budget and suggest optimal savings adjustments to accelerate goal achievement. CRITICAL: After calling this tool, you MUST explain: current savings rate vs optimal savings rate with exact percentages, specific categories to reduce with dollar amounts ('Reduce dining $200/month: cook 3 more meals/week at $15/meal savings'), reallocation strategy with exact numbers ('Redirect $200 dining savings + $100 entertainment cut = $300/month extra toward goal'), timeline improvement ('Reach goal 8 months faster with adjustments'), priority-based recommendations (cut wants before needs, maintain emergency fund), painless savings hacks with specific examples ('Use $50 cash-only for entertainment to avoid overspending'). Calculate exact impact on goals. NEVER just say 'Action completed'.",
      parameters: {
        type: "object",
        properties: {
          currentMonthlyIncome: {
            type: "number",
            description: "Current monthly income in dollars"
          },
          currentMonthlyExpenses: {
            type: "number",
            description: "Current monthly expenses in dollars"
          },
          spendingByCategory: {
            type: "object",
            description: "Breakdown of spending by category with amounts",
            additionalProperties: {
              type: "number"
            }
          },
          financialGoals: {
            type: "array",
            description: "Active financial goals to optimize savings for",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                targetAmount: { type: "number" },
                currentAmount: { type: "number" },
                targetDate: { type: "string" },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high"]
                }
              }
            }
          },
          desiredTimelineReduction: {
            type: "number",
            description: "How many months earlier user wants to achieve their goals (optional)"
          }
        },
        required: ["currentMonthlyIncome", "currentMonthlyExpenses", "financialGoals"]
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
  {
    type: "function",
    function: {
      name: "credit_score_improvement_plan",
      description: "Provide personalized credit score improvement strategies based on user's current situation. Covers payment history optimization, credit utilization tips, length of credit history, credit mix, and new credit inquiries. Use when user asks 'How can I increase my credit score?' or mentions credit building.",
      parameters: {
        type: "object",
        properties: {
          currentScore: {
            type: "number",
            description: "Current credit score (300-850 range). Optional - if unknown, provide general advice."
          },
          hasDebt: {
            type: "boolean",
            description: "Whether user has outstanding debt"
          },
          missedPayments: {
            type: "boolean",
            description: "Whether user has history of missed payments"
          },
          creditUtilization: {
            type: "number",
            description: "Credit utilization percentage (0-100). Optional."
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_rent_affordability",
      description: "Calculate how much user can afford to spend on rent using the 30% rule and 50/30/20 budget framework. Provides recommended rent range, breakdown of remaining budget for other expenses, and location-based affordability insights. Use when user asks 'How much should I spend on rent?' or mentions apartment hunting.",
      parameters: {
        type: "object",
        properties: {
          monthlyIncome: {
            type: "number",
            description: "User's monthly gross income in dollars"
          },
          otherDebts: {
            type: "number",
            description: "Other monthly debt obligations (car, student loans, credit cards) in dollars. Optional."
          },
          desiredLocation: {
            type: "string",
            description: "City or area user wants to live in. Optional - used for context only."
          }
        },
        required: ["monthlyIncome"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_mortgage_payment",
      description: "Calculate monthly mortgage payment with detailed amortization breakdown. Includes principal, interest, estimated property tax, insurance (PITI), PMI if applicable, and total cost analysis over loan lifetime. Use when user asks about home buying, mortgage affordability, or 'How much house can I afford?'",
      parameters: {
        type: "object",
        properties: {
          homePrice: {
            type: "number",
            description: "Purchase price of the home in dollars"
          },
          downPayment: {
            type: "number",
            description: "Down payment amount in dollars"
          },
          interestRate: {
            type: "number",
            description: "Annual interest rate as a percentage (e.g., 6.5 for 6.5%)"
          },
          loanTermYears: {
            type: "number",
            description: "Loan term in years (typically 15 or 30)"
          },
          propertyTaxRate: {
            type: "number",
            description: "Annual property tax rate as percentage of home value (e.g., 1.2 for 1.2%). Optional, defaults to 1.2%"
          },
          insuranceAnnual: {
            type: "number",
            description: "Annual homeowners insurance cost in dollars. Optional, defaults to $1200"
          }
        },
        required: ["homePrice", "downPayment", "interestRate", "loanTermYears"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "optimize_tax_strategy",
      description: "Analyze user's tax situation and provide optimization strategies including retirement account contributions, tax-loss harvesting opportunities, deduction maximization, and tax-efficient investment allocation. Use when user asks about taxes, deductions, or 'How can I reduce my tax bill?'",
      parameters: {
        type: "object",
        properties: {
          annualIncome: {
            type: "number",
            description: "Annual gross income in dollars"
          },
          filingStatus: {
            type: "string",
            enum: ["single", "married_joint", "married_separate", "head_of_household"],
            description: "Tax filing status"
          },
          hasRetirementAccount: {
            type: "boolean",
            description: "Whether user contributes to 401k/IRA"
          },
          currentRetirementContribution: {
            type: "number",
            description: "Annual retirement contribution amount in dollars. Optional."
          },
          hasInvestments: {
            type: "boolean",
            description: "Whether user has taxable investment accounts"
          }
        },
        required: ["annualIncome", "filingStatus"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_car_affordability",
      description: "Calculate comprehensive car affordability including purchase price limits, monthly payment options (financing vs. leasing), total cost of ownership (insurance, maintenance, fuel, depreciation), and impact on user's budget. Use the 20/4/10 rule: 20% down, 4-year loan max, 10% of gross income max payment. Call when user asks 'How much car can I afford?' or mentions buying/leasing a vehicle.",
      parameters: {
        type: "object",
        properties: {
          monthlyIncome: {
            type: "number",
            description: "User's monthly gross income in dollars"
          },
          downPayment: {
            type: "number",
            description: "Available down payment amount in dollars"
          },
          currentCarPayment: {
            type: "number",
            description: "Current car payment if trading in or existing loan. Optional, defaults to 0."
          },
          creditScore: {
            type: "string",
            enum: ["excellent", "good", "fair", "poor"],
            description: "Credit score range for interest rate estimation. Optional, defaults to 'good'."
          },
          preferredTerm: {
            type: "number",
            description: "Preferred loan term in years (3, 4, 5, or 6). Optional, defaults to 4."
          }
        },
        required: ["monthlyIncome", "downPayment"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "optimize_student_loan_payoff",
      description: "Analyze student loan repayment strategies comparing avalanche method, income-driven repayment, refinancing options, and forgiveness programs. Calculates total interest paid, payoff timeline, and monthly payment for each strategy. Use when user asks about student loans, loan forgiveness, or 'How should I pay off my student loans?'",
      parameters: {
        type: "object",
        properties: {
          totalBalance: {
            type: "number",
            description: "Total student loan balance in dollars"
          },
          averageInterestRate: {
            type: "number",
            description: "Weighted average interest rate as percentage (e.g., 6.5 for 6.5%)"
          },
          monthlyIncome: {
            type: "number",
            description: "Monthly gross income in dollars"
          },
          extraPayment: {
            type: "number",
            description: "Extra monthly amount available for loan payoff beyond minimum. Optional."
          },
          employerType: {
            type: "string",
            enum: ["public_service", "private_sector", "nonprofit", "government"],
            description: "Employer type for forgiveness program eligibility. Optional."
          }
        },
        required: ["totalBalance", "averageInterestRate", "monthlyIncome"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "compare_investment_options",
      description: "Compare different investment vehicles (index funds, bonds, HYSA, CDs, crypto) with detailed analysis of expected returns, risk levels, liquidity, tax implications, and recommendations based on user's goals and timeline. Use when user asks 'Should I invest in X or Y?' or 'Where should I put my money?'",
      parameters: {
        type: "object",
        properties: {
          investmentAmount: {
            type: "number",
            description: "Amount to invest in dollars"
          },
          timeHorizon: {
            type: "number",
            description: "Investment time horizon in years"
          },
          riskTolerance: {
            type: "string",
            enum: ["conservative", "moderate", "aggressive"],
            description: "User's risk tolerance level"
          },
          investmentGoal: {
            type: "string",
            description: "Investment goal (e.g., 'retirement', 'house down payment', 'emergency fund', 'wealth building')"
          },
          currentHoldings: {
            type: "string",
            description: "Brief description of current investments if any. Optional."
          }
        },
        required: ["investmentAmount", "timeHorizon", "riskTolerance", "investmentGoal"]
      }
    }
  }
];

export class TwealthAIService {
  private async buildSystemPrompt(context: UserContext, memoryContext?: string): Promise<string> {
    // Check system prompt cache first
    const cacheKey = {
      userId: context.userId || 'anonymous',
      monthlyIncome: context.monthlyIncome,
      monthlyExpenses: context.monthlyExpenses,
      totalSavings: context.totalSavings,
      activeGoals: context.activeGoals,
      language: context.language || 'en',
      cryptoEnabled: context.cryptoEnabled || false,
      experienceLevel: context.experienceLevel || 'beginner'
    };
    
    const cachedPrompt = systemPromptCache.get(cacheKey);
    if (cachedPrompt) {
      return cachedPrompt;
    }
    
    const savingsRate = ((context.monthlyIncome - context.monthlyExpenses) / context.monthlyIncome) * 100;
    const netWorth = context.totalSavings;
    const goals = context.activeGoals;
    const savingsCapacity = context.monthlyIncome - context.monthlyExpenses;
    const emergencyFund = context.monthlyExpenses * 6;
    const age = 30;
    const stockAllocation = Math.max(10, 110 - age);
    const today = new Date().toISOString().split('T')[0];
    
    const marketContext = await marketDataService.getMarketContextForAI('US');
    const taxContext = taxService.getTaxContextForAI(context.monthlyIncome, 'US');
    const spendingContext = context.recentTransactions.length > 0
      ? spendingPatternService.getSpendingPatternsForAI(context.recentTransactions as any)
      : '';
    
    const languageNames: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'id': 'Indonesian',
      'th': 'Thai',
      'pt': 'Portuguese',
      'hi': 'Hindi',
      'vi': 'Vietnamese',
      'tl': 'Filipino/Tagalog',
      'ms': 'Malay',
      'tr': 'Turkish',
      'ar': 'Arabic'
    };
    
    const userLanguage = context.language || 'en';
    const languageName = languageNames[userLanguage] || 'English';
    
    // Crypto & experience level context
    const cryptoContext = context.cryptoEnabled ? `
CRYPTOCURRENCY & ALTERNATIVE ASSETS:
- Client has enabled cryptocurrency features. Provide digital asset analysis including Bitcoin, Ethereum, stablecoins, and de-dollarization strategies.
- Experience Level: ${context.experienceLevel || 'beginner'}
${context.experienceLevel === 'beginner' ? '- Beginner-appropriate explanations: Bitcoin as store of value, basic portfolio diversification, risk fundamentals.' : ''}
${context.experienceLevel === 'intermediate' ? '- Intermediate-level analysis: DeFi protocols, stablecoin yield strategies, tax implications, risk-adjusted returns.' : ''}
${context.experienceLevel === 'advanced' ? '- Advanced strategies: Layer 2 scaling solutions, yield optimization, BTC/ETH portfolio weighting, macro-economic hedging, liquidity provision.' : ''}
- Multi-currency diversification: Analyze USD, BTC, EUR, CNY, gold allocation as sovereign currency risk mitigation.
- Global macro trends: Non-USD asset appreciation, BRICS monetary policy, Bitcoin as neutral reserve asset.
` : `
TRADITIONAL FINANCE SCOPE:
- Client has NOT enabled cryptocurrency features. Restrict analysis to traditional financial instruments.
- Permissible asset classes: Equities, fixed income, real estate, cash equivalents, commodities (excluding crypto).
- If client requests cryptocurrency guidance: Recommend enabling advanced features via Settings for expanded asset class coverage.
`;
    
    const userName = context.userName || 'there';
    const personalGreeting = context.userName ? `working with ${context.userName}` : 'helping you';
    
    // Build conversation memory context
    let memorySection = '';
    if (context.conversationMemory) {
      const mem = context.conversationMemory;
      const memoryPoints = [];
      
      if (mem.financialPriorities && mem.financialPriorities.length > 0) {
        memoryPoints.push(`Priorities: ${mem.financialPriorities.join(', ')}`);
      }
      if (mem.investmentPreferences && mem.investmentPreferences.length > 0) {
        memoryPoints.push(`Investment style: ${mem.investmentPreferences.join(', ')}`);
      }
      if (mem.lifeEvents && mem.lifeEvents.length > 0) {
        memoryPoints.push(`Upcoming milestones: ${mem.lifeEvents.map(e => `${e.event}${e.timeframe ? ` (${e.timeframe})` : ''}`).join(', ')}`);
      }
      if (mem.riskTolerance) {
        memoryPoints.push(`Risk tolerance: ${mem.riskTolerance}`);
      }
      if (mem.spendingHabits && mem.spendingHabits.length > 0) {
        memoryPoints.push(`Spending patterns: ${mem.spendingHabits.join(', ')}`);
      }
      
      if (memoryPoints.length > 0) {
        memorySection = `\n\nCONVERSATION CONTEXT FROM PREVIOUS SESSIONS:\n${memoryPoints.join('\n')}\nReference these details naturally in your advice. Maintain continuity by acknowledging past discussions.`;
      }
    }
    
    // Build the system prompt (combining core instructions with user context)
    // Enterprise-grade CFO assistant: Stripe/Coinbase/Apple quality standards
    const fullPrompt = `You are an enterprise-grade financial advisor providing institutional-quality analysis. Precise, data-driven, actionable. No casual language, no emojis, no marketing speak.

LANGUAGE MATCHING (CRITICAL - HIGHEST PRIORITY):
You MUST respond in the EXACT SAME LANGUAGE the user writes in. This is non-negotiable.
- If user writes in Thai → respond 100% in Thai
- If user writes in Spanish → respond 100% in Spanish
- If user writes in any language → respond 100% in that language
NEVER default to English unless the user writes in English.
The user's message language ALWAYS overrides any system preference.

LANGUAGE DETECTION RULES:
1. Thai (อ/ไ/่/ก/ข/ค): Respond fully in Thai. Use ฿ currency, terms: เงินออม/รายได้/ค่าใช้จ่าย/เป้าหมาย, products: RMF/SSF
2. Spanish (quiero/cómo/tengo): Respond fully in Spanish. Use $/€ currency, terms: ahorros/ingresos/gastos/meta
3. Chinese (我/你/的/是): Respond fully in Chinese. Use ¥ currency, terms: 储蓄/收入/支出/目标
4. Hindi (मैं/आप/रुपये): Respond fully in Hindi. Use ₹ currency, Indian financial products
5. Portuguese (você/quanto/quero): Respond fully in Portuguese. Use R$/€ currency
6. Indonesian (saya/berapa/anda): Respond fully in Indonesian. Use Rp currency
7. Vietnamese (tôi/bạn/tiền): Respond fully in Vietnamese. Use ₫ currency
8. Turkish (ben/para/ne): Respond fully in Turkish. Use ₺ currency
9. Tagalog (ako/pera/ko): Respond fully in Tagalog. Use ₱ currency
10. Malay (wang/saya/anda): Respond fully in Malay. Use RM currency
11. Arabic (ال/و/في): Respond fully in Arabic, RTL format
12. English: Respond fully in English. Use $ currency, USA products: 401k/IRA/HSA

EXAMPLE - User writes: "อยากซื้อรถ" 
CORRECT: "คุณต้องการซื้อรถใช่ไหม? ด้วยรายได้ของคุณ..."
WRONG: "You want to buy a car? With your income..."

User's app preference: ${languageName}. This is ONLY a fallback if language cannot be detected. Always match the user's actual message language first.

USER DATA (${today}):
Income: $${context.monthlyIncome.toLocaleString()}/mo | Expenses: $${context.monthlyExpenses.toLocaleString()}/mo | Savings Capacity: $${(context.monthlyIncome - context.monthlyExpenses).toLocaleString()}/mo
Net Worth: $${netWorth.toLocaleString()} | Savings Rate: ${!isNaN(savingsRate) && isFinite(savingsRate) ? savingsRate.toFixed(1) : 0}% | Goals: ${goals}
Emergency Fund: $${netWorth.toLocaleString()} / $${emergencyFund.toLocaleString()} | ${stockAllocation}% stocks/${100-stockAllocation}% bonds
${context.recentTransactions.length > 0 ? `Recent: ${context.recentTransactions.slice(0, 2).map(t => `$${t.amount} ${t.category}`).join(', ')}` : ''}

${context.financialProfile ? `
COMPREHENSIVE FINANCIAL PROFILE (Database - AUTHORITATIVE):
Monthly Income: $${context.financialProfile.monthlyIncome.toLocaleString()}
Monthly Expenses: $${context.financialProfile.monthlyExpenses.toLocaleString()}
Monthly Savings: $${context.financialProfile.monthlySavings.toLocaleString()}
Total Savings: $${context.financialProfile.totalSavings.toLocaleString()}
Savings Goal: $${context.financialProfile.savingsGoal.toLocaleString()}
Emergency Fund: $${context.financialProfile.emergencyFund.toLocaleString()}
→ USE THESE AUTHORITATIVE VALUES for all calculations. Do not estimate or guess.
` : ''}
${context.expenseCategories && context.expenseCategories.length > 0 ? `
EXPENSE BREAKDOWN (Real Data):
${context.expenseCategories.map(cat => `• ${cat.category}: $${cat.monthlyBudget.toLocaleString()}/mo`).join('\n')}
→ Use these category budgets when analyzing spending patterns or recommending budget adjustments.
` : ''}
${context.debts && context.debts.length > 0 ? `
OUTSTANDING DEBTS (Real Data):
${context.debts.map(debt => `• ${debt.name}: $${debt.balance.toLocaleString()} balance | $${debt.monthlyPayment.toLocaleString()}/mo @ ${debt.interestRate}% APR${debt.minimumPayment ? ` (min: $${debt.minimumPayment.toLocaleString()})` : ''}`).join('\n')}
Total Debt Payments: $${context.debts.reduce((sum, d) => sum + d.monthlyPayment, 0).toLocaleString()}/mo
→ Factor these debt obligations into all budget and savings recommendations. Prioritize high-interest debt payoff.
` : ''}
${context.assets && context.assets.length > 0 ? `
ASSETS (Real Data):
${context.assets.map(asset => `• ${asset.name} (${asset.type}): Current value $${asset.value.toLocaleString()}`).join('\n')}
Total Asset Value: $${context.assets.reduce((sum, a) => sum + a.value, 0).toLocaleString()}
→ Include these assets in net worth calculations and investment portfolio recommendations.
` : ''}
${cryptoContext}
${marketContext}
${taxContext}
${spendingContext}
${memoryContext || ''}

OPERATIONAL STANDARDS:
1. Data-driven analysis: Use client's exact financial data in every calculation. Zero generic advice.
2. ${context.monthlyIncome === 0 || context.monthlyExpenses === 0 || netWorth === 0 ? 'Data incomplete: Request income/expenses/savings, then save via tool for precision' : 'Complete profile available: Execute detailed quantitative analysis'}
3. Validation protocol: Flag anomalies (monthly income >$100k, expenses exceeding income). Verify before proceeding.
4. Feasibility analysis: When goal exceeds monthly capacity ($${(context.monthlyIncome - context.monthlyExpenses).toLocaleString()}/mo), provide multi-year timeline with milestone structure.
5. Investment modeling: Apply compound interest calculations. Present three scenarios: Conservative (4-5% annual return), Balanced (7-8%), Aggressive (10-12%).
6. Output format: Professional financial analysis. No emojis. No code blocks. No JSON syntax to end users.
7. Regional compliance: Apply jurisdiction-specific products (Thailand: RMF/SSF, USA: 401k/IRA/HSA).
8. Technical architecture: Tools execute silently. Users receive only natural language financial advice. Never expose function names, XML tags, or system syntax.

PROACTIVE TOOL EXECUTION (CRITICAL FOR SCOUT):
You MUST use tools immediately for these scenarios - NO exceptions:

LUXURY PURCHASE QUERIES (MANDATORY TOOL USE):
User: "I wanna buy a lambo" or "Can I afford a Ferrari?"
Your action: IMMEDIATELY call analyze_luxury_purchase(itemName="Lamborghini Huracán", purchasePrice=200000, itemType="vehicle")
Then respond: "I ran the numbers on a Lamborghini Huracán ($200K). You'd need $40K down and about $3,200/month for the loan. That's ${Math.round((3200 / context.monthlyIncome) * 100)}% of your $${context.monthlyIncome.toLocaleString()}/mo income. Plus insurance runs about $400/month and maintenance another $300/month. Over 5 years, total cost: $232K. With your current $${(context.monthlyIncome - context.monthlyExpenses).toLocaleString()}/mo savings capacity, [specific recommendation based on their financials - either 'this is doable if you prioritize it' or 'you'd need to increase income by $X first']."

TRANSACTION LOGGING (PAST TENSE = IMMEDIATE ACTION):
User: "I spent $50 on coffee today" or "I just paid $1200 for rent"
Your action: IMMEDIATELY call add_transaction(type="expense", amount="50", category="dining", description="Coffee", date="2025-11-05")
Then respond: "Got it, logged your $50 coffee expense. You've spent $[total] on dining this month. [If over budget: 'That's about $[X] over your usual budget - maybe cut back a bit?' OR if on track: 'You're on track with your dining budget.'] This brings your monthly savings down to $[exact amount]."

GOAL CREATION - WHEN TO CALL THE TOOL:

Rule 1 - COMPLETE IMPERATIVE COMMAND (Call tool immediately, no questions):
User says things like: "Create a goal to save $5000", "Save $5000 for vacation", "Make a $3000 fund"
→ Has amount? YES → CALL create_financial_goal immediately with calculated timeline
→ Response: "Done! I've set up your $5,000 vacation goal. You'll need about $417/month for 12 months..."

Rule 2 - INCOMPLETE IMPERATIVE COMMAND (Ask for missing info first):
User says: "Create a savings goal", "Start saving for vacation", "Make a goal for my wedding"
→ Has amount? NO → DON'T call tool yet. Ask: "I can set that up! What's your target amount?"
→ After they provide amount → THEN call create_financial_goal

Rule 3 - CASUAL DESIRE (Analyze, then ALWAYS ask to create):
User says: "I want to save $5000", "I need to save for vacation", or discusses retirement/savings goals
→ STEP 1: Analyze first (timeline options, feasibility, calculations)
→ STEP 2: **MANDATORY** - End your response with: "Want me to create this goal and track it?" or "Should I add this to your goals?"
→ STEP 3: If they say yes → THEN call create_financial_goal with userConfirmed=true

Example (Thai retirement goal):
User: "เราอยากจะมีเป้าหมายการออมและสถานการณ์ทางการเงินที่ดีกว่านี้" (Want savings goal and better financial situation)
You: [Provide detailed retirement analysis in Thai with calculations]
**CRITICAL: Must end with:** "คุณต้องการให้ฉันสร้างเป้าหมายนี้และติดตามความคืบหน้าให้ไหม?" (Want me to create this goal and track progress?)
→ If user confirms → call create_financial_goal with userConfirmed=true

CRITICAL: When calling create_financial_goal, calculate targetDate dynamically (e.g., 12 months from today = 2026-11-05). Never use a hard-coded date. ALWAYS set userConfirmed=true if user gave explicit confirmation.

SPENDING ANALYSIS:
User: "Analyze my spending" or "Where does my money go?"
Your action: IMMEDIATELY call generate_spending_insights with user's transaction data
Then respond: "Here's where your money is going: Dining ($800, 35%), Housing ($1,200, 52%), Transport ($300, 13%). Your dining is running about $200 higher than ideal for your income level. If you could cut that by $150/month - maybe 2-3 fewer restaurant meals - and move it to your emergency fund, you'd save an extra $1,800 this year. Want me to set up a dining budget to track this?"

DEBT MANAGEMENT:
User: "Help me pay off my credit card debt" or "Review my debt payments"
Your action: IMMEDIATELY call relevant debt tools (calculate_debt_payoff_strategy if available)
Then respond: "With your $5,000 credit card balance at 18% APR, you're paying about $75/month just in interest. Here are two strategies: Pay $500/month and you'll be debt-free in 11 months, saving $450 in interest. Or pay $300/month and finish in 19 months (saves $250). Based on your $${(context.monthlyIncome - context.monthlyExpenses).toLocaleString()}/mo savings capacity, the aggressive plan is doable and gets you out of debt faster."

INVESTMENT QUESTIONS:
User: "Should I invest in S&P 500?" or "How should I invest my money?"
Your action: IMMEDIATELY call investment comparison tools if available
Then respond: "The S&P 500 has historically returned about 10% per year. If you invested $10K today, you'd have around $16K in 5 years. Compare that to a high-yield savings account (4.5%, gets you $12.5K) or bonds (5%, gets you $13K). For your situation with ${context.totalSavings > 15000 ? 'a solid' : 'a growing'} emergency fund, I'd suggest: 70% S&P 500 index funds (VOO or VTI), 20% bonds (BND), 10% cash. That's moderate risk with good growth potential. Pro tip: Max out your Roth IRA first ($7K limit) for the tax benefits."

DIRECT LOGGING COMMANDS:
User: "Log $200 for groceries today" or "Record $50 coffee expense"
Your action: IMMEDIATELY call add_transaction(type="expense", amount="200", category="groceries", date="today")
Then respond: "Got it, logged $200 for groceries. You've spent $[total] on food this month, which is [X%] of your income. [If on track: 'Looking good!' OR if over: 'That's about $[X] over the typical $[recommended] budget for your income - might want to dial it back a bit.']"

NEVER ask "what details would you like?" or "tell me more" for ANY of these scenarios. User's income ($${context.monthlyIncome.toLocaleString()}/mo), expenses ($${context.monthlyExpenses.toLocaleString()}/mo), and savings ($${netWorth.toLocaleString()}) are sufficient. Execute tools FIRST, explain SECOND.

CRITICAL VALIDATION RULES (Enforced by system):
- Generic, tool-less responses to financial questions WILL BE REJECTED and replaced with fallback guidance
- When tool_choice="required", you MUST use at least one tool or your response will be discarded
- Success criteria: Every luxury purchase query, transaction logging request, spending analysis, or debt question MUST include tool execution
- Failure mode: If you respond with generic text when tools are required, users will receive a fallback message asking for clarification instead of your response
- Quality standard: CFO-level analysis with specific numbers from tool results - no shallow "save more" advice

RESPONSE TONE (Natural, helpful, conversational):
1. **Talk like a smart friend**: Be warm and encouraging while staying accurate with numbers
2. **Lead with the answer**: Start with the key conclusion, then explain why
3. **Show your work**: Include real calculations, not vague "save more" advice
4. **Be clear and specific**: Use exact amounts ($417/month) not fuzzy words ("more", "better")
5. **Keep it focused**: 3-5 sentences for simple questions, 6-8 for complex analysis
6. **Sound human**: Natural language, helpful tone. No emojis. Use "you" not "the client"
7. **Be proactive**: After answering, suggest the logical next step naturally

PROACTIVE NEXT STEPS (After answering, suggest logical follow-ups):
- After luxury purchase analysis → "Want me to create a savings goal for the down payment?"
- After transaction logging → "Should I analyze your spending patterns this month?"
- After goal creation → "Would you like a reminder to review progress in 30 days?"
- After debt strategy → "Ready to set up automatic payment tracking?"
- After investment comparison → "Should I create a portfolio allocation goal?"

RESPONSE QUALITY STANDARDS: Always include real numbers and specific advice. Example of GOOD response: "To save $40,000 in 18 months, you'll need to put away $2,222/month. With your current $${(context.monthlyIncome - context.monthlyExpenses).toLocaleString()}/mo savings capacity, that's achievable. I'd recommend splitting it: 70% in a high-yield savings account (4.5% APY, safe and liquid) and 30% in S&P 500 index funds (historical 10% return, higher growth potential). Just make sure your emergency fund is solid first - that's your safety net." Example of BAD response: "You should save more money and invest wisely." (too vague, no numbers, unhelpful)

CONFIDENCE SCORING (Include when giving recommendations):
For investment/strategy recommendations, indicate your confidence level:
- HIGH CONFIDENCE (90%+): Well-established strategies with historical data support (index fund diversification, emergency fund first, pay high-interest debt)
- MODERATE CONFIDENCE (70-89%): Sound strategies that depend on market conditions or personal factors
- EXPLORATORY (50-69%): Newer strategies, volatile assets, or highly personalized situations
Example: "I'm highly confident (90%) that paying off your 18% APR credit card should be your first priority - the math is clear."
Always explain WHY you have that confidence level briefly.

PROS AND CONS (For major decisions):
When recommending strategies for major financial decisions (investments >$5K, debt strategies, major purchases), briefly list:
- 2-3 key advantages (pros)
- 1-2 potential drawbacks (cons)
Example: "Roth IRA conversion: PROS - Tax-free growth, no RMDs, flexible withdrawals. CONS - Pay taxes now, 5-year rule on conversions."

ADAPTIVE EXPLANATIONS (Based on user expertise):
- BEGINNER users (asking "what is...?", simple questions, uncertain language): Explain concepts simply, avoid jargon, give more context
- INTERMEDIATE users (use terms like "401k", "index funds", "compound interest"): Balance explanation with efficiency
- ADVANCED users (mention ETFs, rebalancing, tax-loss harvesting, P/E ratios): Skip basics, focus on nuanced analysis and optimization

CLARIFYING QUESTIONS (Before complex recommendations):
For major financial decisions (investments >$10K, retirement planning, home buying), ask 1-2 clarifying questions BEFORE giving detailed advice:
- Timeline: "What's your target timeline for this goal?"
- Risk tolerance: "Are you comfortable with market fluctuations, or prefer stability?"
- Constraints: "Are there any restrictions I should know about (employer match, existing accounts)?"
DO NOT ask clarifying questions for simple questions (logging expenses, basic budgeting, small purchases).

EMOTIONAL INTELLIGENCE (Adapt tone based on user state):
- If user shows FINANCIAL STRESS (worried, anxious, overwhelmed, can't afford, behind on bills):
  → Be extra supportive and empathetic. Acknowledge the stress first.
  → Focus on small, achievable wins. Don't overwhelm with complex strategies.
  → Example: "I hear you - being behind on bills is stressful. Let's focus on one thing at a time."
- If user celebrates a WIN (paid off debt, reached goal, got raise):
  → Acknowledge and celebrate genuinely! This builds momentum.
  → Suggest the logical next step to capitalize on the win.
  → Example: "That's huge - paying off that credit card is a real accomplishment! Now let's put that $300/month payment toward your emergency fund."
- If user expresses UNCERTAINTY or CONFUSION:
  → Reassure them that financial decisions are complex for everyone.
  → Break down into simpler steps. Check understanding before moving on.

CONVERSATION CONTINUITY (Reference past advice):
If the REMEMBERED USER CONTEXT shows recent advice on a topic:
- Reference it briefly: "Last week we discussed your debt payoff strategy..."
- Check on progress: "How's that $500/month credit card payment going?"
- Maintain consistency: Don't contradict previous recommendations unless new information warrants it`;
    
    // Cache the full generated prompt for 1 hour (market data inside is already cached)
    systemPromptCache.set(cacheKey, fullPrompt);
    return fullPrompt;
  }

  private estimateTokenCount(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity check: count common words
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);
    
    return intersection.size / union.size;
  }

  private sanitizeResponse(text: string): string {
    // CRITICAL: Remove any JSON code blocks, raw JSON, or technical syntax from AI responses
    // Users should NEVER see internal tool call syntax, code, or system prompt echoing
    
    let sanitized = text;
    
    // 0. CRITICAL: Remove ONLY function/tool tags (surgical removal - preserve surrounding text)
    // Pattern 1: Remove <function>text</function> tags on their own line
    sanitized = sanitized.replace(/^<function[^>]*>.*?<\/function>\s*$/gim, '');
    
    // Pattern 2: Remove inline <function> tags but keep surrounding text
    sanitized = sanitized.replace(/<function[^>]*>.*?<\/function>/gi, '');
    
    // Pattern 3: Remove any orphaned tags
    sanitized = sanitized.replace(/<\/?function[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?tool[^>]*>/gi, '');
    
    // 1. Remove obvious system prompt echoing (very specific patterns only)
    // Only remove lines that are CLEARLY system instructions, not natural language
    sanitized = sanitized.replace(/^🚨🚨🚨.*$/gim, ''); // Triple warning emoji
    sanitized = sanitized.replace(/^(STOP!|MANDATORY:).*$/gim, ''); // Explicit instruction markers
    
    // 2. Remove code blocks (```...```) - AI shouldn't output code to users
    sanitized = sanitized.replace(/```[\s\S]*?```/g, '');
    
    // 3. Remove "Tool Call" section headers if AI mentions them
    sanitized = sanitized.replace(/^##?\s*Tool Calls?:?.*$/gim, '');
    
    // 4. Clean up whitespace
    sanitized = sanitized.trim();
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
    
    // Emergency fallback: if sanitized text is too short, AI likely returned only tool calls
    if (sanitized.length < 20) {
      console.error('CRITICAL: AI response too short after sanitization!');
      console.error('Original length:', text.length, 'chars');
      console.error('Sanitized length:', sanitized.length, 'chars');
      console.error('Original (first 1000 chars):', text.substring(0, 1000));
      console.error('After sanitization:', sanitized);
      
      // Return a more helpful fallback that still provides value
      return "I'm analyzing your financial situation. Based on your profile, I can help you create a detailed plan with specific numbers and timelines. What specific aspect would you like to focus on first - saving strategy, timeline, or investment approach?";
    }
    
    return sanitized;
  }

  async generateAdvice(
    userMessage: string, 
    context: UserContext, 
    conversationHistory: ChatMessage[] = [],
    memoryContext?: string
  ): Promise<{ response: string; toolCalls?: ToolCall[] }> {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API key not configured');
    }

    // AUTO-DETECT LANGUAGE from user message (override profile setting)
    const detectedLanguage = detectLanguage(userMessage);
    if (detectedLanguage !== context.language) {
      context = { ...context, language: detectedLanguage };
    }

    // ANTI-LOOP PROTECTION: Check if AI is repeating itself
    if (conversationHistory.length >= 2) {
      const lastTwoAssistantMsgs = conversationHistory
        .slice(-4)
        .filter(m => m.role === 'assistant')
        .map(m => m.content)
        .slice(-2);
      
      if (lastTwoAssistantMsgs.length === 2) {
        const [prevMsg, lastMsg] = lastTwoAssistantMsgs;
        // Check if messages are very similar (>80% overlap)
        const similarity = this.calculateSimilarity(prevMsg, lastMsg);
        if (similarity > 0.8) {
          // Add context to break the AI loop
          userMessage = `[IMPORTANT: Do NOT repeat your previous response. User's actual message: "${userMessage}". Provide a DIFFERENT, more specific answer with NEW details and actionable steps.]`;
        }
      }
    }

    // Check cache first (only for non-tool-using queries)
    const cachedResponse = responseCache.get(userMessage, context);
    if (cachedResponse && conversationHistory.length < 2) {
      return { response: cachedResponse };
    }

    try {
      const systemPrompt = await this.buildSystemPrompt(context, memoryContext);
      
      // Build messages array
      const messages: any[] = [
        { role: "system", content: systemPrompt }
      ];

      // SMART CONVERSATION MEMORY: Optimize context window for quality + performance
      // Keep last 8 messages (4 turns) for immediate context, prioritizing tool-using exchanges
      const recentHistory = conversationHistory.slice(-8);
      
      // If we have older important context (e.g., goal creation, major decisions), include it
      const olderImportantMessages = conversationHistory.slice(0, -8).filter(msg => 
        msg.role === 'assistant' && (
          msg.content.includes('created') || 
          msg.content.includes('Goal:') ||
          msg.content.includes('Strategy:') ||
          msg.content.includes('Analysis complete')
        )
      ).slice(-2); // Keep max 2 older important messages
      
      // Add older important messages first, then recent history
      [...olderImportantMessages, ...recentHistory].forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });

      // Add current user message
      messages.push({ role: "user", content: userMessage });

      // Detect confirmation keywords in user message (multi-language support)
      const lowerMsg = userMessage.toLowerCase();
      
      // Standard confirmation words
      const confirmationWords = ['yes', 'add it', 'create it', 'sure', 'do it', 'make it', 'set it', 'please', 'go ahead', 'ok', 'yeah', 'yep'];
      const isConfirmation = confirmationWords.some(word => lowerMsg.includes(word));
      
      // BALANCED: Enable tool for goal-related commands, let Scout ask for missing details
      // Command verbs indicating user wants action
      const commandVerbs = ['create', 'make', 'add', 'set', 'setup', 'set up', 'start', 'begin', 'put aside'];
      
      // Goal indicators (explicit goal nouns only)
      const goalIndicators = ['goal', 'fund', 'target'];
      
      const hasCommandVerb = commandVerbs.some(verb => lowerMsg.includes(verb));
      const hasGoalIndicator = goalIndicators.some(indicator => lowerMsg.includes(indicator));
      
      // Special case: "save/saving for X" is always a savings goal (with or without amount)
      // Catches: "Save $5000 for vacation", "Start saving for a car", "Saving for my wedding"
      const isSavingsCommand = (lowerMsg.includes('save for') || lowerMsg.includes('saving for') || 
                               lowerMsg.includes('save to') || lowerMsg.includes('saving to')) ||
                               ((lowerMsg.includes('save') || lowerMsg.includes('saving')) && 
                               /\$\d+|\d+\s*dollars?/.test(lowerMsg));
      
      // Negative filters: Prevent false positives
      const isAccountUpdate = (lowerMsg.includes('my savings') || lowerMsg.includes('savings account') || 
                              lowerMsg.includes('current savings') || lowerMsg.includes('savings balance')) &&
                              !lowerMsg.includes('goal') && !lowerMsg.includes('fund');
      const isDebtRelated = (lowerMsg.includes('debt') || lowerMsg.includes('loan') || 
                           lowerMsg.includes('payoff') || lowerMsg.includes('pay off')) &&
                           !lowerMsg.includes('savings goal') && !lowerMsg.includes('save');
      const isBudgetOnly = lowerMsg.includes('budget') && !lowerMsg.includes('goal') && !lowerMsg.includes('fund');
      
      // Confirmation phrases (after AI asks "want me to create this goal?")
      const confirmationPhrases = [
        'add it', 'make that', 'do it', 'go ahead', 'yes', 'sure', 'ok', 'yeah', 'yep',
        'เพิ่ม', 'เพิ่มเป้าหมาย', 'añadir', 'agregar', 'crear',
        'adicionar', 'adicione', 'criar', 'tambah', 'tambahkan', 'buat',
        'thêm', 'thêm mục tiêu', 'tạo', 'magdagdag', 'idagdag', 'gumawa',
        'ekle', 'hedef ekle', 'oluştur', 'أضف', 'اضف', 'أضف هدف', 'انشئ'
      ];
      const hasConfirmationPhrase = confirmationPhrases.some(phrase => lowerMsg.includes(phrase));
      
      // Enable tool access when: (command + goal indicator) OR (savings + amount) OR confirmation
      // Block tool access for: account updates, debt (unless savings-related), budget-only
      const isImperativeAction = !isAccountUpdate && !isDebtRelated && !isBudgetOnly && (
        (hasCommandVerb && hasGoalIndicator) ||
        isSavingsCommand ||  // "Save $5000 for vacation"
        hasConfirmationPhrase
      );
      
      // Detect desire/intention statements requiring analysis or action
      const desireAnalysisNeeded = (
        // Purchase desires (general)
        (lowerMsg.includes('want') || lowerMsg.includes('wanna') || lowerMsg.includes('need') || lowerMsg.includes('looking to') || lowerMsg.includes('thinking about')) &&
        (lowerMsg.includes('buy') || lowerMsg.includes('purchase') || lowerMsg.includes('get') || lowerMsg.includes('afford') || lowerMsg.includes('acquiring'))
      ) || (
        // Luxury items (instant trigger for analysis)
        lowerMsg.includes('lamborghini') || lowerMsg.includes('lambo') ||
        lowerMsg.includes('ferrari') || lowerMsg.includes('porsche') || 
        lowerMsg.includes('mclaren') || lowerMsg.includes('bentley') ||
        lowerMsg.includes('rolls royce') || lowerMsg.includes('rolls-royce') ||
        lowerMsg.includes('tesla') || lowerMsg.includes('mansion') ||
        lowerMsg.includes('yacht') || lowerMsg.includes('private jet')
      ) || (
        // Saving desires
        (lowerMsg.includes('save') || lowerMsg.includes('saving')) &&
        (lowerMsg.includes('for') || lowerMsg.includes('to') || lowerMsg.includes('want'))
      ) || (
        // Investment desires
        (lowerMsg.includes('invest') || lowerMsg.includes('investing') || lowerMsg.includes('investment')) &&
        (lowerMsg.includes('in') || lowerMsg.includes('want') || lowerMsg.includes('should i') || lowerMsg.includes('portfolio'))
      ) || (
        // Budget/spending analysis
        (lowerMsg.includes('budget') || lowerMsg.includes('spending') || lowerMsg.includes('expenses')) &&
        (lowerMsg.includes('analyze') || lowerMsg.includes('review') || lowerMsg.includes('check') || lowerMsg.includes('where'))
      ) || (
        // Debt management
        (lowerMsg.includes('debt') || lowerMsg.includes('loan') || lowerMsg.includes('credit card') || lowerMsg.includes('pay off')) &&
        (lowerMsg.includes('help') || lowerMsg.includes('strategy') || lowerMsg.includes('plan') || lowerMsg.includes('manage'))
      );
      
      // Check if last assistant message was asking for confirmation
      const lastAssistantMsg = conversationHistory.slice().reverse().find(m => m.role === 'assistant')?.content || '';
      const wasAskingForConfirmation = lastAssistantMsg.includes('Want me to') || 
                                       lastAssistantMsg.includes('Should I') || 
                                       lastAssistantMsg.includes('add this as a') ||
                                       lastAssistantMsg.includes('Would you like') ||
                                       lastAssistantMsg.includes('ต้องการให้') || // Thai: Want me to
                                       lastAssistantMsg.includes('คุณต้องการ') || // Thai: Do you want
                                       (lastAssistantMsg.includes('create') && lastAssistantMsg.includes('?')) ||
                                       (lastAssistantMsg.includes('goal') && lastAssistantMsg.includes('?'));
      
      // Enable creation tools if:
      // 1. User confirms after being asked, OR
      // 2. User gives imperative command (direct action request)
      const canCreate = (isConfirmation && wasAskingForConfirmation) || isImperativeAction;
      
      // Check if message indicates need for transaction/crypto tracking (immediate actions)
      // Only trigger for PAST tense actions, NOT future intentions
      const needsImmediateAction = (
        (lowerMsg.includes('spent') || lowerMsg.includes('paid') || 
         lowerMsg.includes('received') || lowerMsg.includes('earned') ||
         lowerMsg.includes('bought') || lowerMsg.includes('purchased') ||
         lowerMsg.includes('got paid') || lowerMsg.includes('made money') ||
         lowerMsg.includes('rent') || lowerMsg.includes('rented')) &&  // Added rent/rented
        !lowerMsg.includes('want to') && !lowerMsg.includes('going to') && 
        !lowerMsg.includes('plan to') && !lowerMsg.includes('will') &&
        !lowerMsg.includes('thinking about') && !lowerMsg.includes('if i')
      ) || (
        // Crypto transactions
        lowerMsg.includes('bought') && 
        (lowerMsg.includes('btc') || lowerMsg.includes('crypto') || lowerMsg.includes('bitcoin') || lowerMsg.includes('ethereum')) &&
        !lowerMsg.includes('want to') && !lowerMsg.includes('going to')
      ) || (
        // Specific spending phrases requiring immediate logging
        (lowerMsg.includes('i spent') || lowerMsg.includes('i paid') || 
         lowerMsg.includes('i bought') || lowerMsg.includes('just spent') ||
         lowerMsg.includes('just paid') || lowerMsg.includes('just bought') ||
         lowerMsg.includes('i rent') || lowerMsg.includes('i rented'))  // Added rent phrases
      ) || (
        // Direct transaction logging commands - CRITICAL: Added "add" for "add it to transaction"
        (lowerMsg.includes('log') || lowerMsg.includes('record') || lowerMsg.includes('track') || 
         lowerMsg.includes('add') || lowerMsg.includes('create')) &&  // Added "add" and "create"
        (lowerMsg.includes('expense') || lowerMsg.includes('income') || 
         lowerMsg.includes('transaction') || lowerMsg.includes('purchase') ||
         lowerMsg.includes('it to') || lowerMsg.includes('this to') ||  // "add it to transaction", "add this to transaction"
         /\$\d+/.test(lowerMsg) || /\d+\s*dollars?/.test(lowerMsg)) // Contains "$50" or "50 dollars"
      ) || (
        // Debt payment tracking
        (lowerMsg.includes('paid off') || lowerMsg.includes('paid down') || lowerMsg.includes('payment on')) &&
        (lowerMsg.includes('debt') || lowerMsg.includes('loan') || lowerMsg.includes('credit'))
      );

      // Filter tools based on context
      const availableTools = canCreate 
        ? TOOLS  // All tools available if confirming
        : TOOLS.filter(t => !['create_financial_goal', 'create_calendar_event', 'create_group'].includes(t.function.name));
      
      // Calculate tool_choice based on trigger detection
      const toolChoiceMode = (needsImmediateAction || desireAnalysisNeeded) ? "required" : "auto";
      
      // DYNAMIC TEMPERATURE: Optimize creativity vs. precision based on query type
      const temperature = (() => {
        // Lower temp (0.6) for calculation-heavy queries requiring precision
        if (lowerMsg.includes('calculate') || lowerMsg.includes('how much') || 
            lowerMsg.includes('afford') || lowerMsg.includes('pay off') ||
            /\$\d+/.test(lowerMsg)) {
          return 0.6; // Precise calculations
        }
        // Medium temp (0.7) for general financial questions
        if (lowerMsg.includes('should i') || lowerMsg.includes('is it') || 
            lowerMsg.includes('which') || lowerMsg.includes('better')) {
          return 0.7; // Balanced reasoning
        }
        // Higher temp (0.8) for creative advice and strategy
        if (lowerMsg.includes('strategy') || lowerMsg.includes('plan') || 
            lowerMsg.includes('advice') || lowerMsg.includes('recommend')) {
          return 0.8; // Creative strategic thinking
        }
        return 0.75; // Default balanced temperature
      })();
      
      const response = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",  // Llama 4 Scout - 17B MoE with native tool-use support
        messages: messages,
        tools: availableTools,
        tool_choice: toolChoiceMode,
        temperature: temperature,  // Dynamic temperature: 0.6 (precision) to 0.8 (strategy)
        max_tokens: 4096,  // Maximum for comprehensive CFO-level analysis
        top_p: 0.9  // More focused sampling for precise financial advice
      });
      
      const assistantMessage = response.choices[0]?.message;
      
      if (!assistantMessage) {
        throw new Error('No response from AI');
      }

      // Helper to coerce tool parameters to correct types (fix Groq type mismatch)
      const coerceToolParams = (toolName: string, args: any) => {
        if (toolName === 'create_financial_goal') {
          return {
            ...args,
            // Coerce "true"/"false" strings to boolean
            userConfirmed: args.userConfirmed === 'true' || args.userConfirmed === true,
            // Coerce numeric strings to numbers
            targetAmount: typeof args.targetAmount === 'string' 
              ? parseFloat(args.targetAmount.replace(/[$,]/g, '')) 
              : args.targetAmount
          };
        }
        return args;
      };

      // Check if AI wants to use tools
      const toolCalls = assistantMessage.tool_calls?.map(tc => {
        const rawArgs = JSON.parse(tc.function.arguments);
        return {
          name: tc.function.name,
          arguments: coerceToolParams(tc.function.name, rawArgs)
        };
      });

      let text = assistantMessage.content || '';
      
      // CRITICAL: Strip any JSON code blocks or raw tool calls from response
      // Users should NEVER see technical JSON or code syntax
      text = this.sanitizeResponse(text);
      
      // Cache only if no tools were used
      if (!toolCalls || toolCalls.length === 0) {
        const tokenCount = this.estimateTokenCount(systemPrompt + userMessage + text);
        
        // RESPONSE QUALITY VALIDATION: Enforce fallback if Scout should have used tools but didn't
        if (needsImmediateAction || desireAnalysisNeeded) {
          
          // ENFORCED FALLBACK: Provide structured response when Scout fails to use tools
          let fallbackResponse = '';
          const lowerMsg = userMessage.toLowerCase();
          
          if (lowerMsg.includes('lambo') || lowerMsg.includes('ferrari') || lowerMsg.includes('porsche') || 
              lowerMsg.includes('luxury') || lowerMsg.includes('mansion') || lowerMsg.includes('yacht')) {
            // Luxury purchase fallback
            fallbackResponse = `I need to run a comprehensive affordability analysis for this purchase. Based on your current financial profile (income: $${context.monthlyIncome.toLocaleString()}/mo, available savings capacity: $${(context.monthlyIncome - context.monthlyExpenses).toLocaleString()}/mo), I'll calculate down payment options, financing terms, total cost of ownership, and opportunity cost. Let me analyze this properly with the specific vehicle details and provide you with a complete CFO-level breakdown. What's the exact model and approximate price you're considering?`;
          } else if (lowerMsg.includes('spent') || lowerMsg.includes('paid') || lowerMsg.includes('bought') ||
                     lowerMsg.includes('log') || lowerMsg.includes('record')) {
            // Transaction logging fallback
            fallbackResponse = `I should log this transaction for you. To ensure accurate tracking, could you confirm: (1) The exact amount, (2) What category this falls under (groceries, dining, transport, etc.), and (3) When this expense occurred? This will help me track your spending patterns and provide budget insights.`;
          } else if (lowerMsg.includes('budget') || lowerMsg.includes('spending') || lowerMsg.includes('where')) {
            // Spending analysis fallback
            fallbackResponse = `I need to analyze your spending patterns to provide actionable insights. Based on your recent transactions, I'll show you: top spending categories with percentages, budget warnings for overspending areas, and specific recommendations to optimize your $${context.monthlyIncome.toLocaleString()}/mo income. Let me pull that data now.`;
          } else if (lowerMsg.includes('debt') || lowerMsg.includes('loan') || lowerMsg.includes('credit')) {
            // Debt management fallback
            fallbackResponse = `I should create a debt payoff strategy for you. To provide the most accurate plan, I'll need: (1) Total debt amount, (2) Interest rate (APR), and (3) Minimum monthly payment. With your current savings capacity of $${(context.monthlyIncome - context.monthlyExpenses).toLocaleString()}/mo, I can calculate aggressive vs. balanced payoff strategies.`;
          } else {
            // Generic financial analysis fallback
            fallbackResponse = `Let me analyze this properly with your financial data. Your current profile: $${context.monthlyIncome.toLocaleString()}/mo income, $${context.monthlyExpenses.toLocaleString()}/mo expenses, $${context.totalSavings.toLocaleString()} total savings. I'll provide specific calculations and recommendations. Could you clarify what specific analysis you'd like me to run?`;
          }
          
          return { response: fallbackResponse, toolCalls: undefined };
        }
        
        // Cache normal responses (when tools weren't expected)
        responseCache.set(userMessage, context, text, tokenCount);
      }
      
      return { response: text, toolCalls };
    } catch (error: any) {
      // Log error for monitoring (minimal, not verbose)
      console.error('[AI Service Error]', {
        type: error.constructor?.name,
        code: error.code || error.status,
        message: error.message?.substring(0, 100)
      });
      
      // GRACEFUL DEGRADATION: If Groq rejected due to tool_use_failed, extract generated text
      if (error?.error?.error?.failed_generation) {
        const failedText = error.error.error.failed_generation;
        const tokenCount = this.estimateTokenCount(userMessage + failedText);
        responseCache.set(userMessage, context, failedText, tokenCount);
        return { response: failedText, toolCalls: undefined };
      }
      
      // FALLBACK RESPONSE: Provide helpful response when AI fails due to transient errors
      const isRateLimited = error.status === 429 || error.code === 429 || 
                           error.message?.includes('rate limit');
      const isTimeout = error.message?.includes('timeout') || error.code === 'ETIMEDOUT';
      
      if (isRateLimited || isTimeout) {
        // Safe access to context with defaults
        const income = context?.monthlyIncome || 0;
        const expenses = context?.monthlyExpenses || 0;
        const savings = income - expenses;
        
        // Only provide financial snapshot if we have valid data
        let fallbackResponse: string;
        if (income > 0) {
          const savingsRate = ((savings / income) * 100).toFixed(0);
          fallbackResponse = `I'm experiencing high demand right now. While I reconnect, here's your financial snapshot: You're saving ${savingsRate}% of your income ($${savings.toLocaleString()}/month). ${
            parseFloat(savingsRate) >= 20 
              ? "Great savings rate - you're on track!" 
              : "Aim for 20%+ savings rate for long-term wealth building."
          } Please try your question again in a moment.`;
        } else {
          fallbackResponse = "I'm experiencing high demand right now. Please try your question again in a moment.";
        }
        
        return { response: fallbackResponse, toolCalls: undefined };
      }
      
      // Create structured error with metadata preserved for upstream handling
      const structuredError = new Error(error.message || 'Failed to generate AI response');
      (structuredError as any).groqError = {
        originalMessage: error.message,
        code: error.code || error.status || error.statusCode,
        type: error.constructor?.name,
        response: error.response?.data || error.error,
        statusCode: error.status || error.statusCode
      };
      throw structuredError;
    }
  }

  async generateProactiveInsight(context: UserContext): Promise<string> {
    if (!process.env.GROQ_API_KEY) {
      return 'AI insights unavailable - API key not configured';
    }

    const savingsRate = ((context.monthlyIncome - context.monthlyExpenses) / context.monthlyIncome) * 100;
    const emergencyFundTarget = context.monthlyExpenses * 6;
    const emergencyFundProgress = (context.totalSavings / emergencyFundTarget) * 100;
    
    // PATTERN DETECTION: Analyze spending trends
    const recentExpenses = context.recentTransactions
      ?.filter(t => t.amount < 0)
      .map(t => Math.abs(t.amount)) || [];
    const avgExpense = recentExpenses.length > 0 
      ? recentExpenses.reduce((a, b) => a + b, 0) / recentExpenses.length 
      : 0;
    
    // Detect unusual spending patterns
    const highSpending = recentExpenses.filter(e => e > avgExpense * 2);
    const hasUnusualSpending = highSpending.length >= 2;
    
    // Category analysis
    const categorySpending = new Map<string, number>();
    context.recentTransactions?.forEach(t => {
      if (t.amount < 0) {
        const current = categorySpending.get(t.category) || 0;
        categorySpending.set(t.category, current + Math.abs(t.amount));
      }
    });
    const topCategory = Array.from(categorySpending.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    // PRIORITY 1: Critical Financial Health Issues
    if (savingsRate < 0) {
      return `Alert: You're spending more than you earn. Emergency action needed: Cut ${Math.abs(savingsRate).toFixed(0)}% of expenses or increase income immediately.`;
    }
    
    if (context.totalSavings === 0 && savingsRate < 10) {
      return `Start strong: Save $${Math.ceil(context.monthlyIncome * 0.1)} monthly (10%) to build your safety net. Start with just $50 this week.`;
    }
    
    // PRIORITY 2: Emergency Fund Building
    if (emergencyFundProgress < 50) {
      const monthsNeeded = Math.ceil((emergencyFundTarget - context.totalSavings) / (context.monthlyIncome * savingsRate / 100));
      return `Emergency Fund: ${emergencyFundProgress.toFixed(0)}% complete. Save $${Math.ceil((emergencyFundTarget - context.totalSavings) / 6)} monthly to finish in ${monthsNeeded} months.`;
    }
    
    // PRIORITY 3: Spending Pattern Alerts
    if (hasUnusualSpending && avgExpense > 100) {
      return `Spending Alert: Detected ${highSpending.length} large expenses ($${Math.round(avgExpense * 2)}+) recently. Review your budget to avoid overspending.`;
    }
    
    if (topCategory && topCategory[1] > context.monthlyIncome * 0.3) {
      return `Budget Tip: ${topCategory[0]} is ${((topCategory[1] / context.monthlyIncome) * 100).toFixed(0)}% of income. Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.`;
    }
    
    // PRIORITY 4: Growth & Optimization
    if (savingsRate > 30 && context.totalSavings > emergencyFundTarget) {
      return `Investment Ready: ${savingsRate.toFixed(0)}% savings rate + full emergency fund = time to invest. Consider VTI/VOO index funds for long-term growth.`;
    }
    
    if (savingsRate >= 20 && savingsRate <= 30) {
      return `Great job. ${savingsRate.toFixed(0)}% savings rate is excellent. Next level: Max out tax-advantaged accounts (401k/Roth IRA) for compound growth.`;
    }
    
    // PRIORITY 5: Goal Motivation
    if (context.activeGoals === 0 && context.totalSavings > 0) {
      return `Set Your Vision: You have $${context.totalSavings.toLocaleString()} saved with no goals. Create 1-2 specific goals to turn savings into achievements.`;
    }
    
    if (context.activeGoals >= 3) {
      return `Goal Achiever: ${context.activeGoals} active goals shows commitment. Focus on one at a time for faster results - snowball effect works.`;
    }

    // Use AI for complex insights
    const cacheKey = `insight_${savingsRate.toFixed(0)}_${context.activeGoals}`;
    const cached = responseCache.get(cacheKey, context);
    if (cached) {
      return cached;
    }

    const insightPrompt = `Based on: ${savingsRate.toFixed(1)}% savings rate, $${context.totalSavings} saved, ${context.activeGoals} active goals. Provide one specific, actionable financial tip in 25 words or less.`;

    try {
      const response = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { role: "system", content: "You are a financial advisor. Give concise, actionable advice." },
          { role: "user", content: insightPrompt }
        ],
        temperature: 0.7,
        max_tokens: 100
      });
      
      const text = response.choices[0]?.message?.content || 'Keep up the great work with your financial management!';
      
      // Cache insight
      responseCache.set(cacheKey, context, text, this.estimateTokenCount(insightPrompt + text));
      return text;
    } catch (error) {
      console.error('[AI Service] Proactive insight error:', error);
      return 'Focus on tracking your spending patterns this week.';
    }
  }

  // Cost monitoring and reporting
  getCostStats(): { cacheStats: any; estimatedSavings: string } {
    const cacheStats = responseCache.getStats();
    const estimatedSavings = `${(cacheStats.hitRate * 100).toFixed(1)}% cache hit rate`;
    
    return {
      cacheStats,
      estimatedSavings
    };
  }
}

export const aiService = new TwealthAIService();

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
    const normalizedMessage = message.toLowerCase().trim();
    const contextKey = JSON.stringify({
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
      description: "Create a financial goal when user gives a direct command or confirms. ALWAYS provide a detailed natural language response explaining the goal creation alongside calling this tool. IMMEDIATE EXECUTION: When user says imperative commands like 'Create a goal to save...', 'Add a goal for...', 'Make a goal for...', 'Set a goal to...', call this tool IMMEDIATELY with all details AND provide comprehensive analysis (savings needed per month, feasibility, timeline, strategy). NO confirmation needed for imperative commands - they ARE the confirmation! Extract: name (e.g., 'Vacation Savings'), targetAmount (e.g., '5000'), targetDate (e.g., '2025-12-31'), description. For imperative commands: Set userConfirmed=true automatically.",
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
      description: "MANDATORY for ALL luxury purchase questions >$50k. When user mentions ANY luxury item (Lamborghini, Ferrari, McLaren, mansion, yacht, etc.), you MUST call this tool FIRST before responding. Do NOT provide analysis without calling this tool. This generates comprehensive CFO-level breakdown: down payment options (10%/20%/30%), financing terms (3/5/7 years), monthly payments, total cost of ownership (insurance+maintenance+fuel for vehicles), depreciation schedule (20-30% year 1 for luxury cars), opportunity cost (invested at 8% over 5/10 years). After calling, expand on results with user's specific income and savings context. Keywords that REQUIRE this tool: 'want to buy', 'afford', 'purchase', 'get', plus ANY luxury brand name.",
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
      description: "Detailed affordability analysis for major purchases. CRITICAL: After calling this tool, you MUST explain: debt-to-income ratio calculation, recommended max purchase (2.5x annual income rule), savings timeline to afford down payment, impact on emergency fund, and whether purchase is financially responsible. Provide specific recommendations based on user's actual income and savings. NEVER just say 'Action completed'.",
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
      description: "Analyze spending patterns and generate visual insights ONLY when user asks about spending analysis, budget review, or wants to see where their money goes. CRITICAL: After calling this tool, you MUST explain: top 3 spending categories with exact percentages and dollar amounts, spending trends (X% increase/decrease vs previous period), specific budget warnings (e.g., 'Dining $800 is 40% above recommended $500 limit'), actionable recommendations with exact numbers ('Cut dining by $150/month, redirect to savings'). Use visual language: 'Your spending pie chart shows...', 'The trend line indicates...'. Provide category breakdown data for charts. NEVER just say 'Action completed'.",
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

LANGUAGE DETECTION: Auto-detect user's language and respond exclusively in that language. Never mix languages.
Thai (อไ่): Full Thai, ฿, terms: เงินออม/รายได้/ค่าใช้จ่าย/เป้าหมาย, products: RMF/SSF
Spanish (quiero/cómo): Full Spanish, $/€, terms: ahorros/ingresos/gastos/meta
Chinese (我你): Full Chinese, ¥, terms: 储蓄/收入/支出/目标
Hindi (मैंरुपये): Full Hindi, ₹, Indian financial products
Portuguese (você/quanto): Full Portuguese, R$/€
Indonesian (saya/berapa): Full Indonesian, Rp
Vietnamese (tôi/bạn): Full Vietnamese, ₫
Turkish (ben/para): Full Turkish, ₺
Tagalog (ako/pera): Full Tagalog, ₱
Malay (wang/saya): Full Malay, RM
Arabic (ال): Full Arabic, RTL format
English: Full English, $, USA: 401k/IRA/HSA
Preference: ${languageName}. Override if detected language differs. Example: User writes "อยากซื้อรถ" → respond "คุณต้องการซื้อรถใช่ไหม..." NOT "You want to buy a car..."

USER DATA (${today}):
Income: $${context.monthlyIncome.toLocaleString()}/mo | Expenses: $${context.monthlyExpenses.toLocaleString()}/mo | Savings Capacity: $${(context.monthlyIncome - context.monthlyExpenses).toLocaleString()}/mo
Net Worth: $${netWorth.toLocaleString()} | Savings Rate: ${!isNaN(savingsRate) && isFinite(savingsRate) ? savingsRate.toFixed(1) : 0}% | Goals: ${goals}
Emergency Fund: $${netWorth.toLocaleString()} / $${emergencyFund.toLocaleString()} | ${stockAllocation}% stocks/${100-stockAllocation}% bonds
${context.recentTransactions.length > 0 ? `Recent: ${context.recentTransactions.slice(0, 2).map(t => `$${t.amount} ${t.category}`).join(', ')}` : ''}

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

RESPONSE REQUIREMENTS: Institutional-grade precision. Minimum 3-4 substantive sentences per response. Include: (1) Exact calculations with methodology, (2) Actionable implementation steps, (3) Risk assessment, (4) Educational context. Example: "Target: $40,000 in 18 months requires $2,222/month savings. Your current capacity: $${(context.monthlyIncome - context.monthlyExpenses).toLocaleString()}/mo. Recommended allocation: 70% high-yield savings (4.5% APY), 30% S&P 500 index (historical 10% return). Risk mitigation: Emergency fund coverage required before aggressive investing." Never provide shallow advice like "save more" without quantitative support.`;
    
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
    
    // DEBUG: Log raw AI output before sanitization
    console.log('🔍 === RAW AI RESPONSE (before sanitization) ===');
    console.log(text.substring(0, 500)); // First 500 chars
    console.log('=== END RAW RESPONSE ===');
    
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
    
    // Log sanitization results
    if (text.length - sanitized.length > 50) {
      console.log(`🧹 Sanitization removed ${text.length - sanitized.length} chars`);
      console.log(`📝 Original: ${text.length} chars → Sanitized: ${sanitized.length} chars`);
    }
    
    console.log('✅ === SANITIZED AI RESPONSE (after cleaning) ===');
    console.log(sanitized.substring(0, 500)); // First 500 chars
    console.log('=== END SANITIZED RESPONSE ===');
    
    // Emergency fallback: if sanitized text is too short, AI likely returned only tool calls
    if (sanitized.length < 20) {
      console.error('⚠️ CRITICAL: AI response too short after sanitization!');
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
      console.log(`🌍 Language auto-detected: ${detectedLanguage} (profile says: ${context.language})`);
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
          console.warn('⚠️  AI LOOP DETECTED - Preventing repetition');
          // Add context to break the loop
          userMessage = `[IMPORTANT: Do NOT repeat your previous response. User's actual message: "${userMessage}". Provide a DIFFERENT, more specific answer with NEW details and actionable steps.]`;
        }
      }
    }

    // Check cache first (only for non-tool-using queries)
    const cachedResponse = responseCache.get(userMessage, context);
    if (cachedResponse && conversationHistory.length < 2) {
      console.log('🎯 Cache hit - saved API call');
      return { response: cachedResponse };
    }

    try {
      const systemPrompt = await this.buildSystemPrompt(context, memoryContext);
      
      // Build messages array
      const messages: any[] = [
        { role: "system", content: systemPrompt }
      ];

      // Add conversation history (last 6 messages for context)
      conversationHistory.slice(-6).forEach(msg => {
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
      
      // Imperative action phrases (commands that implicitly include confirmation)
      const imperativeGoalPhrases = [
        // Natural English variations with articles
        'create a goal', 'create the goal', 'create goal', 'create this goal', 'create my goal',
        'add a goal', 'add the goal', 'add goal', 'add this goal', 'add to goal', 'add it to goal', 'add to my goal',
        'make a goal', 'make the goal', 'make goal', 'make it a goal', 'make that a goal',
        'set a goal', 'set the goal', 'set goal', 'set as goal', 'set this goal',
        'save as goal', 'save a goal', 'track this', 'add this to', 'add that',
        'add it', 'make that', 'do it', 'go ahead',
        // Multilingual support
        'เพิ่ม', 'เพิ่มเป้าหมาย', // Thai: add/add goal
        'añadir', 'agregar', 'crear', // Spanish: add/create
        'adicionar', 'adicione', 'criar', // Portuguese: add/create
        'tambah', 'tambahkan', 'buat', // Indonesian/Malay: add/create
        'thêm', 'thêm mục tiêu', 'tạo', // Vietnamese: add/create
        'magdagdag', 'idagdag', 'gumawa', // Tagalog: add/create
        'ekle', 'hedef ekle', 'oluştur', // Turkish: add/create
        'أضف', 'اضف', 'أضف هدف', 'انشئ' // Arabic: add/create
      ];
      const isImperativeAction = imperativeGoalPhrases.some(phrase => lowerMsg.includes(phrase));
      
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
      
      // Filter tools based on context
      const availableTools = canCreate 
        ? TOOLS  // All tools available if confirming
        : TOOLS.filter(t => !['create_financial_goal', 'create_calendar_event', 'create_group'].includes(t.function.name));
      
      console.log(`🛡️  Tool filtering DEBUG:
        - User message: "${userMessage}"
        - isConfirmation: ${isConfirmation}
        - wasAsking: ${wasAskingForConfirmation}
        - isImperative: ${isImperativeAction}
        - canCreate: ${canCreate}
        - toolCount: ${availableTools.length}/${TOOLS.length}
        - Last assistant msg preview: "${lastAssistantMsg.substring(0, 100)}..."
      `);
      
      // Check if message indicates need for transaction/crypto tracking (immediate actions)
      // Only trigger for PAST tense actions, NOT future intentions
      const needsImmediateAction = (
        (lowerMsg.includes('spent') || lowerMsg.includes('paid') || 
         lowerMsg.includes('received') || lowerMsg.includes('earned')) &&
        !lowerMsg.includes('want to') && !lowerMsg.includes('going to') && 
        !lowerMsg.includes('plan to') && !lowerMsg.includes('will')
      ) || (
        lowerMsg.includes('bought') && 
        (lowerMsg.includes('btc') || lowerMsg.includes('crypto') || lowerMsg.includes('bitcoin') || lowerMsg.includes('ethereum')) &&
        !lowerMsg.includes('want to') && !lowerMsg.includes('going to')
      );

      // DEBUG: Log what we're sending to Groq
      console.log('🟢 === CALLING GROQ API ===');
      console.log('Model: meta-llama/llama-4-scout-17b-16e-instruct');
      console.log('Messages count:', messages.length);
      console.log('System prompt length:', systemPrompt.length, 'chars (~', Math.ceil(systemPrompt.length / 4), 'tokens)');
      console.log('User message:', userMessage.substring(0, 100));
      console.log('Tools available:', availableTools.length);

      const response = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",  // Llama 4 Scout - 17B MoE with native tool-use support
        messages: messages,
        tools: availableTools,
        tool_choice: needsImmediateAction ? "required" : "auto",
        temperature: 0.6,  // Balanced temp for precise financial calculations with good reasoning
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
        responseCache.set(userMessage, context, text, tokenCount);
        console.log(`💰 Groq call made - ~${tokenCount} tokens`);
      } else {
        console.log(`🔧 Groq call with ${toolCalls.length} tool(s):`, toolCalls.map(t => t.name).join(', '));
      }
      
      return { response: text, toolCalls };
    } catch (error: any) {
      // COMPREHENSIVE ERROR LOGGING - Preserve all Groq error details
      console.error('❌ ============ AI SERVICE ERROR ============');
      console.error('Error Type:', error.constructor?.name || 'Unknown');
      console.error('Error Message:', error.message);
      console.error('Error Code/Status:', error.code || error.status || error.statusCode || 'N/A');
      console.error('Error Response:', error.response?.data || error.error || 'N/A');
      console.error('Request ID:', error.headers?.['x-request-id'] || 'N/A');
      console.error('Full Error Object:', JSON.stringify(error, null, 2));
      if (error.stack) console.error('Stack Trace:', error.stack);
      console.error('=========================================');
      
      // GRACEFUL DEGRADATION (like ChatGPT/Claude):
      // If Groq rejected the response due to tool_use_failed, extract the generated text
      if (error?.error?.error?.failed_generation) {
        const failedText = error.error.error.failed_generation;
        console.log('✅ Recovered failed response text - returning to user');
        
        // Cache the recovered response (estimate tokens without systemPrompt)
        const tokenCount = this.estimateTokenCount(userMessage + failedText);
        responseCache.set(userMessage, context, failedText, tokenCount);
        
        return { response: failedText, toolCalls: undefined };
      }
      
      // Create structured error with all Groq metadata preserved
      const structuredError = new Error(error.message || 'Failed to generate AI response');
      // Preserve all original error properties
      (structuredError as any).groqError = {
        originalMessage: error.message,
        code: error.code || error.status || error.statusCode,
        type: error.constructor?.name,
        response: error.response?.data || error.error,
        requestId: error.headers?.['x-request-id'],
        statusCode: error.status || error.statusCode,
        // Preserve raw error for debugging
        raw: error
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
      return `🚨 Alert: You're spending more than you earn! Emergency action needed: Cut ${Math.abs(savingsRate).toFixed(0)}% of expenses or increase income immediately.`;
    }
    
    if (context.totalSavings === 0 && savingsRate < 10) {
      return `💪 Start strong: Save $${Math.ceil(context.monthlyIncome * 0.1)} monthly (10%) to build your safety net. Start with just $50 this week!`;
    }
    
    // PRIORITY 2: Emergency Fund Building
    if (emergencyFundProgress < 50) {
      const monthsNeeded = Math.ceil((emergencyFundTarget - context.totalSavings) / (context.monthlyIncome * savingsRate / 100));
      return `🛡️ Emergency Fund: ${emergencyFundProgress.toFixed(0)}% complete. Save $${Math.ceil((emergencyFundTarget - context.totalSavings) / 6)} monthly to finish in ${monthsNeeded} months.`;
    }
    
    // PRIORITY 3: Spending Pattern Alerts
    if (hasUnusualSpending && avgExpense > 100) {
      return `📊 Spending Alert: Detected ${highSpending.length} large expenses ($${Math.round(avgExpense * 2)}+) recently. Review your budget to avoid overspending.`;
    }
    
    if (topCategory && topCategory[1] > context.monthlyIncome * 0.3) {
      return `💡 Budget Tip: ${topCategory[0]} is ${((topCategory[1] / context.monthlyIncome) * 100).toFixed(0)}% of income. Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.`;
    }
    
    // PRIORITY 4: Growth & Optimization
    if (savingsRate > 30 && context.totalSavings > emergencyFundTarget) {
      return `🚀 Investment Ready! ${savingsRate.toFixed(0)}% savings rate + full emergency fund = time to invest. Consider VTI/VOO index funds for long-term growth.`;
    }
    
    if (savingsRate >= 20 && savingsRate <= 30) {
      return `⭐ Great job! ${savingsRate.toFixed(0)}% savings rate is excellent. Next level: Max out tax-advantaged accounts (401k/Roth IRA) for compound growth.`;
    }
    
    // PRIORITY 5: Goal Motivation
    if (context.activeGoals === 0 && context.totalSavings > 0) {
      return `🎯 Set Your Vision: You have $${context.totalSavings.toLocaleString()} saved with no goals! Create 1-2 specific goals to turn savings into achievements.`;
    }
    
    if (context.activeGoals >= 3) {
      return `🏆 Goal Achiever! ${context.activeGoals} active goals shows commitment. Focus on one at a time for faster results - snowball effect works!`;
    }

    // Use AI for complex insights
    const cacheKey = `insight_${savingsRate.toFixed(0)}_${context.activeGoals}`;
    const cached = responseCache.get(cacheKey, context);
    if (cached) {
      console.log('🎯 Insight cache hit');
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
      console.log('💰 Insight call made');
      
      return text;
    } catch (error) {
      console.error('Proactive Insight Error:', error);
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

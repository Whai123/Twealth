import Groq from "groq-sdk";
import crypto from 'crypto';

// Using Groq with Llama 3.3 for fast, powerful AI with function calling
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
  totalSavings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  activeGoals: number;
  language?: string; // User's preferred language (en, es, id, th, pt, hi, vi, tl, ms, tr, ar)
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
      description: "Create a financial goal ONLY after user explicitly confirms. NEVER auto-call when user mentions a goal - first explain the strategy with calculations, THEN ask 'Want me to add this as a trackable goal?'. Only call when user responds with confirmation words like 'yes', 'add it', 'create it', 'please do', 'sure'.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the goal (e.g., 'Buy Lamborghini')"
          },
          targetAmount: {
            type: "number",
            description: "The target amount in dollars. MUST be a number, not a string."
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
        required: ["name", "targetAmount", "targetDate"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description: "Create a calendar event ONLY after user explicitly asks for a reminder/event. NEVER auto-call when user mentions a date - first explain WHY tracking this is important, THEN offer 'Want me to set a reminder for this?'. Only call when user confirms. IMPORTANT: Calculate dates properly - 'next week' = 7 days from now, 'next month' = 30 days from now, 'tomorrow' = 1 day from now.",
      parameters: {
        type: "object",
        properties: {
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
        required: ["title", "date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_transaction",
      description: "Record a transaction when user explicitly states they spent/received money with specific amount. Call immediately to track the transaction, but ALWAYS provide spending insights and budget context in your response. Use when user says 'I spent $X on Y' or 'I earned $X from Y'.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["income", "expense"],
            description: "Type of transaction"
          },
          amount: {
            type: "number",
            description: "Transaction amount in dollars. MUST be a number, not a string."
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
      description: "Create a group ONLY after user explicitly confirms. NEVER auto-call when user mentions collaborative planning - first explain the benefits of group tracking, THEN ask 'Want me to create this group for you?'. Only call when user confirms with 'yes', 'create it', etc.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The group name (e.g., 'Family Budget', 'Roommates Expenses')"
          },
          description: {
            type: "string",
            description: "What this group is for"
          }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_crypto_holding",
      description: "Track crypto holding when user explicitly states they bought/own crypto with specific amount and price. Call immediately to track, but ALWAYS provide investment analysis, current value, and risk assessment in your response. Use when user says 'I bought X BTC at $Y' or 'I own X ETH purchased at $Y'.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Crypto symbol in uppercase (e.g., 'BTC', 'ETH', 'BNB')"
          },
          amount: {
            type: "number",
            description: "Amount of cryptocurrency owned. MUST be a number, not a string."
          },
          purchasePrice: {
            type: "number",
            description: "Purchase price per unit in USD. MUST be a number, not a string."
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
      description: "Calculate and provide expert portfolio allocation recommendations. Use ONLY when user explicitly asks about investment allocation, diversification, or portfolio strategy. Call this to show detailed breakdown in your response. Example triggers: 'How should I invest $10k?', 'What's a good portfolio allocation for my age?'",
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
      description: "Calculate debt payoff strategies (avalanche vs snowball). Use ONLY when user explicitly asks about debt payment optimization or which debts to pay first. Call this to show comparison analysis in your response. Example triggers: 'How should I pay off my debts?', 'Should I use avalanche or snowball method?'",
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
      description: "Calculate inflation-adjusted future value with compound growth. Use ONLY when user explicitly asks about long-term projections or compound interest calculations. Call this to show detailed math in your response. Example triggers: 'If I save $500/month for 30 years, how much will I have?', 'Show me compound growth projection'",
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
      description: "Calculate retirement needs using 4% rule and retirement formulas. Use ONLY when user explicitly asks about retirement planning or savings requirements. Call this to show detailed retirement analysis in your response. Example triggers: 'How much do I need to retire?', 'Can I retire at 60 with $500k saved?'",
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
  }
];

export class TwealthAIService {
  private buildSystemPrompt(context: UserContext): string {
    const savingsRate = ((context.monthlyIncome - context.monthlyExpenses) / context.monthlyIncome) * 100;
    const netWorth = context.totalSavings;
    const goals = context.activeGoals;
    const emergencyFund = context.monthlyExpenses * 6;
    const age = 30; // TODO: Get from user profile when available
    const stockAllocation = Math.max(10, 110 - age); // Age-based rule of thumb

    const today = new Date().toISOString().split('T')[0];
    
    // Language mapping for natural responses
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
    
    return `You are Twealth AI, an expert-level financial advisor with deep knowledge in investments, tax optimization, retirement planning, and wealth management. You transform conversations into actions while providing professional-grade financial guidance.

🌍 LANGUAGE INSTRUCTION:
• User's Language: ${languageName} (${userLanguage})
• IMPORTANT: Respond in ${languageName}. Use natural, fluent ${languageName} with appropriate financial terminology.
• For tool calls, still use English property names (the system requires it), but explain actions in ${languageName}.
• Use culturally appropriate examples and references for ${languageName} speakers.
${userLanguage === 'ar' ? '• Remember to use RTL-appropriate formatting and Arabic numerals (٠-٩) when natural.' : ''}

📊 USER FINANCIAL SNAPSHOT:
• Today: ${today}
• Net Worth: $${netWorth.toLocaleString()} | Savings Rate: ${savingsRate.toFixed(1)}% | Active Goals: ${goals}
• Emergency Fund Target: $${emergencyFund.toLocaleString()} (6 months expenses)
• Recommended Stock/Bond Allocation: ${stockAllocation}%/${100-stockAllocation}% (age-based)

💡 EXPERT FINANCIAL KNOWLEDGE BASE:

🌍 MACROECONOMICS - THE BIG PICTURE:
Understanding how the economy works helps you make smarter money decisions:

1. INFLATION & PURCHASING POWER:
   • Inflation = money loses value over time. $100 today ≠ $100 in 10 years
   • 3% inflation = prices double every 24 years (Rule of 72: 72÷3=24)
   • Why it matters: Keeping cash under mattress = guaranteed loss. Must invest to beat inflation.
   • Historical avg: 3% inflation means you need 7%+ returns to truly grow wealth

2. INTEREST RATES & FEDERAL RESERVE:
   • Fed controls short-term rates → affects everything (mortgages, savings, loans, stocks)
   • LOW rates (0-2%): Cheap borrowing, stocks rise, bonds fall, refinance mortgages NOW
   • HIGH rates (5%+): Expensive borrowing, stocks volatile, bonds attractive, save more in savings accounts
   • Rate cuts = economy stimulus. Rate hikes = inflation control
   • Your strategy: Borrow when rates low, save when rates high

3. ECONOMIC CYCLES (Boom, Recession, Recovery):
   • EXPANSION: Economy growing, jobs plentiful, invest aggressively in stocks
   • PEAK: Markets at highs, consider taking profits, increase cash position
   • RECESSION: Economy shrinking, job losses, stocks fall 20-50%, but BEST buying opportunity!
   • RECOVERY: Economy healing, stocks rebound fast, re-enter market gradually
   • Key insight: "Be greedy when others are fearful" - Warren Buffett

4. MONETARY POLICY & MONEY PRINTING:
   • Quantitative Easing (QE) = Fed prints money → more dollars in system → inflation risk
   • When government prints trillions: Your dollars worth LESS, assets (stocks, real estate) worth MORE
   • This is why "printing money" makes rich richer (they own assets) and hurts savers (cash loses value)
   • Protection: Own assets that rise with money supply (stocks, real estate, Bitcoin)

5. CURRENCY & EXCHANGE RATES:
   • Strong Dollar: US imports cheaper, travel abroad cheaper, foreign stocks hurt
   • Weak Dollar: Exports competitive, US stocks benefit, gold/commodities rise
   • Global diversification matters: Don't put all eggs in one currency basket

6. UNEMPLOYMENT & CONSUMER SPENDING:
   • Low unemployment (3-4%) = strong economy, higher wages, more spending → stocks up
   • High unemployment (7%+) = recession, cut spending, save more, bargain hunting time
   • Consumer spending = 70% of US economy. When people spend, economy grows.

💡 HOW TO USE MACRO IN YOUR DECISIONS:
• Current inflation high? → Invest in I-bonds, TIPS, real assets (real estate, commodities)
• Fed cutting rates? → Refinance debt, buy stocks/real estate before prices rise
• Recession fears? → Build cash reserves, DCA into index funds (buy the dip)
• Strong economic growth? → Increase stock allocation, take calculated risks

📈 INVESTMENT STRATEGIES:
1. Asset Allocation: Diversify across stocks (index funds like VTI, VOO), bonds (BND, AGG), and alternatives (REITs, commodities)
2. Index Fund Advantage: Lower fees (0.03-0.20% vs 1%+ for active funds), tax efficiency, broad market exposure
3. Dollar-Cost Averaging: Invest fixed amounts regularly to reduce timing risk
4. Rebalancing: Quarterly review, sell winners/buy losers to maintain target allocation
5. Risk-Adjusted Returns: Consider Sharpe ratio, not just returns. Volatility matters.
6. Tax-Loss Harvesting: Offset gains by selling losing positions, maintain allocation with similar assets

💰 TAX OPTIMIZATION:
1. Tax-Advantaged Accounts Priority:
   • 401(k): Up to $23,000/year (2024), employer match is free money, reduces taxable income
   • Roth IRA: $7,000/year, tax-free growth, no RMDs, backdoor Roth for high earners
   • HSA: Triple tax advantage (deduct, grow tax-free, withdraw tax-free for medical), $4,150/individual
2. Tax-Efficient Asset Location: Bonds in tax-deferred, stocks in taxable (lower cap gains rate)
3. Roth Conversions: Convert traditional IRA to Roth in low-income years, pay taxes now for tax-free future
4. Capital Gains Strategy: Hold >1 year for long-term rates (0%, 15%, 20% vs ordinary income)

🏖️ RETIREMENT PLANNING:
1. 4% Rule: Withdraw 4% of portfolio annually, 95% success rate for 30-year retirement
2. FIRE Formula: Annual Expenses × 25 = Financial Independence Number
3. Compound Growth Power: $10,000 at 8% = $100,626 in 30 years (Rule of 72: doubles every 9 years)
4. Social Security Strategy: Delay to 70 for 132% benefit vs taking at 62
5. Retirement Age Planning: Need 25x annual expenses invested to retire safely

💳 DEBT OPTIMIZATION:
1. Avalanche Method: Pay minimums on all, extra to highest interest rate (mathematically optimal)
2. Snowball Method: Pay minimums on all, extra to smallest balance (psychological wins)
3. Refinancing: When rate drops 0.5-1%, calculate break-even vs closing costs
4. Good Debt vs Bad: Mortgage <4%, student loans <6% can wait. Credit cards >15%, pay ASAP
5. Debt-to-Income: Keep <36% for financial health, <43% for mortgage approval

🏠 REAL ESTATE INTELLIGENCE:
1. Mortgage Math: 20% down payment avoids PMI, saves $100-200/month on $300k loan
2. Amortization: Early payments are 80% interest. Extra principal payments save massive interest.
3. 1% Rule: Monthly rent should be 1% of purchase price for positive cash flow
4. Cap Rate: Net Operating Income ÷ Property Value. 8-12% is good for rental properties
5. Rent vs Buy: Buy if staying >5 years, rent/mortgage ratio <0.7, can afford 20% down

🎯 YOUR SUPERPOWERS - Use tools to take immediate action:

1️⃣ FINANCIAL GOALS (create_financial_goal):
   ⚠️ IMPORTANT: When user mentions wanting to buy/save for something, FIRST explain HOW to achieve it, THEN ask for confirmation!
   
   User: "I want a Tesla in 2 years" 
   Step 1: Calculate breakdown (don't create goal yet!)
   → Respond: "🎯 Great goal! A Tesla costs about $80,000. Here's your action plan:
      • Monthly savings needed: $3,333
      • Weekly savings needed: $769
      • Daily savings needed: $110
      
      With your current ${savingsRate.toFixed(0)}% savings rate, this is [realistic/challenging]. Do you want me to add this goal to your tracker?"
   
   Step 2: ONLY after user confirms with words like "yes", "add it", "create it", "let's do it":
   → Create goal with targetAmount: 80000 (NUMBER, no quotes!)
   → Respond: "✅ Goal added! Tesla $80,000 by [date]. You'll get reminders to stay on track!"
   
   ⚠️ NEVER create goals without asking first!

2️⃣ CALENDAR EVENTS (create_calendar_event):
   User: "Remind me to check my portfolio next Friday"
   → Create calendar event
   → Respond: "📅 Reminder set for [date]! I'll notify you to review your portfolio. Consider tracking these metrics: [specific advice]"

3️⃣ TRANSACTIONS (add_transaction):
   User: "I spent $500 on groceries"
   → Add expense with amount: 500 (NUMBER!)
   → Respond: "💸 Tracked: $500 grocery expense. That's X% of your monthly budget. Tip: [money-saving insight]"

4️⃣ GROUPS (create_group):
   User: "Create family budget group"
   → Respond: "👥 Created 'Family Budget' group! Invite members to collaborate on shared expenses and goals."

5️⃣ CRYPTO TRACKING (add_crypto_holding):
   User: "I bought 0.5 Bitcoin at $50000"
   → Add with amount: 0.5, purchasePrice: 50000 (NUMBERS!)
   → Respond: "₿ Tracked: 0.5 BTC at $50,000 ($25k total). Current value: $X. Gain/Loss: X%"

6️⃣ PORTFOLIO ALLOCATION ANALYSIS (analyze_portfolio_allocation):
   User: "I'm 35 with $50k to invest, moderate risk tolerance. How should I allocate?"
   → Call with age: 35, riskTolerance: "moderate", investmentAmount: 50000
   → Respond: "📊 Portfolio Strategy for Age 35 (Moderate Risk):
     • 70% Stocks ($35k): VTI or VOO (total market/S&P 500)
     • 25% Bonds ($12.5k): BND or AGG (stability/income)
     • 5% Alternatives ($2.5k): REITs or commodities (diversification)
     
     Why: 110-35=75% stock rule, adjusted for moderate risk. Rebalance annually!"

7️⃣ DEBT PAYOFF STRATEGY (calculate_debt_payoff):
   User: "I have credit card $5k@18%, car loan $15k@6%, student loan $20k@4%. $500 extra/month. What to pay?"
   → Calculate both methods, show comparison
   → Respond: "💳 Debt Payoff Analysis:
     
     AVALANCHE (Math Winner): Pay Credit Card first (18% highest rate)
     • Saves $X in interest
     • Debt-free in Y months
     
     SNOWBALL (Psychological): Pay smallest balance first
     • Quick wins boost motivation
     • Debt-free in Z months (+ $X more interest)
     
     Recommendation: Avalanche saves most $, but if you need motivation wins, Snowball works too!"

8️⃣ FUTURE VALUE PROJECTION (project_future_value):
   User: "If I save $500/month for 30 years at 8% return, how much will I have?"
   → Calculate with inflation adjustment
   → Respond: "📈 Compound Growth Power:
     Starting: $0 | Monthly: $500 | Return: 8% | Time: 30 years
     
     • Future Value: $745,180 (nominal)
     • Inflation-Adjusted (3%): $305,980 (today's dollars)
     • Total Invested: $180,000
     • Growth: $565,180 (313% return!)
     
     💡 Key: Start early! At 20 → $1.5M by 50. At 30 → $745k by 60. At 40 → $293k by 70."

9️⃣ RETIREMENT PLANNING (calculate_retirement_needs):
   User: "I'm 30, want to retire at 60, need $60k/year. Have $50k saved. Enough?"
   → Calculate using 4% rule and compound growth
   → Respond: "🏖️ Retirement Readiness Check:
     
     TARGET: $60k/year × 25 = $1.5M needed (4% withdrawal rule)
     TIMELINE: 30 years to grow $50k → $1.5M
     REQUIRED: Monthly savings of $X at 8% return
     
     STATUS: [On Track / Need $X more monthly / Aggressive but possible]
     
     PRO TIPS:
     • Max 401(k) employer match (free money!)
     • Consider Roth IRA for tax-free growth
     • Delay Social Security to 70 for 32% boost"

⚡ EXPERT RESPONSE PROTOCOL - ADVICE FIRST, ACTIONS SECOND:

🎯 PRIORITY 1 - EDUCATE & EXPLAIN (ALWAYS DO THIS):
1. Answer the financial question with expert knowledge
2. Explain WHY using macroeconomic context, tax implications, or investment principles
3. Provide specific numbers and calculations (show your math!)
4. Include actionable strategy with step-by-step breakdown
5. Use real-world examples and current economic conditions

🔧 PRIORITY 2 - OFFER TOOLS (ONLY AFTER EXPLAINING):
1. AFTER giving advice, ASK if they want to create a goal/reminder
2. NEVER auto-create without asking first (except transactions/crypto tracking)
3. Example: "Want me to add this as a trackable goal?" or "Should I set a reminder for you?"
4. Only use tools when user confirms with "yes", "add it", "create it", "please do"

📏 RESPONSE STRUCTURE:
Step 1: Expert explanation (60-80 words)
Step 2: Specific recommendation with numbers
Step 3: [OPTIONAL] Offer to create goal/event IF relevant

✅ QUALITY CHECKLIST:
• Educational value - explain WHY, not just WHAT
• Specific numbers with context (e.g., "$500 = 12% of monthly budget")
• Macroeconomic context when relevant (inflation, rates, cycles)
• Actionable next steps, not just acknowledgment
• Celebrate wins & encourage during setbacks with empathy
• Emojis: ✅📅💸₿📈🏠🎯💡

🤝 PERSONALITY & EMPATHY GUIDELINES:

CELEBRATE WINS (Recognize achievements, big or small):
• "🎉 Incredible! You saved $X this month - that's Y% above your goal!"
• "💪 You're crushing it! From $0 to $X saved in Z months is MASSIVE progress!"
• "🏆 Paying off that credit card? That's financial discipline at its finest!"

ENCOURAGE DURING SETBACKS (Normalize struggles, provide hope):
• "I get it - unexpected expenses happen to everyone. Let's adjust and keep moving forward."
• "Missing a goal doesn't mean failure. It means we recalibrate. You've got this!"
• "Starting from $0? Perfect. Every wealthy person started there too. Small steps compound!"

CULTURAL SENSITIVITY (Adapt to user's background):
• For Spanish speakers: Reference "quinceañera" savings, family-oriented goals
• For Thai/Indonesian: Acknowledge cultural festivals (Songkran, Lebaran), family support systems
• For Indian speakers: Mention gold investment traditions, joint family finances
• For Arabic speakers: Consider halal finance principles, avoid interest-heavy language when appropriate
• Always respect religious and cultural financial values

MOTIVATIONAL COACHING STYLE:
• "You're not behind - you're exactly where you need to be to start improving!"
• "Think of debt payments as buying your freedom - every dollar is an investment in yourself!"
• "Your future self will thank you for starting today, even if it's just $10"
• "Progress > Perfection. A 1% improvement today beats waiting for the perfect moment"

🔥 EXAMPLES OF EXPERT RESPONSES (ADVICE FIRST, ACTIONS SECOND):

❌ BAD - Auto-creates without explaining:
User: "I want to save for a house"
Bad AI: *[Creates goal]* "✅ Goal created: House $300,000!"
Problem: No strategy, no education, just action

✅ GOOD - Explains strategy, then offers action:
User: "I want to save for a house"
Good AI: "🏠 Excellent goal! Let's build your house fund strategy:

DOWN PAYMENT MATH (20% to avoid PMI):
• House: $300k → Need $60k down payment
• Monthly target: $2,500 (2 years) or $1,250 (4 years)
• Your ${savingsRate.toFixed(0)}% savings rate makes this [achievable/challenging]

MACRO CONTEXT: With current high interest rates (~7%), consider:
1. Save aggressively now while renting
2. Rates may drop in 12-18 months → better buying opportunity
3. Build 20% down + 6 months emergency fund first

STRATEGY:
• Open high-yield savings (5%+ right now)
• Auto-transfer $X weekly
• Track in separate account to avoid temptation

Want me to create a trackable goal for this?"

---

User: "Should I invest in stocks right now?"
You: "📈 Great timing question! Here's what current macro conditions mean for you:

CURRENT ECONOMIC PICTURE:
• Fed rates: [5-5.5%] = stocks volatile but long-term opportunity
• Inflation: [3-4%] = need 7%+ returns to build real wealth
• Market: S&P 500 near [highs/lows] = [cautious/buying opportunity]

YOUR STRATEGY:
1. DOLLAR-COST AVERAGE: Invest $X monthly regardless of market (reduces timing risk)
2. INDEX FUNDS ONLY: VTI/VOO give you 500 companies, not single-stock gambling
3. 10-YEAR HORIZON: Stocks return 10% avg long-term, but volatile short-term
4. EMERGENCY FUND FIRST: Need 6 months expenses saved before investing

WHY NOW WORKS: Even at market highs, time in market > timing market. $100/month for 30 years at 10% = $228k!

Ready to start? I can help you set investment reminders."

---

User: "I overspent by $500 this month. I feel like a failure."
You: "Hey, first off - you're NOT a failure! 💙 Awareness is the first step. 78% of people overspend sometimes.

WHY THIS HAPPENED (Economics):
• Inflation hitting 3-4% = grocery/gas costs up 20% vs 2 years ago
• It's NOT just you - real wages barely keeping up with costs

RESET STRATEGY:
1. Find trigger: Stress spending? Unexpected expense? Inflation?
2. Adjust budget by $250 next month (realistic, not extreme)
3. One small win: Save $50 this week to rebuild confidence

MACRO INSIGHT: High inflation = your dollars buy less. Combat with:
• Track every dollar (awareness prevents leaks)
• Find one category to cut 10%
• Increase income if possible (side gig, raise negotiation)

You've got this. One month doesn't define you! 💪"

---

User: "Should I invest $10,000 or pay off my car loan at 5%?"
You: "💡 Smart question! With a 5% car loan, here's the math:
• Market avg return: 8-10% annually (stocks/index funds)
• After-tax loan cost: ~4% (if you deduct interest)
• Spread: 4-6% favor investing

HOWEVER, guaranteed 5% return (paying debt) vs risky 8-10% (market). Consider:
- Emergency fund: Have 3-6 months? If yes → invest. If no → pay debt
- Risk tolerance: Sleep well or maximize returns?
- Timeline: >5 years → invest, <3 years → pay debt

What's your emergency fund status?"

User: "I want to buy a house cost 300000 in Miami"
You (Step 1): "🏠 Excellent goal! Let me analyze your Miami house plan with your ${savingsRate.toFixed(0)}% savings rate:

DOWN PAYMENT (20% = $60,000):
• Monthly savings: $2,500 (2 years) or $1,250 (4 years)
• This is ${savingsRate > 40 ? 'achievable' : 'challenging'} with your current rate

TOTAL COST ANALYSIS:
• Mortgage: $240k at 7% = $1,597/month for 30 years
• Avoid PMI by putting 20% down (saves $200/month)
• Total interest: $335k over 30 years

PRO TIPS:
1. Get pre-approved now to lock rates if they drop
2. Save for closing costs too (3% = $9k extra)
3. Build emergency fund first (6 months expenses)

Ready to create this goal?"

User: "I spend $200 on dining out"
You (with tracking): "💸 Tracked: $200 dining expense.

📊 OPPORTUNITY COST: $200/month = $2,400/year. At 8% compound growth:
• 10 years: $36,700
• 20 years: $118,000
• 30 years: $298,000

Not saying don't enjoy life, but awareness helps! Small cuts (reduce to $150/month = $50 saved) × 30 years = $74,000 future wealth.

💡 TIP: 80/20 rule - Cook 8 meals/week, dine out 2. Saves ~$1,000/year while keeping life fun."

CRITICAL RULES:
1. ALL numbers in tool calls must be raw numbers (300000 not "300000")
2. For goals: ALWAYS explain breakdown + expert analysis FIRST, ask confirmation, THEN create
3. ALWAYS include educational insight - teach financial literacy with every response
4. Apply compound interest math when relevant - show long-term impact
5. Balance optimization with life enjoyment - not everything is about max returns`;
  }

  private estimateTokenCount(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  async generateAdvice(
    userMessage: string, 
    context: UserContext, 
    conversationHistory: ChatMessage[] = []
  ): Promise<{ response: string; toolCalls?: ToolCall[] }> {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API key not configured');
    }

    // Check cache first (only for non-tool-using queries)
    const cachedResponse = responseCache.get(userMessage, context);
    if (cachedResponse && conversationHistory.length < 2) {
      console.log('🎯 Cache hit - saved API call');
      return { response: cachedResponse };
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
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

      // Check if message indicates need for action
      const needsAction = userMessage.toLowerCase().includes('want to') || 
                         userMessage.toLowerCase().includes('save for') ||
                         userMessage.toLowerCase().includes('buy') ||
                         userMessage.toLowerCase().includes('purchase') ||
                         userMessage.toLowerCase().includes('spend') ||
                         userMessage.toLowerCase().includes('spent') ||
                         userMessage.toLowerCase().includes('paid') ||
                         userMessage.toLowerCase().includes('received') ||
                         userMessage.toLowerCase().includes('earned') ||
                         userMessage.toLowerCase().includes('bought') ||
                         userMessage.toLowerCase().includes('remind me') ||
                         userMessage.toLowerCase().includes('schedule') ||
                         userMessage.toLowerCase().includes('create') ||
                         userMessage.toLowerCase().includes('add') ||
                         userMessage.toLowerCase().includes('track') ||
                         userMessage.toLowerCase().includes('group') ||
                         userMessage.toLowerCase().includes('crypto') ||
                         userMessage.toLowerCase().includes('bitcoin') ||
                         userMessage.toLowerCase().includes('ethereum');

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        tools: TOOLS,
        tool_choice: needsAction ? "required" : "auto",
        temperature: 0.5,
        max_tokens: 500
      });

      const assistantMessage = response.choices[0]?.message;
      
      if (!assistantMessage) {
        throw new Error('No response from AI');
      }

      // Check if AI wants to use tools
      const toolCalls = assistantMessage.tool_calls?.map(tc => ({
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments)
      }));

      const text = assistantMessage.content || '';
      
      // Cache only if no tools were used
      if (!toolCalls || toolCalls.length === 0) {
        const tokenCount = this.estimateTokenCount(systemPrompt + userMessage + text);
        responseCache.set(userMessage, context, text, tokenCount);
        console.log(`💰 Groq call made - ~${tokenCount} tokens`);
      } else {
        console.log(`🔧 Groq call with ${toolCalls.length} tool(s):`, toolCalls.map(t => t.name).join(', '));
      }
      
      return { response: text, toolCalls };
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate AI response');
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
        model: "llama-3.3-70b-versatile",
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

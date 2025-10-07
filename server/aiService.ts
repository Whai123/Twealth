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
      description: "Create a new financial goal for the user. Use this when the user expresses a desire to save for something specific (e.g., 'I want to buy a Lamborghini in 2 years')",
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
      description: "Create a calendar event for the user. Use this when the user mentions a financial appointment or important date (e.g., 'Remind me to review my portfolio next month'). IMPORTANT: Calculate dates properly - 'next week' = 7 days from now, 'next month' = 30 days from now, 'tomorrow' = 1 day from now.",
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
      description: "Record a financial transaction. Use this when the user mentions spending or receiving money (e.g., 'I spent $50 on groceries today')",
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
      description: "Create a new group for collaborative financial planning. Use when user wants to create a family budget, team expense tracking, etc.",
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
      description: "Track a cryptocurrency holding. Use when user mentions buying or owning crypto.",
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
  }
];

export class TwealthAIService {
  private buildSystemPrompt(context: UserContext): string {
    const savingsRate = ((context.monthlyIncome - context.monthlyExpenses) / context.monthlyIncome) * 100;
    const netWorth = context.totalSavings;
    const goals = context.activeGoals;

    const today = new Date().toISOString().split('T')[0];
    
    return `You are Twealth AI, an elite financial assistant that transforms conversations into actions. You have full control over the user's financial life.

📊 USER FINANCIAL SNAPSHOT:
• Today: ${today}
• Net Worth: $${netWorth.toLocaleString()} | Savings Rate: ${savingsRate.toFixed(1)}% | Active Goals: ${goals}

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

⚡ RESPONSE PROTOCOL:
1. ALWAYS provide a text response confirming actions taken
2. Include specific numbers and dates from the action
3. Add ONE smart financial tip related to the action
4. Keep responses under 100 words but ALWAYS confirm what you did
5. Use emojis to make it engaging: ✅📅💸₿📈

🔥 EXAMPLES OF PERFECT RESPONSES:

User: "I want to buy a house cost 300000 in Miami"
You (Step 1 - Don't create yet!): "🏠 Excellent goal! Here's your Miami house action plan:
• Target: $300,000
• Monthly savings needed: $X (over Y years)
• Weekly savings: $X
• Daily savings: $X

With your current ${savingsRate.toFixed(0)}% savings rate, you'll need to adjust spending by X%. Pro tip: Start researching mortgage rates now! Do you want me to add this goal?"

User: "Yes, add it"
You (Step 2 - Now create): "✅ Goal added! Miami house $300,000 by [date]. You'll get progress updates and tips to stay on track!"

CRITICAL: 
1. ALL numbers in tool calls must be raw numbers (300000 not "300000")
2. For goals: ALWAYS explain breakdown FIRST, ask confirmation, THEN create
3. ALWAYS respond with text confirming actions - never use tools silently!`;
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
    
    // Rule-based insights for common scenarios
    if (savingsRate < 5) {
      return `Your savings rate is ${savingsRate.toFixed(1)}% - try to save at least 10% by reducing one major expense category.`;
    }
    if (savingsRate > 30) {
      return `Excellent ${savingsRate.toFixed(1)}% savings rate! Consider investing some of your excess savings for long-term growth.`;
    }
    if (context.totalSavings < context.monthlyExpenses * 3) {
      return `Build your emergency fund to $${(context.monthlyExpenses * 3).toLocaleString()} (3 months of expenses) before other investments.`;
    }
    if (context.activeGoals === 0) {
      return `Set 2-3 specific financial goals this month to stay motivated and track your progress effectively.`;
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

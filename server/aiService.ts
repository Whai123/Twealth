import { GoogleGenAI } from "@google/genai";
import crypto from 'crypto';

// Using Gemini for cost-effective financial advice - 25x cheaper than OpenAI
// Blueprint integration: javascript_gemini
const genai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
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

// Financial advice templates for common queries
const ADVICE_TEMPLATES = new Map<string, string>([
  ['budget', 'Follow the 50/30/20 rule: 50% for needs, 30% for wants, 20% for savings. Track your expenses using categories to identify areas for improvement.'],
  ['emergency fund', 'Build an emergency fund with 3-6 months of expenses. Start with $1,000 as your initial goal, then gradually increase it.'],
  ['debt payoff', 'Use the debt avalanche method: pay minimums on all debts, then put extra money toward the highest interest rate debt first.'],
  ['investment start', 'Start investing with low-cost index funds. Begin with 10-15% of your income if possible, and increase gradually over time.'],
  ['save money', 'Cut unnecessary subscriptions, cook at home more often, and use the 24-hour rule before making non-essential purchases.'],
  ['retirement', 'Contribute to retirement accounts early. Time is your biggest advantage - even small amounts grow significantly over decades.'],
  ['credit score', 'Pay bills on time, keep credit utilization below 30%, and avoid closing old credit cards to maintain credit history length.']
]);

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

export class TwealthAIService {
  private buildOptimizedSystemPrompt(context: UserContext): string {
    // Optimized context - include only essential data to reduce token usage
    const savingsRate = ((context.monthlyIncome - context.monthlyExpenses) / context.monthlyIncome) * 100;
    const netWorth = context.totalSavings;
    const goals = context.activeGoals;

    return `You are Twealth AI, a personal financial assistant.

Context: $${netWorth.toLocaleString()} savings, ${savingsRate.toFixed(0)}% savings rate, ${goals} goals

Role: Provide specific, actionable financial advice (max 150 words)
- Reference their actual data
- Give practical tips for immediate implementation
- Be encouraging but realistic`;
  }

  private findTemplateMatch(message: string): string | null {
    const normalizedMessage = message.toLowerCase();
    
    for (const [keyword, template] of Array.from(ADVICE_TEMPLATES.entries())) {
      if (normalizedMessage.includes(keyword)) {
        return template;
      }
    }
    
    return null;
  }

  private estimateTokenCount(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  async generateAdvice(
    userMessage: string, 
    context: UserContext, 
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    // Cost optimization 1: Check cache first
    const cachedResponse = responseCache.get(userMessage, context);
    if (cachedResponse) {
      console.log('🎯 Cache hit - saved API call');
      return cachedResponse;
    }

    // Cost optimization 2: Check for template match
    const templateMatch = this.findTemplateMatch(userMessage);
    if (templateMatch && conversationHistory.length === 0) {
      // Use template for first-time common questions
      const personalizedTemplate = this.personalizeTemplate(templateMatch, context);
      responseCache.set(userMessage, context, personalizedTemplate, this.estimateTokenCount(personalizedTemplate));
      console.log('📋 Template used - saved API call');
      return personalizedTemplate;
    }

    try {
      // Cost optimization 3: Use optimized prompt
      const systemPrompt = this.buildOptimizedSystemPrompt(context);
      
      // Cost optimization 4: Limit conversation history to 4 most recent messages
      const conversationContext = conversationHistory.slice(-4).map(msg => 
        `${msg.role}: ${msg.content.slice(0, 100)}` // Truncate long messages
      ).join('\n');
      
      const fullPrompt = `${systemPrompt}

History: ${conversationContext}

Q: ${userMessage}

A:`;

      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt
      });
      
      const text = response.text || 'Sorry, I could not generate a response.';
      
      // Cache the response
      const tokenCount = this.estimateTokenCount(fullPrompt + text);
      responseCache.set(userMessage, context, text, tokenCount);
      
      console.log(`💰 AI call made - ~${tokenCount} tokens`);
      
      return text;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private personalizeTemplate(template: string, context: UserContext): string {
    const savingsRate = ((context.monthlyIncome - context.monthlyExpenses) / context.monthlyIncome) * 100;
    
    // Add personalization based on user's situation
    let personalized = template;
    
    if (context.totalSavings < 1000) {
      personalized += ` With your current savings, focus on building that emergency fund first.`;
    } else if (savingsRate > 20) {
      personalized += ` Your ${savingsRate.toFixed(0)}% savings rate is excellent - keep it up!`;
    } else if (savingsRate < 10) {
      personalized += ` Consider increasing your savings rate from ${savingsRate.toFixed(0)}% to at least 15%.`;
    }
    
    return personalized;
  }

  async generateProactiveInsight(context: UserContext): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      return 'AI insights unavailable - API key not configured';
    }

    const savingsRate = ((context.monthlyIncome - context.monthlyExpenses) / context.monthlyIncome) * 100;
    
    // Cost optimization: Rule-based insights for common scenarios
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

    // Only use AI for complex scenarios
    const cacheKey = `insight_${savingsRate.toFixed(0)}_${context.activeGoals}`;
    const cached = responseCache.get(cacheKey, context);
    if (cached) {
      console.log('🎯 Insight cache hit');
      return cached;
    }

    const insightPrompt = `Financial insight for: ${savingsRate.toFixed(1)}% rate, $${context.totalSavings} saved, ${context.activeGoals} goals. One specific tip (20 words max):`;

    try {
      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: insightPrompt
      });
      
      const text = response.text || 'Keep up the great work with your financial management!';
      
      // Cache insight
      responseCache.set(cacheKey, context, text, this.estimateTokenCount(insightPrompt + text));
      console.log('💰 Insight AI call made');
      
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
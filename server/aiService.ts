import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

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
  private buildSystemPrompt(context: UserContext): string {
    return `You are Twealth AI, a personal financial and time management assistant. You help users make smart decisions about money and time.

Current User Context:
- Total Savings: $${context.totalSavings.toLocaleString()}
- Monthly Income: $${context.monthlyIncome.toLocaleString()}
- Monthly Expenses: $${context.monthlyExpenses.toLocaleString()}
- Active Goals: ${context.activeGoals}
- Recent Transactions: ${context.recentTransactions.length} transactions
- Upcoming Events: ${context.upcomingEvents.length} events

Your role:
1. Provide personalized financial advice based on their actual data
2. Help optimize spending and savings
3. Suggest time management improvements
4. Give actionable recommendations
5. Keep responses concise but helpful (max 200 words)

Guidelines:
- Always reference their actual financial situation
- Provide specific, actionable advice
- Be encouraging but realistic
- Focus on practical tips they can implement immediately
- Use their language preference (Thai or English based on their input)`;
  }

  async generateAdvice(
    userMessage: string, 
    context: UserContext, 
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-6).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using cost-effective model for financial advice
        messages,
        max_tokens: 300,
      });

      return response.choices[0].message.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateProactiveInsight(context: UserContext): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      return 'AI insights unavailable - API key not configured';
    }

    const savingsRate = ((context.monthlyIncome - context.monthlyExpenses) / context.monthlyIncome) * 100;
    
    const insightPrompt = `Based on this financial data, provide ONE specific, actionable insight (1-2 sentences):
    
Savings Rate: ${savingsRate.toFixed(1)}%
Monthly Income: $${context.monthlyIncome}
Monthly Expenses: $${context.monthlyExpenses}
Total Savings: $${context.totalSavings}
Active Goals: ${context.activeGoals}

Focus on the most important opportunity for improvement.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: 'user', content: insightPrompt }],
        max_tokens: 100,
      });

      return response.choices[0].message.content || 'Keep up the great work with your financial management!';
    } catch (error) {
      console.error('Proactive Insight Error:', error);
      return 'Focus on tracking your spending patterns this week.';
    }
  }
}

export const aiService = new TwealthAIService();
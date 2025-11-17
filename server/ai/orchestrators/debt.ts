/**
 * Debt Orchestrator - CFO-level debt payoff analysis
 * 
 * Provides:
 * - Snowball vs. Avalanche payoff ordering
 * - Invest vs. payoff simulations
 * - Multi-debt optimization strategies
 * - Payoff timeline projections
 */

import type { FinancialContext } from '../contextBuilder';
import { getReasoningClient } from '../clients';
import { z } from 'zod';

/**
 * Zod schema for debt analysis validation
 */
const DebtAnalysisSchema = z.object({
  strategy: z.object({
    type: z.enum(['snowball', 'avalanche', 'hybrid', 'invest_and_payoff']),
    reason: z.string().min(10),
    projectedMonthsToDebtFree: z.number().min(0).max(600), // Max 50 years
    totalInterestPaid: z.number().min(0),
  }),
  payoffOrder: z.array(z.object({
    debtName: z.string(),
    balance: z.number().min(0),
    apr: z.number().min(0).max(100),
    payoffMonth: z.number().int().min(1),
    monthlyPayment: z.number().min(0),
  })),
  investVsPayoff: z.object({
    investReturns: z.number(),
    interestSaved: z.number(),
    recommendation: z.enum(['invest', 'payoff', 'split']),
    splitRatio: z.object({
      invest: z.number().min(0).max(1),
      payoff: z.number().min(0).max(1),
    }).optional(),
  }).optional(),
  summary: z.string().min(50),
});

/**
 * Structured debt analysis result
 */
export interface DebtAnalysis {
  // Recommended strategy
  strategy: {
    type: 'snowball' | 'avalanche' | 'hybrid' | 'invest_and_payoff';
    reason: string;
    projectedMonthsToDebtFree: number;
    totalInterestPaid: number;
  };
  
  // Payoff order
  payoffOrder: Array<{
    debtName: string;
    balance: number;
    apr: number;
    payoffMonth: number; // Month in sequence (1, 2, 3...)
    monthlyPayment: number;
  }>;
  
  // Invest vs. payoff comparison (if applicable)
  investVsPayoff?: {
    investReturns: number; // 5-year projection
    interestSaved: number; // By paying off debt
    recommendation: 'invest' | 'payoff' | 'split';
    splitRatio?: { invest: number; payoff: number }; // e.g., {invest: 0.6, payoff: 0.4}
  };
  
  // Natural language summary
  summary: string;
}

/**
 * Orchestrate debt payoff analysis using Claude Opus 4.1
 */
export async function analyzeDebt(
  context: FinancialContext,
  userQuestion: string
): Promise<DebtAnalysis> {
  // Validate input
  if (context.debts.length === 0) {
    throw new Error('Debt orchestrator: No debts found in user context');
  }
  
  const client = getReasoningClient();
  
  // Build structured prompt for CFO-level analysis
  const prompt = buildDebtPrompt(context, userQuestion);
  
  // Call Claude Opus 4.1 with structured output request
  const response = await client.chat({
    messages: [
      {
        role: 'system',
        content: DEBT_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3, // Lower temperature for financial calculations
    maxTokens: 2000,
  });
  
  // Parse structured JSON response with strict validation
  const analysis = parseDebtResponse(response.text, context);
  
  return analysis;
}

/**
 * System prompt for debt analysis
 */
const DEBT_SYSTEM_PROMPT = `You are Twealth AI's debt optimization specialist - a CFO-level financial advisor helping users become debt-free.

Your task is to analyze the user's debt situation in Twealth and provide a comprehensive payoff strategy.

**Analysis Framework:**
1. Debt Inventory: Review all debts (balances, APRs, minimum payments)
2. Cash Flow Analysis: Calculate available monthly surplus for debt payoff
3. Strategy Comparison:
   - Snowball: Pay off smallest balance first (psychological wins)
   - Avalanche: Pay off highest APR first (math optimal)
   - Hybrid: Combine both based on debt characteristics
4. Invest vs. Payoff: If user has investable income, compare returns
5. Timeline Projection: Calculate months to debt-free with each strategy

**Output Requirements:**
Return a JSON object with this exact structure:
\`\`\`json
{
  "strategy": {
    "type": "snowball" | "avalanche" | "hybrid" | "invest_and_payoff",
    "reason": "Clear explanation of why this strategy is optimal",
    "projectedMonthsToDebtFree": 36,
    "totalInterestPaid": 5420.50
  },
  "payoffOrder": [
    {
      "debtName": "Credit Card A",
      "balance": 5000,
      "apr": 18.99,
      "payoffMonth": 12,
      "monthlyPayment": 450
    }
  ],
  "investVsPayoff": {
    "investReturns": 8500,
    "interestSaved": 6200,
    "recommendation": "payoff",
    "splitRatio": null
  },
  "summary": "Natural language summary with actionable next steps"
}
\`\`\`

**Key Principles:**
- High-interest debt (>7% APR) almost always beats investing
- Low-interest debt (<4% APR) may justify investing instead
- Emergency fund takes priority over aggressive debt payoff
- Employer match beats everything (free money)
- Consider psychological factors (snowball motivation)

**Tone:** Professional, clear, actionable. No jargon. Explain trade-offs.`;

/**
 * Build debt analysis prompt with user context
 */
function buildDebtPrompt(context: FinancialContext, userQuestion: string): string {
  const { income, expenses, debts, goals, assets } = context;
  
  // Calculate financial metrics
  const monthlyIncome = income.sources.reduce((sum, s) => sum + s.amount, 0);
  const monthlyExpenses = expenses.monthly;
  const monthlySurplus = income.monthlyNet;
  const currentDebtPayments = debts.reduce((sum, d) => sum + d.monthlyPayment, 0);
  const additionalPayoffCapacity = monthlySurplus - currentDebtPayments;
  
  // Calculate total savings from cash assets
  const totalSavings = assets
    .filter(a => a.type === 'cash')
    .reduce((sum, a) => sum + a.value, 0);
  
  let prompt = `**User Question:** ${userQuestion}\n\n`;
  
  prompt += `**Financial Situation:**\n`;
  prompt += `- Monthly Income: $${monthlyIncome.toLocaleString()}\n`;
  prompt += `- Monthly Expenses: $${monthlyExpenses.toLocaleString()}\n`;
  prompt += `- Monthly Surplus: $${monthlySurplus.toLocaleString()}\n`;
  prompt += `- Total Cash/Savings: $${totalSavings.toLocaleString()}\n\n`;
  
  prompt += `**Debts (${debts.length} total):**\n`;
  debts.forEach((debt, i) => {
    prompt += `${i + 1}. **${debt.name}**\n`;
    prompt += `   - Balance: $${debt.balance.toLocaleString()}\n`;
    prompt += `   - APR: ${debt.apr}%\n`;
    prompt += `   - Minimum Payment: $${debt.min.toLocaleString()}\n`;
    prompt += `   - Current Monthly Payment: $${debt.monthlyPayment.toLocaleString()}\n`;
  });
  
  prompt += `\n**Additional Debt Payoff Capacity:** $${additionalPayoffCapacity.toLocaleString()}/month\n\n`;
  
  if (goals.length > 0) {
    prompt += `**Active Goals:**\n`;
    goals.forEach(g => {
      prompt += `- ${g.name}: $${g.target.toLocaleString()} (current: $${g.current.toLocaleString()})\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `Analyze this debt situation and provide a comprehensive payoff strategy. `;
  prompt += `Return ONLY the JSON object specified in the system prompt, no additional text.`;
  
  return prompt;
}

/**
 * Parse Claude's response into structured DebtAnalysis with strict validation
 */
function parseDebtResponse(responseText: string, context: FinancialContext): DebtAnalysis {
  // Extract JSON from response (Claude might wrap it in markdown)
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                    responseText.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error(`Debt orchestrator: No JSON found in Claude response. Response: ${responseText.substring(0, 200)}`);
  }
  
  const jsonText = jsonMatch[1] || jsonMatch[0];
  let parsed: unknown;
  
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Debt orchestrator: JSON parse error. ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Validate with Zod schema
  const result = DebtAnalysisSchema.safeParse(parsed);
  
  if (!result.success) {
    console.error('Debt analysis validation failed:', result.error.errors);
    throw new Error(`Debt orchestrator: Invalid response structure. Errors: ${JSON.stringify(result.error.errors)}`);
  }
  
  return result.data;
}

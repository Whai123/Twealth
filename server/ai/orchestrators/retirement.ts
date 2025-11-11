/**
 * Retirement Orchestrator - CFO-level retirement planning
 * 
 * Provides:
 * - Glidepath planning (asset allocation by age)
 * - Target retirement income projections
 * - Contribution optimization (401k, IRA, Roth)
 * - Retirement readiness scoring
 */

import type { FinancialContext } from '../contextBuilder';
import { getReasoningClient } from '../clients';
import { z } from 'zod';

/**
 * Zod schema for retirement analysis validation
 */
const RetirementAnalysisSchema = z.object({
  readiness: z.object({
    score: z.number().min(0).max(100),
    status: z.enum(['on_track', 'behind', 'ahead']),
    yearsToRetirement: z.number().min(0).max(100),
    monthlyGap: z.number(),
  }),
  glidepath: z.object({
    current: z.object({
      stocks: z.number().min(0).max(100),
      bonds: z.number().min(0).max(100),
      cash: z.number().min(0).max(100),
    }),
    target: z.object({
      stocks: z.number().min(0).max(100),
      bonds: z.number().min(0).max(100),
      cash: z.number().min(0).max(100),
    }),
    reasoning: z.string().min(20),
  }),
  incomeProjection: z.object({
    targetMonthlyIncome: z.number().min(0),
    projectedMonthlyIncome: z.number().min(0),
    sources: z.array(z.object({
      name: z.string(),
      monthlyAmount: z.number().min(0),
    })),
  }),
  contributionStrategy: z.object({
    monthlyTarget: z.number().min(0),
    allocation: z.array(z.object({
      account: z.string(),
      monthlyAmount: z.number().min(0),
      reason: z.string().min(10),
    })),
  }),
  summary: z.string().min(50),
});

/**
 * Structured retirement analysis result
 */
export interface RetirementAnalysis {
  // Retirement readiness
  readiness: {
    score: number; // 0-100
    status: 'on_track' | 'behind' | 'ahead';
    yearsToRetirement: number;
    monthlyGap: number; // Amount to increase/decrease monthly savings
  };
  
  // Recommended asset allocation glidepath
  glidepath: {
    current: { stocks: number; bonds: number; cash: number };
    target: { stocks: number; bonds: number; cash: number };
    reasoning: string;
  };
  
  // Retirement income projection
  incomeProjection: {
    targetMonthlyIncome: number;
    projectedMonthlyIncome: number;
    sources: Array<{
      name: string; // e.g., "401k", "Social Security", "Rental Income"
      monthlyAmount: number;
    }>;
  };
  
  // Contribution strategy
  contributionStrategy: {
    monthlyTarget: number;
    allocation: Array<{
      account: string; // e.g., "401k", "Roth IRA", "Taxable"
      monthlyAmount: number;
      reason: string;
    }>;
  };
  
  // Natural language summary
  summary: string;
}

/**
 * Orchestrate retirement planning using Claude Opus 4.1
 */
export async function analyzeRetirement(
  context: FinancialContext,
  userQuestion: string
): Promise<RetirementAnalysis> {
  const client = getReasoningClient();
  
  // Build structured prompt for CFO-level analysis
  const prompt = buildRetirementPrompt(context, userQuestion);
  
  // Call Claude Opus 4.1 with structured output request
  const response = await client.chat({
    messages: [
      {
        role: 'system',
        content: RETIREMENT_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3, // Lower temperature for financial calculations
    maxTokens: 2500,
  });
  
  // Parse structured JSON response
  const analysis = parseRetirementResponse(response.text);
  
  return analysis;
}

/**
 * System prompt for retirement analysis
 */
const RETIREMENT_SYSTEM_PROMPT = `You are a CFO-level financial advisor specializing in retirement planning.

Your task is to analyze the user's retirement readiness and provide a comprehensive strategy.

**Analysis Framework:**
1. Current Position: Assess current retirement savings and asset allocation
2. Target Income: Calculate target retirement income (typically 70-80% of current income)
3. Glidepath Planning: Recommend age-appropriate asset allocation
4. Contribution Strategy: Optimize 401k, IRA, Roth contributions
5. Readiness Score: Calculate likelihood of reaching retirement goals

**Output Requirements:**
Return a JSON object with this exact structure:
\`\`\`json
{
  "readiness": {
    "score": 75,
    "status": "on_track",
    "yearsToRetirement": 25,
    "monthlyGap": 0
  },
  "glidepath": {
    "current": { "stocks": 60, "bonds": 30, "cash": 10 },
    "target": { "stocks": 70, "bonds": 25, "cash": 5 },
    "reasoning": "At 40 years old with 25 years to retirement, increase stock allocation for growth"
  },
  "incomeProjection": {
    "targetMonthlyIncome": 6000,
    "projectedMonthlyIncome": 5800,
    "sources": [
      { "name": "401k", "monthlyAmount": 4200 },
      { "name": "Social Security", "monthlyAmount": 1600 }
    ]
  },
  "contributionStrategy": {
    "monthlyTarget": 1200,
    "allocation": [
      {
        "account": "401k (up to match)",
        "monthlyAmount": 500,
        "reason": "Capture full employer match (free money)"
      },
      {
        "account": "Roth IRA",
        "monthlyAmount": 500,
        "reason": "Tax-free growth for long horizon"
      },
      {
        "account": "Taxable brokerage",
        "monthlyAmount": 200,
        "reason": "Flexibility for early retirement goals"
      }
    ]
  },
  "summary": "Natural language summary with actionable next steps"
}
\`\`\`

**Key Principles:**
- Rule of 110: Target stock allocation = 110 - age (adjustable for risk tolerance)
- 4% Rule: Can withdraw 4% of portfolio annually in retirement
- Employer match beats everything (free money)
- Roth for long horizons (>15 years), Traditional for near-term
- Target 10-15x final salary saved by retirement
- Social Security covers ~40% of pre-retirement income

**Tone:** Professional, clear, actionable. No jargon. Explain trade-offs.`;

/**
 * Build retirement analysis prompt with user context
 */
function buildRetirementPrompt(context: FinancialContext, userQuestion: string): string {
  const { user, income, expenses, assets, goals } = context;
  
  // Calculate retirement-specific metrics
  const monthlyIncome = income.sources.reduce((sum, s) => sum + s.amount, 0);
  const monthlySurplus = income.monthlyNet;
  
  // Calculate total retirement savings (equity + bonds)
  const retirementSavings = assets
    .filter(a => a.type === 'equity' || a.type === 'bond')
    .reduce((sum, a) => sum + a.value, 0);
  
  // Calculate current asset allocation
  const totalInvested = assets
    .filter(a => ['equity', 'bond', 'cash'].includes(a.type))
    .reduce((sum, a) => sum + a.value, 0);
  
  const stocksValue = assets
    .filter(a => a.type === 'equity')
    .reduce((sum, a) => sum + a.value, 0);
  
  const bondsValue = assets
    .filter(a => a.type === 'bond')
    .reduce((sum, a) => sum + a.value, 0);
  
  const cashValue = assets
    .filter(a => a.type === 'cash')
    .reduce((sum, a) => sum + a.value, 0);
  
  let prompt = `**User Question:** ${userQuestion}\n\n`;
  
  prompt += `**Current Financial Situation:**\n`;
  prompt += `- Age: ${user.age || 'Not provided'}\n`;
  prompt += `- Monthly Income: $${monthlyIncome.toLocaleString()}\n`;
  prompt += `- Monthly Expenses: $${expenses.monthly.toLocaleString()}\n`;
  prompt += `- Monthly Surplus: $${monthlySurplus.toLocaleString()}\n`;
  prompt += `- Risk Tolerance: ${user.riskTolerance || 'medium'}\n\n`;
  
  prompt += `**Current Retirement Savings: $${retirementSavings.toLocaleString()}**\n\n`;
  
  // Safeguard: Only calculate percentages if totalInvested > 0
  if (totalInvested > 0) {
    const stocksPct = ((stocksValue / totalInvested) * 100).toFixed(1);
    const bondsPct = ((bondsValue / totalInvested) * 100).toFixed(1);
    const cashPct = ((cashValue / totalInvested) * 100).toFixed(1);
    
    prompt += `**Current Asset Allocation:**\n`;
    prompt += `- Stocks/Equity: ${stocksPct}% ($${stocksValue.toLocaleString()})\n`;
    prompt += `- Bonds: ${bondsPct}% ($${bondsValue.toLocaleString()})\n`;
    prompt += `- Cash: ${cashPct}% ($${cashValue.toLocaleString()})\n\n`;
  } else {
    prompt += `**Current Asset Allocation:** No investment assets found. Starting from zero.\n\n`;
  }
  
  if (goals.length > 0) {
    const retirementGoals = goals.filter(g => 
      g.name.toLowerCase().includes('retire') || 
      g.horizonMonths > 120 // >10 years
    );
    
    if (retirementGoals.length > 0) {
      prompt += `**Retirement Goals:**\n`;
      retirementGoals.forEach(g => {
        prompt += `- ${g.name}: $${g.target.toLocaleString()} in ${Math.floor(g.horizonMonths / 12)} years (current: $${g.current.toLocaleString()})\n`;
      });
      prompt += `\n`;
    }
  }
  
  prompt += `Analyze this retirement situation and provide a comprehensive strategy. `;
  prompt += `Return ONLY the JSON object specified in the system prompt, no additional text.`;
  
  return prompt;
}

/**
 * Parse Claude's response into structured RetirementAnalysis with strict validation
 */
function parseRetirementResponse(responseText: string): RetirementAnalysis {
  // Extract JSON from response (Claude might wrap it in markdown)
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                    responseText.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error(`Retirement orchestrator: No JSON found in Claude response. Response: ${responseText.substring(0, 200)}`);
  }
  
  const jsonText = jsonMatch[1] || jsonMatch[0];
  let parsed: unknown;
  
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Retirement orchestrator: JSON parse error. ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Validate with Zod schema
  const result = RetirementAnalysisSchema.safeParse(parsed);
  
  if (!result.success) {
    console.error('Retirement analysis validation failed:', result.error.errors);
    throw new Error(`Retirement orchestrator: Invalid response structure. Errors: ${JSON.stringify(result.error.errors)}`);
  }
  
  return result.data;
}

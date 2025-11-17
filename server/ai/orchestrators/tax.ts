/**
 * Tax Orchestrator - CFO-level tax optimization
 * 
 * Provides:
 * - Roth vs. Traditional IRA analysis
 * - Tax bracket optimization
 * - Multi-year tax strategy
 * - Tax-loss harvesting opportunities
 */

import type { FinancialContext } from '../contextBuilder';
import { getReasoningClient } from '../clients';
import { z } from 'zod';

/**
 * Zod schema for tax analysis validation
 */
const TaxAnalysisSchema = z.object({
  rothVsTraditional: z.object({
    recommendation: z.enum(['roth', 'traditional', 'split']),
    reason: z.string().min(20),
    currentBracket: z.string(),
    projectedRetirementBracket: z.string(),
    splitRatio: z.object({
      roth: z.number().min(0).max(1),
      traditional: z.number().min(0).max(1),
    }).optional(),
  }),
  strategies: z.array(z.object({
    strategy: z.string(),
    estimatedSavings: z.number().min(0),
    complexity: z.enum(['low', 'medium', 'high']),
    description: z.string().min(10),
  })),
  multiYearProjection: z.object({
    currentYearTax: z.number().min(0),
    fiveYearProjectedTax: z.number().min(0),
    recommendedActions: z.array(z.string()),
  }).optional(),
  summary: z.string().min(50),
});

/**
 * Structured tax analysis result
 */
export interface TaxAnalysis {
  // Roth vs Traditional recommendation
  rothVsTraditional: {
    recommendation: 'roth' | 'traditional' | 'split';
    reason: string;
    currentBracket: string; // e.g., "22%"
    projectedRetirementBracket: string; // e.g., "12%"
    splitRatio?: { roth: number; traditional: number }; // e.g., {roth: 0.6, traditional: 0.4}
  };
  
  // Tax optimization strategies
  strategies: Array<{
    strategy: string;
    estimatedSavings: number; // Annual tax savings
    complexity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  
  // Multi-year tax projection
  multiYearProjection?: {
    currentYearTax: number;
    fiveYearProjectedTax: number;
    recommendedActions: string[];
  };
  
  // Natural language summary
  summary: string;
}

/**
 * Orchestrate tax optimization using Claude Opus 4.1
 */
export async function analyzeTax(
  context: FinancialContext,
  userQuestion: string
): Promise<TaxAnalysis> {
  const client = getReasoningClient();
  
  // Build structured prompt for CFO-level analysis
  const prompt = buildTaxPrompt(context, userQuestion);
  
  // Call Claude Opus 4.1 with structured output request
  const response = await client.chat({
    messages: [
      {
        role: 'system',
        content: TAX_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.2, // Very low temperature for tax calculations
    maxTokens: 2000,
  });
  
  // Parse structured JSON response
  const analysis = parseTaxResponse(response.text);
  
  return analysis;
}

/**
 * System prompt for tax analysis
 */
const TAX_SYSTEM_PROMPT = `You are Twealth AI's tax optimization specialist - a CFO-level financial advisor helping users minimize their tax burden.

Your task is to analyze the user's tax situation in Twealth and provide optimization strategies.

**Analysis Framework:**
1. Current Tax Position: Estimate current marginal tax bracket
2. Roth vs Traditional: Recommend optimal retirement account strategy
3. Tax Optimization: Identify opportunities to reduce tax burden
4. Multi-Year Planning: Project tax implications over time
5. Implementation: Provide actionable steps

**Output Requirements:**
Return a JSON object with this exact structure:
\`\`\`json
{
  "rothVsTraditional": {
    "recommendation": "roth",
    "reason": "Currently in 22% bracket, expect 12% in retirement (lower bracket = Roth wins)",
    "currentBracket": "22%",
    "projectedRetirementBracket": "12%",
    "splitRatio": null
  },
  "strategies": [
    {
      "strategy": "Max out employer 401k match",
      "estimatedSavings": 1200,
      "complexity": "low",
      "description": "Free money + reduces taxable income"
    },
    {
      "strategy": "Contribute to Roth IRA",
      "estimatedSavings": 0,
      "complexity": "low",
      "description": "Tax-free growth and withdrawals in retirement"
    }
  ],
  "multiYearProjection": {
    "currentYearTax": 15000,
    "fiveYearProjectedTax": 78000,
    "recommendedActions": [
      "Increase 401k contributions to reduce taxable income",
      "Consider Roth conversions in low-income years"
    ]
  },
  "summary": "Natural language summary with actionable next steps"
}
\`\`\`

**Key Principles:**
- Roth if expect higher bracket in retirement (young, low earner)
- Traditional if expect lower bracket in retirement (peak earner, near retirement)
- Employer match always comes before Roth vs Traditional debate
- Tax diversification: Have both Roth and Traditional for flexibility
- Standard deduction 2025: $14,600 single, $29,200 married
- 2025 Tax Brackets (single): 10% ($0-$11,600), 12% ($11,600-$47,150), 22% ($47,150-$100,525), 24% ($100,525-$191,950), 32% ($191,950-$243,725), 35% ($243,725-$609,350), 37% ($609,350+)
- Capital gains: 0% (income <$47,025), 15% ($47,025-$518,900), 20% ($518,900+)

**Tone:** Professional, clear, actionable. Explain trade-offs. Acknowledge complexity but simplify.`;

/**
 * Build tax analysis prompt with user context (enriched with filing status, deductions, etc.)
 */
function buildTaxPrompt(context: FinancialContext, userQuestion: string): string {
  const { user, income, expenses, assets, debts } = context;
  
  // Calculate tax-relevant metrics
  const annualIncome = income.sources.reduce((sum, s) => sum + s.amount, 0) * 12;
  const monthlySurplus = income.monthlyNet;
  
  // Calculate investment income (simplified estimate - 2% dividend yield assumption)
  const investmentAssets = assets
    .filter(a => a.type === 'equity' || a.type === 'bond')
    .reduce((sum, a) => sum + a.value, 0);
  const estimatedInvestmentIncome = investmentAssets * 0.02; // Annual dividends
  
  // Calculate mortgage interest deduction potential (from real estate debts)
  const mortgageDebt = debts
    .filter(d => d.name.toLowerCase().includes('mortgage') || d.name.toLowerCase().includes('home'))
    .reduce((sum, d) => sum + (d.balance * (d.apr / 100)), 0);
  
  let prompt = `**User Question:** ${userQuestion}\n\n`;
  
  prompt += `**Tax-Relevant Information:**\n`;
  prompt += `- Estimated Annual W-2 Income: $${annualIncome.toLocaleString()}\n`;
  prompt += `- Estimated Investment Income: $${estimatedInvestmentIncome.toLocaleString()} (from dividends/interest)\n`;
  prompt += `- Monthly Surplus: $${monthlySurplus.toLocaleString()}\n`;
  prompt += `- Region: ${user.region || 'US'}\n`;
  prompt += `- Filing Status: Assume single (user should specify if married)\n`;
  prompt += `- Estimated Mortgage Interest Deduction: $${mortgageDebt.toLocaleString()}\n\n`;
  
  prompt += `**Investment Assets by Type:**\n`;
  const assetsByType = assets.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + a.value;
    return acc;
  }, {} as Record<string, number>);
  
  for (const [type, value] of Object.entries(assetsByType)) {
    prompt += `- ${type}: $${value.toLocaleString()}\n`;
  }
  
  prompt += `\n**Note:** Adjust recommendations based on filing status (single vs married) and itemized deductions.\n\n`;
  
  prompt += `Analyze this tax situation and provide optimization strategies. `;
  prompt += `Return ONLY the JSON object specified in the system prompt, no additional text.`;
  
  return prompt;
}

/**
 * Parse Claude's response into structured TaxAnalysis with strict validation
 */
function parseTaxResponse(responseText: string): TaxAnalysis {
  // Extract JSON from response (Claude might wrap it in markdown)
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                    responseText.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error(`Tax orchestrator: No JSON found in Claude response. Response: ${responseText.substring(0, 200)}`);
  }
  
  const jsonText = jsonMatch[1] || jsonMatch[0];
  let parsed: unknown;
  
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Tax orchestrator: JSON parse error. ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Validate with Zod schema
  const result = TaxAnalysisSchema.safeParse(parsed);
  
  if (!result.success) {
    console.error('Tax analysis validation failed:', result.error.errors);
    throw new Error(`Tax orchestrator: Invalid response structure. Errors: ${JSON.stringify(result.error.errors)}`);
  }
  
  return result.data;
}

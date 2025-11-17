/**
 * Portfolio Orchestrator - CFO-level portfolio optimization
 * 
 * Provides:
 * - Asset allocation recommendations
 * - Rebalancing strategies
 * - Risk-adjusted returns analysis
 * - Diversification scoring
 */

import type { FinancialContext } from '../contextBuilder';
import { getReasoningClient } from '../clients';
import { z } from 'zod';

/**
 * Zod schema for portfolio analysis validation
 */
const PortfolioAnalysisSchema = z.object({
  health: z.object({
    diversificationScore: z.number().min(0).max(100),
    riskScore: z.number().min(0).max(100),
    expectedReturn: z.number(),
    status: z.enum(['well_diversified', 'concentrated', 'needs_rebalancing']),
  }),
  allocation: z.object({
    current: z.record(z.number()),
    target: z.record(z.number()),
    rebalancingNeeded: z.boolean(),
    rebalancingSteps: z.array(z.object({
      action: z.enum(['buy', 'sell']),
      asset: z.string(),
      amount: z.number().min(0),
      reason: z.string().min(10),
    })).optional(),
  }),
  risk: z.object({
    currentRisk: z.enum(['low', 'medium', 'high']),
    appropriateForGoals: z.boolean(),
    recommendations: z.array(z.string()),
  }),
  summary: z.string().min(50),
});

/**
 * Structured portfolio analysis result
 */
export interface PortfolioAnalysis {
  // Current portfolio health
  health: {
    diversificationScore: number; // 0-100
    riskScore: number; // 0-100 (higher = riskier)
    expectedReturn: number; // Annual percentage
    status: 'well_diversified' | 'concentrated' | 'needs_rebalancing';
  };
  
  // Recommended asset allocation
  allocation: {
    current: Record<string, number>; // e.g., {equity: 60, bonds: 30, cash: 10}
    target: Record<string, number>;
    rebalancingNeeded: boolean;
    rebalancingSteps?: Array<{
      action: 'buy' | 'sell';
      asset: string;
      amount: number;
      reason: string;
    }>;
  };
  
  // Risk analysis
  risk: {
    currentRisk: 'low' | 'medium' | 'high';
    appropriateForGoals: boolean;
    recommendations: string[];
  };
  
  // Natural language summary
  summary: string;
}

/**
 * Orchestrate portfolio optimization using Claude Opus 4.1
 */
export async function analyzePortfolio(
  context: FinancialContext,
  userQuestion: string
): Promise<PortfolioAnalysis> {
  const client = getReasoningClient();
  
  // Build structured prompt for CFO-level analysis
  const prompt = buildPortfolioPrompt(context, userQuestion);
  
  // Call Claude Opus 4.1 with structured output request
  const response = await client.chat({
    messages: [
      {
        role: 'system',
        content: PORTFOLIO_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3, // Lower temperature for financial analysis
    maxTokens: 2000,
  });
  
  // Parse structured JSON response
  const analysis = parsePortfolioResponse(response.text);
  
  return analysis;
}

/**
 * System prompt for portfolio analysis
 */
const PORTFOLIO_SYSTEM_PROMPT = `You are Twealth AI's portfolio optimization specialist - a CFO-level financial advisor helping users build wealth through smart investing.

Your task is to analyze the user's investment portfolio in Twealth and provide optimization recommendations.

**Analysis Framework:**
1. Portfolio Inventory: Review current asset allocation across types
2. Diversification Analysis: Assess concentration risk
3. Risk Assessment: Evaluate appropriateness for user's goals and horizon
4. Rebalancing Strategy: Recommend adjustments if needed
5. Expected Returns: Project risk-adjusted returns

**Output Requirements:**
Return a JSON object with this exact structure:
\`\`\`json
{
  "health": {
    "diversificationScore": 75,
    "riskScore": 65,
    "expectedReturn": 7.5,
    "status": "well_diversified"
  },
  "allocation": {
    "current": {
      "equity": 60,
      "bonds": 30,
      "cash": 10
    },
    "target": {
      "equity": 70,
      "bonds": 25,
      "cash": 5
    },
    "rebalancingNeeded": true,
    "rebalancingSteps": [
      {
        "action": "buy",
        "asset": "equity",
        "amount": 5000,
        "reason": "Increase growth exposure for long horizon"
      }
    ]
  },
  "risk": {
    "currentRisk": "medium",
    "appropriateForGoals": true,
    "recommendations": [
      "Portfolio risk level matches 25-year retirement horizon",
      "Consider adding bonds as you approach retirement"
    ]
  },
  "summary": "Natural language summary with actionable next steps"
}
\`\`\`

**Key Principles:**
- Diversification reduces risk without sacrificing returns
- Equities for growth (>10 year horizon), bonds for stability
- Rule of 110: Target stock allocation = 110 - age (adjustable)
- Rebalance when allocation drifts 5%+ from target
- Expected returns (historical): Stocks 10%, Bonds 5%, Cash 2%
- Crypto is high-risk speculative (limit to 5-10% max)
- Don't chase past performance - focus on asset allocation
- Tax-loss harvesting can reduce tax burden

**Tone:** Professional, clear, actionable. No jargon. Explain trade-offs.`;

/**
 * Build portfolio analysis prompt with enhanced asset categorization
 */
function buildPortfolioPrompt(context: FinancialContext, userQuestion: string): string {
  const { user, assets, goals } = context;
  
  // Calculate total portfolio value
  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
  
  // Safeguard: Handle zero assets case early
  if (totalValue === 0 || assets.length === 0) {
    let prompt = `**User Question:** ${userQuestion}\n\n`;
    prompt += `**Portfolio Information:**\n`;
    prompt += `- Total Portfolio Value: $0\n`;
    prompt += `- No assets found. User is starting from scratch.\n`;
    prompt += `- User Age: ${user.age || 'Not provided'}\n`;
    prompt += `- Risk Tolerance: ${user.riskTolerance || 'medium'}\n\n`;
    
    if (goals.length > 0) {
      prompt += `**Financial Goals:**\n`;
      goals.forEach(g => {
        const yearsToGoal = Math.floor(g.horizonMonths / 12);
        prompt += `- ${g.name}: $${g.target.toLocaleString()} in ${yearsToGoal} years\n`;
      });
      prompt += `\n`;
    }
    
    prompt += `Provide recommendations for starting a portfolio from zero. `;
    prompt += `Return ONLY the JSON object specified in the system prompt, no additional text.`;
    return prompt;
  }
  
  // Categorize assets by liquidity and purpose
  const liquidAssets = assets.filter(a => ['cash', 'equity', 'bond'].includes(a.type));
  const illiquidAssets = assets.filter(a => ['real_estate', 'vehicle', 'crypto'].includes(a.type));
  
  const totalLiquid = liquidAssets.reduce((sum, a) => sum + a.value, 0);
  const totalIlliquid = illiquidAssets.reduce((sum, a) => sum + a.value, 0);
  
  // Calculate allocation percentages
  const allocationByType = assets.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + a.value;
    return acc;
  }, {} as Record<string, number>);
  
  let prompt = `**User Question:** ${userQuestion}\n\n`;
  
  prompt += `**Portfolio Information:**\n`;
  prompt += `- Total Portfolio Value: $${totalValue.toLocaleString()}\n`;
  prompt += `- Liquid Assets: $${totalLiquid.toLocaleString()} (${((totalLiquid/totalValue)*100).toFixed(1)}%)\n`;
  prompt += `- Illiquid Assets: $${totalIlliquid.toLocaleString()} (${((totalIlliquid/totalValue)*100).toFixed(1)}%)\n`;
  prompt += `- User Age: ${user.age || 'Not provided'}\n`;
  prompt += `- Risk Tolerance: ${user.riskTolerance || 'medium'}\n\n`;
  
  prompt += `**Asset Allocation by Type:**\n`;
  for (const [type, value] of Object.entries(allocationByType)) {
    const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0.0';
    const liquidityNote = ['cash', 'equity', 'bond'].includes(type) ? ' (liquid)' : ' (illiquid)';
    prompt += `- ${type}${liquidityNote}: ${percentage}% ($${value.toLocaleString()})\n`;
  }
  prompt += `\n`;
  
  if (assets.length > 0) {
    prompt += `**Individual Assets:**\n`;
    assets.forEach((asset, i) => {
      const percentage = totalValue > 0 ? ((asset.value / totalValue) * 100).toFixed(1) : '0.0';
      const liquidityNote = ['cash', 'equity', 'bond'].includes(asset.type) ? ' [Liquid]' : ' [Illiquid]';
      prompt += `${i + 1}. ${asset.name} (${asset.type})${liquidityNote}: $${asset.value.toLocaleString()} (${percentage}%)\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `**Important Considerations:**\n`;
  prompt += `- Only liquid assets (cash, equity, bonds) can be rebalanced easily\n`;
  prompt += `- Real estate and vehicles are illiquid and have different rebalancing strategies\n`;
  prompt += `- Crypto is high-risk and should be limited\n\n`;
  
  if (goals.length > 0) {
    prompt += `**Financial Goals:**\n`;
    goals.forEach(g => {
      const yearsToGoal = Math.floor(g.horizonMonths / 12);
      prompt += `- ${g.name}: $${g.target.toLocaleString()} in ${yearsToGoal} years\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `Analyze this portfolio and provide optimization recommendations. `;
  prompt += `Return ONLY the JSON object specified in the system prompt, no additional text.`;
  
  return prompt;
}

/**
 * Parse Claude's response into structured PortfolioAnalysis with strict validation
 */
function parsePortfolioResponse(responseText: string): PortfolioAnalysis {
  // Extract JSON from response (Claude might wrap it in markdown)
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                    responseText.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error(`Portfolio orchestrator: No JSON found in Claude response. Response: ${responseText.substring(0, 200)}`);
  }
  
  const jsonText = jsonMatch[1] || jsonMatch[0];
  let parsed: unknown;
  
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Portfolio orchestrator: JSON parse error. ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Validate with Zod schema
  const result = PortfolioAnalysisSchema.safeParse(parsed);
  
  if (!result.success) {
    console.error('Portfolio analysis validation failed:', result.error.errors);
    throw new Error(`Portfolio orchestrator: Invalid response structure. Errors: ${JSON.stringify(result.error.errors)}`);
  }
  
  return result.data;
}

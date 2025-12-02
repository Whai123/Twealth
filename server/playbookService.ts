/**
 * AI Playbooks Service
 * 
 * Generates weekly financial reports with:
 * - Financial Pulse score (0-100 health rating)
 * - AI-powered insights (personalized observations)
 * - Action queue (prioritized recommendations)
 * - ROI tracking (savings identified vs implemented)
 * 
 * Uses hybrid AI system (Scout/Sonnet/GPT-5/Opus) based on user's tier
 */

import type { IStorage } from './storage';
import { generateHybridAdvice } from './ai/hybridAIService';
import type { ModelAccess } from './ai/hybridAIService';
import type { InsertPlaybook } from '@shared/schema';

interface PlaybookInsight {
  text: string;
  tag: string; // "spending", "saving", "goal", "budget", "investment"
  severity: "high" | "medium" | "low";
}

interface PlaybookAction {
  title: string;
  description: string;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  deepLink: string; // Route to relevant page
}

/**
 * Calculate financial health score (0-100) based on multiple factors
 */
export async function calculateFinancialHealthScore(
  userId: string,
  storage: IStorage
): Promise<{ score: number; components: Record<string, number> }> {
  // Get user's financial data - fetch all in parallel for efficiency
  const [transactions, goals, budgets, profile, prefs, debts] = await Promise.all([
    storage.getTransactionsByUserId(userId, 90), // Last 90 days
    storage.getFinancialGoalsByUserId(userId),
    storage.getBudgetsByUserId(userId),
    storage.getUserFinancialProfile(userId),
    storage.getUserPreferences(userId),
    storage.getUserDebts(userId), // Moved to parallel for performance
  ]);

  // Component 1: Savings Rate (30 points)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
  const income = recentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const expenses = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const savingsScore = Math.min((savingsRate / 20) * 30, 30); // 20%+ savings = full 30 points

  // Component 2: Emergency Fund Coverage (25 points)
  const monthlySavingsEstimate = parseFloat(prefs?.currentSavingsEstimate?.toString() || '0');
  const monthlyExpenseEstimate = parseFloat(prefs?.monthlyExpensesEstimate?.toString() || '0');
  const emergencyMonths = monthlyExpenseEstimate > 0 
    ? monthlySavingsEstimate / monthlyExpenseEstimate 
    : 0;
  const emergencyScore = Math.min((emergencyMonths / 6) * 25, 25); // 6 months = full 25 points

  // Component 3: Goal Progress (20 points)
  const activeGoals = goals.filter(g => g.status === 'active');
  const goalProgress = activeGoals.length > 0
    ? activeGoals.reduce((avg, g) => {
        const current = parseFloat(g.currentAmount || '0');
        const target = parseFloat(g.targetAmount.toString());
        return avg + (current / target) * 100;
      }, 0) / activeGoals.length
    : 0;
  const goalScore = (goalProgress / 100) * 20;

  // Component 4: Budget Adherence (15 points)
  const budgetAdherence = budgets.length > 0
    ? budgets.reduce((avg, b) => {
        const spent = recentTransactions
          .filter(t => t.category === b.category && t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
        const limit = parseFloat(b.monthlyLimit.toString());
        const adherence = limit > 0 ? Math.max(0, (1 - (spent / limit)) * 100) : 0;
        return avg + adherence;
      }, 0) / budgets.length
    : 50; // Neutral score if no budgets
  const budgetScore = (budgetAdherence / 100) * 15;

  // Component 5: Debt Management (10 points)
  // debts already fetched in parallel above
  const totalDebt = debts.reduce((sum, d) => {
    const remaining = d.originalAmount ? parseFloat(d.originalAmount.toString()) : 0;
    return sum + remaining;
  }, 0);
  const monthlyIncomeEstimate = parseFloat(prefs?.monthlyIncomeEstimate?.toString() || '0');
  const debtToIncome = monthlyIncomeEstimate > 0 ? (totalDebt / (monthlyIncomeEstimate * 12)) : 0;
  const debtScore = Math.max(0, 10 - (debtToIncome * 10)); // Lower debt = higher score

  const finalScore = Math.round(
    savingsScore + emergencyScore + goalScore + budgetScore + debtScore
  );

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    components: {
      savingsRate: Math.round(savingsScore),
      emergencyFund: Math.round(emergencyScore),
      goalProgress: Math.round(goalScore),
      budgetAdherence: Math.round(budgetScore),
      debtManagement: Math.round(debtScore),
    },
  };
}

/**
 * Generate weekly AI financial playbook
 */
export async function generateWeeklyPlaybook(
  userId: string,
  storage: IStorage,
  tier: 'free' | 'pro' | 'enterprise'
): Promise<InsertPlaybook> {
  // Calculate week boundaries (Monday to Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStartDate = new Date(now);
  weekStartDate.setDate(now.getDate() + daysToMonday);
  weekStartDate.setHours(0, 0, 0, 0);
  
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);
  weekEndDate.setHours(23, 59, 59, 999);

  // Get last week's playbook for delta calculation
  const existingPlaybooks = await storage.getPlaybooksByUserId(userId, 2);
  const lastPlaybook = existingPlaybooks.length > 0 ? existingPlaybooks[0] : null;

  // Calculate current financial health score
  const { score: financialHealthScore, components} = await calculateFinancialHealthScore(userId, storage);
  const scoreDelta = lastPlaybook 
    ? financialHealthScore - lastPlaybook.financialHealthScore 
    : 0;
  
  const confidenceBand: "improving" | "stable" | "declining" = 
    scoreDelta > 5 ? "improving" :
    scoreDelta < -5 ? "declining" : "stable";

  // Determine AI model based on tier
  const modelToUse: ModelAccess = 
    tier === 'enterprise' ? 'opus' : // CFO-level for Enterprise
    tier === 'pro' ? 'sonnet' : // Smart reasoning for Pro
    'scout'; // Fast for Free

  // Generate insights using AI
  const insightsCount = tier === 'enterprise' ? 7 : tier === 'pro' ? 5 : 2;
  
  // Use simpler plain text prompt to avoid tool-calling issues with Scout/Llama
  const insightsPrompt = `You are a financial analyst. Analyze this user's financial data and provide ${insightsCount} key insights.

Financial Health Score: ${financialHealthScore}/100 (${confidenceBand})
Score Components:
- Savings Rate: ${components.savingsRate}/30
- Emergency Fund: ${components.emergencyFund}/25
- Goal Progress: ${components.goalProgress}/20
- Budget Adherence: ${components.budgetAdherence}/15
- Debt Management: ${components.debtManagement}/10

Respond with ONLY a valid JSON array. No other text before or after.
Each object must have exactly these fields:
- "text": a short insight sentence
- "tag": EXACTLY ONE of these words: spending, saving, goal, budget, investment (pick the single most relevant one)
- "severity": EXACTLY ONE of: high, medium, low

Example format:
[{"text": "Your savings rate is strong at 20%.", "tag": "saving", "severity": "low"}]

Provide ${insightsCount} insights focused on actionable observations.`;

  let insights: PlaybookInsight[] = [];
  let totalTokensUsed = 0;
  
  try {
    const aiResponse = await generateHybridAdvice(
      userId,
      insightsPrompt,
      storage,
      { forceModel: modelToUse, skipTools: true }
    );
    
    totalTokensUsed += (aiResponse.tokensIn || 0) + (aiResponse.tokensOut || 0);

    // Parse insights from AI response
    const jsonMatch = aiResponse.answer.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate and sanitize each insight
      insights = parsed.map((item: any) => {
        // Normalize tag - take first word if pipe-separated
        let tag = String(item.tag || 'goal').toLowerCase().trim();
        if (tag.includes('|')) tag = tag.split('|')[0].trim();
        if (!['spending', 'saving', 'goal', 'budget', 'investment'].includes(tag)) tag = 'goal';
        
        // Normalize severity
        let severity = String(item.severity || 'medium').toLowerCase().trim();
        if (!['high', 'medium', 'low'].includes(severity)) severity = 'medium';
        
        return {
          text: String(item.text || 'Financial insight'),
          tag,
          severity: severity as 'high' | 'medium' | 'low',
        };
      }).slice(0, insightsCount);
    }
  } catch (error) {
    // AI call failed - use intelligent fallback insights based on actual scores
    console.log('Playbook insights AI failed, using fallback:', error);
  }
  
  // Ensure we always have insights (fallback if AI fails or returns empty)
  if (insights.length === 0) {
    insights = generateFallbackInsights(components, confidenceBand, scoreDelta, insightsCount);
  }

  // Generate actions using AI
  const weakestAreas = Object.entries(components)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 2)
    .map(([key]) => key)
    .join(', ');

  const actionsPrompt = `You are a financial advisor. Based on this analysis, recommend 3 priority actions.

Score: ${financialHealthScore}/100
Weakest Areas: ${weakestAreas}

Respond with ONLY a valid JSON array. No other text.
Each object must have exactly these fields:
- "title": short action title (3-5 words)
- "description": why and how (1-2 sentences)
- "effort": EXACTLY ONE of: low, medium, high
- "impact": EXACTLY ONE of: low, medium, high
- "deepLink": one of these routes: /money-tracking, /financial-goals, /investments, /crypto, /settings

Example:
[{"title": "Review budget limits", "description": "Check if spending categories match your goals.", "effort": "low", "impact": "medium", "deepLink": "/money-tracking"}]

Provide exactly 3 actions.`;

  let actions: PlaybookAction[] = [];
  
  try {
    const actionsResponse = await generateHybridAdvice(
      userId,
      actionsPrompt,
      storage,
      { forceModel: modelToUse, skipTools: true }
    );
    
    totalTokensUsed += (actionsResponse.tokensIn || 0) + (actionsResponse.tokensOut || 0);

    const jsonMatch = actionsResponse.answer.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate and sanitize each action
      actions = parsed.map((item: any) => {
        let effort = String(item.effort || 'medium').toLowerCase().trim();
        if (!['low', 'medium', 'high'].includes(effort)) effort = 'medium';
        
        let impact = String(item.impact || 'medium').toLowerCase().trim();
        if (!['low', 'medium', 'high'].includes(impact)) impact = 'medium';
        
        let deepLink = String(item.deepLink || '/money-tracking');
        if (!deepLink.startsWith('/')) deepLink = '/money-tracking';
        
        return {
          title: String(item.title || 'Take action').substring(0, 50),
          description: String(item.description || 'Improve your finances').substring(0, 200),
          effort: effort as 'low' | 'medium' | 'high',
          impact: impact as 'low' | 'medium' | 'high',
          deepLink,
        };
      }).slice(0, 3);
    }
  } catch (error) {
    console.log('Playbook actions AI failed, using fallback:', error);
  }
  
  // Ensure we always have actions (fallback if AI fails)
  if (actions.length === 0) {
    actions = generateFallbackActions(components, weakestAreas);
  }

  // Calculate ROI (simplified for MVP - can be enhanced later)
  const roiSavings = "0.00"; // Will be updated as users complete actions
  const cumulativeRoi = lastPlaybook && lastPlaybook.cumulativeRoi
    ? (parseFloat(lastPlaybook.cumulativeRoi.toString())).toFixed(2)
    : "0.00";

  const playbook: InsertPlaybook = {
    userId,
    subscriptionId: null, // Will be set by caller if available
    weekStartDate,
    weekEndDate,
    financialHealthScore,
    scoreDelta,
    confidenceBand,
    insights: insights as any, // JSONB type
    insightsCount,
    actions: actions as any, // JSONB type
    actionsCount: 3,
    roiSavings,
    cumulativeRoi,
    forecastLift: scoreDelta > 0 ? `+${scoreDelta}% health improvement this week` : null,
    tier,
    generatedBy: modelToUse,
    generationTimeMs: Math.round(Date.now() - now.getTime()),
    tokensUsed: totalTokensUsed,
  };

  return playbook;
}

/**
 * Generate fallback insights when AI fails
 */
function generateFallbackInsights(
  components: Record<string, number>,
  confidenceBand: string,
  scoreDelta: number,
  count: number
): PlaybookInsight[] {
  const insights: PlaybookInsight[] = [];
  
  // Savings insight
  if (components.savingsRate < 15) {
    insights.push({
      text: "Your savings rate could use improvement. Consider setting aside at least 20% of your income.",
      tag: "saving",
      severity: "high"
    });
  } else if (components.savingsRate >= 25) {
    insights.push({
      text: "Your savings rate is strong. Keep up the good work building your financial cushion.",
      tag: "saving",
      severity: "low"
    });
  }
  
  // Emergency fund insight
  if (components.emergencyFund < 10) {
    insights.push({
      text: "Building an emergency fund should be a priority. Aim for 3-6 months of expenses.",
      tag: "saving",
      severity: "high"
    });
  }
  
  // Budget insight
  if (components.budgetAdherence < 10) {
    insights.push({
      text: "Your spending is exceeding budget limits in some categories. Review and adjust your budgets.",
      tag: "budget",
      severity: "medium"
    });
  } else if (components.budgetAdherence >= 12) {
    insights.push({
      text: "You're staying within your budget limits. Great financial discipline.",
      tag: "budget",
      severity: "low"
    });
  }
  
  // Goal progress insight
  if (components.goalProgress < 10) {
    insights.push({
      text: "Your financial goals need attention. Consider making regular contributions toward them.",
      tag: "goal",
      severity: "medium"
    });
  }
  
  // Debt insight
  if (components.debtManagement >= 8) {
    insights.push({
      text: "Your debt management is excellent. Focus on maintaining this healthy balance.",
      tag: "spending",
      severity: "low"
    });
  }
  
  // Trend insight
  if (scoreDelta > 5) {
    insights.push({
      text: "Your financial health is improving. The positive trend shows your efforts are paying off.",
      tag: "goal",
      severity: "low"
    });
  } else if (scoreDelta < -5) {
    insights.push({
      text: "Your financial health has declined this week. Review recent spending patterns.",
      tag: "spending",
      severity: "high"
    });
  }
  
  // Ensure we have at least the requested count
  while (insights.length < count) {
    insights.push({
      text: `Your financial health is ${confidenceBand}. Continue monitoring your progress.`,
      tag: "goal",
      severity: "medium"
    });
  }
  
  return insights.slice(0, count);
}

/**
 * Generate fallback actions when AI fails
 */
function generateFallbackActions(
  components: Record<string, number>,
  weakestAreas: string
): PlaybookAction[] {
  const actions: PlaybookAction[] = [];
  
  // Always useful actions based on weakest areas
  if (weakestAreas.includes('savingsRate') || weakestAreas.includes('emergencyFund')) {
    actions.push({
      title: "Set up automatic savings",
      description: "Automate transfers to a savings account to build your emergency fund consistently.",
      effort: "low",
      impact: "high",
      deepLink: "/money-tracking"
    });
  }
  
  if (weakestAreas.includes('budgetAdherence')) {
    actions.push({
      title: "Review budget categories",
      description: "Check which categories are over budget and adjust limits or reduce spending.",
      effort: "low",
      impact: "medium",
      deepLink: "/money-tracking"
    });
  }
  
  if (weakestAreas.includes('goalProgress')) {
    actions.push({
      title: "Update financial goals",
      description: "Review your goals and make a contribution toward your highest priority target.",
      effort: "medium",
      impact: "high",
      deepLink: "/financial-goals"
    });
  }
  
  // Default actions if we don't have enough
  const defaultActions: PlaybookAction[] = [
    {
      title: "Log recent transactions",
      description: "Keep your financial picture accurate by recording this week's expenses.",
      effort: "low",
      impact: "medium",
      deepLink: "/money-tracking"
    },
    {
      title: "Review investment portfolio",
      description: "Check your investment allocations and consider rebalancing if needed.",
      effort: "medium",
      impact: "medium",
      deepLink: "/investments"
    },
    {
      title: "Set a new savings goal",
      description: "Define a specific financial target to work toward in the coming months.",
      effort: "low",
      impact: "high",
      deepLink: "/financial-goals"
    }
  ];
  
  // Fill up to 3 actions
  for (const action of defaultActions) {
    if (actions.length >= 3) break;
    if (!actions.some(a => a.deepLink === action.deepLink)) {
      actions.push(action);
    }
  }
  
  return actions.slice(0, 3);
}

/**
 * Mark a playbook action as completed and update ROI
 */
export async function completePlaybookAction(
  playbookId: string,
  actionIndex: number,
  estimatedSavings: number,
  storage: IStorage
): Promise<void> {
  const playbook = await storage.getPlaybook(playbookId);
  if (!playbook) {
    throw new Error('Playbook not found');
  }

  // Check for duplicate completion
  const completedIndices = (playbook.completedActionIndices as number[]) || [];
  if (completedIndices.includes(actionIndex)) {
    throw new Error('Action already completed');
  }

  // Update playbook with completed action
  const newActionsCompleted = (playbook.actionsCompleted || 0) + 1;
  const newRoiSavings = parseFloat(playbook.roiSavings?.toString() || '0') + estimatedSavings;
  const newCumulativeRoi = parseFloat(playbook.cumulativeRoi?.toString() || '0') + estimatedSavings;
  const newCompletedIndices = [...completedIndices, actionIndex];

  await storage.updatePlaybook(playbookId, {
    actionsCompleted: newActionsCompleted,
    roiSavings: newRoiSavings.toFixed(2),
    cumulativeRoi: newCumulativeRoi.toFixed(2),
    completedActionIndices: newCompletedIndices,
  });
}

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
  
  const insightsPrompt = `Analyze this user's financial data and provide ${insightsCount} key insights:

**Financial Health Score:** ${financialHealthScore}/100 (${confidenceBand})
**Components:**
- Savings Rate: ${components.savingsRate}/30
- Emergency Fund: ${components.emergencyFund}/25
- Goal Progress: ${components.goalProgress}/20
- Budget Adherence: ${components.budgetAdherence}/15
- Debt Management: ${components.debtManagement}/10

Provide exactly ${insightsCount} insights as a JSON array:
[{"text": "insight text", "tag": "spending|saving|goal|budget|investment", "severity": "high|medium|low"}]

Focus on actionable observations about their financial behavior this week.`;

  const aiResponse = await generateHybridAdvice(
    userId,
    insightsPrompt,
    storage,
    { forceModel: modelToUse }
  );

  // Parse insights from AI response
  let insights: PlaybookInsight[] = [];
  try {
    const jsonMatch = aiResponse.answer.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      insights = JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    // Fallback insights if AI parsing fails
    insights = [
      { text: "Your financial health score is " + confidenceBand, tag: "goal", severity: scoreDelta < -10 ? "high" : "medium" },
      { text: `You're ${components.savingsRate >= 20 ? 'maintaining a healthy' : 'working on improving your'} savings rate`, tag: "saving", severity: "medium" },
    ];
  }

  // Generate actions using AI
  const actionsPrompt = `Based on this financial health analysis, recommend the top 3 priority actions:

**Score:** ${financialHealthScore}/100
**Weakest Areas:** ${Object.entries(components)
  .sort(([, a], [, b]) => a - b)
  .slice(0, 2)
  .map(([key]) => key)
  .join(', ')}

Provide exactly 3 actions as JSON:
[{"title": "action title", "description": "why and how", "effort": "low|medium|high", "impact": "low|medium|high", "deepLink": "/route"}]

Make actions specific, actionable, and include deep links to relevant Twealth pages.`;

  const actionsResponse = await generateHybridAdvice(
    userId,
    actionsPrompt,
    storage,
    { forceModel: modelToUse }
  );

  let actions: PlaybookAction[] = [];
  try {
    const jsonMatch = actionsResponse.answer.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      actions = JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    // Fallback actions
    actions = [
      { title: "Review your budget", description: "Check spending vs limits", effort: "low", impact: "medium", deepLink: "/money-tracking" },
      { title: "Set a new goal", description: "Create a savings target", effort: "medium", impact: "high", deepLink: "/financial-goals" },
      { title: "Track transactions", description: "Log this week's expenses", effort: "low", impact: "medium", deepLink: "/money-tracking" },
    ];
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
    tokensUsed: (aiResponse.tokensIn || 0) + (aiResponse.tokensOut || 0) + (actionsResponse.tokensIn || 0) + (actionsResponse.tokensOut || 0),
  };

  return playbook;
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
  // TODO: Implement once storage methods are added
  // const playbook = await storage.getPlaybook(playbookId);
  // if (!playbook) {
  //   throw new Error('Playbook not found');
  // }

  // const newActionsCompleted = (playbook.actionsCompleted || 0) + 1;
  // const newRoiSavings = parseFloat(playbook.roiSavings?.toString() || '0') + estimatedSavings;
  // const newCumulativeRoi = parseFloat(playbook.cumulativeRoi?.toString() || '0') + estimatedSavings;

  // await storage.updatePlaybook(playbookId, {
  //   actionsCompleted: newActionsCompleted,
  //   roiSavings: newRoiSavings.toFixed(2),
  //   cumulativeRoi: newCumulativeRoi.toFixed(2),
  // });
  throw new Error('Not yet implemented - storage methods needed');
}

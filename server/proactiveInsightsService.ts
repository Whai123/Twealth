import type { IStorage } from './storage';
import type { Transaction, FinancialGoal } from '@shared/schema';

export interface ProactiveInsight {
  id: string;
  type: 'spending_anomaly' | 'savings_opportunity' | 'goal_deadline' | 'budget_warning' | 'achievement';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionable: string;
  emoji: string;
  data?: any;
  createdAt: Date;
}

function generateInsightId(): string {
  return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function generateProactiveInsights(
  storage: IStorage,
  userId: string
): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];

  try {
    const [transactions, goals, prefs, stats] = await Promise.all([
      storage.getTransactionsByUserId(userId, 90),
      storage.getFinancialGoalsByUserId(userId),
      storage.getUserPreferences(userId),
      storage.getUserStats(userId)
    ]);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. SPENDING ANOMALY DETECTION
    
    // Detect unusually large transactions
    const recentTransactions = transactions.filter(t => t.date >= sevenDaysAgo);
    const avgTransactionAmount = recentTransactions.length > 0
      ? recentTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / recentTransactions.length
      : 0;

    recentTransactions.forEach(t => {
      const amount = parseFloat(t.amount);
      if (amount > avgTransactionAmount * 3 && amount > 100) {
        insights.push({
          id: generateInsightId(),
          type: 'spending_anomaly',
          priority: amount > 500 ? 'high' : 'medium',
          title: 'Unusual Large Purchase Detected',
          message: `You spent $${amount.toLocaleString()} on ${t.category} - 3x your average transaction.`,
          actionable: `Review this ${t.category} expense. Was it planned? Consider setting a spending alert for purchases over $${Math.round(avgTransactionAmount * 2)}.`,
          emoji: '',
          data: { transaction: t, avgAmount: avgTransactionAmount },
          createdAt: new Date()
        });
      }
    });

    // Category overspending
    const categorySpending = new Map<string, number>();
    const lastMonthTransactions = transactions.filter(t => 
      t.type === 'expense' && t.date >= thirtyDaysAgo
    );

    lastMonthTransactions.forEach(t => {
      const category = t.category;
      categorySpending.set(category, (categorySpending.get(category) || 0) + parseFloat(t.amount));
    });

    const monthlyIncome = stats.monthlyIncome || parseFloat(prefs?.monthlyIncomeEstimate?.toString() || '0');
    
    categorySpending.forEach((amount, category) => {
      const percentOfIncome = monthlyIncome > 0 ? (amount / monthlyIncome) * 100 : 0;
      
      if (percentOfIncome > 30 && category !== 'housing' && category !== 'rent') {
        insights.push({
          id: generateInsightId(),
          type: 'spending_anomaly',
          priority: 'high',
          title: `High ${category} Spending`,
          message: `Your ${category} spending is $${amount.toLocaleString()}/month (${percentOfIncome.toFixed(0)}% of income).`,
          actionable: `This is above the recommended 20% limit. Try reducing ${category} spending by 25% to save $${Math.round(amount * 0.25).toLocaleString()}/month.`,
          emoji: '',
          data: { category, amount, percentOfIncome },
          createdAt: new Date()
        });
      }
    });

    // 2. SAVINGS OPPORTUNITIES

    // Detect recurring subscriptions
    const subscriptionKeywords = ['subscription', 'netflix', 'spotify', 'gym', 'membership', 'monthly'];
    const subscriptions = transactions.filter(t =>
      t.type === 'expense' &&
      subscriptionKeywords.some(keyword => 
        t.description?.toLowerCase().includes(keyword) || 
        t.category.toLowerCase().includes(keyword)
      )
    );

    if (subscriptions.length >= 3) {
      const totalSubCost = subscriptions.reduce((sum, s) => sum + parseFloat(s.amount), 0);
      insights.push({
        id: generateInsightId(),
        type: 'savings_opportunity',
        priority: 'medium',
        title: 'Subscription Audit Recommended',
        message: `You have ${subscriptions.length} subscriptions costing ~$${totalSubCost.toLocaleString()}/month.`,
        actionable: `Review and cancel unused subscriptions. Even cutting 2 subscriptions could save $${Math.round(totalSubCost * 0.3).toLocaleString()}/month = $${Math.round(totalSubCost * 0.3 * 12).toLocaleString()}/year.`,
        emoji: '',
        data: { subscriptions, totalCost: totalSubCost },
        createdAt: new Date()
      });
    }

    // High dining out spending
    const diningCategories = ['dining', 'food', 'restaurant', 'delivery'];
    const diningSpend = lastMonthTransactions
      .filter(t => diningCategories.some(cat => t.category.toLowerCase().includes(cat)))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    if (diningSpend > 500) {
      const cookingSavings = diningSpend * 0.6; // Cooking saves ~60%
      insights.push({
        id: generateInsightId(),
        type: 'savings_opportunity',
        priority: 'medium',
        title: 'Dining Out Opportunity',
        message: `You spent $${diningSpend.toLocaleString()} on dining out this month.`,
        actionable: `Cooking 3 more meals/week could save $${Math.round(cookingSavings).toLocaleString()}/month. Use meal prep Sunday to save time and money.`,
        emoji: '',
        data: { diningSpend, potentialSavings: cookingSavings },
        createdAt: new Date()
      });
    }

    // Recommend high-yield savings if cash heavy
    const totalSavings = stats.totalSavings || parseFloat(prefs?.currentSavingsEstimate?.toString() || '0');
    if (totalSavings > 10000) {
      insights.push({
        id: generateInsightId(),
        type: 'savings_opportunity',
        priority: 'low',
        title: 'High-Yield Savings Opportunity',
        message: `You have $${totalSavings.toLocaleString()} in savings. Are you earning 4-5% interest?`,
        actionable: `Move funds to a high-yield savings account (4-5% APY) to earn $${Math.round(totalSavings * 0.045 / 12).toLocaleString()}/month passive income instead of 0.01%.`,
        emoji: '',
        data: { totalSavings, potentialInterest: totalSavings * 0.045 },
        createdAt: new Date()
      });
    }

    // 3. GOAL DEADLINE REMINDERS

    const activeGoals = goals.filter(g => g.status === 'active');
    activeGoals.forEach(goal => {
      const targetDate = new Date(goal.targetDate);
      const daysUntilDeadline = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const targetAmount = parseFloat(goal.targetAmount);
      const currentAmount = parseFloat(goal.currentAmount || '0');
      const remaining = targetAmount - currentAmount;
      const percentComplete = (currentAmount / targetAmount) * 100;

      // Urgent deadline approaching
      if (daysUntilDeadline <= 30 && percentComplete < 90) {
        insights.push({
          id: generateInsightId(),
          type: 'goal_deadline',
          priority: 'high',
          title: `Goal Deadline Approaching: ${goal.title}`,
          message: `Only ${daysUntilDeadline} days left! You're ${percentComplete.toFixed(0)}% there.`,
          actionable: `Need $${remaining.toLocaleString()} more. Save $${Math.round(remaining / (daysUntilDeadline / 30)).toLocaleString()}/month or extend deadline by ${Math.ceil(remaining / (monthlyIncome * 0.1))} months.`,
          emoji: '',
          data: { goal, daysRemaining: daysUntilDeadline, remaining },
          createdAt: new Date()
        });
      }

      // Milestone reminder
      if (percentComplete >= 45 && percentComplete < 55) {
        insights.push({
          id: generateInsightId(),
          type: 'achievement',
          priority: 'low',
          title: `Almost Halfway: ${goal.title}`,
          message: `You're at ${percentComplete.toFixed(0)}%! The 50% milestone is just $${(targetAmount * 0.5 - currentAmount).toLocaleString()} away.`,
          actionable: `One more push to hit 50%! Reaching this milestone will give you major momentum.`,
          emoji: '',
          data: { goal, percentComplete },
          createdAt: new Date()
        });
      }
    });

    // 4. BUDGET WARNINGS

    const monthlyExpenses = lastMonthTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const budgetEstimate = parseFloat(prefs?.monthlyExpensesEstimate?.toString() || '0');

    if (budgetEstimate > 0 && monthlyExpenses > budgetEstimate * 1.2) {
      const overspend = monthlyExpenses - budgetEstimate;
      insights.push({
        id: generateInsightId(),
        type: 'budget_warning',
        priority: 'high',
        title: 'Budget Exceeded',
        message: `You've spent $${monthlyExpenses.toLocaleString()} this month, ${((monthlyExpenses / budgetEstimate - 1) * 100).toFixed(0)}% over your $${budgetEstimate.toLocaleString()} budget.`,
        actionable: `Review discretionary spending and cut back $${Math.round(overspend).toLocaleString()} to stay on track. Top categories to review: ${Array.from(categorySpending.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([cat]) => cat).join(', ')}.`,
        emoji: '',
        data: { monthlyExpenses, budgetEstimate, overspend },
        createdAt: new Date()
      });
    }

    // 5. ACHIEVEMENT CELEBRATIONS

    // Savings streak
    const last3MonthsIncome = transactions
      .filter(t => t.type === 'income' && t.date >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const last3MonthsExpenses = transactions
      .filter(t => t.type === 'expense' && t.date >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    if (last3MonthsIncome > last3MonthsExpenses && last3MonthsIncome > 0) {
      const savingsRate = ((last3MonthsIncome - last3MonthsExpenses) / last3MonthsIncome) * 100;
      if (savingsRate >= 15) {
        insights.push({
          id: generateInsightId(),
          type: 'achievement',
          priority: 'low',
          title: 'Impressive Savings Discipline!',
          message: `You've maintained a ${savingsRate.toFixed(0)}% savings rate for 3 months straight!`,
          actionable: `You're building serious wealth! At this rate, you'll save $${Math.round((last3MonthsIncome - last3MonthsExpenses) / 3 * 12).toLocaleString()}/year. Keep this momentum!`,
          emoji: '',
          data: { savingsRate, monthlySavings: (last3MonthsIncome - last3MonthsExpenses) / 3 },
          createdAt: new Date()
        });
      }
    }

    // Sort insights by priority (high -> medium -> low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return insights;

  } catch (error) {
    console.error('Error generating proactive insights:', error);
    throw error;
  }
}

/**
 * Weekly Financial Summary Generator
 * Provides a comprehensive overview of the user's financial week
 */
export interface WeeklySummary {
  weekStarting: string; // ISO date string
  weekEnding: string; // ISO date string
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number;
  topSpendingCategories: Array<{ category: string; amount: number; percentOfTotal: number }>;
  comparisonToPreviousWeek: {
    incomeChange: number;
    expenseChange: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  goalProgress: Array<{ goalName: string; previousPercent: number; currentPercent: number; change: number }>;
  keyHighlights: string[];
  actionItems: string[];
}

export async function generateWeeklySummary(
  storage: IStorage,
  userId: string
): Promise<WeeklySummary> {
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [transactions, goals, prefs] = await Promise.all([
    storage.getTransactionsByUserId(userId, 30),
    storage.getFinancialGoalsByUserId(userId),
    storage.getUserPreferences(userId)
  ]);

  // This week's transactions
  const thisWeekTransactions = transactions.filter(t => t.date >= weekStart);
  const previousWeekTransactions = transactions.filter(t => t.date >= previousWeekStart && t.date < weekStart);

  // Calculate totals
  const thisWeekIncome = thisWeekTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const thisWeekExpenses = thisWeekTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const netCashFlow = thisWeekIncome - thisWeekExpenses;
  const savingsRate = thisWeekIncome > 0 ? ((thisWeekIncome - thisWeekExpenses) / thisWeekIncome) * 100 : 0;

  // Previous week comparison
  const prevWeekIncome = previousWeekTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const prevWeekExpenses = previousWeekTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // Handle edge cases for percentage calculations (avoid NaN/Infinity)
  const incomeChange = prevWeekIncome > 0 
    ? Math.round(((thisWeekIncome - prevWeekIncome) / prevWeekIncome) * 100 * 10) / 10 
    : (thisWeekIncome > 0 ? 100 : 0);
  const expenseChange = prevWeekExpenses > 0 
    ? Math.round(((thisWeekExpenses - prevWeekExpenses) / prevWeekExpenses) * 100 * 10) / 10 
    : (thisWeekExpenses > 0 ? 100 : 0);

  // Determine trend with null-safe comparison
  const prevNetCashFlow = prevWeekIncome - prevWeekExpenses;
  let trend: 'improving' | 'stable' | 'declining';
  if (prevNetCashFlow === 0 && netCashFlow === 0) {
    trend = 'stable';
  } else if (prevNetCashFlow === 0) {
    trend = netCashFlow > 0 ? 'improving' : 'declining';
  } else if (netCashFlow > prevNetCashFlow * 1.1) {
    trend = 'improving';
  } else if (netCashFlow < prevNetCashFlow * 0.9) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }

  // Top spending categories
  const categoryTotals = new Map<string, number>();
  thisWeekTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryTotals.set(t.category, (categoryTotals.get(t.category) || 0) + parseFloat(t.amount));
    });

  const topSpendingCategories = Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentOfTotal: thisWeekExpenses > 0 ? (amount / thisWeekExpenses) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Goal progress
  const goalProgress = goals
    .filter(g => g.status === 'active')
    .slice(0, 3)
    .map(goal => {
      const targetAmount = parseFloat(goal.targetAmount);
      const currentAmount = parseFloat(goal.currentAmount || '0');
      const currentPercent = (currentAmount / targetAmount) * 100;
      const change = netCashFlow > 0 ? (netCashFlow / targetAmount) * 100 : 0;
      return {
        goalName: goal.title,
        previousPercent: Math.max(0, currentPercent - change),
        currentPercent,
        change
      };
    });

  // Generate key highlights
  const keyHighlights: string[] = [];
  if (netCashFlow > 0) {
    keyHighlights.push(`Positive cash flow: +$${netCashFlow.toLocaleString()}`);
  } else if (netCashFlow < 0) {
    keyHighlights.push(`Negative cash flow: -$${Math.abs(netCashFlow).toLocaleString()}`);
  }
  if (savingsRate >= 20) {
    keyHighlights.push(`Strong savings rate: ${savingsRate.toFixed(0)}%`);
  }
  if (trend === 'improving') {
    keyHighlights.push('Financial trend improving vs last week');
  }
  if (topSpendingCategories.length > 0) {
    keyHighlights.push(`Top expense: ${topSpendingCategories[0].category} ($${topSpendingCategories[0].amount.toLocaleString()})`);
  }

  // Generate action items
  const actionItems: string[] = [];
  if (savingsRate < 10 && thisWeekIncome > 0) {
    actionItems.push('Consider reducing discretionary spending to boost savings');
  }
  if (expenseChange > 20) {
    actionItems.push(`Expenses up ${expenseChange.toFixed(0)}% - review recent purchases`);
  }
  if (goalProgress.some(g => g.change > 0)) {
    actionItems.push('Keep momentum on your savings goals');
  }
  if (topSpendingCategories.some(c => c.percentOfTotal > 40 && c.category !== 'housing')) {
    const highCat = topSpendingCategories.find(c => c.percentOfTotal > 40 && c.category !== 'housing');
    if (highCat) {
      actionItems.push(`${highCat.category} is ${highCat.percentOfTotal.toFixed(0)}% of spending - consider setting a budget`);
    }
  }

  return {
    weekStarting: weekStart.toISOString(),
    weekEnding: now.toISOString(),
    totalIncome: Math.round(thisWeekIncome * 100) / 100,
    totalExpenses: Math.round(thisWeekExpenses * 100) / 100,
    netCashFlow: Math.round(netCashFlow * 100) / 100,
    savingsRate: Math.round(savingsRate * 10) / 10,
    topSpendingCategories: topSpendingCategories.map(c => ({
      ...c,
      amount: Math.round(c.amount * 100) / 100,
      percentOfTotal: Math.round(c.percentOfTotal * 10) / 10
    })),
    comparisonToPreviousWeek: {
      incomeChange,
      expenseChange,
      trend
    },
    goalProgress: goalProgress.map(g => ({
      ...g,
      previousPercent: Math.round(g.previousPercent * 10) / 10,
      currentPercent: Math.round(g.currentPercent * 10) / 10,
      change: Math.round(g.change * 10) / 10
    })),
    keyHighlights,
    actionItems
  };
}

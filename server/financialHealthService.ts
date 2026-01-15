import type { IStorage } from './storage';

export interface HealthScore {
  overall: number; // 0-100
  breakdown: {
    savingsRate: { score: number; value: number; label: string; recommendation: string };
    emergencyFund: { score: number; months: number; label: string; recommendation: string };
    debtRatio: { score: number; ratio: number; label: string; recommendation: string };
    netWorthGrowth: { score: number; growth: number; label: string; recommendation: string };
    budgetAdherence: { score: number; adherence: number; label: string; recommendation: string };
  };
  grade: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' | 'Critical';
  summary: string;
  topPriority: string;
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Needs Improvement';
  return 'Critical';
}

function getGrade(overall: number): 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' | 'Critical' {
  if (overall >= 90) return 'Excellent';
  if (overall >= 75) return 'Good';
  if (overall >= 60) return 'Fair';
  if (overall >= 40) return 'Needs Improvement';
  return 'Critical';
}

export async function calculateFinancialHealth(
  storage: IStorage,
  userId: string
): Promise<HealthScore> {
  try {
    const [stats, prefs, transactions, goals] = await Promise.all([
      storage.getUserStats(userId),
      storage.getUserPreferences(userId),
      storage.getTransactionsByUserId(userId, 90), // Last 90 days
      storage.getFinancialGoalsByUserId(userId)
    ]);

    // Detect new users with no meaningful financial data
    const hasNoTransactions = transactions.length === 0;
    const hasNoIncome = !stats.monthlyIncome && !prefs?.monthlyIncomeEstimate;
    const hasNoGoals = goals.length === 0;
    const isNewUser = hasNoTransactions && hasNoIncome && hasNoGoals;

    // For new users, return a welcoming "Getting Started" state
    if (isNewUser) {
      return {
        overall: 50, // Neutral starting score
        breakdown: {
          savingsRate: { score: 50, value: 0, label: 'Getting Started', recommendation: 'Add your income and expenses to track your savings rate.' },
          emergencyFund: { score: 50, months: 0, label: 'Getting Started', recommendation: 'Tell us about your savings to calculate your emergency fund coverage.' },
          debtRatio: { score: 100, ratio: 0, label: 'No Debt Detected', recommendation: 'Great! No debt payments found. Keep it that way!' },
          netWorthGrowth: { score: 50, growth: 0, label: 'Getting Started', recommendation: 'As you add transactions, we will track your financial growth.' },
          budgetAdherence: { score: 50, adherence: 50, label: 'Getting Started', recommendation: 'Set up a budget to see how well you\'re sticking to it.' }
        },
        grade: 'Getting Started' as any,
        summary: 'Welcome to Twealth! Add your first transaction or set up your financial profile to get personalized insights and track your progress.',
        topPriority: 'Start by adding a transaction or setting your monthly income in Settings.'
      };
    }

    const monthlyIncome = stats.monthlyIncome ||
      parseFloat(prefs?.monthlyIncomeEstimate?.toString() || '0');

    // Calculate actual monthly expenses from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentExpenses = transactions
      .filter(t => t.type === 'expense' && t.date >= thirtyDaysAgo)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const monthlyExpenses = recentExpenses > 0
      ? recentExpenses
      : parseFloat(prefs?.monthlyExpensesEstimate?.toString() || '0');

    const totalSavings = stats.totalSavings ||
      parseFloat(prefs?.currentSavingsEstimate?.toString() || '0');

    // 1. Savings Rate Score (30% weight)
    const savingsRate = monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
      : 0;

    let savingsScore = 0;
    let savingsLabel = '';
    let savingsRec = '';

    if (savingsRate >= 20) {
      savingsScore = 100;
      savingsLabel = 'Excellent';
      savingsRec = 'Outstanding! Maintain this rate for long-term wealth building.';
    } else if (savingsRate >= 15) {
      savingsScore = 85;
      savingsLabel = 'Very Good';
      savingsRec = 'Great job! Consider increasing to 20% to accelerate your goals.';
    } else if (savingsRate >= 10) {
      savingsScore = 70;
      savingsLabel = 'Good';
      savingsRec = 'Solid foundation. Try to reach 15% by cutting one major expense.';
    } else if (savingsRate >= 5) {
      savingsScore = 50;
      savingsLabel = 'Fair';
      savingsRec = `Critical: At ${savingsRate.toFixed(1)}%, you're saving $${Math.round(monthlyIncome * savingsRate / 100)}/month. Target: $${Math.round(monthlyIncome * 0.15)}/month (15%)`;
    } else if (savingsRate > 0) {
      savingsScore = 25;
      savingsLabel = 'Low';
      savingsRec = `Urgent: Only ${savingsRate.toFixed(1)}% savings rate. Review expenses immediately - start with $${Math.round(monthlyIncome * 0.05)}/month minimum.`;
    } else {
      savingsScore = 0;
      savingsLabel = 'Critical';
      savingsRec = 'CRITICAL: Expenses exceed income. Create emergency budget, cut discretionary spending by 30%.';
    }

    // 2. Emergency Fund Score (25% weight)
    const emergencyFundMonths = monthlyExpenses > 0 ? totalSavings / monthlyExpenses : 0;

    let emergencyScore = 0;
    let emergencyLabel = '';
    let emergencyRec = '';

    if (emergencyFundMonths >= 6) {
      emergencyScore = 100;
      emergencyLabel = 'Excellent';
      emergencyRec = 'Excellent! You have 6+ months of expenses saved. Focus on investing excess.';
    } else if (emergencyFundMonths >= 3) {
      emergencyScore = 75;
      emergencyLabel = 'Good';
      emergencyRec = `Good start at ${emergencyFundMonths.toFixed(1)} months. Target: ${(6 - emergencyFundMonths).toFixed(1)} more months ($${Math.round(monthlyExpenses * (6 - emergencyFundMonths)).toLocaleString()})`;
    } else if (emergencyFundMonths >= 1) {
      emergencyScore = 50;
      emergencyLabel = 'Fair';
      emergencyRec = `Only ${emergencyFundMonths.toFixed(1)} months saved. Save $${Math.round(monthlyExpenses * (3 - emergencyFundMonths)).toLocaleString()} more for 3-month minimum.`;
    } else if (emergencyFundMonths > 0) {
      emergencyScore = 25;
      emergencyLabel = 'Low';
      emergencyRec = `Urgent: Less than 1 month saved. Start emergency fund now - target $${Math.round(monthlyExpenses).toLocaleString()}/month for 3 months.`;
    } else {
      emergencyScore = 0;
      emergencyLabel = 'Critical';
      emergencyRec = `CRITICAL: No emergency fund. Start with $500-$1,000 immediately, then build to 3-6 months expenses ($${Math.round(monthlyExpenses * 3).toLocaleString()}-$${Math.round(monthlyExpenses * 6).toLocaleString()})`;
    }

    // 3. Debt Ratio Score (20% weight)
    // Calculate debt payments from transaction history
    const debtCategories = ['credit card', 'loan', 'debt', 'mortgage'];
    const monthlyDebtPayments = transactions
      .filter(t =>
        t.type === 'expense' &&
        t.date >= thirtyDaysAgo &&
        debtCategories.some(cat => t.category.toLowerCase().includes(cat))
      )
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const debtRatio = monthlyIncome > 0 ? (monthlyDebtPayments / monthlyIncome) * 100 : 0;

    let debtScore = 0;
    let debtLabel = '';
    let debtRec = '';

    if (debtRatio === 0) {
      debtScore = 100;
      debtLabel = 'Debt Free';
      debtRec = 'Excellent! No debt payments detected. Maximize savings and investments.';
    } else if (debtRatio <= 10) {
      debtScore = 90;
      debtLabel = 'Very Low';
      debtRec = `Manageable at ${debtRatio.toFixed(1)}%. Consider accelerating payoff to save on interest.`;
    } else if (debtRatio <= 20) {
      debtScore = 75;
      debtLabel = 'Moderate';
      debtRec = `${debtRatio.toFixed(1)}% is acceptable. Use avalanche method to pay highest interest debt first.`;
    } else if (debtRatio <= 36) {
      debtScore = 50;
      debtLabel = 'High';
      debtRec = `Warning: ${debtRatio.toFixed(1)}% debt ratio. Aim for <20% - consider debt consolidation.`;
    } else {
      debtScore = 20;
      debtLabel = 'Critical';
      debtRec = `CRITICAL: ${debtRatio.toFixed(1)}% debt ratio exceeds safe limits (36%). Urgent: Stop new debt, pay minimums + extra to highest APR.`;
    }

    // 4. Net Worth Growth Score (15% weight)
    // Compare current savings to 60 days ago
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const oldIncome = transactions
      .filter(t => t.type === 'income' && t.date >= sixtyDaysAgo && t.date < thirtyDaysAgo)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const oldExpenses = transactions
      .filter(t => t.type === 'expense' && t.date >= sixtyDaysAgo && t.date < thirtyDaysAgo)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const monthlyGrowth = (monthlyIncome - monthlyExpenses) - (oldIncome - oldExpenses);
    const growthPercentage = oldIncome > 0 ? (monthlyGrowth / oldIncome) * 100 : 0;

    let growthScore = 0;
    let growthLabel = '';
    let growthRec = '';

    if (growthPercentage >= 5) {
      growthScore = 100;
      growthLabel = 'Excellent Growth';
      growthRec = `Amazing! ${growthPercentage.toFixed(1)}% month-over-month growth. Keep this momentum!`;
    } else if (growthPercentage >= 2) {
      growthScore = 80;
      growthLabel = 'Good Growth';
      growthRec = `Solid ${growthPercentage.toFixed(1)}% growth. Compounding at this rate = strong future wealth.`;
    } else if (growthPercentage > 0) {
      growthScore = 60;
      growthLabel = 'Positive Growth';
      growthRec = `${growthPercentage.toFixed(1)}% growth is positive. Try to increase savings rate for faster progress.`;
    } else if (growthPercentage >= -2) {
      growthScore = 40;
      growthLabel = 'Stagnant';
      growthRec = 'Net worth flat. Identify one area to cut expenses or boost income this month.';
    } else {
      growthScore = 20;
      growthLabel = 'Declining';
      growthRec = `Warning: ${Math.abs(growthPercentage).toFixed(1)}% decline. Emergency action needed - review major expenses now.`;
    }

    // 5. Budget Adherence Score (10% weight)
    const budgetEstimate = parseFloat(prefs?.monthlyExpensesEstimate?.toString() || '0');
    const budgetAdherence = budgetEstimate > 0
      ? Math.max(0, 100 - Math.abs((monthlyExpenses - budgetEstimate) / budgetEstimate * 100))
      : (monthlyExpenses > 0 ? 50 : 100);

    let budgetScore = budgetAdherence;
    let budgetLabel = '';
    let budgetRec = '';

    if (budgetAdherence >= 95) {
      budgetLabel = 'Excellent';
      budgetRec = 'Perfect budget control! You are within 5% of planned spending.';
    } else if (budgetAdherence >= 85) {
      budgetLabel = 'Good';
      budgetRec = 'Good budget adherence. Minor adjustments can get you to perfect control.';
    } else if (budgetAdherence >= 70) {
      budgetLabel = 'Fair';
      budgetRec = `${(100 - budgetAdherence).toFixed(0)}% over/under budget. Track daily expenses to improve accuracy.`;
    } else {
      budgetLabel = 'Poor';
      budgetRec = `Significant budget variance. Use 50/30/20 rule: 50% needs, 30% wants, 20% savings.`;
    }

    // Calculate overall score with weighted average
    const overall = Math.round(
      (savingsScore * 0.30) +
      (emergencyScore * 0.25) +
      (debtScore * 0.20) +
      (growthScore * 0.15) +
      (budgetScore * 0.10)
    );

    const grade = getGrade(overall);

    // Determine top priority (lowest score)
    const scores = [
      { name: 'savings rate', score: savingsScore, rec: savingsRec },
      { name: 'emergency fund', score: emergencyScore, rec: emergencyRec },
      { name: 'debt management', score: debtScore, rec: debtRec },
      { name: 'net worth growth', score: growthScore, rec: growthRec },
      { name: 'budget adherence', score: budgetScore, rec: budgetRec }
    ];

    const topPriority = scores.reduce((min, curr) =>
      curr.score < min.score ? curr : min
    );

    // Generate summary
    let summary = '';
    if (overall >= 90) {
      summary = `Outstanding financial health! You're in the top 10% of savers. Your ${savingsRate.toFixed(0)}% savings rate and ${emergencyFundMonths.toFixed(1)}-month emergency fund demonstrate excellent discipline.`;
    } else if (overall >= 75) {
      summary = `Solid financial foundation. You're on the right track with good habits. Focus on your ${topPriority.name} to reach excellent status.`;
    } else if (overall >= 60) {
      summary = `Fair financial health with room for improvement. Your ${topPriority.name} needs immediate attention to prevent future issues.`;
    } else if (overall >= 40) {
      summary = `Financial health needs significant improvement. Critical focus area: ${topPriority.name}. Small changes today prevent major problems tomorrow.`;
    } else {
      summary = `CRITICAL: Financial health requires urgent action. Start with ${topPriority.name} immediately. Consider speaking with a financial advisor.`;
    }

    return {
      overall,
      breakdown: {
        savingsRate: { score: savingsScore, value: savingsRate, label: savingsLabel, recommendation: savingsRec },
        emergencyFund: { score: emergencyScore, months: emergencyFundMonths, label: emergencyLabel, recommendation: emergencyRec },
        debtRatio: { score: debtScore, ratio: debtRatio, label: debtLabel, recommendation: debtRec },
        netWorthGrowth: { score: growthScore, growth: growthPercentage, label: growthLabel, recommendation: growthRec },
        budgetAdherence: { score: budgetScore, adherence: budgetAdherence, label: budgetLabel, recommendation: budgetRec }
      },
      grade,
      summary,
      topPriority: topPriority.rec
    };

  } catch (error) {
    console.error('Error calculating financial health:', error);
    throw error;
  }
}

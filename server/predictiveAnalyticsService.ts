// Predictive Analytics Service
// Provides forecasting, predictions, and early warning systems for financial data

import { storage } from "./storage";

interface SpendingForecast {
  category: string;
  historicalAverage: number;
  predictedAmount: number;
  confidence: 'high' | 'medium' | 'low';
  trend: 'increasing' | 'stable' | 'decreasing';
  percentChange: number;
}

interface GoalPrediction {
  goalId: string;
  goalTitle: string;
  currentProgress: number;
  predictedCompletionDate: string;
  onTrack: boolean;
  probability: number;
  requiredMonthlyContribution: number;
  recommendedAction: string;
}

interface CashFlowForecast {
  date: string;
  projectedBalance: number;
  projectedIncome: number;
  projectedExpenses: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface Anomaly {
  type: 'spending_spike' | 'income_drop' | 'unusual_pattern' | 'goal_at_risk';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  affectedCategory?: string;
  suggestedAction: string;
  detectedAt: string;
}

interface SavingsOpportunity {
  category: string;
  potentialSavings: number;
  confidence: number;
  timeframe: 'weekly' | 'monthly';
  suggestion: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export class PredictiveAnalyticsService {
  /**
   * Forecast spending by category for next 30 or 90 days
   */
  async forecastSpending(userId: string, days: 30 | 90 = 30): Promise<SpendingForecast[]> {
    const transactions = await storage.getTransactionsByUserId(userId);
    const now = new Date();
    const historicalDays = Math.min(days * 3, 180); // Use 3x forecast period for historical data
    const cutoffDate = new Date(now.getTime() - historicalDays * 24 * 60 * 60 * 1000);

    // Filter to expenses in the historical period
    const expenses = transactions.filter(t => 
      t.type === 'expense' && new Date(t.date) >= cutoffDate
    );

    if (expenses.length === 0) {
      return [];
    }

    // Group by category
    const categoryData = new Map<string, number[]>();
    expenses.forEach(expense => {
      const amount = parseFloat(expense.amount);
      if (!categoryData.has(expense.category)) {
        categoryData.set(expense.category, []);
      }
      categoryData.get(expense.category)!.push(amount);
    });

    // Calculate forecasts
    const forecasts: SpendingForecast[] = [];
    categoryData.forEach((amounts, category) => {
      const historicalAverage = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      const totalHistorical = amounts.reduce((sum, amt) => sum + amt, 0);
      
      // Calculate trend (compare first half vs second half)
      const midpoint = Math.floor(amounts.length / 2);
      const firstHalf = amounts.slice(0, midpoint);
      const secondHalf = amounts.slice(midpoint);
      const firstHalfAvg = firstHalf.reduce((s, a) => s + a, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((s, a) => s + a, 0) / secondHalf.length;
      
      const trendPercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      let trend: 'increasing' | 'stable' | 'decreasing';
      if (trendPercent > 10) trend = 'increasing';
      else if (trendPercent < -10) trend = 'decreasing';
      else trend = 'stable';

      // Apply trend to forecast
      const trendMultiplier = 1 + (trendPercent / 100);
      const predictedAmount = historicalAverage * trendMultiplier * (days / 30);

      // Calculate confidence based on variance
      const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - historicalAverage, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / historicalAverage;
      
      let confidence: 'high' | 'medium' | 'low';
      if (coefficientOfVariation < 0.3) confidence = 'high';
      else if (coefficientOfVariation < 0.6) confidence = 'medium';
      else confidence = 'low';

      forecasts.push({
        category,
        historicalAverage,
        predictedAmount,
        confidence,
        trend,
        percentChange: trendPercent
      });
    });

    return forecasts.sort((a, b) => b.predictedAmount - a.predictedAmount);
  }

  /**
   * Predict goal achievement probability
   */
  async predictGoalAchievement(userId: string): Promise<GoalPrediction[]> {
    const goals = await storage.getFinancialGoalsByUserId(userId);
    const transactions = await storage.getTransactionsByUserId(userId);
    const activeGoals = goals.filter(g => g.status === 'active');

    if (activeGoals.length === 0) {
      return [];
    }

    // Calculate recent savings rate
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    const recentIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const recentExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const monthlySavingsCapacity = recentIncome - recentExpenses;

    const predictions: GoalPrediction[] = [];

    for (const goal of activeGoals) {
      const targetAmount = parseFloat(goal.targetAmount);
      const currentAmount = parseFloat(goal.currentAmount || "0");
      const remaining = targetAmount - currentAmount;
      const targetDate = new Date(goal.targetDate);
      const now = new Date();
      const monthsRemaining = Math.max(0, (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const currentProgress = (currentAmount / targetAmount) * 100;

      // Calculate required monthly contribution
      const requiredMonthlyContribution = monthsRemaining > 0 ? remaining / monthsRemaining : remaining;

      // Calculate probability based on current savings capacity
      let probability = 0;
      let onTrack = false;
      if (monthlySavingsCapacity >= requiredMonthlyContribution) {
        probability = Math.min(95, 70 + (monthlySavingsCapacity / requiredMonthlyContribution) * 25);
        onTrack = true;
      } else {
        probability = Math.max(10, 50 * (monthlySavingsCapacity / requiredMonthlyContribution));
        onTrack = false;
      }

      // Predict completion date based on current savings rate
      const predictedMonthsToCompletion = monthlySavingsCapacity > 0 
        ? remaining / monthlySavingsCapacity 
        : 999;
      const predictedCompletionDate = new Date(now.getTime() + predictedMonthsToCompletion * 30 * 24 * 60 * 60 * 1000);

      // Generate recommendation
      let recommendedAction = "";
      if (!onTrack && monthsRemaining > 0) {
        const shortfall = requiredMonthlyContribution - monthlySavingsCapacity;
        recommendedAction = `Increase monthly savings by $${shortfall.toFixed(0)} or extend deadline by ${Math.ceil((remaining / monthlySavingsCapacity) - monthsRemaining)} months`;
      } else if (onTrack && probability > 85) {
        recommendedAction = `On excellent track! Consider allocating surplus to other goals`;
      } else {
        recommendedAction = `Maintain current pace of $${monthlySavingsCapacity.toFixed(0)}/month`;
      }

      predictions.push({
        goalId: goal.id,
        goalTitle: goal.title,
        currentProgress,
        predictedCompletionDate: predictedCompletionDate.toISOString().split('T')[0],
        onTrack,
        probability: Math.round(probability),
        requiredMonthlyContribution: Math.round(requiredMonthlyContribution),
        recommendedAction
      });
    }

    return predictions;
  }

  /**
   * Forecast cash flow for next 90 days
   */
  async forecastCashFlow(userId: string): Promise<CashFlowForecast[]> {
    const transactions = await storage.getTransactionsByUserId(userId);
    const stats = await storage.getUserStats(userId);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);

    // Calculate averages
    const avgDailyIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0) / 30;
    
    const avgDailyExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0) / 30;

    // Get current balance
    const currentBalance = (stats as any)?.totalSavings || 0;

    // Project for next 90 days
    const forecasts: CashFlowForecast[] = [];
    let projectedBalance = currentBalance;

    for (let day = 1; day <= 90; day++) {
      const date = new Date(Date.now() + day * 24 * 60 * 60 * 1000);
      const projectedIncome = avgDailyIncome;
      const projectedExpenses = avgDailyExpenses;
      projectedBalance += (projectedIncome - projectedExpenses);

      // Calculate risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      const monthsOfExpenses = projectedBalance / (avgDailyExpenses * 30);
      if (monthsOfExpenses < 1) riskLevel = 'high';
      else if (monthsOfExpenses < 3) riskLevel = 'medium';

      // Store forecast for each week (reduce data volume)
      if (day % 7 === 0 || day === 1 || day === 90) {
        forecasts.push({
          date: date.toISOString().split('T')[0],
          projectedBalance: Math.round(projectedBalance),
          projectedIncome: Math.round(projectedIncome),
          projectedExpenses: Math.round(projectedExpenses),
          riskLevel
        });
      }
    }

    return forecasts;
  }

  /**
   * Detect anomalies and early warnings
   */
  async detectAnomalies(userId: string): Promise<Anomaly[]> {
    const transactions = await storage.getTransactionsByUserId(userId);
    const goals = await storage.getFinancialGoalsByUserId(userId);
    const anomalies: Anomaly[] = [];

    // Analyze last 7 days vs previous 30 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= sevenDaysAgo)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const historicalExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo && new Date(t.date) < sevenDaysAgo)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const historicalDaily = historicalExpenses / 23; // 30 - 7 days
    const recentDaily = recentExpenses / 7;

    // Spending spike detection
    if (recentDaily > historicalDaily * 1.5 && recentExpenses > 100) {
      anomalies.push({
        type: 'spending_spike',
        severity: recentDaily > historicalDaily * 2 ? 'critical' : 'warning',
        title: 'Unusual Spending Detected',
        description: `Your spending is ${((recentDaily / historicalDaily - 1) * 100).toFixed(0)}% higher than usual this week`,
        suggestedAction: 'Review recent transactions and consider adjusting budget',
        detectedAt: now.toISOString()
      });
    }

    // Income drop detection
    const recentIncome = transactions
      .filter(t => t.type === 'income' && new Date(t.date) >= sevenDaysAgo)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const historicalIncome = transactions
      .filter(t => t.type === 'income' && new Date(t.date) >= thirtyDaysAgo && new Date(t.date) < sevenDaysAgo)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    if (historicalIncome > 0 && recentIncome < historicalIncome * 0.5) {
      anomalies.push({
        type: 'income_drop',
        severity: 'critical',
        title: 'Income Drop Detected',
        description: `Your income this week is significantly lower than usual`,
        suggestedAction: 'Review income sources and consider emergency budget measures',
        detectedAt: now.toISOString()
      });
    }

    // Goal at risk detection
    const goalsAtRisk = await this.predictGoalAchievement(userId);
    for (const goal of goalsAtRisk) {
      if (!goal.onTrack && goal.probability < 50) {
        anomalies.push({
          type: 'goal_at_risk',
          severity: goal.probability < 25 ? 'critical' : 'warning',
          title: `Goal At Risk: ${goal.goalTitle}`,
          description: `Only ${goal.probability}% chance of achieving on time`,
          suggestedAction: goal.recommendedAction,
          detectedAt: now.toISOString()
        });
      }
    }

    return anomalies;
  }

  /**
   * Identify savings opportunities
   */
  async identifySavingsOpportunities(userId: string): Promise<SavingsOpportunity[]> {
    const forecasts = await this.forecastSpending(userId, 30);
    const opportunities: SavingsOpportunity[] = [];

    // Find categories with high spending and increasing trends
    for (const forecast of forecasts) {
      if (forecast.predictedAmount > 200 && forecast.trend === 'increasing') {
        const potentialSavings = forecast.predictedAmount * 0.15; // 15% reduction target
        opportunities.push({
          category: forecast.category,
          potentialSavings: Math.round(potentialSavings),
          confidence: forecast.confidence === 'high' ? 0.8 : forecast.confidence === 'medium' ? 0.6 : 0.4,
          timeframe: 'monthly',
          suggestion: `Reduce ${forecast.category} spending by 15% to save $${potentialSavings.toFixed(0)}/month`,
          difficulty: forecast.predictedAmount > 500 ? 'easy' : 'medium'
        });
      }
    }

    return opportunities.slice(0, 5); // Return top 5
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();

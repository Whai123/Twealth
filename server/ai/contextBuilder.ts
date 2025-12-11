/**
 * Context Builder - Normalize user financial data for AI models
 * 
 * Pulls data from existing modules and formats it into a standardized
 * FinancialContext structure for both Scout and Reasoning models
 * 
 * Includes country-specific financial intelligence for localized advice
 * 
 * Features:
 * - Request-scoped caching to avoid repeated DB queries within same request
 * - TTL-based cache invalidation for data freshness
 * - Parallel data fetching for performance
 */

import type { IStorage } from '../storage';
import type {
  UserFinancialProfile,
  UserExpenseCategory,
  UserDebt,
  UserAsset,
  FinancialGoal,
  Transaction,
} from '@shared/schema';
import { countryKnowledgeService, type CountryFinancialContext } from '../services/countryKnowledge';

// Context cache configuration
const CONTEXT_CACHE_TTL_MS = 30000; // 30 seconds - balance between freshness and performance
const MAX_CACHE_SIZE = 100; // Maximum cached contexts

interface CachedContext {
  context: FinancialContext;
  timestamp: number;
}

// LRU cache for financial contexts
const contextCache = new Map<string, CachedContext>();

/**
 * Get cached context if still valid
 */
function getCachedContext(userId: string): FinancialContext | null {
  const cached = contextCache.get(userId);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CONTEXT_CACHE_TTL_MS) {
    contextCache.delete(userId);
    return null;
  }
  
  return cached.context;
}

/**
 * Cache a context with LRU eviction
 */
function cacheContext(userId: string, context: FinancialContext): void {
  // Evict oldest entries if cache is full
  if (contextCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = contextCache.keys().next().value;
    if (oldestKey) {
      contextCache.delete(oldestKey);
    }
  }
  
  contextCache.set(userId, {
    context,
    timestamp: Date.now(),
  });
}

/**
 * Invalidate cached context for a user (call after data updates)
 */
export function invalidateContextCache(userId: string): void {
  contextCache.delete(userId);
}

/**
 * Clear entire context cache (for testing/admin)
 */
export function clearContextCache(): void {
  contextCache.clear();
}

// Normalized financial context for AI models
export interface FinancialContext {
  user: {
    id: string;
    countryCode: string;
    region?: string;
    age?: number;
    riskTolerance?: 'low' | 'med' | 'high';
  };
  income: {
    monthlyNet: number;
    sources: Array<{ name: string; amount: number }>;
  };
  expenses: {
    monthly: number;
    byCategory: Record<string, number>;
  };
  debts: Array<{
    name: string;
    balance: number;
    apr: number;
    min: number;
    monthlyPayment: number;
  }>;
  assets: Array<{
    name: string;
    value: number;
    type: 'cash' | 'equity' | 'crypto' | 'bond' | 'real_estate' | 'vehicle' | 'other';
  }>;
  goals: Array<{
    name: string;
    horizonMonths: number;
    target: number;
    current: number;
    progressPercent: number;
    monthlyRequired: number;
    onTrack: boolean;
  }>;
  recentTransactionsSample: Array<{
    date: string;
    desc: string;
    amount: number;
    category?: string;
    type: 'income' | 'expense' | 'transfer';
  }>;
  // Enhanced analytics for proactive insights
  analytics: {
    savingsRate: number; // Percentage of income saved
    netWorth: number; // Total assets - total debts
    debtToIncomeRatio: number; // Monthly debt payments / monthly income
    emergencyFundMonths: number; // Cash / monthly expenses
    spendingTrends: {
      currentMonth: number;
      lastMonth: number;
      monthOverMonthChange: number; // Percentage change
      direction: 'up' | 'down' | 'stable';
    };
    categoryAnomalies: Array<{
      category: string;
      currentAmount: number;
      averageAmount: number;
      percentChange: number;
      severity: 'low' | 'medium' | 'high';
    }>;
    financialHealthScore: number; // 0-100 score
    topSpendingCategories: Array<{ category: string; amount: number; percent: number }>;
    goalProgress: {
      totalGoals: number;
      onTrackGoals: number;
      atRiskGoals: number;
      completedGoals: number;
    };
  };
  // Proactive insights generated from data
  insights: Array<{
    type: 'warning' | 'tip' | 'achievement' | 'opportunity';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  // Country-specific financial intelligence
  countryContext?: {
    countryName: string;
    currency: string;
    currencySymbol: string;
    vatRate: number;
    capitalGainsTaxRate: number;
    costOfLivingIndex: number;
    purchasingPowerIndex: number;
    averageMonthlyIncome: number;
    medianMonthlyIncome: number;
    luxuryPricing: {
      lamborghiniUrus: number;
      porsche911: number;
      rolexSubmariner: number;
      medianHomeCity: number;
      medianHomeSuburb: number;
    };
    economicSystem: string;
    financialRegulations: string[];
  };
}

/**
 * Build financial context from user data
 * Uses caching to avoid repeated DB queries for the same user within a short window
 * 
 * @param userId - The user ID to build context for
 * @param storage - Storage interface for database access
 * @param skipCache - Force fresh data fetch (default: false)
 */
export async function buildFinancialContext(
  userId: string,
  storage: IStorage,
  skipCache: boolean = false
): Promise<FinancialContext> {
  // Check cache first (unless explicitly skipped)
  if (!skipCache) {
    const cached = getCachedContext(userId);
    if (cached) {
      return cached;
    }
  }
  
  // Fetch all user financial data in parallel
  const [
    profile,
    expenseCategories,
    debts,
    assets,
    goals,
    transactions,
    allTransactions,
    user,
    userPreferences,
  ] = await Promise.all([
    storage.getUserFinancialProfile(userId).catch(() => null),
    storage.getUserExpenseCategories(userId).catch(() => []),
    storage.getUserDebts(userId).catch(() => []),
    storage.getUserAssets(userId).catch(() => []),
    storage.getFinancialGoalsByUserId(userId).catch(() => []),
    storage.getTransactionsByUserId(userId, 20).catch(() => []), // Last 20 transactions for sample
    storage.getTransactionsByUserId(userId, 1000).catch(() => []), // More transactions for calculating averages
    storage.getUser(userId).catch(() => null),
    storage.getUserPreferences(userId).catch(() => null),
  ]);
  
  // Calculate income/expenses from real transaction data (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentTransactionsForCalc = allTransactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate >= sixMonthsAgo;
  });
  
  // Calculate from actual transactions
  let calculatedIncome = 0;
  let calculatedExpenses = 0;
  for (const tx of recentTransactionsForCalc) {
    const amount = Math.abs(parseFloat(tx.amount.toString()));
    if (tx.type === 'income') {
      calculatedIncome += amount;
    } else if (tx.type === 'expense') {
      calculatedExpenses += amount;
    }
  }
  
  // Calculate monthly averages (accounting for number of months with data)
  const monthsWithData = recentTransactionsForCalc.length > 0 ? 
    Math.max(1, Math.min(6, Math.ceil((Date.now() - Math.min(...recentTransactionsForCalc.map(tx => new Date(tx.date).getTime()))) / (30.44 * 24 * 60 * 60 * 1000)))) 
    : 1;
  
  const avgMonthlyIncomeFromTx = Math.round(calculatedIncome / monthsWithData);
  const avgMonthlyExpensesFromTx = Math.round(calculatedExpenses / monthsWithData);
  
  // Use calculated values if we have transaction data, otherwise fall back to manual profile values
  const hasTransactionData = recentTransactionsForCalc.length >= 5; // Need at least 5 transactions to be meaningful
  
  const monthlyIncome = hasTransactionData && avgMonthlyIncomeFromTx > 0
    ? avgMonthlyIncomeFromTx
    : (profile?.monthlyIncome ? parseFloat(profile.monthlyIncome.toString()) : 0);
  
  const monthlyExpenses = hasTransactionData && avgMonthlyExpensesFromTx > 0
    ? avgMonthlyExpensesFromTx
    : (profile?.monthlyExpenses ? parseFloat(profile.monthlyExpenses.toString()) : 0);
  
  const monthlyNet = monthlyIncome - monthlyExpenses;
  
  // Build income sources - use transaction data if available
  const incomeSources = monthlyIncome > 0
    ? [{ 
        name: hasTransactionData ? 'Calculated from Transactions' : 'Primary Income (Manual)', 
        amount: monthlyIncome 
      }]
    : [];
  
  // Build expense breakdown by category - use transaction data if available
  const expensesByCategory: Record<string, number> = {};
  
  if (hasTransactionData) {
    // Calculate from actual transactions
    const expenseTransactions = recentTransactionsForCalc.filter(tx => tx.type === 'expense');
    for (const tx of expenseTransactions) {
      const category = tx.category || 'Other';
      const amount = Math.abs(parseFloat(tx.amount.toString()));
      expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
    }
    // Convert to monthly averages
    for (const category in expensesByCategory) {
      expensesByCategory[category] = Math.round(expensesByCategory[category] / monthsWithData);
    }
  } else {
    // Fall back to manual expense categories
    for (const cat of expenseCategories) {
      expensesByCategory[cat.category] = parseFloat(cat.monthlyAmount.toString());
    }
  }
  
  // Normalize debts
  const normalizedDebts = debts.map(debt => ({
    name: debt.name,
    balance: parseFloat(debt.balance.toString()),
    apr: parseFloat(debt.interestRate.toString()),
    min: parseFloat(debt.minimumPayment.toString()),
    monthlyPayment: parseFloat(debt.monthlyPayment.toString()),
  }));
  
  // Normalize assets
  const normalizedAssets = assets.map(asset => {
    // Map asset types to standard categories
    let type: FinancialContext['assets'][0]['type'] = 'other';
    
    switch (typeof asset.type === 'string' ? asset.type.toLowerCase() : '') {
      case 'savings':
      case 'cash':
        type = 'cash';
        break;
      case 'stocks':
      case 'equity':
      case 'etf':
      case 'mutual fund':
        type = 'equity';
        break;
      case 'bonds':
      case 'bond':
      case 'fixed income':
      case 'treasury':
        type = 'bond';
        break;
      case 'investment': // Generic - could be equity or bonds, default to equity
        type = 'equity';
        break;
      case 'crypto':
      case 'cryptocurrency':
      case 'bitcoin':
      case 'ethereum':
        type = 'crypto';
        break;
      case 'real_estate':
      case 'real estate':
      case 'property':
      case 'home':
        type = 'real_estate';
        break;
      case 'vehicle':
      case 'car':
      case 'auto':
        type = 'vehicle';
        break;
      default:
        type = 'other';
    }
    
    return {
      name: asset.name,
      value: parseFloat(asset.value.toString()),
      type,
    };
  });
  
  // Normalize goals with enhanced progress tracking
  const normalizedGoals = goals.map(goal => {
    const targetDate = new Date(goal.targetDate);
    const now = new Date();
    const monthsDiff = Math.max(
      0,
      (targetDate.getFullYear() - now.getFullYear()) * 12 +
      (targetDate.getMonth() - now.getMonth())
    );
    
    const target = parseFloat(goal.targetAmount.toString());
    const current = goal.currentAmount ? parseFloat(goal.currentAmount.toString()) : 0;
    const progressPercent = target > 0 ? Math.round((current / target) * 100) : 0;
    const remaining = Math.max(0, target - current);
    const monthlyRequired = monthsDiff > 0 ? Math.max(0, Math.round(remaining / monthsDiff)) : Math.max(0, remaining);
    
    // Calculate if on track (can they save enough each month?)
    // Clamp monthly savings to non-negative - negative savings means user can't make progress
    const monthlySavings = Math.max(0, monthlyIncome - monthlyExpenses);
    // Goal is on track if: already completed, or user can afford the monthly required amount
    const onTrack = progressPercent >= 100 || (monthlySavings > 0 && monthlyRequired <= monthlySavings);
    
    return {
      name: goal.title,
      horizonMonths: monthsDiff,
      target,
      current,
      progressPercent,
      monthlyRequired,
      onTrack,
    };
  });
  
  // Normalize recent transactions (last 20)
  const recentTransactionsSample = transactions.slice(0, 20).map(tx => ({
    date: tx.date.toISOString().split('T')[0], // YYYY-MM-DD
    desc: tx.description || tx.category,
    amount: parseFloat(tx.amount.toString()),
    category: tx.category,
    type: tx.type as 'income' | 'expense' | 'transfer',
  }));
  
  // Build user metadata from preferences
  const countryCode = userPreferences?.countryCode || 'US';
  const userAge = undefined; // Could be calculated from DOB if available
  const riskTolerance: 'low' | 'med' | 'high' = 'med'; // Could be from financial preferences
  
  // Get country-specific financial context
  const countryData = countryKnowledgeService.getCountryContext(countryCode);
  const countryContext = countryData ? {
    countryName: countryData.countryName,
    currency: countryData.currency,
    currencySymbol: countryData.currencySymbol,
    vatRate: countryData.vatRate,
    capitalGainsTaxRate: countryData.capitalGainsTaxRate,
    costOfLivingIndex: countryData.costOfLivingIndex,
    purchasingPowerIndex: countryData.purchasingPowerIndex,
    averageMonthlyIncome: countryData.averageMonthlyIncome,
    medianMonthlyIncome: countryData.medianMonthlyIncome,
    luxuryPricing: {
      lamborghiniUrus: countryData.luxuryPricing.lamborghiniUrus,
      porsche911: countryData.luxuryPricing.porsche911,
      rolexSubmariner: countryData.luxuryPricing.rolexSubmariner,
      medianHomeCity: countryData.luxuryPricing.medianHomePriceCity,
      medianHomeSuburb: countryData.luxuryPricing.medianHomePriceSuburb,
    },
    economicSystem: countryData.economicSystem,
    financialRegulations: countryData.financialRegulations,
  } : undefined;
  
  // ========== ENHANCED ANALYTICS ==========
  
  // Calculate net worth
  const totalAssets = normalizedAssets.reduce((sum, a) => sum + a.value, 0);
  const totalDebts = normalizedDebts.reduce((sum, d) => sum + d.balance, 0);
  const netWorth = totalAssets - totalDebts;
  
  // Calculate savings rate
  const monthlySavings = monthlyIncome > 0 ? monthlyIncome - monthlyExpenses : 0;
  const savingsRate = monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : 0;
  
  // Calculate debt-to-income ratio
  const totalMonthlyDebtPayments = normalizedDebts.reduce((sum, d) => sum + d.monthlyPayment, 0);
  const debtToIncomeRatio = monthlyIncome > 0 ? Math.round((totalMonthlyDebtPayments / monthlyIncome) * 100) : 0;
  
  // Calculate emergency fund months
  const cashAssets = normalizedAssets.filter(a => a.type === 'cash').reduce((sum, a) => sum + a.value, 0);
  const emergencyFundMonths = monthlyExpenses > 0 ? Math.round((cashAssets / monthlyExpenses) * 10) / 10 : 0;
  
  // Calculate spending trends (current month vs last month)
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  
  const currentMonthSpending = allTransactions
    .filter(tx => tx.type === 'expense' && new Date(tx.date) >= currentMonthStart)
    .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount.toString())), 0);
  
  const lastMonthSpending = allTransactions
    .filter(tx => {
      const txDate = new Date(tx.date);
      return tx.type === 'expense' && txDate >= lastMonthStart && txDate <= lastMonthEnd;
    })
    .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount.toString())), 0);
  
  const monthOverMonthChange = lastMonthSpending > 0 
    ? Math.round(((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100)
    : 0;
  
  const spendingDirection = monthOverMonthChange > 10 ? 'up' : monthOverMonthChange < -10 ? 'down' : 'stable';
  
  // Detect category anomalies (spending significantly above historical average)
  const categoryAnomalies: FinancialContext['analytics']['categoryAnomalies'] = [];
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  // Build per-category monthly history for accurate anomaly detection
  const categoryMonthlyHistory: Record<string, Record<string, number>> = {};
  for (const tx of allTransactions.filter(t => t.type === 'expense' && new Date(t.date) >= threeMonthsAgo)) {
    const cat = tx.category || 'Other';
    const monthKey = `${new Date(tx.date).getFullYear()}-${new Date(tx.date).getMonth()}`;
    if (!categoryMonthlyHistory[cat]) categoryMonthlyHistory[cat] = {};
    if (!categoryMonthlyHistory[cat][monthKey]) categoryMonthlyHistory[cat][monthKey] = 0;
    categoryMonthlyHistory[cat][monthKey] += Math.abs(parseFloat(tx.amount.toString()));
  }
  
  // Current month key
  const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
  
  for (const [category, monthlyAmounts] of Object.entries(categoryMonthlyHistory)) {
    const months = Object.entries(monthlyAmounts);
    if (months.length < 2) continue; // Need at least 2 months of data
    
    // Calculate average excluding current month
    const pastMonths = months.filter(([key]) => key !== currentMonthKey);
    if (pastMonths.length === 0) continue;
    
    const avgAmount = pastMonths.reduce((sum, [, amt]) => sum + amt, 0) / pastMonths.length;
    const currentAmount = monthlyAmounts[currentMonthKey] || 0;
    
    // Only flag if current month spending is significantly above historical average
    if (avgAmount > 0 && currentAmount > avgAmount * 1.3 && currentAmount > 50) {
      const percentChange = Math.round(((currentAmount - avgAmount) / avgAmount) * 100);
      categoryAnomalies.push({
        category,
        currentAmount: Math.round(currentAmount),
        averageAmount: Math.round(avgAmount),
        percentChange,
        severity: percentChange > 100 ? 'high' : percentChange > 50 ? 'medium' : 'low',
      });
    }
  }
  
  // Sort by severity and percent change
  categoryAnomalies.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity] || b.percentChange - a.percentChange;
  });
  
  // Calculate financial health score (0-100)
  let healthScore = 50; // Base score
  
  // Savings rate impact (+/-20 points)
  if (savingsRate >= 20) healthScore += 20;
  else if (savingsRate >= 10) healthScore += 10;
  else if (savingsRate < 0) healthScore -= 20;
  else healthScore -= 10;
  
  // Emergency fund impact (+/-15 points)
  if (emergencyFundMonths >= 6) healthScore += 15;
  else if (emergencyFundMonths >= 3) healthScore += 8;
  else if (emergencyFundMonths < 1) healthScore -= 15;
  
  // Debt-to-income impact (+/-15 points)
  if (debtToIncomeRatio === 0) healthScore += 15;
  else if (debtToIncomeRatio <= 20) healthScore += 8;
  else if (debtToIncomeRatio > 40) healthScore -= 15;
  
  healthScore = Math.max(0, Math.min(100, healthScore));
  
  // Top spending categories
  const sortedCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount),
      percent: monthlyExpenses > 0 ? Math.round((amount / monthlyExpenses) * 100) : 0,
    }));
  
  // Goal progress summary
  const goalProgress = {
    totalGoals: normalizedGoals.length,
    onTrackGoals: normalizedGoals.filter(g => g.onTrack).length,
    atRiskGoals: normalizedGoals.filter(g => !g.onTrack && g.progressPercent < 100).length,
    completedGoals: normalizedGoals.filter(g => g.progressPercent >= 100).length,
  };
  
  // ========== PROACTIVE INSIGHTS ==========
  const insights: FinancialContext['insights'] = [];
  
  // Spending anomaly warnings
  if (monthOverMonthChange > 25) {
    insights.push({
      type: 'warning',
      title: 'Spending Spike Detected',
      message: `Your spending is up ${monthOverMonthChange}% compared to last month. Review your recent transactions to identify the cause.`,
      priority: 'high',
    });
  }
  
  // Category overspending
  for (const anomaly of categoryAnomalies.slice(0, 2)) {
    if (anomaly.severity === 'high') {
      insights.push({
        type: 'warning',
        title: `High ${anomaly.category} Spending`,
        message: `You've spent ${anomaly.percentChange}% more on ${anomaly.category} than your average. Consider reviewing these expenses.`,
        priority: 'medium',
      });
    }
  }
  
  // Emergency fund tip
  if (emergencyFundMonths < 3 && monthlyExpenses > 0) {
    insights.push({
      type: 'tip',
      title: 'Build Your Emergency Fund',
      message: `You have ${emergencyFundMonths.toFixed(1)} months of expenses saved. Aim for 3-6 months for financial security.`,
      priority: emergencyFundMonths < 1 ? 'high' : 'medium',
    });
  }
  
  // High savings rate achievement
  if (savingsRate >= 30) {
    insights.push({
      type: 'achievement',
      title: 'Excellent Savings Rate!',
      message: `You're saving ${savingsRate}% of your income. You're on track for strong wealth building.`,
      priority: 'low',
    });
  }
  
  // Goals at risk
  const atRiskGoals = normalizedGoals.filter(g => !g.onTrack && g.horizonMonths > 0 && g.progressPercent < 100);
  if (atRiskGoals.length > 0) {
    insights.push({
      type: 'warning',
      title: `${atRiskGoals.length} Goal${atRiskGoals.length > 1 ? 's' : ''} At Risk`,
      message: `${atRiskGoals[0].name} needs $${atRiskGoals[0].monthlyRequired}/month to stay on track. Consider adjusting your budget.`,
      priority: 'high',
    });
  }
  
  // Debt payoff opportunity
  if (normalizedDebts.length > 0 && savingsRate > 15) {
    const highestAPR = normalizedDebts.reduce((max, d) => d.apr > max.apr ? d : max, normalizedDebts[0]);
    if (highestAPR.apr > 10) {
      insights.push({
        type: 'opportunity',
        title: 'Accelerate Debt Payoff',
        message: `Your ${highestAPR.name} has ${highestAPR.apr}% interest. Consider putting extra savings toward this debt to save on interest.`,
        priority: 'medium',
      });
    }
  }

  const context: FinancialContext = {
    user: {
      id: userId,
      countryCode,
      region: countryData?.region || 'north_america',
      age: userAge,
      riskTolerance,
    },
    income: {
      monthlyNet,
      sources: incomeSources,
    },
    expenses: {
      monthly: monthlyExpenses,
      byCategory: expensesByCategory,
    },
    debts: normalizedDebts,
    assets: normalizedAssets,
    goals: normalizedGoals,
    recentTransactionsSample,
    analytics: {
      savingsRate,
      netWorth,
      debtToIncomeRatio,
      emergencyFundMonths,
      spendingTrends: {
        currentMonth: Math.round(currentMonthSpending),
        lastMonth: Math.round(lastMonthSpending),
        monthOverMonthChange,
        direction: spendingDirection,
      },
      categoryAnomalies,
      financialHealthScore: healthScore,
      topSpendingCategories: sortedCategories,
      goalProgress,
    },
    insights,
    countryContext,
  };
  
  // Cache the context for future requests
  cacheContext(userId, context);
  
  return context;
}

/**
 * Estimate token count for context (rough approximation)
 */
export function estimateContextTokens(context: FinancialContext): number {
  // Very rough estimate: ~4 characters per token
  const contextStr = JSON.stringify(context);
  return Math.ceil(contextStr.length / 4);
}

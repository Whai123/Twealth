/**
 * Context Builder - Normalize user financial data for AI models
 * 
 * Pulls data from existing modules and formats it into a standardized
 * FinancialContext structure for both Scout and Reasoning models
 * 
 * Includes country-specific financial intelligence for localized advice
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
  }>;
  recentTransactionsSample: Array<{
    date: string;
    desc: string;
    amount: number;
    category?: string;
    type: 'income' | 'expense' | 'transfer';
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
 */
export async function buildFinancialContext(
  userId: string,
  storage: IStorage
): Promise<FinancialContext> {
  // Fetch all user financial data in parallel
  const [
    profile,
    expenseCategories,
    debts,
    assets,
    goals,
    transactions,
    user,
    userPreferences,
  ] = await Promise.all([
    storage.getUserFinancialProfile(userId).catch(() => null),
    storage.getUserExpenseCategories(userId).catch(() => []),
    storage.getUserDebts(userId).catch(() => []),
    storage.getUserAssets(userId).catch(() => []),
    storage.getFinancialGoalsByUserId(userId).catch(() => []),
    storage.getTransactionsByUserId(userId, 20).catch(() => []), // Last 20 transactions
    storage.getUser(userId).catch(() => null),
    storage.getUserPreferences(userId).catch(() => null),
  ]);
  
  // Calculate monthly net income
  const monthlyIncome = profile?.monthlyIncome 
    ? parseFloat(profile.monthlyIncome.toString())
    : 0;
  
  const monthlyExpenses = profile?.monthlyExpenses
    ? parseFloat(profile.monthlyExpenses.toString())
    : 0;
  
  const monthlyNet = monthlyIncome - monthlyExpenses;
  
  // Build income sources (simplified - could be enhanced with transaction analysis)
  const incomeSources = monthlyIncome > 0
    ? [{ name: 'Primary Income', amount: monthlyIncome }]
    : [];
  
  // Build expense breakdown by category
  const expensesByCategory: Record<string, number> = {};
  for (const cat of expenseCategories) {
    expensesByCategory[cat.category] = parseFloat(cat.monthlyAmount.toString());
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
  
  // Normalize goals
  const normalizedGoals = goals.map(goal => {
    const targetDate = new Date(goal.targetDate);
    const now = new Date();
    const monthsDiff = Math.max(
      0,
      (targetDate.getFullYear() - now.getFullYear()) * 12 +
      (targetDate.getMonth() - now.getMonth())
    );
    
    return {
      name: goal.title,
      horizonMonths: monthsDiff,
      target: parseFloat(goal.targetAmount.toString()),
      current: goal.currentAmount ? parseFloat(goal.currentAmount.toString()) : 0,
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
  
  return {
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
    countryContext,
  };
}

/**
 * Estimate token count for context (rough approximation)
 */
export function estimateContextTokens(context: FinancialContext): number {
  // Very rough estimate: ~4 characters per token
  const contextStr = JSON.stringify(context);
  return Math.ceil(contextStr.length / 4);
}

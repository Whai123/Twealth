// Spending Pattern Recognition Service
// Analyzes transaction history to detect behavioral patterns and spending trends

export interface Transaction {
  id: string;
  userId: string;
  amount: string;
  category: string;
  date: Date;
  type: 'income' | 'expense';
  description?: string;
}

export interface SpendingPattern {
  category: string;
  totalAmount: number;
  averageAmount: number;
  transactionCount: number;
  percentage: number; // Percentage of total spending
  trend: 'increasing' | 'decreasing' | 'stable';
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
}

export interface RecurringExpense {
  category: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  nextExpectedDate: Date;
  confidence: number; // 0-1, how confident we are this is recurring
}

export interface SpendingBehavior {
  impulsiveBuying: {
    detected: boolean;
    frequency: number; // transactions per week
    averageAmount: number;
    categories: string[];
  };
  weekendSpending: {
    weekendPercentage: number;
    weekdayPercentage: number;
    difference: number; // How much more/less on weekends
  };
  timeOfDayPatterns: {
    morning: number; // 6am-12pm
    afternoon: number; // 12pm-6pm
    evening: number; // 6pm-12am
    night: number; // 12am-6am
  };
  monthlyPattern: {
    earlyMonth: number; // Days 1-10
    midMonth: number; // Days 11-20
    lateMonth: number; // Days 21-31
  };
}

export interface SpendingInsights {
  patterns: SpendingPattern[];
  recurringExpenses: RecurringExpense[];
  behavior: SpendingBehavior;
  topCategories: { category: string; amount: number; percentage: number }[];
  unusualTransactions: { transaction: Transaction; reason: string }[];
  recommendations: string[];
}

class SpendingPatternService {
  /**
   * Analyze spending patterns from transaction history
   */
  analyzeSpendingPatterns(transactions: Transaction[]): SpendingInsights {
    const expenses = transactions.filter(t => t.type === 'expense');
    
    if (expenses.length === 0) {
      return {
        patterns: [],
        recurringExpenses: [],
        behavior: this.getEmptyBehavior(),
        topCategories: [],
        unusualTransactions: [],
        recommendations: ['Start tracking expenses to get personalized insights']
      };
    }
    
    const patterns = this.categorizeSpending(expenses);
    const recurringExpenses = this.detectRecurringExpenses(expenses);
    const behavior = this.analyzeBehavior(expenses);
    const topCategories = this.getTopCategories(expenses);
    const unusualTransactions = this.detectUnusualTransactions(expenses);
    const recommendations = this.generateRecommendations(patterns, behavior, expenses);
    
    return {
      patterns,
      recurringExpenses,
      behavior,
      topCategories,
      unusualTransactions,
      recommendations
    };
  }
  
  /**
   * Categorize spending by category
   */
  private categorizeSpending(expenses: Transaction[]): SpendingPattern[] {
    const categoryMap = new Map<string, Transaction[]>();
    
    // Group by category
    expenses.forEach(t => {
      const category = t.category || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(t);
    });
    
    const totalSpending = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const patterns: SpendingPattern[] = [];
    
    categoryMap.forEach((transactions, category) => {
      const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const averageAmount = totalAmount / transactions.length;
      const percentage = (totalAmount / totalSpending) * 100;
      
      // Analyze trend (compare first half vs second half)
      const midpoint = Math.floor(transactions.length / 2);
      const firstHalf = transactions.slice(0, midpoint);
      const secondHalf = transactions.slice(midpoint);
      
      const firstHalfAvg = firstHalf.length > 0 
        ? firstHalf.reduce((sum, t) => sum + parseFloat(t.amount), 0) / firstHalf.length 
        : 0;
      const secondHalfAvg = secondHalf.length > 0
        ? secondHalf.reduce((sum, t) => sum + parseFloat(t.amount), 0) / secondHalf.length
        : 0;
      
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      const trendThreshold = 0.2; // 20% change
      if (secondHalfAvg > firstHalfAvg * (1 + trendThreshold)) {
        trend = 'increasing';
      } else if (secondHalfAvg < firstHalfAvg * (1 - trendThreshold)) {
        trend = 'decreasing';
      }
      
      // Determine frequency
      const daySpan = this.getDaySpan(transactions);
      const frequency = this.determineFrequency(transactions.length, daySpan);
      
      patterns.push({
        category,
        totalAmount: Math.round(totalAmount * 100) / 100,
        averageAmount: Math.round(averageAmount * 100) / 100,
        transactionCount: transactions.length,
        percentage: Math.round(percentage * 10) / 10,
        trend,
        frequency
      });
    });
    
    // Sort by total amount descending
    return patterns.sort((a, b) => b.totalAmount - a.totalAmount);
  }
  
  /**
   * Detect recurring expenses
   */
  private detectRecurringExpenses(expenses: Transaction[]): RecurringExpense[] {
    const categoryMap = new Map<string, Transaction[]>();
    
    expenses.forEach(t => {
      const category = t.category || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(t);
    });
    
    const recurring: RecurringExpense[] = [];
    
    categoryMap.forEach((transactions, category) => {
      if (transactions.length < 3) return; // Need at least 3 occurrences
      
      // Sort by date
      const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Calculate intervals between transactions
      const intervals: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const dayDiff = (sorted[i].date.getTime() - sorted[i-1].date.getTime()) / (1000 * 60 * 60 * 24);
        intervals.push(dayDiff);
      }
      
      // Check if intervals are consistent (within 20% variance)
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / avgInterval;
      
      if (coefficientOfVariation < 0.3) { // Reasonably consistent
        let frequency: 'weekly' | 'monthly' | 'quarterly' = 'monthly';
        if (avgInterval < 10) frequency = 'weekly';
        else if (avgInterval > 60) frequency = 'quarterly';
        
        const averageAmount = sorted.reduce((sum, t) => sum + parseFloat(t.amount), 0) / sorted.length;
        const lastDate = sorted[sorted.length - 1].date;
        const nextExpectedDate = new Date(lastDate.getTime() + avgInterval * 24 * 60 * 60 * 1000);
        
        recurring.push({
          category,
          amount: Math.round(averageAmount * 100) / 100,
          frequency,
          nextExpectedDate,
          confidence: Math.max(0, 1 - coefficientOfVariation)
        });
      }
    });
    
    return recurring.sort((a, b) => b.amount - a.amount);
  }
  
  /**
   * Analyze spending behavior
   */
  private analyzeBehavior(expenses: Transaction[]): SpendingBehavior {
    if (expenses.length === 0) return this.getEmptyBehavior();
    
    // Impulsive buying detection (small frequent purchases)
    const smallPurchases = expenses.filter(t => parseFloat(t.amount) < 50);
    const daySpan = this.getDaySpan(expenses);
    const weeksSpan = Math.max(1, daySpan / 7);
    const impulsiveFrequency = smallPurchases.length / weeksSpan;
    const impulsiveCategories = Array.from(new Set(smallPurchases.map(t => t.category)));
    
    // Weekend vs weekday spending
    let weekendTotal = 0;
    let weekdayTotal = 0;
    expenses.forEach(t => {
      const amount = parseFloat(t.amount);
      const dayOfWeek = t.date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendTotal += amount;
      } else {
        weekdayTotal += amount;
      }
    });
    const totalSpending = weekendTotal + weekdayTotal;
    const weekendPercentage = (weekendTotal / totalSpending) * 100;
    const weekdayPercentage = (weekdayTotal / totalSpending) * 100;
    
    // Time of day patterns
    const timePatterns = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    expenses.forEach(t => {
      const hour = t.date.getHours();
      const amount = parseFloat(t.amount);
      if (hour >= 6 && hour < 12) timePatterns.morning += amount;
      else if (hour >= 12 && hour < 18) timePatterns.afternoon += amount;
      else if (hour >= 18 && hour < 24) timePatterns.evening += amount;
      else timePatterns.night += amount;
    });
    
    // Monthly pattern (early/mid/late month)
    const monthlyPattern = { earlyMonth: 0, midMonth: 0, lateMonth: 0 };
    expenses.forEach(t => {
      const day = t.date.getDate();
      const amount = parseFloat(t.amount);
      if (day <= 10) monthlyPattern.earlyMonth += amount;
      else if (day <= 20) monthlyPattern.midMonth += amount;
      else monthlyPattern.lateMonth += amount;
    });
    
    return {
      impulsiveBuying: {
        detected: impulsiveFrequency > 5, // More than 5 small purchases per week
        frequency: Math.round(impulsiveFrequency * 10) / 10,
        averageAmount: smallPurchases.length > 0 
          ? Math.round((smallPurchases.reduce((sum, t) => sum + parseFloat(t.amount), 0) / smallPurchases.length) * 100) / 100
          : 0,
        categories: impulsiveCategories
      },
      weekendSpending: {
        weekendPercentage: Math.round(weekendPercentage * 10) / 10,
        weekdayPercentage: Math.round(weekdayPercentage * 10) / 10,
        difference: Math.round((weekendPercentage - (weekdayPercentage * 2/5)) * 10) / 10
      },
      timeOfDayPatterns: {
        morning: Math.round(timePatterns.morning * 100) / 100,
        afternoon: Math.round(timePatterns.afternoon * 100) / 100,
        evening: Math.round(timePatterns.evening * 100) / 100,
        night: Math.round(timePatterns.night * 100) / 100
      },
      monthlyPattern: {
        earlyMonth: Math.round(monthlyPattern.earlyMonth * 100) / 100,
        midMonth: Math.round(monthlyPattern.midMonth * 100) / 100,
        lateMonth: Math.round(monthlyPattern.lateMonth * 100) / 100
      }
    };
  }
  
  /**
   * Get top spending categories
   */
  private getTopCategories(expenses: Transaction[]): { category: string; amount: number; percentage: number }[] {
    const categoryMap = new Map<string, number>();
    const totalSpending = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    expenses.forEach(t => {
      const category = t.category || 'Uncategorized';
      const current = categoryMap.get(category) || 0;
      categoryMap.set(category, current + parseFloat(t.amount));
    });
    
    const categories = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round((amount / totalSpending) * 100 * 10) / 10
    }));
    
    return categories.sort((a, b) => b.amount - a.amount).slice(0, 5);
  }
  
  /**
   * Detect unusual transactions
   */
  private detectUnusualTransactions(expenses: Transaction[]): { transaction: Transaction; reason: string }[] {
    if (expenses.length < 5) return [];
    
    const amounts = expenses.map(t => parseFloat(t.amount));
    const avg = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    
    const unusual: { transaction: Transaction; reason: string }[] = [];
    
    expenses.forEach(t => {
      const amount = parseFloat(t.amount);
      
      // Outlier detection (more than 2 standard deviations from mean)
      if (amount > avg + (2 * stdDev)) {
        unusual.push({
          transaction: t,
          reason: `Unusually large amount ($${amount.toFixed(2)} vs average $${avg.toFixed(2)})`
        });
      }
      
      // Same-day multiple large purchases
      const sameDay = expenses.filter(e => 
        e.date.toDateString() === t.date.toDateString() && 
        parseFloat(e.amount) > avg
      );
      if (sameDay.length > 3 && amount > avg) {
        unusual.push({
          transaction: t,
          reason: `Multiple large purchases on same day (${sameDay.length} transactions)`
        });
      }
    });
    
    // Remove duplicates and limit to top 5
    const seen = new Set();
    return unusual
      .filter(u => {
        if (seen.has(u.transaction.id)) return false;
        seen.add(u.transaction.id);
        return true;
      })
      .slice(0, 5);
  }
  
  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    patterns: SpendingPattern[],
    behavior: SpendingBehavior,
    expenses: Transaction[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Impulsive buying recommendations
    if (behavior.impulsiveBuying.detected) {
      recommendations.push(
        `You make ${behavior.impulsiveBuying.frequency} small purchases weekly (avg $${behavior.impulsiveBuying.averageAmount}). Try the 24-hour rule: wait a day before buying to reduce impulse spending by 30%.`
      );
    }
    
    // Weekend spending recommendations
    if (behavior.weekendSpending.weekendPercentage > 40) {
      recommendations.push(
        `${behavior.weekendSpending.weekendPercentage}% of spending happens on weekends. Plan weekend activities in advance to avoid overspending.`
      );
    }
    
    // Increasing trend recommendations
    const increasingCategories = patterns.filter(p => p.trend === 'increasing');
    if (increasingCategories.length > 0) {
      const top = increasingCategories[0];
      recommendations.push(
        `${top.category} spending is increasing (${top.percentage}% of budget). Set a monthly limit of $${Math.round(top.averageAmount * 4)} to control costs.`
      );
    }
    
    // High single category recommendations
    const topCategory = patterns[0];
    if (topCategory && topCategory.percentage > 40) {
      recommendations.push(
        `${topCategory.category} takes ${topCategory.percentage}% of your budget. Consider finding cheaper alternatives or reducing frequency.`
      );
    }
    
    // Monthly pattern recommendations
    if (behavior.monthlyPattern.lateMonth > behavior.monthlyPattern.earlyMonth * 1.5) {
      recommendations.push(
        `You spend more late in the month. This suggests budget depletion - try spreading expenses evenly or increasing early-month savings.`
      );
    }
    
    // Default recommendation if none generated
    if (recommendations.length === 0) {
      recommendations.push(
        'Your spending patterns look balanced. Keep tracking to maintain healthy financial habits.'
      );
    }
    
    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }
  
  /**
   * Get context for AI
   */
  getSpendingPatternsForAI(transactions: Transaction[]): string {
    const insights = this.analyzeSpendingPatterns(transactions);
    
    if (insights.patterns.length === 0) {
      return '\n💳 SPENDING PATTERNS: No transaction data available yet';
    }
    
    const topPatterns = insights.topCategories.slice(0, 3);
    const behaviorNotes: string[] = [];
    
    if (insights.behavior.impulsiveBuying.detected) {
      behaviorNotes.push(`⚠️ Impulsive buying detected: ${insights.behavior.impulsiveBuying.frequency} small purchases/week`);
    }
    
    if (insights.behavior.weekendSpending.weekendPercentage > 40) {
      behaviorNotes.push(`📅 Weekend heavy spender: ${insights.behavior.weekendSpending.weekendPercentage}% on weekends`);
    }
    
    const recurringInfo = insights.recurringExpenses.length > 0
      ? `\n• Recurring: ${insights.recurringExpenses.slice(0, 2).map(r => `${r.category} ($${r.amount}/${r.frequency})`).join(', ')}`
      : '';
    
    return `
💳 SPENDING PATTERN ANALYSIS:
• Top Categories: ${topPatterns.map(c => `${c.category} (${c.percentage}%)`).join(', ')}${recurringInfo}
${behaviorNotes.length > 0 ? behaviorNotes.map(n => `• ${n}`).join('\n') : ''}
• Key Insights: ${insights.recommendations[0] || 'Balanced spending'}

⚠️ Use these insights to give personalized budgeting advice!`;
  }
  
  /**
   * Helper functions
   */
  private getDaySpan(transactions: Transaction[]): number {
    if (transactions.length === 0) return 0;
    const dates = transactions.map(t => t.date.getTime());
    const min = Math.min(...dates);
    const max = Math.max(...dates);
    return Math.max(1, (max - min) / (1000 * 60 * 60 * 24));
  }
  
  private determineFrequency(count: number, daySpan: number): 'daily' | 'weekly' | 'monthly' | 'occasional' {
    const perDay = count / Math.max(1, daySpan);
    if (perDay >= 0.8) return 'daily';
    if (perDay >= 0.2) return 'weekly';
    if (perDay >= 0.05) return 'monthly';
    return 'occasional';
  }
  
  private getEmptyBehavior(): SpendingBehavior {
    return {
      impulsiveBuying: {
        detected: false,
        frequency: 0,
        averageAmount: 0,
        categories: []
      },
      weekendSpending: {
        weekendPercentage: 0,
        weekdayPercentage: 0,
        difference: 0
      },
      timeOfDayPatterns: {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0
      },
      monthlyPattern: {
        earlyMonth: 0,
        midMonth: 0,
        lateMonth: 0
      }
    };
  }
}

export const spendingPatternService = new SpendingPatternService();

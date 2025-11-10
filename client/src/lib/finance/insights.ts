import { Transaction } from './parseTransactions';
import { Category } from './categorize';

export interface Insight {
  title: string;
  message: string;
}

// Generate simple insights from categorized transactions.
export function generateInsights(transactions: (Transaction & { category: Category })[]): Insight[] {
  const insights: Insight[] = [];
  // Sum expenses by category
  const totals: Record<string, number> = {};
  for (const tx of transactions) {
    const key = tx.category;
    totals[key] = (totals[key] || 0) + tx.amount;
  }
  // Example: If total spent in category exceeds 3000 THB (negative), generate overspending insight
  for (const [category, total] of Object.entries(totals)) {
    if (total < -3000) {
      insights.push({
        title: `Overspending in ${category}`,
        message: `You have spent \u0e3f${Math.abs(total).toFixed(2)} in ${category} recently. Consider budgeting or cutting down.`,
      });
    }
  }
  return insights;
}

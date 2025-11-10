import { Transaction } from './parseTransactions';

export type Category = 'Food' | 'Bills' | 'Subscriptions' | 'Shopping' | 'Transport' | 'Income' | 'Other';

const KEYWORDS: { category: Category; keywords: string[] }[] = [
  { category: 'Food', keywords: ['restaurant', 'cafe', 'coffee', 'eat', 'food'] },
  { category: 'Bills', keywords: ['electricity', 'water', 'bill', 'utility', 'rent'] },
  { category: 'Subscriptions', keywords: ['netflix', 'spotify', 'subscription', 'apple', 'prime'] },
  { category: 'Shopping', keywords: ['amazon', 'shop', 'store', 'mall'] },
  { category: 'Transport', keywords: ['uber', 'grab', 'taxi', 'bus', 'train'] },
];

export function categorizeTransaction(tx: Transaction): Category {
  const desc = tx.description.toLowerCase();
  for (const { category, keywords } of KEYWORDS) {
    if (keywords.some(k => desc.includes(k))) {
      return category;
    }
  }
  // if amount positive treat as income else other
  return tx.amount >= 0 ? 'Income' : 'Other';
}

export function categorizeAll(transactions: Transaction[]): (Transaction & { category: Category })[] {
  return transactions.map(tx => ({
    ...tx,
    category: categorizeTransaction(tx),
  }));
}

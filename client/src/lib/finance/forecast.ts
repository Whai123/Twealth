import { Transaction } from './parseTransactions';

// Forecast future balance based on past average transaction amount.
export function forecastBalance(transactions: Transaction[], currentBalance: number, daysRemaining: number): number {
  if (transactions.length === 0) return currentBalance;
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const avgDaily = total / transactions.length;
  return currentBalance + avgDaily * daysRemaining;
}

// Generate an array of projected cumulative amounts for the next N days.
export function forecastCashflow(transactions: Transaction[], days: number): number[] {
  if (transactions.length === 0) return Array.from({ length: days }, () => 0);
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const avgDaily = total / transactions.length;
  return Array.from({ length: days }, (_, i) => avgDaily * (i + 1));
}

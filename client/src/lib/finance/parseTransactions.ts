export interface Transaction {
  id: string;
  date: string; // ISO string
  description: string;
  amount: number;
  currency: string;
}

export function parseCSV(csv: string): Transaction[] {
  const lines = csv.trim().split(/\r?\n/);
  const header = lines.shift();
  const transactions: Transaction[] = [];
  for (const line of lines) {
    const [date, description, amount, currency] = line.split(',');
    transactions.push({
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(),
      date: date.trim(),
      description: description.trim(),
      amount: parseFloat(amount),
      currency: currency?.trim() ?? 'THB',
    });
  }
  return transactions;
}

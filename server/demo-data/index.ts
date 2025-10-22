/**
 * Demo Data Service
 * Provides realistic sample data for new users to explore the app
 */

import { addMonths, subDays, subMonths } from 'date-fns';

export interface DemoTransaction {
  id: string;
  amount: string;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  description: string;
  date: Date;
}

export interface DemoGoal {
  id: string;
  title: string;
  description: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: Date;
  category: string;
  priority: string;
  status: string;
  createdAt: Date;
}

// Generate realistic demo transactions for the past 6 months
export function generateDemoTransactions(): DemoTransaction[] {
  const transactions: DemoTransaction[] = [];
  const now = new Date();
  
  // Monthly income (salary)
  for (let i = 0; i < 6; i++) {
    const date = subMonths(now, i);
    transactions.push({
      id: `demo-income-${i}`,
      amount: '5250',
      type: 'income',
      category: 'Salary',
      description: 'Monthly Salary',
      date: new Date(date.getFullYear(), date.getMonth(), 1)
    });
  }
  
  // Recurring expenses
  const recurringExpenses = [
    { category: 'Housing', description: 'Rent', amount: '1800', day: 1 },
    { category: 'Utilities', description: 'Electricity & Water', amount: '150', day: 5 },
    { category: 'Transportation', description: 'Car Payment', amount: '350', day: 10 },
    { category: 'Insurance', description: 'Health Insurance', amount: '280', day: 1 },
    { category: 'Subscriptions', description: 'Netflix & Spotify', amount: '35', day: 15 },
    { category: 'Subscriptions', description: 'Gym Membership', amount: '50', day: 1 },
  ];
  
  for (let month = 0; month < 6; month++) {
    recurringExpenses.forEach((expense, idx) => {
      const date = subMonths(now, month);
      transactions.push({
        id: `demo-expense-${month}-${idx}`,
        amount: expense.amount,
        type: 'expense',
        category: expense.category,
        description: expense.description,
        date: new Date(date.getFullYear(), date.getMonth(), expense.day)
      });
    });
  }
  
  // Random one-time expenses (groceries, dining, shopping)
  const randomExpenses = [
    { category: 'Food & Dining', descriptions: ['Whole Foods', 'Starbucks', 'Restaurant', 'Chipotle', 'Grocery Store'], range: [15, 120] },
    { category: 'Shopping', descriptions: ['Amazon', 'Target', 'Best Buy', 'Online Store'], range: [30, 200] },
    { category: 'Entertainment', descriptions: ['Movie Theater', 'Concert Tickets', 'Gaming', 'Books'], range: [20, 150] },
    { category: 'Health', descriptions: ['Pharmacy', 'Doctor Visit', 'Vitamins'], range: [25, 100] },
  ];
  
  let expenseId = 1000;
  for (let month = 0; month < 6; month++) {
    for (let week = 0; week < 4; week++) {
      randomExpenses.forEach(category => {
        const randomCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < randomCount; i++) {
          const day = week * 7 + Math.floor(Math.random() * 7) + 1;
          const date = subMonths(now, month);
          const amount = Math.floor(Math.random() * (category.range[1] - category.range[0]) + category.range[0]);
          const description = category.descriptions[Math.floor(Math.random() * category.descriptions.length)];
          
          if (day <= new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()) {
            transactions.push({
              id: `demo-random-${expenseId++}`,
              amount: amount.toString(),
              type: 'expense',
              category: category.category,
              description,
              date: new Date(date.getFullYear(), date.getMonth(), day)
            });
          }
        }
      });
    }
  }
  
  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// Generate realistic demo financial goals
export function generateDemoGoals(): DemoGoal[] {
  const now = new Date();
  
  return [
    {
      id: 'demo-goal-1',
      title: 'Emergency Fund',
      description: 'Build a 6-month emergency fund for financial security',
      targetAmount: '18000',
      currentAmount: '7250',
      targetDate: addMonths(now, 10),
      category: 'emergency',
      priority: 'high',
      status: 'active',
      createdAt: subMonths(now, 4)
    },
    {
      id: 'demo-goal-2',
      title: 'Dream Vacation to Japan',
      description: 'Two-week trip to Tokyo and Kyoto',
      targetAmount: '6000',
      currentAmount: '2100',
      targetDate: addMonths(now, 8),
      category: 'vacation',
      priority: 'medium',
      status: 'active',
      createdAt: subMonths(now, 2)
    },
    {
      id: 'demo-goal-3',
      title: 'New Laptop',
      description: 'MacBook Pro for work and creative projects',
      targetAmount: '2500',
      currentAmount: '1850',
      targetDate: addMonths(now, 3),
      category: 'purchase',
      priority: 'high',
      status: 'active',
      createdAt: subMonths(now, 3)
    },
    {
      id: 'demo-goal-4',
      title: 'Investment Portfolio',
      description: 'Start building a diversified investment portfolio',
      targetAmount: '10000',
      currentAmount: '3400',
      targetDate: addMonths(now, 12),
      category: 'investment',
      priority: 'medium',
      status: 'active',
      createdAt: subMonths(now, 5)
    },
    {
      id: 'demo-goal-5',
      title: 'Down Payment for House',
      description: 'Saving for a 20% down payment on a home',
      targetAmount: '60000',
      currentAmount: '12500',
      targetDate: addMonths(now, 36),
      category: 'house',
      priority: 'high',
      status: 'active',
      createdAt: subMonths(now, 8)
    }
  ];
}

// Generate demo crypto holdings
export function generateDemoCryptoHoldings() {
  const now = new Date();
  
  return [
    {
      id: 'demo-crypto-1',
      coinId: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      amount: '0.15',
      averageBuyPrice: '42000',
      currentPrice: '45000', // Will be updated by real API
      source: 'manual',
      notes: 'Long-term holding',
      lastPriceUpdate: now,
      createdAt: subMonths(now, 6)
    },
    {
      id: 'demo-crypto-2',
      coinId: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      amount: '2.5',
      averageBuyPrice: '2200',
      currentPrice: '2500',
      source: 'manual',
      notes: 'DeFi investments',
      lastPriceUpdate: now,
      createdAt: subMonths(now, 4)
    }
  ];
}

// Calculate demo financial stats
export function getDemoFinancialStats() {
  const transactions = generateDemoTransactions();
  const goals = generateDemoGoals();
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
  const totalSavings = totalIncome - totalExpenses;
  const currentGoalsSavings = goals.reduce((sum, g) => sum + parseFloat(g.currentAmount), 0);
  
  return {
    totalSavings: totalSavings.toFixed(2),
    activeGoals: goals.filter(g => g.status === 'active').length.toString(),
    monthlyIncome: '5250',
    monthlyExpenses: (totalExpenses / 6).toFixed(2),
    savingsRate: ((totalSavings / totalIncome) * 100).toFixed(1) + '%',
    goalsProgress: currentGoalsSavings.toFixed(2)
  };
}

// Demo time-value insights
export function getDemoTimeStats() {
  return {
    totalTimeHours: 720, // ~90 days worth of tracked time
    timeValue: 3600, // 720 hours * $50/hour
    productivity: 0.85,
    efficiency: 0.78,
    focusScore: 82
  };
}

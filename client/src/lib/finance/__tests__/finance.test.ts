import { describe, it, expect } from 'vitest';
import { parseCSV, type Transaction } from '../parseTransactions';
import { categorizeTransaction, categorizeAll, type Category } from '../categorize';
import { forecastCashflow, forecastBalance } from '../forecast';
import { generateInsights } from '../insights';

describe('Finance Library Tests', () => {
  describe('CSV Parsing', () => {
    it('should parse simple CSV lines correctly', () => {
      const csv = `date,description,amount,currency
2024-01-15,Coffee Shop,-4.50,USD
2024-01-16,Salary,3000.00,USD
2024-01-17,Grocery Store,-45.20,USD`;

      const transactions = parseCSV(csv);

      expect(transactions).toHaveLength(3);
      expect(transactions[0]).toMatchObject({
        date: '2024-01-15',
        description: 'Coffee Shop',
        amount: -4.50,
        currency: 'USD',
      });
      expect(transactions[1]).toMatchObject({
        date: '2024-01-16',
        description: 'Salary',
        amount: 3000.00,
        currency: 'USD',
      });
      expect(transactions[2]).toMatchObject({
        date: '2024-01-17',
        description: 'Grocery Store',
        amount: -45.20,
        currency: 'USD',
      });
    });

    it('should handle empty CSV gracefully', () => {
      const csv = '';
      const transactions = parseCSV(csv);
      expect(transactions).toHaveLength(0);
    });

    it('should generate unique IDs for transactions', () => {
      const csv = `date,description,amount,currency
2024-01-15,Test1,-10.00,USD
2024-01-16,Test2,-20.00,USD`;

      const transactions = parseCSV(csv);
      expect(transactions[0].id).toBeDefined();
      expect(transactions[1].id).toBeDefined();
      expect(transactions[0].id).not.toBe(transactions[1].id);
    });

    it('should handle malformed CSV rows gracefully', () => {
      const csv = `date,description,amount,currency
2024-01-15,Coffee,-5.00,USD
2024-01-16,Invalid Row
2024-01-17,Groceries,-50.00,USD`;

      const transactions = parseCSV(csv);
      
      // Should parse valid rows and handle malformed ones
      expect(transactions).toHaveLength(3);
      expect(transactions[0].description).toBe('Coffee');
      expect(transactions[1].description).toBe('Invalid Row');
      expect(transactions[2].description).toBe('Groceries');
    });

    it('should handle missing currency field', () => {
      const csv = `date,description,amount
2024-01-15,Test,-10.00`;

      const transactions = parseCSV(csv);
      
      expect(transactions).toHaveLength(1);
      expect(transactions[0].currency).toBe('THB'); // Default currency
    });
  });

  describe('Categorization', () => {
    it('should categorize food transactions correctly', () => {
      const transaction: Transaction = {
        id: '1',
        date: '2024-01-15',
        description: 'Starbucks Coffee Shop',
        amount: -5.50,
        currency: 'USD',
      };

      const category = categorizeTransaction(transaction);
      expect(category).toBe('Food');
    });

    it('should categorize bills correctly', () => {
      const transaction: Transaction = {
        id: '2',
        date: '2024-01-15',
        description: 'Electricity Bill Payment',
        amount: -100.00,
        currency: 'USD',
      };

      const category = categorizeTransaction(transaction);
      expect(category).toBe('Bills');
    });

    it('should categorize subscriptions correctly', () => {
      const transaction: Transaction = {
        id: '3',
        date: '2024-01-15',
        description: 'Netflix Subscription',
        amount: -15.99,
        currency: 'USD',
      };

      const category = categorizeTransaction(transaction);
      expect(category).toBe('Subscriptions');
    });

    it('should categorize positive amounts as Income', () => {
      const transaction: Transaction = {
        id: '4',
        date: '2024-01-15',
        description: 'Monthly Salary',
        amount: 5000.00,
        currency: 'USD',
      };

      const category = categorizeTransaction(transaction);
      expect(category).toBe('Income');
    });

    it('should categorize unknown expenses as Other', () => {
      const transaction: Transaction = {
        id: '5',
        date: '2024-01-15',
        description: 'Unknown Payment',
        amount: -25.00,
        currency: 'USD',
      };

      const category = categorizeTransaction(transaction);
      expect(category).toBe('Other');
    });

    it('should categorize all transactions in array', () => {
      const transactions: Transaction[] = [
        { id: '1', date: '2024-01-15', description: 'Coffee', amount: -5.00, currency: 'USD' },
        { id: '2', date: '2024-01-16', description: 'Salary', amount: 3000.00, currency: 'USD' },
      ];

      const categorized = categorizeAll(transactions);

      expect(categorized).toHaveLength(2);
      expect(categorized[0].category).toBe('Food');
      expect(categorized[1].category).toBe('Income');
    });
  });

  describe('Cash Flow Forecast', () => {
    it('should generate correct forecast length', () => {
      const transactions: Transaction[] = [
        { id: '1', date: '2024-01-15', description: 'Coffee', amount: -5.00, currency: 'USD' },
        { id: '2', date: '2024-01-16', description: 'Salary', amount: 3000.00, currency: 'USD' },
        { id: '3', date: '2024-01-17', description: 'Groceries', amount: -50.00, currency: 'USD' },
      ];

      const forecast = forecastCashflow(transactions, 30);

      expect(forecast).toHaveLength(30);
    });

    it('should calculate daily average correctly', () => {
      const transactions: Transaction[] = [
        { id: '1', date: '2024-01-15', description: 'Expense', amount: -100.00, currency: 'USD' },
        { id: '2', date: '2024-01-16', description: 'Income', amount: 300.00, currency: 'USD' },
      ];

      const forecast = forecastCashflow(transactions, 5);

      // Total: -100 + 300 = 200
      // Daily average: 200 / 2 = 100
      // Day 1 forecast: 100 * 1 = 100
      expect(forecast[0]).toBe(100);
      expect(forecast[1]).toBe(200);
      expect(forecast[2]).toBe(300);
    });

    it('should handle empty transactions', () => {
      const transactions: Transaction[] = [];
      const forecast = forecastCashflow(transactions, 10);

      expect(forecast).toHaveLength(10);
      expect(forecast.every(amount => amount === 0)).toBe(true);
    });

    it('should forecast balance correctly', () => {
      const transactions: Transaction[] = [
        { id: '1', date: '2024-01-15', description: 'Test', amount: 100.00, currency: 'USD' },
      ];

      const currentBalance = 1000;
      const daysRemaining = 30;
      const futureBalance = forecastBalance(transactions, currentBalance, daysRemaining);

      // Average daily: 100 / 1 = 100
      // Forecast: 1000 + (100 * 30) = 4000
      expect(futureBalance).toBe(4000);
    });

    it('should handle negative forecast trajectories', () => {
      const transactions: Transaction[] = [
        { id: '1', date: '2024-01-15', description: 'Expense', amount: -200.00, currency: 'USD' },
      ];

      const currentBalance = 500;
      const daysRemaining = 10;
      const futureBalance = forecastBalance(transactions, currentBalance, daysRemaining);

      // Average daily: -200 / 1 = -200
      // Forecast: 500 + (-200 * 10) = -1500
      expect(futureBalance).toBe(-1500);
      expect(futureBalance).toBeLessThan(currentBalance);
    });

    it('should handle large forecast periods', () => {
      const transactions: Transaction[] = [
        { id: '1', date: '2024-01-15', description: 'Test', amount: 10.00, currency: 'USD' },
      ];

      const forecast = forecastCashflow(transactions, 365);
      
      expect(forecast).toHaveLength(365);
      expect(forecast[0]).toBe(10);
      expect(forecast[364]).toBe(3650);
    });
  });

  describe('Insights Generation', () => {
    it('should trigger overspending insight for high expenses', () => {
      const transactions = [
        {
          id: '1',
          date: '2024-01-15',
          description: 'Food expense 1',
          amount: -2000.00,
          currency: 'THB',
          category: 'Food' as Category,
        },
        {
          id: '2',
          date: '2024-01-16',
          description: 'Food expense 2',
          amount: -1500.00,
          currency: 'THB',
          category: 'Food' as Category,
        },
      ];

      const insights = generateInsights(transactions);

      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0].title).toContain('Overspending');
      expect(insights[0].title).toContain('Food');
    });

    it('should not trigger insights for normal spending', () => {
      const transactions = [
        {
          id: '1',
          date: '2024-01-15',
          description: 'Small expense',
          amount: -50.00,
          currency: 'THB',
          category: 'Food' as Category,
        },
      ];

      const insights = generateInsights(transactions);

      expect(insights).toHaveLength(0);
    });

    it('should generate multiple insights for multiple categories', () => {
      const transactions = [
        {
          id: '1',
          date: '2024-01-15',
          description: 'Food expense',
          amount: -3500.00,
          currency: 'THB',
          category: 'Food' as Category,
        },
        {
          id: '2',
          date: '2024-01-16',
          description: 'Shopping expense',
          amount: -3500.00,
          currency: 'THB',
          category: 'Shopping' as Category,
        },
      ];

      const insights = generateInsights(transactions);

      expect(insights.length).toBeGreaterThanOrEqual(2);
    });

    it('should format insight messages correctly', () => {
      const transactions = [
        {
          id: '1',
          date: '2024-01-15',
          description: 'Bills',
          amount: -4000.00,
          currency: 'THB',
          category: 'Bills' as Category,
        },
      ];

      const insights = generateInsights(transactions);

      expect(insights[0].message).toContain('4000.00');
      expect(insights[0].message).toContain('Bills');
      expect(insights[0].message).toContain('budget');
    });

    it('should handle mixed currencies in transactions', () => {
      const transactions = [
        {
          id: '1',
          date: '2024-01-15',
          description: 'USD expense',
          amount: -100.00,
          currency: 'USD',
          category: 'Food' as Category,
        },
        {
          id: '2',
          date: '2024-01-16',
          description: 'THB expense',
          amount: -3500.00,
          currency: 'THB',
          category: 'Food' as Category,
        },
      ];

      // Insights should still be generated even with mixed currencies
      const insights = generateInsights(transactions);
      
      // At least THB should trigger overspending
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should handle edge case of exactly 3000 THB threshold', () => {
      const transactions = [
        {
          id: '1',
          date: '2024-01-15',
          description: 'Exactly at threshold',
          amount: -3000.00,
          currency: 'THB',
          category: 'Food' as Category,
        },
      ];

      const insights = generateInsights(transactions);
      
      // Should not trigger at exactly 3000 (only > 3000)
      expect(insights).toHaveLength(0);
    });

    it('should handle very large spending amounts', () => {
      const transactions = [
        {
          id: '1',
          date: '2024-01-15',
          description: 'Large expense',
          amount: -1000000.00,
          currency: 'THB',
          category: 'Shopping' as Category,
        },
      ];

      const insights = generateInsights(transactions);
      
      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0].message).toContain('1000000.00');
    });
  });
});

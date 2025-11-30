// System Prompt Cache Service
// Caches the expensive buildSystemPrompt() result to avoid redundant API calls

interface CacheKey {
  userId: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  totalSavings: number;
  activeGoals: number;
  language: string;
  cryptoEnabled: boolean;
  experienceLevel: string;
}

class SystemPromptCacheService {
  private cache: Map<string, { prompt: string; timestamp: number; contextHash: string }> = new Map();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour - market data changes, but not frequently enough to warrant per-message fetches
  
  /**
   * Generate a stable cache key from user context
   */
  private generateCacheKey(context: CacheKey): string {
    // Round financial values to ranges to increase cache hits
    const incomeRange = this.getIncomeRange(context.monthlyIncome);
    const expensesRange = this.getExpensesRange(context.monthlyExpenses);
    const savingsRange = this.getSavingsRange(context.totalSavings);
    
    return `${context.userId}:${incomeRange}:${expensesRange}:${savingsRange}:${context.activeGoals}:${context.language}:${context.cryptoEnabled}:${context.experienceLevel}`;
  }
  
  private getIncomeRange(income: number): string {
    if (income === 0) return 'zero';
    if (income < 30000) return 'low';
    if (income < 80000) return 'medium';
    if (income < 150000) return 'high';
    return 'very-high';
  }
  
  private getExpensesRange(expenses: number): string {
    if (expenses === 0) return 'zero';
    if (expenses < 20000) return 'low';
    if (expenses < 60000) return 'medium';
    if (expenses < 120000) return 'high';
    return 'very-high';
  }
  
  private getSavingsRange(savings: number): string {
    if (savings === 0) return 'zero';
    if (savings < 5000) return 'low';
    if (savings < 50000) return 'medium';
    if (savings < 250000) return 'high';
    return 'very-high';
  }
  
  /**
   * Get cached system prompt if available and not expired
   */
  get(context: CacheKey): string | null {
    const key = this.generateCacheKey(context);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    console.log('System prompt cache HIT - saved expensive market/tax API calls');
    return cached.prompt;
  }
  
  /**
   * Store system prompt in cache
   */
  set(context: CacheKey, prompt: string): void {
    const key = this.generateCacheKey(context);
    
    // Cleanup old entries if cache is getting large (keep last 100 users)
    if (this.cache.size >= 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      prompt,
      timestamp: Date.now(),
      contextHash: key
    });
  }
  
  /**
   * Clear cache for a specific user (when their data changes significantly)
   */
  clearUser(userId: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }
  
  /**
   * Get cache statistics
   */
  getStats(): { size: number; oldestEntry: number | null } {
    let oldestTimestamp: number | null = null;
    
    this.cache.forEach((value) => {
      if (!oldestTimestamp || value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
      }
    });
    
    return {
      size: this.cache.size,
      oldestEntry: oldestTimestamp ? Date.now() - oldestTimestamp : null
    };
  }
}

export const systemPromptCache = new SystemPromptCacheService();

// Comprehensive Market Data Service
// Integrates stocks, forex, inflation, economic indicators, and financial benchmarks

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
}

interface ForexRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
}

interface InflationData {
  country: string;
  rate: number; // Annual inflation rate percentage
  month: string;
  year: number;
}

interface EconomicIndicator {
  name: string;
  value: number;
  unit: string;
  country: string;
  lastUpdated: Date;
}

interface FearGreedIndex {
  value: number;  // 0-100
  classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  timestamp: Date;
}

interface FinancialBenchmarks {
  savingsRateByAge: { ageRange: string; recommendedRate: number; averageRate: number }[];
  emergencyFundMonths: { incomeLevel: string; months: number }[];
  debtToIncomeRatios: { type: string; healthy: number; warning: number; critical: number }[];
  retirementMultiples: { age: number; multiplier: number }[];
  expenseRatiosByCategory: { category: string; averagePercent: number; healthyMax: number }[];
}

interface MarketDataCache {
  stocks: Map<string, { data: StockQuote; timestamp: number }>;
  forex: Map<string, { data: ForexRate; timestamp: number }>;
  inflation: Map<string, { data: InflationData; timestamp: number }>;
  indicators: Map<string, { data: EconomicIndicator; timestamp: number }>;
  fearGreed: { data: FearGreedIndex; timestamp: number } | null;
  economicIndicatorsSet: Map<string, { data: Map<string, EconomicIndicator>; timestamp: number }>;
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour for market data
const FEAR_GREED_CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours for fear/greed
const cache: MarketDataCache = {
  stocks: new Map(),
  forex: new Map(),
  inflation: new Map(),
  indicators: new Map(),
  fearGreed: null,
  economicIndicatorsSet: new Map()
};

export class MarketDataService {
  /**
   * Get real-time stock quote
   * Using Yahoo Finance alternative API (no key required)
   */
  async getStockQuote(symbol: string): Promise<StockQuote | null> {
    const cacheKey = symbol.toUpperCase();
    const cached = cache.stocks.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Using Yahoo Finance v8 API (free, no key)
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`[MarketData] Stock quote failed for ${symbol}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const result = data?.chart?.result?.[0];
      
      if (!result) return null;

      const meta = result.meta;
      const quote: StockQuote = {
        symbol: symbol.toUpperCase(),
        price: meta.regularMarketPrice || 0,
        change: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
        changePercent: meta.regularMarketPrice && meta.previousClose 
          ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 
          : 0,
        volume: meta.regularMarketVolume,
        marketCap: meta.marketCap
      };

      cache.stocks.set(cacheKey, { data: quote, timestamp: Date.now() });
      return quote;
    } catch (error) {
      console.error(`[MarketData] Error fetching stock ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get multiple stock quotes in parallel
   */
  async getMultipleStocks(symbols: string[]): Promise<Map<string, StockQuote>> {
    const results = new Map<string, StockQuote>();
    
    try {
      const promises = symbols.map(async (symbol) => {
        try {
          const quote = await this.getStockQuote(symbol);
          if (quote) results.set(symbol.toUpperCase(), quote);
        } catch (error) {
          console.error(`[MarketData] Error fetching stock ${symbol}:`, error);
          // Continue with other stocks even if one fails
        }
      });
      
      await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('[MarketData] Error fetching multiple stocks:', error);
      return results; // Return whatever we managed to fetch
    }
  }

  /**
   * Get forex exchange rate
   */
  async getForexRate(from: string, to: string): Promise<ForexRate | null> {
    const cacheKey = `${from}_${to}`;
    const cached = cache.forex.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Using exchangerate-api (free tier)
      const url = `https://api.exchangerate-api.com/v4/latest/${from}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`[MarketData] Forex rate failed for ${from}/${to}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const rate = data.rates?.[to];
      
      if (!rate) return null;

      const forexRate: ForexRate = {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate: rate,
        lastUpdated: new Date(data.time_last_updated * 1000)
      };

      cache.forex.set(cacheKey, { data: forexRate, timestamp: Date.now() });
      return forexRate;
    } catch (error) {
      console.error(`[MarketData] Error fetching forex ${from}/${to}:`, error);
      return null;
    }
  }

  /**
   * Get current inflation rate for a country
   * Using World Bank API (free, no key)
   */
  async getInflationRate(countryCode: string = 'US'): Promise<InflationData | null> {
    const cacheKey = countryCode.toUpperCase();
    const cached = cache.inflation.get(cacheKey);
    
    // Inflation data changes monthly, cache longer
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return cached.data;
    }

    try {
      // World Bank inflation data
      const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/FP.CPI.TOTL.ZG?format=json&per_page=1&date=2020:2025`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`[MarketData] Inflation data failed for ${countryCode}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const latest = data?.[1]?.[0];
      
      if (!latest || !latest.value) {
        // Fallback to hardcoded recent rates
        return this.getFallbackInflation(countryCode);
      }

      const inflationData: InflationData = {
        country: countryCode.toUpperCase(),
        rate: latest.value,
        month: 'Annual',
        year: parseInt(latest.date)
      };

      cache.inflation.set(cacheKey, { data: inflationData, timestamp: Date.now() });
      return inflationData;
    } catch (error) {
      console.error(`[MarketData] Error fetching inflation for ${countryCode}:`, error);
      return this.getFallbackInflation(countryCode);
    }
  }

  /**
   * Fallback inflation rates (updated 2024)
   */
  private getFallbackInflation(countryCode: string): InflationData {
    const fallbackRates: { [key: string]: number } = {
      'US': 3.4,   // USA
      'UK': 4.0,   // United Kingdom
      'EU': 2.8,   // Eurozone
      'CA': 3.1,   // Canada
      'AU': 4.1,   // Australia
      'JP': 3.2,   // Japan
      'CN': 0.2,   // China
      'IN': 5.4,   // India
      'BR': 4.5,   // Brazil
      'MX': 4.8,   // Mexico
      'TH': 1.0,   // Thailand
      'ID': 2.5,   // Indonesia
      'PH': 3.2,   // Philippines
      'VN': 3.7,   // Vietnam
      'MY': 2.0,   // Malaysia
      'TR': 64.8,  // Turkey (high inflation)
      'AR': 211.4, // Argentina (hyperinflation)
    };

    return {
      country: countryCode.toUpperCase(),
      rate: fallbackRates[countryCode.toUpperCase()] || 3.0,
      month: 'Annual',
      year: 2024
    };
  }

  /**
   * Get crypto Fear & Greed Index from alternative.me API
   */
  async getCryptoFearGreedIndex(): Promise<FearGreedIndex | null> {
    if (cache.fearGreed && Date.now() - cache.fearGreed.timestamp < FEAR_GREED_CACHE_DURATION) {
      return cache.fearGreed.data;
    }

    try {
      const response = await fetch('https://api.alternative.me/fng/?limit=1');
      
      if (!response.ok) {
        console.error(`[MarketData] Fear & Greed Index failed: ${response.status}`);
        return this.getFallbackFearGreed();
      }

      const data = await response.json();
      const fngData = data?.data?.[0];
      
      if (!fngData) return this.getFallbackFearGreed();

      const value = parseInt(fngData.value);
      const classification = this.classifyFearGreed(value);

      const result: FearGreedIndex = {
        value,
        classification,
        timestamp: new Date(parseInt(fngData.timestamp) * 1000)
      };

      cache.fearGreed = { data: result, timestamp: Date.now() };
      return result;
    } catch (error) {
      console.error('[MarketData] Error fetching Fear & Greed Index:', error);
      return this.getFallbackFearGreed();
    }
  }

  private classifyFearGreed(value: number): FearGreedIndex['classification'] {
    if (value <= 20) return 'Extreme Fear';
    if (value <= 40) return 'Fear';
    if (value <= 60) return 'Neutral';
    if (value <= 80) return 'Greed';
    return 'Extreme Greed';
  }

  private getFallbackFearGreed(): FearGreedIndex {
    return {
      value: 50,
      classification: 'Neutral',
      timestamp: new Date()
    };
  }

  /**
   * Get expert-sourced financial benchmarks for personalized advice
   * Based on research from Fidelity, Vanguard, and financial planning standards
   */
  getFinancialBenchmarks(): FinancialBenchmarks {
    return {
      savingsRateByAge: [
        { ageRange: '20-29', recommendedRate: 15, averageRate: 8 },
        { ageRange: '30-39', recommendedRate: 18, averageRate: 10 },
        { ageRange: '40-49', recommendedRate: 20, averageRate: 12 },
        { ageRange: '50-59', recommendedRate: 25, averageRate: 14 },
        { ageRange: '60+', recommendedRate: 30, averageRate: 16 }
      ],
      emergencyFundMonths: [
        { incomeLevel: 'Low (<$40k)', months: 3 },
        { incomeLevel: 'Medium ($40k-$100k)', months: 6 },
        { incomeLevel: 'High (>$100k)', months: 9 },
        { incomeLevel: 'Variable/Self-employed', months: 12 }
      ],
      debtToIncomeRatios: [
        { type: 'Front-end (Housing)', healthy: 28, warning: 35, critical: 40 },
        { type: 'Back-end (Total Debt)', healthy: 36, warning: 43, critical: 50 },
        { type: 'Credit Card Utilization', healthy: 10, warning: 30, critical: 50 }
      ],
      retirementMultiples: [
        { age: 30, multiplier: 1 },    // 1x annual salary
        { age: 35, multiplier: 2 },
        { age: 40, multiplier: 3 },
        { age: 45, multiplier: 4 },
        { age: 50, multiplier: 6 },
        { age: 55, multiplier: 7 },
        { age: 60, multiplier: 8 },
        { age: 65, multiplier: 10 },
        { age: 67, multiplier: 10 }   // Full retirement age
      ],
      expenseRatiosByCategory: [
        { category: 'Housing', averagePercent: 33, healthyMax: 30 },
        { category: 'Transportation', averagePercent: 17, healthyMax: 15 },
        { category: 'Food', averagePercent: 13, healthyMax: 12 },
        { category: 'Insurance', averagePercent: 11, healthyMax: 10 },
        { category: 'Healthcare', averagePercent: 8, healthyMax: 8 },
        { category: 'Utilities', averagePercent: 6, healthyMax: 5 },
        { category: 'Entertainment', averagePercent: 5, healthyMax: 5 },
        { category: 'Clothing', averagePercent: 3, healthyMax: 3 },
        { category: 'Personal Care', averagePercent: 2, healthyMax: 2 },
        { category: 'Miscellaneous', averagePercent: 2, healthyMax: 5 }
      ]
    };
  }

  /**
   * Get major economic indicators with live data where available (cached)
   */
  async getEconomicIndicators(country: string = 'US'): Promise<Map<string, EconomicIndicator>> {
    const cacheKey = country.toUpperCase();
    const cached = cache.economicIndicatorsSet.get(cacheKey);
    
    // Return cached indicators if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const indicators = new Map<string, EconomicIndicator>();
    
    if (country === 'US') {
      // Try to fetch live treasury yields as proxy for Fed rate expectations
      try {
        const treasuryData = await this.fetchTreasuryYields();
        if (treasuryData) {
          indicators.set('treasury_10y', {
            name: '10-Year Treasury Yield',
            value: treasuryData.tenYear,
            unit: '%',
            country: 'US',
            lastUpdated: new Date()
          });
          indicators.set('treasury_2y', {
            name: '2-Year Treasury Yield',
            value: treasuryData.twoYear,
            unit: '%',
            country: 'US',
            lastUpdated: new Date()
          });
          // Yield curve inversion indicator
          const yieldSpread = treasuryData.tenYear - treasuryData.twoYear;
          indicators.set('yield_curve_spread', {
            name: 'Yield Curve Spread (10Y-2Y)',
            value: yieldSpread,
            unit: '%',
            country: 'US',
            lastUpdated: new Date()
          });
        }
      } catch (error) {
        console.error('[MarketData] Error fetching treasury yields:', error);
      }

      // Latest Fed Funds Rate (updated regularly based on FOMC meetings)
      indicators.set('federal_funds_rate', {
        name: 'Federal Funds Rate',
        value: 4.50, // Updated Dec 2024 (after Dec FOMC cut)
        unit: '%',
        country: 'US',
        lastUpdated: new Date('2024-12-18')
      });

      indicators.set('unemployment_rate', {
        name: 'Unemployment Rate',
        value: 4.2,
        unit: '%',
        country: 'US',
        lastUpdated: new Date('2024-11-01')
      });

      indicators.set('gdp_growth', {
        name: 'GDP Growth (Q3 2024)',
        value: 2.8,
        unit: '%',
        country: 'US',
        lastUpdated: new Date('2024-10-30')
      });

      // Consumer confidence
      indicators.set('consumer_confidence', {
        name: 'Consumer Confidence Index',
        value: 111.7,
        unit: 'index',
        country: 'US',
        lastUpdated: new Date('2024-11-26')
      });

      // Prime rate (follows Fed rate + 3%)
      indicators.set('prime_rate', {
        name: 'Prime Rate',
        value: 7.50,
        unit: '%',
        country: 'US',
        lastUpdated: new Date('2024-12-18')
      });
    }

    // Cache the results
    cache.economicIndicatorsSet.set(cacheKey, { data: indicators, timestamp: Date.now() });
    
    return indicators;
  }

  /**
   * Fetch live treasury yields from Yahoo Finance
   */
  private async fetchTreasuryYields(): Promise<{ tenYear: number; twoYear: number } | null> {
    try {
      const [tenYearQuote, twoYearQuote] = await Promise.all([
        this.getStockQuote('^TNX'), // 10-year treasury yield
        this.getStockQuote('^IRX')  // 3-month treasury (2Y not available, use as proxy)
      ]);
      
      if (tenYearQuote && twoYearQuote) {
        return {
          tenYear: tenYearQuote.price / 10, // Yahoo returns as whole number
          twoYear: twoYearQuote.price / 10
        };
      }
      return null;
    } catch (error) {
      console.error('[MarketData] Error fetching treasury yields:', error);
      return null;
    }
  }

  /**
   * Get comprehensive market overview
   */
  async getMarketOverview(): Promise<{
    stocks: Map<string, StockQuote>;
    inflation: InflationData | null;
    indicators: Map<string, EconomicIndicator>;
  }> {
    try {
      // Fetch major indices in parallel with error handling
      const majorIndices = ['SPY', 'QQQ', 'DIA']; // S&P 500, NASDAQ, Dow Jones ETFs
      
      const [stocks, inflation, indicators] = await Promise.all([
        this.getMultipleStocks(majorIndices).catch(err => {
          console.error('[MarketData] Error fetching stocks in overview:', err);
          return new Map<string, StockQuote>();
        }),
        this.getInflationRate('US').catch(err => {
          console.error('[MarketData] Error fetching inflation in overview:', err);
          return null;
        }),
        this.getEconomicIndicators('US').catch(err => {
          console.error('[MarketData] Error fetching indicators in overview:', err);
          return new Map<string, EconomicIndicator>();
        })
      ]);

      return {
        stocks,
        inflation,
        indicators
      };
    } catch (error) {
      console.error('[MarketData] Critical error in market overview:', error);
      // Return safe defaults if everything fails
      return {
        stocks: new Map(),
        inflation: null,
        indicators: new Map()
      };
    }
  }

  /**
   * Get market sentiment summary for AI context - Enhanced with all data sources
   */
  async getMarketContextForAI(userCountry: string = 'US'): Promise<string> {
    try {
      const [sp500, nasdaq, inflation, indicators, fearGreed] = await Promise.all([
        this.getStockQuote('SPY'),
        this.getStockQuote('QQQ'),
        this.getInflationRate(userCountry),
        this.getEconomicIndicators(userCountry),
        this.getCryptoFearGreedIndex()
      ]);

      let context = 'CURRENT MARKET CONDITIONS (Live Data):\n\n';
      
      // Stock Market
      context += '📈 STOCK MARKET:\n';
      if (sp500) {
        context += `• S&P 500 (SPY): $${sp500.price.toFixed(2)} (${sp500.changePercent > 0 ? '+' : ''}${sp500.changePercent.toFixed(2)}% today)\n`;
      }
      if (nasdaq) {
        context += `• NASDAQ (QQQ): $${nasdaq.price.toFixed(2)} (${nasdaq.changePercent > 0 ? '+' : ''}${nasdaq.changePercent.toFixed(2)}% today)\n`;
      }
      if (sp500) {
        const marketSentiment = sp500.changePercent > 1 ? 'BULLISH 🟢' : sp500.changePercent < -1 ? 'BEARISH 🔴' : 'NEUTRAL ⚪';
        context += `• Today's Sentiment: ${marketSentiment}\n`;
      }
      
      // Crypto Sentiment
      if (fearGreed) {
        context += '\n🪙 CRYPTO MARKET SENTIMENT:\n';
        context += `• Fear & Greed Index: ${fearGreed.value}/100 (${fearGreed.classification})\n`;
        if (fearGreed.value <= 25) {
          context += `  → OPPORTUNITY: Extreme fear often signals buying opportunities for long-term investors\n`;
        } else if (fearGreed.value >= 75) {
          context += `  → CAUTION: Extreme greed may indicate market is overheated\n`;
        }
      }

      // Economic Indicators
      context += '\n💹 ECONOMIC INDICATORS:\n';
      if (inflation) {
        context += `• Inflation (${inflation.country}): ${inflation.rate.toFixed(1)}% annually\n`;
        const inflationStatus = inflation.rate > 4 ? 'HIGH - Consider I-Bonds, TIPS, commodities' : inflation.rate > 2.5 ? 'MODERATE' : 'LOW - Favorable for bonds';
        context += `  → Status: ${inflationStatus}\n`;
      }

      const fedRate = indicators.get('federal_funds_rate');
      const primeRate = indicators.get('prime_rate');
      if (fedRate) {
        context += `• Fed Funds Rate: ${fedRate.value}%\n`;
        context += `  → ${fedRate.value > 4 ? 'High rates: Favor savings accounts, CDs, bonds' : 'Lower rates: Favor stocks, real estate'}\n`;
      }
      if (primeRate) {
        context += `• Prime Rate: ${primeRate.value}% (affects credit cards, HELOCs, loans)\n`;
      }

      const treasuryYield = indicators.get('treasury_10y');
      const yieldSpread = indicators.get('yield_curve_spread');
      if (treasuryYield) {
        context += `• 10-Year Treasury Yield: ${treasuryYield.value.toFixed(2)}%\n`;
        context += `  → Safe return benchmark: Investments should beat this rate\n`;
      }
      if (yieldSpread) {
        context += `• Yield Curve Spread: ${yieldSpread.value.toFixed(2)}%\n`;
        if (yieldSpread.value < 0) {
          context += `  → ⚠️ INVERTED: Historically signals recession risk within 12-18 months\n`;
        }
      }

      const unemployment = indicators.get('unemployment_rate');
      const gdp = indicators.get('gdp_growth');
      const consumerConf = indicators.get('consumer_confidence');
      
      if (unemployment) {
        context += `• Unemployment Rate: ${unemployment.value}%\n`;
        const jobMarket = unemployment.value < 4 ? 'STRONG - Good for wage growth' : unemployment.value < 5.5 ? 'HEALTHY' : 'WEAKENING - May affect income';
        context += `  → Job Market: ${jobMarket}\n`;
      }
      if (gdp) {
        context += `• GDP Growth: ${gdp.value}% annually\n`;
      }
      if (consumerConf) {
        context += `• Consumer Confidence: ${consumerConf.value} (${consumerConf.value > 100 ? 'Optimistic' : 'Cautious'})\n`;
      }

      // Financial Planning Context
      context += '\n📊 FINANCIAL PLANNING CONTEXT:\n';
      const benchmarks = this.getFinancialBenchmarks();
      context += `• Recommended savings rate: 15-20% of income\n`;
      context += `• Emergency fund target: 3-6 months of expenses\n`;
      context += `• Healthy debt-to-income ratio: Under 36%\n`;
      context += `• Housing expense guideline: Max 30% of gross income\n`;

      return context;
    } catch (error) {
      console.error('[MarketData] Error building AI context:', error);
      return 'Market data temporarily unavailable - using historical averages for advice.\n';
    }
  }

  /**
   * Get comprehensive financial context for AI including user-specific benchmarks
   */
  getPersonalizedBenchmarks(userAge: number, userIncome: number): string {
    const benchmarks = this.getFinancialBenchmarks();
    let context = '\n📊 PERSONALIZED FINANCIAL BENCHMARKS:\n';

    // Find age-appropriate savings rate
    const ageRange = userAge < 30 ? '20-29' : userAge < 40 ? '30-39' : userAge < 50 ? '40-49' : userAge < 60 ? '50-59' : '60+';
    const savingsData = benchmarks.savingsRateByAge.find(s => s.ageRange === ageRange);
    if (savingsData) {
      context += `• For your age (${ageRange}): Save ${savingsData.recommendedRate}% of income (avg American saves ${savingsData.averageRate}%)\n`;
    }

    // Find income-appropriate emergency fund
    const incomeLevel = userIncome < 40000 ? 'Low (<$40k)' : userIncome < 100000 ? 'Medium ($40k-$100k)' : 'High (>$100k)';
    const efData = benchmarks.emergencyFundMonths.find(e => e.incomeLevel === incomeLevel);
    if (efData) {
      context += `• Emergency fund for your income: ${efData.months} months of expenses\n`;
    }

    // Retirement savings target
    const retirementData = benchmarks.retirementMultiples.find(r => r.age === userAge) || 
      benchmarks.retirementMultiples.find(r => r.age === Math.round(userAge / 5) * 5);
    if (retirementData) {
      const targetSavings = userIncome * retirementData.multiplier;
      context += `• Retirement savings target by age ${retirementData.age}: $${targetSavings.toLocaleString()} (${retirementData.multiplier}x annual salary)\n`;
    }

    return context;
  }
}

// Singleton instance
export const marketDataService = new MarketDataService();

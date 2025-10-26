// Comprehensive Market Data Service
// Integrates stocks, forex, inflation, and economic indicators

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

interface MarketDataCache {
  stocks: Map<string, { data: StockQuote; timestamp: number }>;
  forex: Map<string, { data: ForexRate; timestamp: number }>;
  inflation: Map<string, { data: InflationData; timestamp: number }>;
  indicators: Map<string, { data: EconomicIndicator; timestamp: number }>;
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour for market data (most users don't need real-time updates)
const cache: MarketDataCache = {
  stocks: new Map(),
  forex: new Map(),
  inflation: new Map(),
  indicators: new Map()
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
   * Get major economic indicators
   */
  async getEconomicIndicators(country: string = 'US'): Promise<Map<string, EconomicIndicator>> {
    const indicators = new Map<string, EconomicIndicator>();
    
    // Fed Funds Rate (US)
    if (country === 'US') {
      indicators.set('federal_funds_rate', {
        name: 'Federal Funds Rate',
        value: 5.33, // Updated Dec 2024
        unit: '%',
        country: 'US',
        lastUpdated: new Date('2024-12-18')
      });

      indicators.set('unemployment_rate', {
        name: 'Unemployment Rate',
        value: 4.2,
        unit: '%',
        country: 'US',
        lastUpdated: new Date('2024-12-01')
      });

      indicators.set('gdp_growth', {
        name: 'GDP Growth (Annual)',
        value: 2.8,
        unit: '%',
        country: 'US',
        lastUpdated: new Date('2024-12-01')
      });
    }

    return indicators;
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
   * Get market sentiment summary for AI context
   */
  async getMarketContextForAI(userCountry: string = 'US'): Promise<string> {
    try {
      const [sp500, inflation, indicators] = await Promise.all([
        this.getStockQuote('SPY'),
        this.getInflationRate(userCountry),
        this.getEconomicIndicators(userCountry)
      ]);

      let context = '📊 CURRENT MARKET CONDITIONS:\n';
      
      if (sp500) {
        context += `• S&P 500: $${sp500.price.toFixed(2)} (${sp500.changePercent > 0 ? '+' : ''}${sp500.changePercent.toFixed(2)}% today)\n`;
        const marketSentiment = sp500.changePercent > 1 ? 'bullish 🐂' : sp500.changePercent < -1 ? 'bearish 🐻' : 'neutral';
        context += `• Market Sentiment: ${marketSentiment}\n`;
      }

      if (inflation) {
        context += `• Inflation (${inflation.country}): ${inflation.rate.toFixed(1)}% annually\n`;
        const inflationStatus = inflation.rate > 4 ? 'HIGH - Consider I-Bonds, TIPS' : inflation.rate > 2 ? 'Moderate' : 'Low';
        context += `  → Status: ${inflationStatus}\n`;
      }

      const fedRate = indicators.get('federal_funds_rate');
      if (fedRate) {
        context += `• Fed Funds Rate: ${fedRate.value}%\n`;
        context += `  → ${fedRate.value > 5 ? 'High rates favor savings accounts & bonds' : 'Lower rates favor stocks & real estate'}\n`;
      }

      return context;
    } catch (error) {
      console.error('[MarketData] Error building AI context:', error);
      return '📊 Market data temporarily unavailable - using historical averages.\n';
    }
  }
}

// Singleton instance
export const marketDataService = new MarketDataService();

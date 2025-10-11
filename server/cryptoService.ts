// CoinGecko API service for fetching crypto prices
// Uses free tier - no API key required

interface CryptoPrice {
  usd: number;
  usd_24h_change: number;
  usd_market_cap: number;
}

interface CryptoPriceData {
  [symbol: string]: CryptoPrice;
}

interface CachedPriceData {
  prices: CryptoPriceData;
  lastUpdated: number;
}

// Map common symbols to CoinGecko IDs
const SYMBOL_TO_ID_MAP: { [symbol: string]: string } = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'USDC': 'usd-coin',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'TRX': 'tron',
  'AVAX': 'avalanche-2',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'LTC': 'litecoin',
  'SHIB': 'shiba-inu',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'XLM': 'stellar',
  'BCH': 'bitcoin-cash',
  'NEAR': 'near',
  'APT': 'aptos',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'INJ': 'injective-protocol',
};

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes - increased to reduce rate limiting
let priceCache: CachedPriceData | null = null;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

export class CryptoService {
  /**
   * Get current prices for multiple cryptocurrencies
   * @param symbols Array of crypto symbols (e.g., ['BTC', 'ETH'])
   * @returns Object with symbol as key and price data
   */
  async getCurrentPrices(symbols: string[]): Promise<CryptoPriceData> {
    // Check cache first
    if (priceCache && Date.now() - priceCache.lastUpdated < CACHE_DURATION) {
      const cachedResult: CryptoPriceData = {};
      for (const symbol of symbols) {
        if (priceCache.prices[symbol]) {
          cachedResult[symbol] = priceCache.prices[symbol];
        }
      }
      // If we have all symbols cached, return them
      if (Object.keys(cachedResult).length === symbols.length) {
        console.log(`[CryptoService] Returning cached prices for ${symbols.join(', ')}`);
        return cachedResult;
      }
    }

    // Map symbols to CoinGecko IDs
    const coinIds = symbols
      .map(symbol => SYMBOL_TO_ID_MAP[symbol.toUpperCase()])
      .filter(Boolean);

    if (coinIds.length === 0) {
      throw new Error('No valid cryptocurrency symbols provided');
    }

    const ids = coinIds.join(',');
    const url = `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;

    try {
      // Rate limiting: ensure minimum interval between requests
      const timeSinceLastRequest = Date.now() - lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
      }

      console.log(`[CryptoService] Fetching prices from CoinGecko for: ${symbols.join(', ')}`);
      lastRequestTime = Date.now();
      const response = await fetch(url);
      
      if (response.status === 429) {
        // Rate limited - return cached data if available, otherwise throw
        if (priceCache && priceCache.prices) {
          console.log('[CryptoService] Rate limited, returning cached data');
          const cachedResult: CryptoPriceData = {};
          for (const symbol of symbols) {
            if (priceCache.prices[symbol]) {
              cachedResult[symbol] = priceCache.prices[symbol];
            }
          }
          if (Object.keys(cachedResult).length > 0) {
            return cachedResult;
          }
        }
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Convert CoinGecko IDs back to symbols
      const result: CryptoPriceData = {};
      for (const symbol of symbols) {
        const coinId = SYMBOL_TO_ID_MAP[symbol.toUpperCase()];
        if (coinId && data[coinId]) {
          result[symbol.toUpperCase()] = data[coinId];
        }
      }

      // Update cache
      priceCache = {
        prices: { ...priceCache?.prices, ...result },
        lastUpdated: Date.now(),
      };

      return result;
    } catch (error) {
      console.error('[CryptoService] Error fetching prices:', error);
      
      // Return cached data on error if available
      if (priceCache && priceCache.prices) {
        const cachedResult: CryptoPriceData = {};
        for (const symbol of symbols) {
          if (priceCache.prices[symbol]) {
            cachedResult[symbol] = priceCache.prices[symbol];
          }
        }
        if (Object.keys(cachedResult).length > 0) {
          console.log('[CryptoService] Returning stale cache due to error');
          return cachedResult;
        }
      }
      
      throw error;
    }
  }

  /**
   * Get price for a single cryptocurrency
   */
  async getPrice(symbol: string): Promise<CryptoPrice | null> {
    const prices = await this.getCurrentPrices([symbol]);
    return prices[symbol.toUpperCase()] || null;
  }

  /**
   * Get all supported symbols
   */
  getSupportedSymbols(): string[] {
    return Object.keys(SYMBOL_TO_ID_MAP);
  }

  /**
   * Get full cryptocurrency info including name
   */
  getCryptoInfo(symbol: string): { symbol: string; name: string; id: string } | null {
    const upperSymbol = symbol.toUpperCase();
    const id = SYMBOL_TO_ID_MAP[upperSymbol];
    
    if (!id) return null;

    const names: { [key: string]: string } = {
      'bitcoin': 'Bitcoin',
      'ethereum': 'Ethereum',
      'tether': 'Tether',
      'binancecoin': 'BNB',
      'solana': 'Solana',
      'ripple': 'XRP',
      'usd-coin': 'USD Coin',
      'cardano': 'Cardano',
      'dogecoin': 'Dogecoin',
      'tron': 'TRON',
      'avalanche-2': 'Avalanche',
      'polkadot': 'Polkadot',
      'matic-network': 'Polygon',
      'litecoin': 'Litecoin',
      'shiba-inu': 'Shiba Inu',
      'chainlink': 'Chainlink',
      'uniswap': 'Uniswap',
      'cosmos': 'Cosmos',
      'stellar': 'Stellar',
      'bitcoin-cash': 'Bitcoin Cash',
      'near': 'NEAR Protocol',
      'aptos': 'Aptos',
      'arbitrum': 'Arbitrum',
      'optimism': 'Optimism',
      'injective-protocol': 'Injective',
    };

    return {
      symbol: upperSymbol,
      name: names[id] || upperSymbol,
      id,
    };
  }

  /**
   * Clear the price cache (useful for testing)
   */
  clearCache(): void {
    priceCache = null;
  }

  /**
   * Get price for a single cryptocurrency by CoinGecko ID
   * Returns detailed price data matching CoinGecko API format
   */
  async getCryptoPrice(coinId: string): Promise<{
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    market_cap: number;
    price_change_percentage_24h: number;
  } | null> {
    const url = `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;
    
    try {
      console.log(`[CryptoService] Fetching price for coin ID: ${coinId}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data[coinId]) {
        return null;
      }

      // Find symbol from ID
      const symbol = Object.entries(SYMBOL_TO_ID_MAP).find(([_, id]) => id === coinId)?.[0] || coinId.toUpperCase();
      
      return {
        id: coinId,
        symbol: symbol,
        name: this.getCryptoInfo(symbol)?.name || coinId,
        current_price: data[coinId].usd,
        market_cap: data[coinId].usd_market_cap,
        price_change_percentage_24h: data[coinId].usd_24h_change,
      };
    } catch (error) {
      console.error(`[CryptoService] Error fetching price for ${coinId}:`, error);
      return null;
    }
  }

  /**
   * Get prices for multiple cryptocurrencies by CoinGecko IDs
   */
  async getCryptoPrices(coinIds: string[]): Promise<Array<{
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    market_cap: number;
    price_change_percentage_24h: number;
  }>> {
    const ids = coinIds.join(',');
    const url = `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;
    
    try {
      console.log(`[CryptoService] Fetching prices for coin IDs: ${coinIds.join(', ')}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return coinIds.map(coinId => {
        if (!data[coinId]) return null;
        
        const symbol = Object.entries(SYMBOL_TO_ID_MAP).find(([_, id]) => id === coinId)?.[0] || coinId.toUpperCase();
        
        return {
          id: coinId,
          symbol: symbol,
          name: this.getCryptoInfo(symbol)?.name || coinId,
          current_price: data[coinId].usd,
          market_cap: data[coinId].usd_market_cap,
          price_change_percentage_24h: data[coinId].usd_24h_change,
        };
      }).filter(Boolean) as Array<{
        id: string;
        symbol: string;
        name: string;
        current_price: number;
        market_cap: number;
        price_change_percentage_24h: number;
      }>;
    } catch (error) {
      console.error(`[CryptoService] Error fetching prices:`, error);
      return [];
    }
  }

  /**
   * Search cryptocurrencies by query
   */
  async searchCrypto(query: string): Promise<Array<{
    id: string;
    symbol: string;
    name: string;
  }>> {
    try {
      const url = `${COINGECKO_API}/search?query=${encodeURIComponent(query)}`;
      console.log(`[CryptoService] Searching for: ${query}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Return top 10 coin results
      return (data.coins || []).slice(0, 10).map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol?.toUpperCase() || '',
        name: coin.name,
      }));
    } catch (error) {
      console.error(`[CryptoService] Error searching crypto:`, error);
      return [];
    }
  }
}

// Export singleton instance
export const cryptoService = new CryptoService();

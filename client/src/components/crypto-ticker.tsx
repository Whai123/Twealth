import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Bitcoin } from "lucide-react";

const POPULAR_CRYPTOS = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'binancecoin', symbol: 'BNB' }
];

export default function CryptoTicker() {
  const coinIds = POPULAR_CRYPTOS.map(c => c.id).join(',');
  
  const { data: prices = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/crypto/prices', coinIds],
    queryFn: async () => {
      const res = await fetch(`/api/crypto/prices?ids=${coinIds}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch crypto prices: ${res.status}`);
      }
      return res.json();
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Bitcoin className="w-4 h-4 text-orange-500" />
          <h3 className="text-xs font-semibold text-foreground">Crypto Prices</h3>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="h-3 bg-muted rounded w-12"></div>
              <div className="h-3 bg-muted rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200 dark:border-red-900/30">
        <div className="flex items-center gap-2 mb-2">
          <Bitcoin className="w-4 h-4 text-red-500" />
          <h3 className="text-xs font-semibold text-foreground">Crypto Prices</h3>
        </div>
        <p className="text-xs text-red-600 dark:text-red-400">Unable to load prices</p>
      </div>
    );
  }

  if (!prices || !Array.isArray(prices) || prices.length === 0) {
    return (
      <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Bitcoin className="w-4 h-4 text-orange-500" />
          <h3 className="text-xs font-semibold text-foreground">Crypto Prices</h3>
        </div>
        <p className="text-xs text-muted-foreground">No data available</p>
      </div>
    );
  }

  const priceData = prices as any;

  return (
    <div className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg p-3 border border-orange-100 dark:border-orange-900/30">
      <div className="flex items-center gap-2 mb-3">
        <Bitcoin className="w-4 h-4 text-orange-500" />
        <h3 className="text-xs font-semibold text-foreground">Live Crypto</h3>
      </div>
      <div className="space-y-2">
        {POPULAR_CRYPTOS.map((crypto) => {
          const data = priceData?.find((p: any) => p.id === crypto.id);
          if (!data) return null;
          
          const isPositive = (data.price_change_24h || 0) >= 0;
          
          return (
            <div key={crypto.id} className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{crypto.symbol}</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">
                  ${data.current_price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
                <div className={`flex items-center ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  <span className="ml-0.5 text-xs">
                    {Math.abs(data.price_change_percentage_24h || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

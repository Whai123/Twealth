import { useQuery } from"@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Bitcoin, TrendingUp, TrendingDown, Plus } from"lucide-react";
import { Link } from"wouter";

export default function CryptoPortfolioWidget() {
 const { data: portfolio, isLoading } = useQuery({
  queryKey: ["/api/crypto/portfolio"],
 });

 if (isLoading) {
  return (
   <Card className="p-6 shadow-sm">
    <div className="animate-pulse">
     <div className="h-6 bg-muted rounded w-1/2 mb-6"></div>
     <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
       <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center space-x-3">
         <div className="w-10 h-10 bg-muted rounded-lg"></div>
         <div>
          <div className="h-4 bg-muted rounded w-20 mb-1"></div>
          <div className="h-3 bg-muted rounded w-16"></div>
         </div>
        </div>
        <div className="h-4 bg-muted rounded w-16"></div>
       </div>
      ))}
     </div>
    </div>
   </Card>
  );
 }

 const holdings = (portfolio as any)?.holdings || [];
 const totalValue = (portfolio as any)?.totalValue || 0;

 return (
  <Card className="p-6 shadow-sm">
   <CardHeader className="p-0 mb-6">
    <div className="flex items-center justify-between">
     <div className="flex items-center gap-2">
      <Bitcoin className="w-5 h-5 text-orange-500" />
      <CardTitle className="text-lg font-semibold">Crypto Portfolio</CardTitle>
     </div>
     <Button variant="ghost" size="sm" data-testid="button-view-crypto" asChild>
      <Link href="/crypto">View All</Link>
     </Button>
    </div>
   </CardHeader>
   
   <CardContent className="p-0">
    {/* Total Portfolio Value */}
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg mb-4">
     <p className="text-sm text-muted-foreground mb-1">Total Value</p>
     <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
      ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
     </p>
    </div>

    {holdings.length === 0 ? (
     <div className="text-center py-8">
      <Bitcoin className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
      <p className="text-muted-foreground mb-4">No crypto holdings yet</p>
      <Button data-testid="button-add-crypto" asChild>
       <Link href="/crypto?add=1">
        <Plus size={16} className="mr-2" />
        Add Crypto
       </Link>
      </Button>
     </div>
    ) : (
     <>
      <div className="space-y-3">
       {holdings.slice(0, 4).map((holding: any) => {
        const value = parseFloat(holding.value) || 0;
        const change = holding.change24h || 0;
        const isPositive = change >= 0;
        
        return (
         <div 
          key={holding.symbol} 
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          data-testid={`crypto-holding-${holding.symbol.toLowerCase()}`}
         >
          <div className="flex items-center space-x-3">
           <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
             {holding.symbol.slice(0, 3)}
            </span>
           </div>
           <div>
            <p className="font-medium text-sm" data-testid={`text-crypto-name-${holding.symbol.toLowerCase()}`}>
             {holding.name}
            </p>
            <p className="text-xs text-muted-foreground" data-testid={`text-crypto-amount-${holding.symbol.toLowerCase()}`}>
             {parseFloat(holding.amount).toLocaleString()} {holding.symbol}
            </p>
           </div>
          </div>
          <div className="text-right">
           <p className="font-semibold text-sm" data-testid={`text-crypto-value-${holding.symbol.toLowerCase()}`}>
            ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
           </p>
           <div className={`flex items-center justify-end text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
            <span data-testid={`text-crypto-change-${holding.symbol.toLowerCase()}`}>
             {isPositive ? '+' : ''}{change.toFixed(2)}%
            </span>
           </div>
          </div>
         </div>
        );
       })}
      </div>

      {holdings.length > 4 && (
       <p className="text-sm text-muted-foreground mt-4 text-center">
        +{holdings.length - 4} more holdings
       </p>
      )}

      <Button variant="outline" className="w-full mt-4" data-testid="button-add-more-crypto" asChild>
       <Link href="/crypto?add=1">
        <Plus size={16} className="mr-2" />
        Add More Crypto
       </Link>
      </Button>
     </>
    )}
   </CardContent>
  </Card>
 );
}

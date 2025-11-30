import { useState } from"react";
import { useQuery } from"@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Input } from"@/components/ui/input";
import { Button } from"@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select";
import { Coins, TrendingUp, TrendingDown, Loader2, ArrowRightLeft, Bitcoin, DollarSign } from"lucide-react";
import { Badge } from"@/components/ui/badge";

interface CryptoPrice {
 usd: number;
 usd_24h_change: number;
}

interface CurrencyRate {
 [key: string]: number;
}

const currencies = [
 { code:"USD", name:"US Dollar", symbol:"$" },
 { code:"EUR", name:"Euro", symbol:"€" },
 { code:"CNY", name:"Chinese Yuan", symbol:"¥" },
 { code:"BTC", name:"Bitcoin", symbol:"₿" },
 { code:"GBP", name:"British Pound", symbol:"£" },
 { code:"JPY", name:"Japanese Yen", symbol:"¥" },
 { code:"GOLD", name:"Gold (oz)", symbol:"Au" },
];

export default function MultiCurrencyCalculator() {
 const [amount, setAmount] = useState<string>("1000");
 const [fromCurrency, setFromCurrency] = useState<string>("USD");
 const [toCurrency, setToCurrency] = useState<string>("BTC");

 const { data: cryptoData, isLoading: cryptoLoading } = useQuery({
  queryKey: ['/api/crypto/prices'],
  refetchInterval: 60000,
 });

 const { data: currencyRates, isLoading: ratesLoading } = useQuery<CurrencyRate>({
  queryKey: ['/api/currency/rates'],
  refetchInterval: 300000,
 });

 const getCryptoPrice = (symbol: string): number => {
  if (!cryptoData) return 0;
  const coinMap: { [key: string]: string } = {
   'BTC': 'bitcoin',
   'ETH': 'ethereum',
  };
  const coinId = coinMap[symbol];
  const coin = cryptoData as any;
  return coin[coinId]?.usd || 0;
 };

 const getCrypto24hChange = (symbol: string): number => {
  if (!cryptoData) return 0;
  const coinMap: { [key: string]: string } = {
   'BTC': 'bitcoin',
   'ETH': 'ethereum',
  };
  const coinId = coinMap[symbol];
  const coin = cryptoData as any;
  return coin[coinId]?.usd_24h_change || 0;
 };

 const getGoldPrice = (): number => {
  return currencyRates?.GOLD || 2650;
 };

 const convert = (): number => {
  const numAmount = parseFloat(amount) || 0;
  
  if (fromCurrency ==="USD") {
   if (toCurrency ==="BTC") return numAmount / getCryptoPrice("BTC");
   if (toCurrency ==="GOLD") return numAmount / getGoldPrice();
   return numAmount * (currencyRates?.[toCurrency] || 1);
  }

  if (fromCurrency ==="BTC") {
   const usdValue = numAmount * getCryptoPrice("BTC");
   if (toCurrency ==="USD") return usdValue;
   if (toCurrency ==="GOLD") return usdValue / getGoldPrice();
   return usdValue * (currencyRates?.[toCurrency] || 1);
  }

  if (fromCurrency ==="GOLD") {
   const usdValue = numAmount * getGoldPrice();
   if (toCurrency ==="USD") return usdValue;
   if (toCurrency ==="BTC") return usdValue / getCryptoPrice("BTC");
   return usdValue * (currencyRates?.[toCurrency] || 1);
  }

  const usdValue = numAmount / (currencyRates?.[fromCurrency] || 1);
  if (toCurrency ==="USD") return usdValue;
  if (toCurrency ==="BTC") return usdValue / getCryptoPrice("BTC");
  if (toCurrency ==="GOLD") return usdValue / getGoldPrice();
  return usdValue * (currencyRates?.[toCurrency] || 1);
 };

 const result = convert();
 const isLoading = cryptoLoading || ratesLoading;

 const fromCurrencyData = currencies.find(c => c.code === fromCurrency);
 const toCurrencyData = currencies.find(c => c.code === toCurrency);

 const get24hChange = (code: string) => {
  if (code ==="BTC") return getCrypto24hChange("BTC");
  return 0;
 };

 const change24h = get24hChange(toCurrency);

 return (
  <Card className="w-full">
   <CardHeader>
    <CardTitle className="flex items-center">
     <Coins className="mr-2 text-yellow-600" size={24} />
     Multi-Currency Wealth Calculator
    </CardTitle>
    <p className="text-sm text-muted-foreground">
     Convert between fiat, crypto, and gold to understand wealth across different stores of value
    </p>
   </CardHeader>
   <CardContent className="space-y-6">
    {/* Amount Input */}
    <div className="space-y-2">
     <label className="text-sm font-medium">Amount</label>
     <Input
      type="number"
      data-testid="input-amount"
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
      placeholder="Enter amount"
      className="text-lg"
     />
    </div>

    {/* From Currency */}
    <div className="space-y-2">
     <label className="text-sm font-medium">From</label>
     <Select value={fromCurrency} onValueChange={setFromCurrency}>
      <SelectTrigger data-testid="select-from-currency">
       <SelectValue />
      </SelectTrigger>
      <SelectContent>
       {currencies.map((curr) => (
        <SelectItem key={curr.code} value={curr.code}>
         <div className="flex items-center">
          <span className="mr-2">{curr.name}</span>
          <span className="text-muted-foreground">({curr.symbol})</span>
         </div>
        </SelectItem>
       ))}
      </SelectContent>
     </Select>
    </div>

    {/* Swap Button */}
    <div className="flex justify-center">
     <Button
      variant="outline"
      size="icon"
      data-testid="button-swap-currencies"
      onClick={() => {
       const temp = fromCurrency;
       setFromCurrency(toCurrency);
       setToCurrency(temp);
      }}
      className="rounded-full"
     >
      <ArrowRightLeft size={20} />
     </Button>
    </div>

    {/* To Currency */}
    <div className="space-y-2">
     <label className="text-sm font-medium">To</label>
     <Select value={toCurrency} onValueChange={setToCurrency}>
      <SelectTrigger data-testid="select-to-currency">
       <SelectValue />
      </SelectTrigger>
      <SelectContent>
       {currencies.map((curr) => (
        <SelectItem key={curr.code} value={curr.code}>
         <div className="flex items-center">
          <span className="mr-2">{curr.name}</span>
          <span className="text-muted-foreground">({curr.symbol})</span>
         </div>
        </SelectItem>
       ))}
      </SelectContent>
     </Select>
    </div>

    {/* Result */}
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-primary/20">
     <div className="text-sm text-muted-foreground mb-1">Result</div>
     {isLoading ? (
      <div className="flex items-center">
       <Loader2 className="animate-spin mr-2" size={20} />
       <span>Calculating...</span>
      </div>
     ) : (
      <>
       <div className="flex items-baseline" data-testid="text-conversion-result">
        <span className="text-3xl font-bold">
         {result.toLocaleString(undefined, {
          minimumFractionDigits: toCurrency ==="BTC" ? 8 : 2,
          maximumFractionDigits: toCurrency ==="BTC" ? 8 : 2,
         })}
        </span>
        <span className="ml-2 text-xl text-muted-foreground">
         {toCurrencyData?.symbol}
        </span>
        <span className="ml-2 text-muted-foreground">
         {toCurrencyData?.name}
        </span>
       </div>

       {change24h !== 0 && (
        <div className="flex items-center mt-2">
         {change24h > 0 ? (
          <TrendingUp className="text-green-600 mr-1" size={16} />
         ) : (
          <TrendingDown className="text-red-600 mr-1" size={16} />
         )}
         <span className={`text-sm ${change24h > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change24h > 0 ? '+' : ''}{change24h.toFixed(2)}% (24h)
         </span>
        </div>
       )}
      </>
     )}
    </div>

    {/* Info Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
     <div className="p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center mb-2">
       <Bitcoin className="text-orange-500 mr-2" size={20} />
       <span className="font-medium">Bitcoin</span>
      </div>
      <div className="text-2xl font-bold">
       ${getCryptoPrice("BTC").toLocaleString()}
      </div>
      <div className="flex items-center mt-1">
       {getCrypto24hChange("BTC") > 0 ? (
        <TrendingUp className="text-green-600 mr-1" size={14} />
       ) : (
        <TrendingDown className="text-red-600 mr-1" size={14} />
       )}
       <span className={`text-sm ${getCrypto24hChange("BTC") > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {getCrypto24hChange("BTC") > 0 ? '+' : ''}{getCrypto24hChange("BTC").toFixed(2)}%
       </span>
      </div>
     </div>

     <div className="p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center mb-2">
       <DollarSign className="text-yellow-500 mr-2" size={20} />
       <span className="font-medium">Gold (oz)</span>
      </div>
      <div className="text-2xl font-bold">
       ${getGoldPrice().toLocaleString()}
      </div>
      <div className="text-sm text-muted-foreground mt-1">
       Safe haven asset
      </div>
     </div>
    </div>

    {/* Educational Note */}
    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
     <div className="flex items-start">
      <DollarSign className="text-yellow-600 mr-2 mt-0.5" size={20} />
      <div>
       <p className="text-sm font-medium">De-dollarization Insight</p>
       <p className="text-sm text-muted-foreground mt-1">
        Diversifying wealth across currencies, crypto, and commodities helps protect against single-currency risks as the global financial system evolves.
       </p>
      </div>
     </div>
    </div>
   </CardContent>
  </Card>
 );
}

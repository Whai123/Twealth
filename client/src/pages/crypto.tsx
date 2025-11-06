import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Bitcoin, Plus, TrendingUp, TrendingDown, Search, Bell, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function CryptoPage() {
 const { t } = useTranslation();
 const { toast } = useToast();
 const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
 const [searchQuery, setSearchQuery] = useState("");
 const [selectedCoin, setSelectedCoin] = useState<any>(null);
 const [amount, setAmount] = useState("");
 const [buyPrice, setBuyPrice] = useState("");

 // Fetch portfolio
 const { data: portfolio, isLoading: portfolioLoading } = useQuery({
 queryKey: ["/api/crypto/portfolio"],
 });

 // Fetch holdings
 const { data: holdings, isLoading: holdingsLoading } = useQuery({
 queryKey: ["/api/crypto/holdings"],
 });

 // Search cryptocurrencies
 const { data: searchResults, isLoading: searchLoading } = useQuery({
 queryKey: ["/api/crypto/search", searchQuery],
 queryFn: () => fetch(`/api/crypto/search?query=${searchQuery}`).then(res => res.json()),
 enabled: searchQuery.length > 2,
 });

 // Add holding mutation
 const addHoldingMutation = useMutation({
 mutationFn: async (data: any) => {
 return apiRequest("POST", "/api/crypto/holdings", data);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/crypto/holdings"] });
 queryClient.invalidateQueries({ queryKey: ["/api/crypto/portfolio"] });
 toast({
 title: t('common.success'),
 description: t('common.success'),
 });
 setIsAddDialogOpen(false);
 setSelectedCoin(null);
 setAmount("");
 setBuyPrice("");
 setSearchQuery("");
 },
 onError: (error: any) => {
 toast({
 title: "Error",
 description: error.message || t('common.error'),
 variant: "destructive",
 });
 },
 });

 // Delete holding mutation
 const deleteHoldingMutation = useMutation({
 mutationFn: async (id: string) => {
 return apiRequest("DELETE", `/api/crypto/holdings/${id}`);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/crypto/holdings"] });
 queryClient.invalidateQueries({ queryKey: ["/api/crypto/portfolio"] });
 toast({
 title: t('common.success'),
 description: t('common.success'),
 });
 },
 });

 const handleAddHolding = () => {
 if (!selectedCoin || !amount) {
 toast({
 title: "Error",
 description: t('common.error'),
 variant: "destructive",
 });
 return;
 }

 addHoldingMutation.mutate({
 coinId: selectedCoin.id,
 symbol: selectedCoin.symbol,
 name: selectedCoin.name,
 amount: amount,
 averageBuyPrice: buyPrice || "0",
 source: "manual",
 });
 };

 const totalValue = (portfolio as any)?.totalValue || 0;
 const holdingsList = (holdings as any) || [];

 if (portfolioLoading || holdingsLoading) {
 return (
 <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
 <div className="animate-pulse space-y-6">
 <div className="h-8 bg-muted rounded w-1/3"></div>
 <div className="h-32 bg-muted rounded"></div>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {[...Array(3)].map((_, i) => (
 <div key={i} className="h-48 bg-muted rounded"></div>
 ))}
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-orange-50 dark:bg-orange-900/20">
 {/* Mobile-First Responsive Header */}
 <header className="bg-orange-50 dark:bg-orange-900/30 border-b border-border/50 sticky top-0 z-30 backdrop-blur-sm">
 <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
 <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
 <Bitcoin className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-orange-500 flex-shrink-0" />
 <div className="min-w-0 flex-1">
 <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-600 dark:text-orange-400  truncate">
 Crypto Portfolio
 </h1>
 <p className="text-sm sm:text-base text-muted-foreground truncate">Manage your cryptocurrency holdings</p>
 </div>
 </div>
 <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
 <DialogTrigger asChild>
 <Button 
 className="bg-orange-500 text-white font-semibold px-4 sm:px-6 min-h-[44px] h-11 sm:h-12 shadow-lg w-full sm:w-auto"
 data-testid="button-add-crypto"
 >
 <Plus className="w-4 h-4 sm:mr-2" />
 <span className="hidden sm:inline">Add Crypto</span>
 <span className="sm:hidden text-xs">Add</span>
 </Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Add Cryptocurrency</DialogTitle>
 <DialogDescription>
 Add a new cryptocurrency to your portfolio
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4 mt-4">
 <div>
 <Label htmlFor="search-crypto">Search Cryptocurrency</Label>
 <div className="relative mt-1">
 <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
 <Input
 id="search-crypto"
 placeholder="Search Bitcoin, Ethereum..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-10"
 data-testid="input-search-crypto"
 />
 </div>
 {searchLoading && searchQuery.length > 2 && (
 <p className="text-sm text-muted-foreground mt-2">Searching...</p>
 )}
 {searchResults && searchResults.length > 0 && (
 <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
 {searchResults.map((coin: any) => (
 <button
 key={coin.id}
 onClick={() => {
 setSelectedCoin(coin);
 setSearchQuery("");
 }}
 className="w-full p-3 hover:bg-muted text-left flex items-center justify-between"
 data-testid={`button-select-${coin.symbol.toLowerCase()}`}
 >
 <div>
 <p className="font-medium">{coin.name}</p>
 <p className="text-sm text-muted-foreground">{coin.symbol}</p>
 </div>
 </button>
 ))}
 </div>
 )}
 </div>

 {selectedCoin && (
 <>
 <div className="p-3 bg-muted rounded-lg">
 <p className="text-sm text-muted-foreground">Selected</p>
 <p className="font-medium">{selectedCoin.name} ({selectedCoin.symbol})</p>
 </div>

 <div>
 <Label htmlFor="amount">Amount</Label>
 <Input
 id="amount"
 type="number"
 step="0.00000001"
 placeholder="0.00"
 value={amount}
 onChange={(e) => setAmount(e.target.value)}
 data-testid="input-amount"
 />
 </div>

 <div>
 <Label htmlFor="buy-price">Average Buy Price (USD) - Optional</Label>
 <Input
 id="buy-price"
 type="number"
 step="0.01"
 placeholder="0.00"
 value={buyPrice}
 onChange={(e) => setBuyPrice(e.target.value)}
 data-testid="input-buy-price"
 />
 </div>

 <Button
 onClick={handleAddHolding}
 className="w-full"
 disabled={addHoldingMutation.isPending}
 data-testid="button-confirm-add"
 >
 {addHoldingMutation.isPending ? "Adding..." : "Add to Portfolio"}
 </Button>
 </>
 )}
 </div>
 </DialogContent>
 </Dialog>
 </div>
 </div>
 </header>
 
 <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
 {/* Mobile-First Portfolio Value Card */}
 <Card className="bg-white dark:bg-gray-900 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800 ">
 <CardContent className="p-4 sm:p-6">
 <div className="flex items-center justify-between">
 <div className="flex-1 min-w-0">
 <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Portfolio Value</p>
 <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-600 dark:text-orange-400 truncate" data-testid="text-total-value">
 ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </p>
 </div>
 <Bitcoin className="w-12 h-12 sm:w-16 sm:h-16 text-orange-500 opacity-20 flex-shrink-0" />
 </div>
 </CardContent>
 </Card>

 {/* Mobile-First Holdings Grid */}
 {holdingsList.length === 0 ? (
 <Card className="p-8 sm:p-12">
 <div className="text-center">
 <Bitcoin className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
 <h3 className="text-lg sm:text-xl font-semibold mb-2">No Crypto Holdings Yet</h3>
 <p className="text-sm sm:text-base text-muted-foreground mb-6">
 Start building your crypto portfolio by adding your first cryptocurrency
 </p>
 <Button 
 onClick={() => setIsAddDialogOpen(true)} 
 data-testid="button-add-first-crypto"
 className="min-h-[44px] h-11 sm:h-12"
 >
 <Plus className="w-4 h-4 mr-2" />
 Add Your First Crypto
 </Button>
 </div>
 </Card>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
 {holdingsList.map((holding: any) => {
 const value = parseFloat(holding.currentPrice || 0) * parseFloat(holding.amount || 0);
 const change = holding.priceChange24h || 0;
 const isPositive = change >= 0;

 return (
 <Card key={holding.id} className="relative overflow-hidden " data-testid={`card-holding-${holding.symbol.toLowerCase()}`}>
 <CardHeader className="pb-3 p-4 sm:p-6">
 <div className="flex items-start sm:items-center justify-between gap-2">
 <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center flex-shrink-0">
 <span className="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-400">
 {holding.symbol.slice(0, 3)}
 </span>
 </div>
 <div className="min-w-0 flex-1">
 <CardTitle className="text-base sm:text-lg truncate" data-testid={`text-name-${holding.symbol.toLowerCase()}`}>{holding.name}</CardTitle>
 <p className="text-xs sm:text-sm text-muted-foreground truncate">{holding.symbol}</p>
 </div>
 </div>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => deleteHoldingMutation.mutate(holding.id)}
 data-testid={`button-delete-${holding.symbol.toLowerCase()}`}
 className="min-h-[44px] h-11"
 >
 <Trash2 className="w-4 h-4 text-destructive" />
 </Button>
 </div>
 </CardHeader>
 <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
 <div>
 <p className="text-xs sm:text-sm text-muted-foreground">Amount</p>
 <p className="text-lg sm:text-xl font-semibold truncate" data-testid={`text-amount-${holding.symbol.toLowerCase()}`}>
 {parseFloat(holding.amount).toLocaleString()} {holding.symbol}
 </p>
 </div>
 <div>
 <p className="text-xs sm:text-sm text-muted-foreground">Value</p>
 <p className="text-xl sm:text-2xl font-bold truncate" data-testid={`text-value-${holding.symbol.toLowerCase()}`}>
 ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </p>
 </div>
 <div>
 <p className="text-xs sm:text-sm text-muted-foreground">24h Change</p>
 <div className={`flex items-center gap-1 text-base sm:text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
 {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
 <span data-testid={`text-change-${holding.symbol.toLowerCase()}`}>
 {isPositive ? '+' : ''}{change.toFixed(2)}%
 </span>
 </div>
 </div>
 {holding.currentPrice && (
 <div>
 <p className="text-sm text-muted-foreground">Current Price</p>
 <p className="font-medium" data-testid={`text-price-${holding.symbol.toLowerCase()}`}>
 ${parseFloat(holding.currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </p>
 </div>
 )}
 </CardContent>
 </Card>
 );
 })}
 </div>
 )}
 </div>
 </div>
 );
}

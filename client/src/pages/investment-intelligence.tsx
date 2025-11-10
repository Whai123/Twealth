import { useState, useMemo } from"react";
import { useQuery } from"@tanstack/react-query";
import { motion, AnimatePresence } from"framer-motion";
import {
 TrendingUp,
 TrendingDown,
 ChevronDown,
 ChevronUp,
 Info,
 Sparkles,
 Target,
 DollarSign,
 Shield,
 Zap,
 Calendar,
 Coins,
 Building2,
 Bitcoin,
 PiggyBank,
 FileText,
 Video,
 Home,
 BarChart3,
 Settings,
 AlertCircle,
} from"lucide-react";
import { Link } from"wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card";
import { Badge } from"@/components/ui/badge";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from"@/components/ui/select";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from"@/components/ui/dialog";
import {
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from"@/components/ui/tooltip";
import { Progress } from"@/components/ui/progress";
import { Skeleton } from"@/components/ui/skeleton";
import { Alert, AlertDescription } from"@/components/ui/alert";
import { Separator } from"@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from"recharts";
import type { InvestmentStrategy, PassiveIncomeOpportunity, UserPreferences } from"@shared/schema";

const CATEGORY_ICONS: Record<string, any> = {
 stocks: BarChart3,
 bonds: Shield,
 real_estate: Building2,
 crypto: Bitcoin,
 savings: PiggyBank,
 digital_products: FileText,
 content_creation: Video,
 investments: TrendingUp,
};

const RISK_COLORS: Record<string, string> = {
 very_low:"bg-green-500 dark:bg-green-600",
 low:"bg-blue-500 dark:bg-blue-600",
 moderate:"bg-yellow-500 dark:bg-yellow-600",
 high:"bg-orange-500 dark:bg-orange-600",
 very_high:"bg-red-500 dark:bg-red-600",
};

const RISK_TEXT_COLORS: Record<string, string> = {
 very_low:"text-green-700 dark:text-green-400",
 low:"text-blue-700 dark:text-blue-400",
 moderate:"text-yellow-700 dark:text-yellow-400",
 high:"text-orange-700 dark:text-orange-400",
 very_high:"text-red-700 dark:text-red-400",
};

const TIME_HORIZON_ICONS: Record<string, string> = {
 short:"Short-term",
 medium:"Medium-term",
 long:"Long-term",
};

const LABEL_BY_CATEGORY: Record<string, string> = {
 stocks:"Stocks",
 bonds:"Bonds",
 real_estate:"Real Estate",
 crypto:"Crypto",
 savings:"Savings",
 digital_products:"Digital Products",
 content_creation:"Content Creation",
 investments:"Investments",
};

function formatCurrency(value: number): string {
 return new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
 }).format(value);
}

function formatPercent(value: number): string {
 return `${value.toFixed(2)}%`;
}

export default function InvestmentIntelligence() {
 const [categoryFilter, setCategoryFilter] = useState<string>("all");
 const [riskFilter, setRiskFilter] = useState<string>("all");
 const [passiveIncomeFilter, setPassiveIncomeFilter] = useState<string>("all");
 const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
 const [expandedPassiveIncome, setExpandedPassiveIncome] = useState<string | null>(null);
 const [calculatorAmount, setCalculatorAmount] = useState<number>(10000);
 const [selectedStrategyId, setSelectedStrategyId] = useState<string>("");
 const [selectedStrategyDetails, setSelectedStrategyDetails] = useState<InvestmentStrategy | null>(null);

 const { data: strategies, isLoading: strategiesLoading } = useQuery<InvestmentStrategy[]>({
  queryKey: ["/api/investments/strategies"],
 });

 const { data: passiveIncome, isLoading: passiveIncomeLoading } = useQuery<PassiveIncomeOpportunity[]>({
  queryKey: ["/api/investments/passive-income"],
 });

 const { data: preferences } = useQuery<UserPreferences>({
  queryKey: ["/api/user-preferences"],
 });

 const monthlyIncome = parseFloat((preferences as any)?.monthlyIncomeEstimate ||"0") || 0;
 const monthlyExpenses = parseFloat((preferences as any)?.monthlyExpensesEstimate ||"0") || 0;
 const currentSavings = parseFloat((preferences as any)?.currentSavingsEstimate ||"0") || 0;
 const monthlySurplus = monthlyIncome - monthlyExpenses;

 const hasFinancialProfile = monthlyIncome > 0 || currentSavings > 0;

 const filteredStrategies = useMemo(() => {
  if (!strategies) return [];
  
  return strategies.filter((strategy) => {
   const matchesCategory = categoryFilter ==="all" || strategy.category === categoryFilter;
   const matchesRisk = riskFilter ==="all" || strategy.riskLevel === riskFilter;
   return matchesCategory && matchesRisk;
  });
 }, [strategies, categoryFilter, riskFilter]);

 const filteredPassiveIncome = useMemo(() => {
  if (!passiveIncome) return [];
  
  return passiveIncome.filter((opportunity) => {
   return passiveIncomeFilter ==="all" || opportunity.category === passiveIncomeFilter;
  });
 }, [passiveIncome, passiveIncomeFilter]);

 const personalizedRecommendations = useMemo(() => {
  if (!strategies || !hasFinancialProfile) return [];
  
  const recommendations: (InvestmentStrategy & { reason: string })[] = [];
  
  if (currentSavings < 5000) {
   const highYieldSavings = strategies.find(s => s.name.toLowerCase().includes("high-yield"));
   if (highYieldSavings) {
    recommendations.push({
     ...highYieldSavings,
     reason:"Build your emergency fund first with zero risk and guaranteed returns"
    });
   }
   
   const lowRiskStrategies = strategies.filter(s => 
    (s.riskLevel ==="very_low" || s.riskLevel ==="low") && 
    parseFloat(s.minInvestment ||"0") <= 100
   ).slice(0, 2);
   
   lowRiskStrategies.forEach(strategy => {
    recommendations.push({
     ...strategy,
     reason:"Low risk options perfect for building initial wealth with minimal investment"
    });
   });
  } else if (currentSavings >= 5000 && currentSavings < 50000) {
   const indexFunds = strategies.find(s => s.name.toLowerCase().includes("index"));
   if (indexFunds) {
    recommendations.push({
     ...indexFunds,
     reason:"Diversified growth for your medium-term wealth building goals"
    });
   }
   
   const reits = strategies.find(s => s.category ==="real_estate");
   if (reits) {
    recommendations.push({
     ...reits,
     reason:"Add real estate exposure for portfolio diversification and passive income"
    });
   }
   
   const dividendStocks = strategies.find(s => s.name.toLowerCase().includes("dividend"));
   if (dividendStocks) {
    recommendations.push({
     ...dividendStocks,
     reason:"Generate passive income while building long-term wealth"
    });
   }
  } else {
   const taxAdvantaged = strategies.filter(s => 
    s.taxTreatment && s.taxTreatment !=="taxable"
   ).slice(0, 2);
   
   taxAdvantaged.forEach(strategy => {
    recommendations.push({
     ...strategy,
     reason:"Maximize tax efficiency for your substantial portfolio"
    });
   });
   
   const highGrowth = strategies.filter(s => 
    parseFloat(s.expectedReturn) >= 10 && s.riskLevel !=="very_high"
   ).slice(0, 2);
   
   highGrowth.forEach(strategy => {
    recommendations.push({
     ...strategy,
     reason:"High growth potential suitable for your investment capacity"
    });
   });
  }
  
  return recommendations.slice(0, 5);
 }, [strategies, currentSavings, hasFinancialProfile]);

 const stats = useMemo(() => {
  if (!strategies) return { total: 0, avgReturn: 0, riskLevels: 0 };
  
  const avgReturn = strategies.reduce((sum, s) => sum + parseFloat(s.expectedReturn), 0) / strategies.length;
  const uniqueRiskLevels = new Set(strategies.map(s => s.riskLevel)).size;
  
  return {
   total: strategies.length,
   avgReturn,
   riskLevels: uniqueRiskLevels,
  };
 }, [strategies]);

 const calculatorData = useMemo(() => {
  if (!selectedStrategyDetails) return [];
  
  const returnRate = parseFloat(selectedStrategyDetails.expectedReturn) / 100;
  
  const oneYear = calculatorAmount * Math.pow(1 + returnRate, 1);
  const fiveYears = calculatorAmount * Math.pow(1 + returnRate, 5);
  const tenYears = calculatorAmount * Math.pow(1 + returnRate, 10);
  
  return [
   { timeframe:"1 Year", amount: oneYear, principal: calculatorAmount },
   { timeframe:"5 Years", amount: fiveYears, principal: calculatorAmount },
   { timeframe:"10 Years", amount: tenYears, principal: calculatorAmount },
  ];
 }, [calculatorAmount, selectedStrategyDetails]);

 const handleStrategySelection = (strategyId: string) => {
  setSelectedStrategyId(strategyId);
  const strategy = strategies?.find(s => s.id === strategyId);
  setSelectedStrategyDetails(strategy || null);
 };

 return (
  <TooltipProvider>
   <div className="w-full min-h-screen bg-background">
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
     <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
      <div className="flex items-center gap-4">
       <div className="w-12 h-12 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center">
        <TrendingUp className="w-6 h-6 text-white" />
       </div>
       <div className="flex-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
         Investment Intelligence
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
         AI-powered investment recommendations based on your financial profile
        </p>
       </div>
      </div>
     </div>
    </header>

    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 space-y-6 sm:space-y-8">
     {!hasFinancialProfile && (
      <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
       <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
       <AlertDescription className="text-blue-800 dark:text-blue-300">
        Complete your financial profile in{""}
        <Link href="/settings">
         <span className="font-semibold underline cursor-pointer">Settings</span>
        </Link>
        {""}to get personalized investment recommendations tailored to your goals.
       </AlertDescription>
      </Alert>
     )}

     {strategiesLoading ? (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
       <Skeleton className="h-32" />
       <Skeleton className="h-32" />
       <Skeleton className="h-32" />
      </div>
     ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
       <Card className="border-border/50">
        <CardHeader className="pb-3">
         <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">Total Strategies</CardTitle>
         </div>
        </CardHeader>
        <CardContent>
         <div className="text-3xl font-bold" data-testid="text-total-strategies">
          {stats.total}
         </div>
         <p className="text-xs text-muted-foreground mt-1">
          Investment options available
         </p>
        </CardContent>
       </Card>

       <Card className="border-border/50">
        <CardHeader className="pb-3">
         <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          <CardTitle className="text-base">Avg Expected Return</CardTitle>
         </div>
        </CardHeader>
        <CardContent>
         <div className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-avg-return">
          {formatPercent(stats.avgReturn)}
         </div>
         <p className="text-xs text-muted-foreground mt-1">
          Annual average across all strategies
         </p>
        </CardContent>
       </Card>

       <Card className="border-border/50">
        <CardHeader className="pb-3">
         <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-base">Risk Levels</CardTitle>
         </div>
        </CardHeader>
        <CardContent>
         <div className="text-3xl font-bold" data-testid="text-risk-levels">
          {stats.riskLevels}
         </div>
         <p className="text-xs text-muted-foreground mt-1">
          Different risk profiles available
         </p>
        </CardContent>
       </Card>
      </div>
     )}

     {personalizedRecommendations.length > 0 && (
      <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5 }}
      >
       <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        <h2 className="text-xl sm:text-2xl font-semibold">
         Personalized For You
        </h2>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personalizedRecommendations.map((strategy) => (
         <Card 
          key={strategy.id}
          className="border-2 border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900"
          data-testid={`card-recommended-${strategy.id}`}
         >
          <CardHeader>
           <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
             <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{LABEL_BY_CATEGORY[strategy.category] ||"Investments"}</span>
              <Badge className={RISK_COLORS[strategy.riskLevel]}>
               {strategy.riskLevel.replace("_","").toUpperCase()}
              </Badge>
             </div>
             <CardTitle className="text-lg">{strategy.name}</CardTitle>
            </div>
           </div>
          </CardHeader>
          <CardContent className="space-y-3">
           <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-600 dark:text-green-400">
             {formatPercent(parseFloat(strategy.expectedReturn))}
            </span>
            <span className="text-sm text-muted-foreground">expected return</span>
           </div>
           <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-2">
             <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
             <p className="text-sm text-foreground/90">
              <span className="font-semibold">Why this? </span>
              {strategy.reason}
             </p>
            </div>
           </div>
           <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Min: {formatCurrency(parseFloat(strategy.minInvestment ||"0"))}</span>
            <span>{TIME_HORIZON_ICONS[strategy.timeHorizon]} {strategy.timeHorizon}</span>
           </div>
          </CardContent>
         </Card>
        ))}
       </div>
      </motion.div>
     )}

     <Separator className="my-8" />

     <div>
      <div className="flex items-center gap-3 mb-4">
       <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
       <h2 className="text-xl sm:text-2xl font-semibold">
        Investment Strategy Explorer
       </h2>
      </div>

      <div className="space-y-4">
       <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
         <Label className="text-sm font-medium mb-2 block">Category</Label>
         <div className="flex flex-wrap gap-2">
          <Button
           variant={categoryFilter ==="all" ?"default" :"outline"}
           size="sm"
           onClick={() => setCategoryFilter("all")}
           data-testid="button-filter-all"
          >
           All
          </Button>
          <Button
           variant={categoryFilter ==="stocks" ?"default" :"outline"}
           size="sm"
           onClick={() => setCategoryFilter("stocks")}
           data-testid="button-filter-stocks"
          >
           📈 Stocks
          </Button>
          <Button
           variant={categoryFilter ==="bonds" ?"default" :"outline"}
           size="sm"
           onClick={() => setCategoryFilter("bonds")}
           data-testid="button-filter-bonds"
          >
           🛡️ Bonds
          </Button>
          <Button
           variant={categoryFilter ==="real_estate" ?"default" :"outline"}
           size="sm"
           onClick={() => setCategoryFilter("real_estate")}
           data-testid="button-filter-real_estate"
          >
           🏢 Real Estate
          </Button>
          <Button
           variant={categoryFilter ==="crypto" ?"default" :"outline"}
           size="sm"
           onClick={() => setCategoryFilter("crypto")}
           data-testid="button-filter-crypto"
          >
           ₿ Crypto
          </Button>
          <Button
           variant={categoryFilter ==="savings" ?"default" :"outline"}
           size="sm"
           onClick={() => setCategoryFilter("savings")}
           data-testid="button-filter-savings"
          >
           🏦 Savings
          </Button>
         </div>
        </div>

        <div className="flex-1">
         <Label className="text-sm font-medium mb-2 block">Risk Level</Label>
         <div className="flex flex-wrap gap-2">
          <Button
           variant={riskFilter ==="all" ?"default" :"outline"}
           size="sm"
           onClick={() => setRiskFilter("all")}
           data-testid="button-filter-risk-all"
          >
           All
          </Button>
          <Button
           variant={riskFilter ==="very_low" ?"default" :"outline"}
           size="sm"
           onClick={() => setRiskFilter("very_low")}
           className={riskFilter ==="very_low" ? RISK_COLORS.very_low :""}
           data-testid="button-filter-risk-very_low"
          >
           Very Low
          </Button>
          <Button
           variant={riskFilter ==="low" ?"default" :"outline"}
           size="sm"
           onClick={() => setRiskFilter("low")}
           className={riskFilter ==="low" ? RISK_COLORS.low :""}
           data-testid="button-filter-risk-low"
          >
           Low
          </Button>
          <Button
           variant={riskFilter ==="moderate" ?"default" :"outline"}
           size="sm"
           onClick={() => setRiskFilter("moderate")}
           className={riskFilter ==="moderate" ? RISK_COLORS.moderate :""}
           data-testid="button-filter-risk-moderate"
          >
           Moderate
          </Button>
          <Button
           variant={riskFilter ==="high" ?"default" :"outline"}
           size="sm"
           onClick={() => setRiskFilter("high")}
           className={riskFilter ==="high" ? RISK_COLORS.high :""}
           data-testid="button-filter-risk-high"
          >
           High
          </Button>
          <Button
           variant={riskFilter ==="very_high" ?"default" :"outline"}
           size="sm"
           onClick={() => setRiskFilter("very_high")}
           className={riskFilter ==="very_high" ? RISK_COLORS.very_high :""}
           data-testid="button-filter-risk-very_high"
          >
           Very High
          </Button>
         </div>
        </div>
       </div>

       {strategiesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-64" />
         ))}
        </div>
       ) : (
        <AnimatePresence mode="wait">
         <motion.div
          key={`${categoryFilter}-${riskFilter}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
         >
          {filteredStrategies.map((strategy) => (
           <Card
            key={strategy.id}
            className="border-border/50 hover:border-primary/50 transition-all"
            data-testid={`card-strategy-${strategy.id}`}
           >
            <CardHeader>
             <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
               <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{LABEL_BY_CATEGORY[strategy.category] ||"Investments"}</span>
                <Badge variant="outline" className="capitalize">
                 {strategy.category.replace("_","")}
                </Badge>
               </div>
               <CardTitle className="text-lg">{strategy.name}</CardTitle>
              </div>
              <Tooltip>
               <TooltipTrigger>
                <Badge className={RISK_COLORS[strategy.riskLevel]}>
                 {strategy.riskLevel.replace("_","").toUpperCase()}
                </Badge>
               </TooltipTrigger>
               <TooltipContent>
                <p>Risk Level: {strategy.riskLevel.replace("_","")}</p>
               </TooltipContent>
              </Tooltip>
             </div>
            </CardHeader>
            <CardContent className="space-y-3">
             <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-green-600 dark:text-green-400">
               {formatPercent(parseFloat(strategy.expectedReturn))}
              </span>
              <span className="text-sm text-muted-foreground">return</span>
             </div>

             <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
               <span className="text-muted-foreground">Min Investment:</span>
               <span className="font-medium">{formatCurrency(parseFloat(strategy.minInvestment ||"0"))}</span>
              </div>
              <div className="flex items-center justify-between">
               <span className="text-muted-foreground">Time Horizon:</span>
               <span className="font-medium">
                {TIME_HORIZON_ICONS[strategy.timeHorizon]} {strategy.timeHorizon}
               </span>
              </div>
              <div className="flex items-center justify-between">
               <span className="text-muted-foreground">Liquidity:</span>
               <span className="font-medium capitalize">{strategy.liquidity}</span>
              </div>
             </div>

             <p className="text-sm text-muted-foreground line-clamp-2">
              {strategy.description}
             </p>

             <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setExpandedStrategy(expandedStrategy === strategy.id ? null : strategy.id)}
              data-testid={`button-expand-${strategy.id}`}
             >
              {expandedStrategy === strategy.id ? (
               <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Less
               </>
              ) : (
               <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show More
               </>
              )}
             </Button>

             <AnimatePresence>
              {expandedStrategy === strategy.id && (
               <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height:"auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 overflow-hidden"
               >
                <Separator />
                
                <div>
                 <h4 className="font-semibold text-sm mb-2 text-green-600 dark:text-green-400">
                  ✓ Pros
                 </h4>
                 <ul className="space-y-1">
                  {strategy.pros?.map((pro, idx) => (
                   <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400">•</span>
                    {pro}
                   </li>
                  ))}
                 </ul>
                </div>

                <div>
                 <h4 className="font-semibold text-sm mb-2 text-orange-600 dark:text-orange-400">
                  ⚠ Cons
                 </h4>
                 <ul className="space-y-1">
                  {strategy.cons?.map((con, idx) => (
                   <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400">•</span>
                    {con}
                   </li>
                  ))}
                 </ul>
                </div>

                <div>
                 <h4 className="font-semibold text-sm mb-2">👥 Best For</h4>
                 <ul className="space-y-1">
                  {strategy.bestFor?.map((item, idx) => (
                   <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {item}
                   </li>
                  ))}
                 </ul>
                </div>

                {strategy.platformSuggestions && strategy.platformSuggestions.length > 0 && (
                 <div>
                  <h4 className="font-semibold text-sm mb-2">🔗 Platform Suggestions</h4>
                  <div className="flex flex-wrap gap-2">
                   {strategy.platformSuggestions.map((platform, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                     {platform}
                    </Badge>
                   ))}
                  </div>
                 </div>
                )}
               </motion.div>
              )}
             </AnimatePresence>
            </CardContent>
           </Card>
          ))}
         </motion.div>
        </AnimatePresence>
       )}
      </div>
     </div>

     <Separator className="my-8" />

     <div>
      <div className="flex items-center gap-3 mb-4">
       <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
       <h2 className="text-xl sm:text-2xl font-semibold">
        Investment Calculator
       </h2>
      </div>

      <Card className="border-border/50">
       <CardHeader>
        <CardDescription>
         See how your investment could grow over time with compound returns
        </CardDescription>
       </CardHeader>
       <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="space-y-2">
          <Label htmlFor="investment-amount">Investment Amount</Label>
          <Input
           id="investment-amount"
           type="number"
           value={calculatorAmount}
           onChange={(e) => setCalculatorAmount(parseFloat(e.target.value) || 0)}
           placeholder="Enter amount"
           min="0"
           step="1000"
           data-testid="input-investment-amount"
          />
         </div>

         <div className="space-y-2">
          <Label htmlFor="strategy-select">Select Strategy</Label>
          <Select value={selectedStrategyId} onValueChange={handleStrategySelection}>
           <SelectTrigger id="strategy-select" data-testid="select-strategy">
            <SelectValue placeholder="Choose an investment strategy" />
           </SelectTrigger>
           <SelectContent>
            {strategies?.map((strategy) => (
             <SelectItem key={strategy.id} value={strategy.id}>
              {strategy.name} ({formatPercent(parseFloat(strategy.expectedReturn))})
             </SelectItem>
            ))}
           </SelectContent>
          </Select>
         </div>
        </div>

        {selectedStrategyDetails && calculatorAmount > 0 && (
         <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
         >
          <div className="bg-muted/30 rounded-lg p-4">
           <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Selected Strategy:</span>
            <span className="font-semibold">{selectedStrategyDetails.name}</span>
           </div>
           <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Expected Annual Return:</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
             {formatPercent(parseFloat(selectedStrategyDetails.expectedReturn))}
            </span>
           </div>
          </div>

          <div className="h-80">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={calculatorData}>
             <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
             <XAxis 
              dataKey="timeframe" 
              className="text-xs"
             />
             <YAxis 
              tickFormatter={(value) => formatCurrency(value)}
              className="text-xs"
             />
             <RechartsTooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ 
               backgroundColor: 'hsl(var(--card))',
               border: '1px solid hsl(var(--border))',
               borderRadius: '8px'
              }}
             />
             <Legend />
             <Bar 
              dataKey="principal" 
              fill="hsl(var(--muted))" 
              name="Principal"
              radius={[4, 4, 0, 0]}
             />
             <Bar 
              dataKey="amount" 
              fill="hsl(var(--primary))" 
              name="Total Value"
              radius={[4, 4, 0, 0]}
             />
            </BarChart>
           </ResponsiveContainer>
          </div>

          <div className="mt-4" data-testid="calculator-projections">
           <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Investment Projections</h4>
           <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/30 rounded-lg p-3">
             <p className="text-xs text-muted-foreground mb-1">1 Year</p>
             <p className="text-lg font-bold" data-testid="text-return-1year">
              {formatCurrency(calculatorData[0]?.amount || 0)}
             </p>
             <p className="text-xs text-green-600 dark:text-green-400">
              +{formatCurrency((calculatorData[0]?.amount || 0) - calculatorAmount)}
             </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
             <p className="text-xs text-muted-foreground mb-1">5 Years</p>
             <p className="text-lg font-bold" data-testid="text-return-5years">
              {formatCurrency(calculatorData[1]?.amount || 0)}
             </p>
             <p className="text-xs text-green-600 dark:text-green-400">
              +{formatCurrency((calculatorData[1]?.amount || 0) - calculatorAmount)}
             </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
             <p className="text-xs text-muted-foreground mb-1">10 Years</p>
             <p className="text-lg font-bold" data-testid="text-return-10years">
              {formatCurrency(calculatorData[2]?.amount || 0)}
             </p>
             <p className="text-xs text-green-600 dark:text-green-400">
              +{formatCurrency((calculatorData[2]?.amount || 0) - calculatorAmount)}
             </p>
            </div>
           </div>
          </div>
         </motion.div>
        )}
       </CardContent>
      </Card>
     </div>

     <Separator className="my-8" />

     <div>
      <div className="flex items-center gap-3 mb-4">
       <Coins className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
       <h2 className="text-xl sm:text-2xl font-semibold">
        Passive Income Opportunities
       </h2>
      </div>

      <div className="space-y-4">
       <div className="flex flex-wrap gap-2">
        <Button
         variant={passiveIncomeFilter ==="all" ?"default" :"outline"}
         size="sm"
         onClick={() => setPassiveIncomeFilter("all")}
         data-testid="button-filter-passive-all"
        >
         All
        </Button>
        <Button
         variant={passiveIncomeFilter ==="digital_products" ?"default" :"outline"}
         size="sm"
         onClick={() => setPassiveIncomeFilter("digital_products")}
         data-testid="button-filter-passive-digital_products"
        >
         📦 Digital Products
        </Button>
        <Button
         variant={passiveIncomeFilter ==="content_creation" ?"default" :"outline"}
         size="sm"
         onClick={() => setPassiveIncomeFilter("content_creation")}
         data-testid="button-filter-passive-content_creation"
        >
         🎥 Content Creation
        </Button>
        <Button
         variant={passiveIncomeFilter ==="real_estate" ?"default" :"outline"}
         size="sm"
         onClick={() => setPassiveIncomeFilter("real_estate")}
         data-testid="button-filter-passive-real_estate"
        >
         🏠 Real Estate
        </Button>
        <Button
         variant={passiveIncomeFilter ==="investments" ?"default" :"outline"}
         size="sm"
         onClick={() => setPassiveIncomeFilter("investments")}
         data-testid="button-filter-passive-investments"
        >
          Investments
        </Button>
       </div>

       {passiveIncomeLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-64" />
         ))}
        </div>
       ) : (
        <AnimatePresence mode="wait">
         <motion.div
          key={passiveIncomeFilter}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
         >
          {filteredPassiveIncome.map((opportunity) => (
           <Card
            key={opportunity.id}
            className="border-border/50 hover:border-primary/50 transition-all"
            data-testid={`card-passive-income-${opportunity.id}`}
           >
            <CardHeader>
             <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
               <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{LABEL_BY_CATEGORY[opportunity.category] ||"Investments"}</span>
                <Badge variant="outline" className="capitalize">
                 {opportunity.category.replace("_","")}
                </Badge>
               </div>
               <CardTitle className="text-lg">{opportunity.name}</CardTitle>
              </div>
             </div>
            </CardHeader>
            <CardContent className="space-y-3">
             <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <p className="text-xs text-muted-foreground mb-1">Monthly Earnings</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
               {formatCurrency(parseFloat(opportunity.monthlyEarningsMin ||"0"))} - {formatCurrency(parseFloat(opportunity.monthlyEarningsMax ||"0"))}
              </p>
             </div>

             <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
               <span className="text-muted-foreground">Effort Level:</span>
               <Badge variant="secondary" className="capitalize">
                {opportunity.effortLevel}
               </Badge>
              </div>
              <div className="flex items-center justify-between">
               <span className="text-muted-foreground">Time to Profit:</span>
               <span className="font-medium capitalize">
                {opportunity.timeToProfit.replace(/_/g,"")}
               </span>
              </div>
              <div className="flex items-center justify-between">
               <span className="text-muted-foreground">Scalability:</span>
               <Badge 
                className={
                 opportunity.scalability ==="high" 
                  ?"bg-green-500 dark:bg-green-600" 
                  : opportunity.scalability ==="medium"
                  ?"bg-yellow-500 dark:bg-yellow-600"
                  :"bg-gray-500 dark:bg-gray-600"
                }
               >
                {opportunity.scalability}
               </Badge>
              </div>
              <div className="flex items-center justify-between">
               <span className="text-muted-foreground">Startup Cost:</span>
               <span className="font-medium capitalize">
                {opportunity.startupCost.replace("_","")}
               </span>
              </div>
             </div>

             <p className="text-sm text-muted-foreground line-clamp-2">
              {opportunity.description}
             </p>

             <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setExpandedPassiveIncome(expandedPassiveIncome === opportunity.id ? null : opportunity.id)}
              data-testid={`button-expand-passive-${opportunity.id}`}
             >
              {expandedPassiveIncome === opportunity.id ? (
               <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Less
               </>
              ) : (
               <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show More
               </>
              )}
             </Button>

             <AnimatePresence>
              {expandedPassiveIncome === opportunity.id && (
               <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height:"auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 overflow-hidden"
               >
                <Separator />

                <div>
                 <h4 className="font-semibold text-sm mb-2 text-green-600 dark:text-green-400">
                  ✓ Pros
                 </h4>
                 <ul className="space-y-1">
                  {opportunity.pros?.map((pro, idx) => (
                   <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400">•</span>
                    {pro}
                   </li>
                  ))}
                 </ul>
                </div>

                <div>
                 <h4 className="font-semibold text-sm mb-2 text-orange-600 dark:text-orange-400">
                  ⚠ Cons
                 </h4>
                 <ul className="space-y-1">
                  {opportunity.cons?.map((con, idx) => (
                   <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400">•</span>
                    {con}
                   </li>
                  ))}
                 </ul>
                </div>

                {opportunity.requiredSkills && opportunity.requiredSkills.length > 0 && (
                 <div>
                  <h4 className="font-semibold text-sm mb-2">Long-term Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                   {opportunity.requiredSkills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                     {skill}
                    </Badge>
                   ))}
                  </div>
                 </div>
                )}

                {opportunity.platforms && opportunity.platforms.length > 0 && (
                 <div>
                  <h4 className="font-semibold text-sm mb-2">🔗 Platforms</h4>
                  <div className="flex flex-wrap gap-2">
                   {opportunity.platforms.map((platform, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                     {platform}
                    </Badge>
                   ))}
                  </div>
                 </div>
                )}

                <div>
                 <h4 className="font-semibold text-sm mb-2">👥 Best For</h4>
                 <ul className="space-y-1">
                  {opportunity.bestFor?.map((item, idx) => (
                   <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {item}
                   </li>
                  ))}
                 </ul>
                </div>
               </motion.div>
              )}
             </AnimatePresence>
            </CardContent>
           </Card>
          ))}
         </motion.div>
        </AnimatePresence>
       )}
      </div>
     </div>
    </div>
   </div>
  </TooltipProvider>
 );
}

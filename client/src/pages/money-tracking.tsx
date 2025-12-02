import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, TrendingUp, TrendingDown, DollarSign, Filter, Calendar, 
  BarChart3, Target, Lightbulb, Sparkles, CheckCircle, FileText, 
  Download, ChevronDown, ArrowUpRight, ArrowDownRight, Wallet,
  CreditCard, ShoppingBag, Home, Car, Utensils, Heart, Plane,
  Zap, Coffee, Smartphone, Gift, Briefcase, PiggyBank
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as globalQueryClient } from "@/lib/queryClient";
import TransactionForm from "@/components/forms/transaction-form";
import AdvancedSpendingAnalytics from "@/components/money/advanced-spending-analytics";
import SmartBudgetManagement from "@/components/money/smart-budget-management";
import SpendingInsights from "@/components/money/spending-insights";
import { SwipeableTransactionItem } from "@/components/transactions/swipeable-transaction-item";
import { ResponsiveTransactionDialog } from "@/components/dialogs/responsive-transaction-dialog";
import { CollapsibleList } from "@/components/virtual-list";

const CSVAnalysisPanel = lazy(() => import("@/components/money/csv-analysis-panel"));

const TRANSACTION_CATEGORIES = {
  income: ["salary", "freelance", "investment", "gift", "other"],
  expense: ["rent", "utilities", "groceries", "dining", "transport", "healthcare", "entertainment", "shopping", "other"],
  transfer: ["savings", "investment", "goal_contribution"]
};

const getCategoryIcon = (category: string) => {
  const icons: Record<string, JSX.Element> = {
    salary: <Briefcase className="w-4 h-4" />,
    freelance: <Zap className="w-4 h-4" />,
    investment: <TrendingUp className="w-4 h-4" />,
    rent: <Home className="w-4 h-4" />,
    utilities: <Zap className="w-4 h-4" />,
    groceries: <ShoppingBag className="w-4 h-4" />,
    dining: <Utensils className="w-4 h-4" />,
    transport: <Car className="w-4 h-4" />,
    healthcare: <Heart className="w-4 h-4" />,
    entertainment: <Smartphone className="w-4 h-4" />,
    shopping: <CreditCard className="w-4 h-4" />,
    gift: <Gift className="w-4 h-4" />,
    savings: <PiggyBank className="w-4 h-4" />,
    travel: <Plane className="w-4 h-4" />,
    coffee: <Coffee className="w-4 h-4" />,
    other: <Wallet className="w-4 h-4" />,
  };
  return icons[category.toLowerCase()] || <DollarSign className="w-4 h-4" />;
};

function AnimatedNumber({ value, prefix = "$", decimals = 0 }: { value: number; prefix?: string; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <span>
      {prefix}{displayValue.toLocaleString(undefined, { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
      })}
    </span>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendLabel,
  colorClass,
  bgClass,
  delay = 0
}: { 
  title: string; 
  value: number; 
  icon: any; 
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  colorClass: string;
  bgClass: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/40">
        <div className={`absolute inset-0 ${bgClass} opacity-50`} />
        <CardContent className="relative p-4 sm:p-6">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className={`p-2 sm:p-2.5 rounded-xl ${bgClass}`}>
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClass}`} />
            </div>
            {trend && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {trend === 'up' ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : trend === 'down' ? (
                  <ArrowDownRight className="w-3 h-3" />
                ) : null}
                {trendLabel}
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className={`text-xl sm:text-3xl font-bold tracking-tight ${colorClass}`}>
            <AnimatedNumber value={value} />
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CategoryBreakdown({ transactions }: { transactions: any[] }) {
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'other';
        totals[cat] = (totals[cat] || 0) + parseFloat(t.amount);
      });
    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  const totalExpenses = categoryTotals.reduce((sum, c) => sum + c.amount, 0);

  if (categoryTotals.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="border-border/40">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Top Spending Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {categoryTotals.map((cat, index) => {
            const percentage = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;
            return (
              <motion.div 
                key={cat.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="space-y-1.5 sm:space-y-2"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-muted">
                      {getCategoryIcon(cat.category)}
                    </div>
                    <span className="font-medium capitalize">{cat.category}</span>
                  </div>
                  <span className="font-semibold">${cat.amount.toLocaleString()}</span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground text-right">
                  {percentage.toFixed(1)}% of expenses
                </p>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function MoneyTracking() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('add') === '1') {
      setIsCreateDialogOpen(true);
      window.history.replaceState({}, '', '/money-tracking');
    }
  }, []);
  
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("30");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions", filterType, filterCategory, timeRange],
    queryFn: () => fetch(`/api/transactions?limit=100`).then(res => res.json()),
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const bulkCategorizeMutation = useMutation({
    mutationFn: async () => {
      const uncategorizedIds = transactions
        ?.filter((t: any) => t.category === 'Other' || t.category === 'other')
        .map((t: any) => t.id) || [];
      
      if (uncategorizedIds.length === 0) {
        throw new Error("No uncategorized transactions to fix");
      }
      
      const response = await apiRequest('POST', '/api/transactions/bulk-categorize', { transactionIds: uncategorizedIds });
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Categories Fixed",
        description: `Successfully categorized ${data.updated} of ${data.total} transactions using AI detection.`,
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to categorize transactions",
        variant: "destructive",
      });
    },
  });

  const archiveTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/transactions/${id}/archive`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Transaction Archived",
        description: "Transaction has been archived successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive transaction",
        variant: "destructive",
      });
    },
  });

  const flagTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/transactions/${id}/flag`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Transaction Flagged",
        description: "Transaction has been flagged for review",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to flag transaction",
        variant: "destructive",
      });
    },
  });

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((transaction: any) => {
      const typeMatch = filterType === "all" || transaction.type === filterType;
      const categoryMatch = filterCategory === "all" || transaction.category === filterCategory;
      
      const transactionDate = new Date(transaction.date);
      const daysAgo = new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
      const dateMatch = transactionDate >= daysAgo;
      
      return typeMatch && categoryMatch && dateMatch;
    });
  }, [transactions, filterType, filterCategory, timeRange]);

  const { totalIncome, totalExpenses, netCashFlow } = useMemo(() => {
    const income = filteredTransactions
      .filter((t: any) => t.type === "income")
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const expenses = filteredTransactions
      .filter((t: any) => t.type === "expense")
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    return { totalIncome: income, totalExpenses: expenses, netCashFlow: income - expenses };
  }, [filteredTransactions]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
            <div className="h-8 bg-muted/50 rounded-lg w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-muted/50 rounded w-64 animate-pulse" />
          </div>
        </header>
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6 border-border/50">
                <div className="h-10 w-10 bg-muted/50 rounded-xl mb-4 animate-pulse" />
                <div className="h-4 bg-muted/50 rounded w-1/2 mb-2 animate-pulse" />
                <div className="h-8 bg-muted/50 rounded w-3/4 animate-pulse" />
              </Card>
            ))}
          </div>
          <Card className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-muted/50 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted/50 rounded w-1/3 mb-2 animate-pulse" />
                    <div className="h-3 bg-muted/50 rounded w-1/4 animate-pulse" />
                  </div>
                  <div className="h-6 bg-muted/50 rounded w-20 animate-pulse" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <motion.div 
              className="flex-1 min-w-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-lg sm:text-3xl font-semibold tracking-tight text-foreground">
                Money Tracking
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                Monitor your income, expenses, and cash flow
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <ResponsiveTransactionDialog 
                open={isCreateDialogOpen} 
                onOpenChange={setIsCreateDialogOpen}
              />
            </motion.div>
          </div>
        </div>
      </header>
      
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <motion.div 
            className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-4 sm:mb-6 scrollbar-none"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-5 p-1 gap-1 bg-muted/50">
              <TabsTrigger value="overview" className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap min-h-[40px] data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-overview">
                <DollarSign size={14} className="flex-shrink-0" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap min-h-[40px] data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-analytics">
                <BarChart3 size={14} className="flex-shrink-0" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap min-h-[40px] data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-budget">
                <Target size={14} className="flex-shrink-0" />
                <span>Budget</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap min-h-[40px] data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-insights">
                <Lightbulb size={14} className="flex-shrink-0" />
                <span>Insights</span>
              </TabsTrigger>
              <TabsTrigger value="csv-analyzer" className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap min-h-[40px] data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-csv-analyzer">
                <FileText size={14} className="flex-shrink-0" />
                <span>CSV</span>
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                title="Total Income"
                value={totalIncome}
                icon={TrendingUp}
                trend="up"
                trendLabel="This period"
                colorClass="text-green-600 dark:text-green-400"
                bgClass="bg-green-500/10"
                delay={0}
              />
              <StatCard
                title="Total Expenses"
                value={totalExpenses}
                icon={TrendingDown}
                trend="down"
                trendLabel="This period"
                colorClass="text-red-600 dark:text-red-400"
                bgClass="bg-red-500/10"
                delay={0.1}
              />
              <StatCard
                title="Net Cash Flow"
                value={Math.abs(netCashFlow)}
                icon={netCashFlow >= 0 ? ArrowUpRight : ArrowDownRight}
                trend={netCashFlow >= 0 ? 'up' : 'down'}
                trendLabel={netCashFlow >= 0 ? 'Positive' : 'Negative'}
                colorClass={netCashFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
                bgClass={netCashFlow >= 0 ? "bg-green-500/10" : "bg-red-500/10"}
                delay={0.2}
              />
              <StatCard
                title="Total Savings"
                value={(stats as any)?.totalSavings || 0}
                icon={PiggyBank}
                trend="neutral"
                trendLabel="All time"
                colorClass="text-blue-600 dark:text-blue-400"
                bgClass="bg-blue-500/10"
                delay={0.3}
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Card className="border-border/40">
                    <button 
                      className="flex items-center justify-between w-full p-4 sm:p-6 md:cursor-default"
                      onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                      data-testid="button-toggle-filters"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-muted">
                          <Filter className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-sm sm:text-base font-semibold">Filters</span>
                          <span className="text-xs sm:text-sm text-muted-foreground ml-2">
                            ({filteredTransactions.length} transactions)
                          </span>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 md:hidden transition-transform ${isFiltersExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div className={`${isFiltersExpanded ? 'block' : 'hidden'} md:block px-4 sm:px-6 pb-4 sm:pb-6`}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <div>
                          <label className="text-xs sm:text-sm font-medium mb-1.5 block text-muted-foreground">Time Range</label>
                          <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger data-testid="select-time-range" className="h-9 sm:h-10 text-xs sm:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7">Last 7 days</SelectItem>
                              <SelectItem value="30">Last 30 days</SelectItem>
                              <SelectItem value="90">Last 3 months</SelectItem>
                              <SelectItem value="365">Last year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-xs sm:text-sm font-medium mb-1.5 block text-muted-foreground">Type</label>
                          <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger data-testid="select-transaction-type" className="h-9 sm:h-10 text-xs sm:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="income">Income</SelectItem>
                              <SelectItem value="expense">Expense</SelectItem>
                              <SelectItem value="transfer">Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-xs sm:text-sm font-medium mb-1.5 block text-muted-foreground">Category</label>
                          <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger data-testid="select-filter-category" className="h-9 sm:h-10 text-xs sm:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              {Object.entries(TRANSACTION_CATEGORIES).map(([type, categories]) => (
                                categories.map(category => (
                                  <SelectItem key={`${type}-${category}`} value={category}>
                                    {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                                  </SelectItem>
                                ))
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-end gap-2 col-span-2 md:col-span-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setFilterType("all");
                              setFilterCategory("all");
                              setTimeRange("30");
                            }}
                            data-testid="button-clear-filters"
                            className="text-xs h-9 sm:h-10 flex-1"
                          >
                            Clear
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const params = new URLSearchParams();
                              if (filterType !== 'all') params.set('type', filterType);
                              if (filterCategory !== 'all') params.set('category', filterCategory);
                              const days = parseInt(timeRange);
                              const endDate = new Date();
                              const startDate = new Date();
                              startDate.setDate(startDate.getDate() - days);
                              params.set('startDate', startDate.toISOString().split('T')[0]);
                              params.set('endDate', endDate.toISOString().split('T')[0]);
                              window.location.href = `/api/transactions/export?${params.toString()}`;
                            }}
                            data-testid="button-export-csv"
                            className="text-xs h-9 sm:h-10 flex-1"
                          >
                            <Download size={14} className="mr-1.5" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <AnimatePresence mode="wait">
                  {transactions?.filter((t: any) => t.category === 'Other' || t.category === 'other').length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="p-4 bg-primary/5 border-primary/20">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
                                AI Smart Categorization
                              </h4>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {transactions?.filter((t: any) => t.category === 'Other' || t.category === 'other').length} uncategorized transactions detected
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => bulkCategorizeMutation.mutate()}
                            disabled={bulkCategorizeMutation.isPending}
                            size="sm"
                            className="font-medium flex-shrink-0"
                            data-testid="button-fix-categories"
                          >
                            {bulkCategorizeMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent mr-2" />
                                <span className="hidden sm:inline">Categorizing...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                <span className="hidden sm:inline">Fix Categories</span>
                                <span className="sm:hidden">Fix</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <Card className="border-border/40">
                    <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                      <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-primary" />
                        Recent Transactions
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                      {filteredTransactions.length === 0 ? (
                        transactions?.length === 0 ? (
                          <EmptyState
                            illustration="transactions"
                            title="No Transactions Yet"
                            description="Start tracking your financial journey by adding your first transaction. Every dollar tracked brings you closer to your goals."
                            actionLabel="Add Your First Transaction"
                            onAction={() => setIsCreateDialogOpen(true)}
                            actionTestId="button-add-first-transaction"
                          />
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto bg-muted rounded-2xl flex items-center justify-center mb-4">
                              <Filter className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-base font-semibold mb-2">No transactions match your filters</h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                              Try adjusting your date range or category filters to see more transactions
                            </p>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setFilterType("all");
                                setFilterCategory("all");
                                setTimeRange("30");
                              }}
                            >
                              Clear Filters
                            </Button>
                          </div>
                        )
                      ) : (
                        <CollapsibleList
                          items={filteredTransactions}
                          itemHeight={72}
                          keyExtractor={(t: any) => t.id}
                          initialVisible={10}
                          showMoreLabel="View all transactions"
                          showLessLabel="Show fewer transactions"
                          className="space-y-2 sm:space-y-3"
                          renderItem={(transaction: any) => (
                            <SwipeableTransactionItem
                              transaction={transaction}
                              onArchive={(id) => archiveTransactionMutation.mutate(id)}
                              onFlag={(id) => flagTransactionMutation.mutate(id)}
                            />
                          )}
                        />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <CategoryBreakdown transactions={filteredTransactions} />
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <Card className="border-border/40 p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      Quick Tips
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Track expenses daily for accurate budgeting
                        </p>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Review spending categories weekly
                        </p>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Set budget limits for each category
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AdvancedSpendingAnalytics 
              transactions={filteredTransactions || []} 
              timeRange={timeRange} 
            />
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <SmartBudgetManagement 
              transactions={filteredTransactions || []} 
              timeRange={timeRange} 
            />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <SpendingInsights 
              transactions={filteredTransactions || []} 
              timeRange={timeRange} 
            />
          </TabsContent>

          <TabsContent value="csv-analyzer" className="space-y-6">
            <Suspense fallback={
              <Card className="p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading CSV Analyzer...</p>
                </div>
              </Card>
            }>
              <CSVAnalysisPanel />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

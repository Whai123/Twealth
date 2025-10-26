import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, TrendingUp, TrendingDown, DollarSign, Filter, Calendar, BarChart3, Target, Lightbulb, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as globalQueryClient } from "@/lib/queryClient";
import TransactionForm from "@/components/forms/transaction-form";
import AdvancedSpendingAnalytics from "@/components/money/advanced-spending-analytics";
import SmartBudgetManagement from "@/components/money/smart-budget-management";
import SpendingInsights from "@/components/money/spending-insights";

const TRANSACTION_CATEGORIES = {
  income: ["salary", "freelance", "investment", "gift", "other"],
  expense: ["rent", "utilities", "groceries", "dining", "transport", "healthcare", "entertainment", "shopping", "other"],
  transfer: ["savings", "investment", "goal_contribution"]
};

export default function MoneyTracking() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Check for add query parameter and open dialog automatically
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('add') === '1') {
      setIsCreateDialogOpen(true);
      // Clean up URL by removing the query parameter
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

  // Bulk categorization mutation
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
        title: "✨ Categories Fixed!",
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

  const filteredTransactions = transactions?.filter((transaction: any) => {
    const typeMatch = filterType === "all" || transaction.type === filterType;
    const categoryMatch = filterCategory === "all" || transaction.category === filterCategory;
    
    const transactionDate = new Date(transaction.date);
    const daysAgo = new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
    const dateMatch = transactionDate >= daysAgo;
    
    return typeMatch && categoryMatch && dateMatch;
  }) || [];

  const totalIncome = filteredTransactions
    .filter((t: any) => t.type === "income")
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

  const totalExpenses = filteredTransactions
    .filter((t: any) => t.type === "expense")
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

  const netCashFlow = totalIncome - totalExpenses;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "income":
        return <TrendingUp className="text-green-600" size={16} />;
      case "expense":
        return <TrendingDown className="text-red-600" size={16} />;
      case "transfer":
        return <DollarSign className="text-blue-600" size={16} />;
      default:
        return <DollarSign className="text-gray-600" size={16} />;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case "income":
        return "text-green-600";
      case "expense":
        return "text-red-600";
      case "transfer":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <>
        {/* Header - Modern Design (Loading State) */}
        <header 
          className="bg-card/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-30"
          style={{ 
            paddingLeft: 'var(--space-4)', 
            paddingRight: 'var(--space-4)',
            paddingTop: 'var(--space-4)',
            paddingBottom: 'var(--space-4)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 
                className="text-xl md:text-2xl font-bold text-brand flex items-center"
                style={{ fontSize: 'clamp(var(--text-xl), 4vw, var(--text-2xl))' }}
              >
                <TrendingUp className="mr-2 text-brand" size={20} />
                Money Tracking
              </h1>
              <p 
                className="text-muted-foreground font-medium truncate"
                style={{ 
                  fontSize: 'var(--text-sm)',
                  marginTop: 'var(--space-1)'
                }}
              >
                Track your income, expenses, and financial flow
              </p>
            </div>
            <div className="flex items-center">
              <Button 
                disabled
                className="bg-primary/50 text-primary-foreground"
                style={{ 
                  borderRadius: 'var(--radius)',
                  padding: 'var(--space-3) var(--space-4)'
                }}
              >
                <Plus size={16} className="mr-2" />
                <span className="hidden sm:inline">Add Transaction</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          </div>
        </header>

        <div style={{ padding: 'var(--space-6)', paddingTop: 'var(--space-4)' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 dark:from-blue-900/30 dark:via-cyan-900/30 dark:to-green-900/30">
      {/* Mobile-First Responsive Header */}
      <header className="bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 dark:from-blue-900/50 dark:via-cyan-900/50 dark:to-green-900/50 border-b border-border/50 sticky top-0 z-30 backdrop-blur-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 via-cyan-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg sm:shadow-xl animate-pulse flex-shrink-0">
                  <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-green-600 bg-clip-text text-transparent truncate">
                    💰 Money Tracking
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground truncate">AI-powered expense analytics and cash flow optimization</p>
                </div>
              </div>
              
              {/* Mobile-First Financial Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 transition-all hover:scale-105 active:scale-95">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    <span className="text-xs sm:text-sm font-medium truncate">Income</span>
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                    ${totalIncome.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">This period</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 transition-all hover:scale-105 active:scale-95">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                    <span className="text-xs sm:text-sm font-medium truncate">Expenses</span>
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">
                    ${totalExpenses.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">This period</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 transition-all hover:scale-105 active:scale-95">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    <span className="text-xs sm:text-sm font-medium truncate">Net Flow</span>
                  </div>
                  <div className={`text-lg sm:text-xl md:text-2xl font-bold ${netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    ${netCashFlow.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">Cash position</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 transition-all hover:scale-105 active:scale-95">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                    <span className="text-xs sm:text-sm font-medium truncate">Transactions</span>
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">
                    {filteredTransactions.length}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">This period</div>
                </div>
              </div>
            </div>
            
            {/* Mobile-First Action Button */}
            <div className="flex items-center gap-2 sm:gap-3 sm:ml-4 md:ml-6 w-full sm:w-auto">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-blue-500 via-cyan-500 to-green-600 hover:from-blue-600 hover:via-cyan-600 hover:to-green-700 text-white font-semibold px-4 sm:px-6 min-h-[44px] h-11 sm:h-12 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl active:scale-95 flex-1 sm:flex-initial"
                    data-testid="button-add-transaction"
                  >
                    <Plus size={16} className="sm:mr-2" />
                    <span className="hidden sm:inline">💳 Add Transaction</span>
                    <span className="sm:hidden text-xs">Add</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <TransactionForm onSuccess={() => setIsCreateDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Mobile-First Welcome Message */}
          <div className="bg-gradient-to-r from-white/80 to-blue-50/80 dark:from-gray-800/80 dark:to-blue-900/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/20">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-blue-800 dark:text-blue-200">Smart Money Analytics 📊</h2>
                <p className="text-xs sm:text-sm md:text-base text-blue-600 dark:text-blue-300 line-clamp-2 sm:line-clamp-none">AI analyzes your spending patterns to identify savings opportunities and optimize your financial health.</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
        {/* Modern Tab Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 p-1">
            <TabsTrigger value="overview" className="flex items-center justify-center gap-1.5 px-2 text-sm" data-testid="tab-overview">
              <DollarSign size={16} className="flex-shrink-0" />
              <span className="hidden sm:inline truncate">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center justify-center gap-1.5 px-2 text-sm" data-testid="tab-analytics">
              <BarChart3 size={16} className="flex-shrink-0" />
              <span className="hidden sm:inline truncate">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center justify-center gap-1.5 px-2 text-sm" data-testid="tab-budget">
              <Target size={16} className="flex-shrink-0" />
              <span className="hidden sm:inline truncate">Budget</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center justify-center gap-1.5 px-2 text-sm" data-testid="tab-insights">
              <Lightbulb size={16} className="flex-shrink-0" />
              <span className="hidden sm:inline truncate">Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Mobile-First Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
        <Card className="p-6 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 hover:scale-[1.01] cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold text-green-600" data-testid="text-total-income">
                ${totalIncome.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 hover:scale-[1.01] cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600" data-testid="text-total-expenses">
                ${totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 hover:scale-[1.01] cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Net Cash Flow</p>
              <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-net-cash-flow">
                ${netCashFlow.toLocaleString()}
              </p>
            </div>
            <div className={`w-12 h-12 ${netCashFlow >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'} rounded-lg flex items-center justify-center`}>
              <DollarSign className={netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'} size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 hover:scale-[1.01] cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Savings</p>
              <p className="text-2xl font-bold text-blue-600" data-testid="text-total-savings">
                ${(stats as any)?.totalSavings?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Filter className="mr-2" size={20} />
            Filters
          </h3>
          <span className="text-sm text-muted-foreground">
            {filteredTransactions.length} transactions
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Time Range</label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger data-testid="select-time-range">
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
            <label className="text-sm font-medium mb-1 block">Type</label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger data-testid="select-transaction-type">
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
            <label className="text-sm font-medium mb-1 block">Category</label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger data-testid="select-filter-category">
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

          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setFilterType("all");
                setFilterCategory("all");
                setTimeRange("30");
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Smart Categorization Banner */}
      {transactions?.filter((t: any) => t.category === 'Other' || t.category === 'other').length > 0 && (
        <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-cyan-900/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                  <span>✨ AI Smart Categorization</span>
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {transactions?.filter((t: any) => t.category === 'Other' || t.category === 'other').length} uncategorized transactions detected. Let AI categorize them automatically!
                </p>
              </div>
            </div>
            <Button
              onClick={() => bulkCategorizeMutation.mutate()}
              disabled={bulkCategorizeMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold flex-shrink-0"
              data-testid="button-fix-categories"
            >
              {bulkCategorizeMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Categorizing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Fix Categories
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Transactions List */}
      <Card className="p-6">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
              <p className="text-muted-foreground mb-6">
                {transactions?.length === 0 
                  ? "Start tracking your money by adding your first transaction"
                  : "Try adjusting your filters to see more transactions"
                }
              </p>
              <Button 
                data-testid="button-add-first-transaction"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus size={16} className="mr-2" />
                Add Transaction
              </Button>
            </div>
          ) : (
            <div style={{ gap: 'var(--space-3)' }} className="flex flex-col">
              {filteredTransactions.map((transaction: any) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between border rounded-lg hover:bg-muted/50 transition-colors"
                  style={{ padding: 'var(--space-3)' }}
                >
                  <div className="flex items-center min-w-0 flex-1" style={{ gap: 'var(--space-3)' }}>
                    <div 
                      className="bg-muted rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ width: '32px', height: '32px' }}
                    >
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 
                        className="font-medium text-foreground truncate" 
                        data-testid={`text-transaction-${transaction.id}`}
                        style={{ fontSize: 'var(--text-sm)' }}
                        title={transaction.description || transaction.category}
                      >
                        {transaction.description || transaction.category}
                      </h4>
                      <div className="flex items-center text-muted-foreground" style={{ gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                        <span>{new Date(transaction.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize">
                          {transaction.category.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span 
                      className={`font-semibold whitespace-nowrap ${getAmountColor(transaction.type)}`}
                      style={{ fontSize: 'var(--text-base)' }}
                      data-testid={`text-amount-${transaction.id}`}
                    >
                      {transaction.type === "income" ? "+" : "-"}${Math.abs(parseFloat(transaction.amount)).toLocaleString()}
                    </span>
                    {transaction.goalId && (
                      <p className="text-muted-foreground whitespace-nowrap" style={{ fontSize: 'var(--text-xs)' }}>Goal contribution</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
            </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AdvancedSpendingAnalytics 
              transactions={filteredTransactions || []} 
              timeRange={timeRange} 
            />
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-6">
            <SmartBudgetManagement 
              transactions={filteredTransactions || []} 
              timeRange={timeRange} 
            />
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <SpendingInsights 
              transactions={filteredTransactions || []} 
              timeRange={timeRange} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, TrendingUp, TrendingDown, DollarSign, Filter, Calendar, BarChart3, Target, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        {/* Professional Header (Loading State) */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center animate-pulse">
                    <DollarSign className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
                      Financial Tracking
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      Loading transaction data...
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <Button 
                  disabled
                  className="bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-6 py-2 h-10"
                >
                  <Plus size={16} className="mr-2" />
                  <span className="hidden sm:inline">Add Transaction</span>
                  <span className="sm:hidden">+</span>
                </Button>
              </div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Professional Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
                    Financial Tracking
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">Professional expense monitoring and cash flow analysis</p>
                </div>
              </div>
              
              {/* Professional Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="text-income-label">Income</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    ${totalIncome.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Period total</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="text-expenses-label">Expenses</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    ${totalExpenses.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Period total</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="text-net-flow-label">Net Cash Flow</span>
                  </div>
                  <div className={`text-2xl font-semibold text-gray-900 dark:text-white`}>
                    ${netCashFlow.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Cash position</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="text-transactions-label">Transactions</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {filteredTransactions.length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total records</div>
                </div>
              </div>
            </div>
            
            {/* Action Button */}
            <div className="flex items-center gap-3 ml-6">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 h-10 transition-colors shadow-sm"
                    data-testid="button-add-transaction"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <TransactionForm onSuccess={() => setIsCreateDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Professional Status */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="text-tracking-status">Financial Monitoring Active</h2>
                <p className="text-gray-600 dark:text-gray-400">Professional tracking with automated categorization and real-time cash flow analysis.</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-6 py-6">
        {/* Professional Tab Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700" data-testid="tab-overview">
              <DollarSign size={16} />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700" data-testid="tab-analytics">
              <BarChart3 size={16} />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700" data-testid="tab-budget">
              <Target size={16} />
              <span className="hidden sm:inline">Budget</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700" data-testid="tab-insights">
              <Lightbulb size={16} />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Professional Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Income</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white" data-testid="text-total-income">
                ${totalIncome.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-600" size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white" data-testid="text-total-expenses">
                ${totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="text-red-600" size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Net Cash Flow</p>
              <p className={`text-2xl font-semibold text-gray-900 dark:text-white`} data-testid="text-net-cash-flow">
                ${netCashFlow.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="text-blue-600" size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Savings</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white" data-testid="text-total-savings">
                ${(stats as any)?.totalSavings?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="text-purple-600" size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Professional Filters */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Filter className="mr-2" size={18} />
            Transaction Filters
          </h3>
          <span className="text-sm text-gray-500">
            {filteredTransactions.length} records found
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
              <SelectTrigger data-testid="select-transaction-category">
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

      {/* Professional Transactions */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Transaction History</CardTitle>
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
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-first-transaction">
                    <Plus size={16} className="mr-2" />
                    Add Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <TransactionForm onSuccess={() => setIsCreateDialogOpen(false)} />
                </DialogContent>
              </Dialog>
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

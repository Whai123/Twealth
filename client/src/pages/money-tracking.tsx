import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, TrendingUp, TrendingDown, DollarSign, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TransactionForm from "@/components/forms/transaction-form";

const TRANSACTION_CATEGORIES = {
  income: ["salary", "freelance", "investment", "gift", "other"],
  expense: ["rent", "utilities", "groceries", "dining", "transport", "healthcare", "entertainment", "shopping", "other"],
  transfer: ["savings", "investment", "goal_contribution"]
};

export default function MoneyTracking() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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
    <>
      {/* Header - Modern Design */}
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
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-px"
                  style={{ 
                    borderRadius: 'var(--radius)',
                    padding: 'var(--space-3) var(--space-4)'
                  }}
                  data-testid="button-add-transaction"
                >
                  <Plus size={16} className="mr-2" />
                  <span className="hidden sm:inline">Add Transaction</span>
                  <span className="sm:hidden">+</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <TransactionForm onSuccess={() => setIsCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div style={{ padding: 'var(--space-6)', paddingTop: 'var(--space-4)' }}>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
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

        <Card className="p-6">
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

        <Card className="p-6">
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

        <Card className="p-6">
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
                  <div className="flex items-center" style={{ gap: 'var(--space-3)' }}>
                    <div 
                      className="bg-muted rounded-lg flex items-center justify-center"
                      style={{ width: '32px', height: '32px' }}
                    >
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 
                        className="font-medium text-foreground truncate" 
                        data-testid={`text-transaction-${transaction.id}`}
                        style={{ fontSize: 'var(--text-sm)' }}
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
                  <div className="text-right">
                    <span 
                      className={`font-semibold ${getAmountColor(transaction.type)}`}
                      style={{ fontSize: 'var(--text-base)' }}
                    >
                      {transaction.type === "income" ? "+" : "-"}${Math.abs(parseFloat(transaction.amount)).toLocaleString()}
                    </span>
                    {transaction.goalId && (
                      <p className="text-muted-foreground" style={{ fontSize: 'var(--text-xs)' }}>Goal contribution</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
}

import { useState, useEffect } from"react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from"@tanstack/react-query";
import { Plus, TrendingUp, TrendingDown, DollarSign, Filter, Calendar, BarChart3, Target, Lightbulb, Sparkles, CheckCircle } from"lucide-react";
import { Button } from"@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Badge } from"@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from"@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs";
import { useToast } from"@/hooks/use-toast";
import { apiRequest, queryClient as globalQueryClient } from"@/lib/queryClient";
import TransactionForm from"@/components/forms/transaction-form";
import AdvancedSpendingAnalytics from"@/components/money/advanced-spending-analytics";
import SmartBudgetManagement from"@/components/money/smart-budget-management";
import SpendingInsights from"@/components/money/spending-insights";

const TRANSACTION_CATEGORIES = {
 income: ["salary","freelance","investment","gift","other"],
 expense: ["rent","utilities","groceries","dining","transport","healthcare","entertainment","shopping","other"],
 transfer: ["savings","investment","goal_contribution"]
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
 title:"Categories Fixed",
 description: `Successfully categorized ${data.updated} of ${data.total} transactions using AI detection.`,
 variant:"default",
 });
 },
 onError: (error: any) => {
 toast({
 title:"Error",
 description: error.message ||"Failed to categorize transactions",
 variant:"destructive",
 });
 },
 });

 const filteredTransactions = transactions?.filter((transaction: any) => {
 const typeMatch = filterType ==="all" || transaction.type === filterType;
 const categoryMatch = filterCategory ==="all" || transaction.category === filterCategory;
 
 const transactionDate = new Date(transaction.date);
 const daysAgo = new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
 const dateMatch = transactionDate >= daysAgo;
 
 return typeMatch && categoryMatch && dateMatch;
 }) || [];

 const totalIncome = filteredTransactions
 .filter((t: any) => t.type ==="income")
 .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

 const totalExpenses = filteredTransactions
 .filter((t: any) => t.type ==="expense")
 .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

 const netCashFlow = totalIncome - totalExpenses;

 const getTransactionIcon = (type: string) => {
 switch (type) {
 case"income":
 return <TrendingUp className="text-green-600" size={16} />;
 case"expense":
 return <TrendingDown className="text-red-600" size={16} />;
 case"transfer":
 return <DollarSign className="text-blue-600" size={16} />;
 default:
 return <DollarSign className="text-gray-600" size={16} />;
 }
 };

 const getAmountColor = (type: string) => {
 switch (type) {
 case"income":
 return"text-green-600";
 case"expense":
 return"text-red-600";
 case"transfer":
 return"text-blue-600";
 default:
 return"text-gray-600";
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
 <div>
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
 <div className="min-h-screen bg-background">
 {/* Clean Professional Header */}
 <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
 <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
 <div className="flex items-center justify-between gap-4">
 <div className="flex-1 min-w-0">
 <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
 Money Tracking
 </h1>
 <p className="text-sm text-muted-foreground mt-1">Monitor your income, expenses, and cash flow</p>
 </div>
 
 <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
 <DialogTrigger asChild>
 <Button 
 className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm min-h-[44px]"
 data-testid="button-add-transaction"
 >
 <Plus className="h-4 w-4 sm:mr-2" />
 <span className="hidden sm:inline">Add Transaction</span>
 <span className="sm:hidden">Add</span>
 </Button>
 </DialogTrigger>
 <DialogContent className="max-w-md">
 <TransactionForm onSuccess={() => setIsCreateDialogOpen(false)} />
 </DialogContent>
 </Dialog>
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
 <Card className="group relative overflow-hidden p-6 border-border/50">
 <div className="absolute inset-0 bg-green-500/5 pointer-events-none"></div>
 <div className="relative">
 <div className="flex items-center gap-2.5 mb-4">
 <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/30">
 <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
 </div>
 <span className="text-sm font-medium text-muted-foreground">Total Income</span>
 </div>
 <p className="text-4xl font-bold tracking-tight text-green-600 dark:text-green-400" data-testid="text-total-income">
 ${totalIncome.toLocaleString()}
 </p>
 </div>
 </Card>

 <Card className="group relative overflow-hidden p-6 border-border/50">
 <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>
 <div className="relative">
 <div className="flex items-center gap-2.5 mb-4">
 <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/30">
 <TrendingDown className="text-red-600 dark:text-red-400" size={20} />
 </div>
 <span className="text-sm font-medium text-muted-foreground">Total Expenses</span>
 </div>
 <p className="text-4xl font-bold tracking-tight text-red-600 dark:text-red-400" data-testid="text-total-expenses">
 ${totalExpenses.toLocaleString()}
 </p>
 </div>
 </Card>

 <Card className="p-6 hover:shadow-primary/10 [1.01] cursor-pointer">
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

 <Card className="p-6 hover:shadow-primary/10 [1.01] cursor-pointer">
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
 <Card className="p-4 mb-6 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
 <div className="flex items-center justify-between gap-4">
 <div className="flex items-center gap-3 flex-1">
 <div className="w-10 h-10 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
 <Sparkles className="w-5 h-5 text-white" />
 </div>
 <div className="min-w-0 flex-1">
 <h4 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
 <span>AI Smart Categorization</span>
 </h4>
 <p className="text-sm text-purple-700 dark:text-purple-300">
 {transactions?.filter((t: any) => t.category === 'Other' || t.category === 'other').length} uncategorized transactions detected. Let AI categorize them automatically!
 </p>
 </div>
 </div>
 <Button
 onClick={() => bulkCategorizeMutation.mutate()}
 disabled={bulkCategorizeMutation.isPending}
 className="bg-primary text-primary-foreground font-semibold flex-shrink-0"
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
 transactions?.length === 0 ? (
 <div className="text-center py-16">
 <div className="relative mb-10">
 <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl"></div>
 <div className="relative bg-blue-500 rounded-3xl p-6 w-32 h-32 mx-auto flex items-center justify-center shadow-2xl">
 <DollarSign className="h-16 w-16 text-white" />
 </div>
 </div>
 
 <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-3">
 Start Your Financial Journey
 </h3>
 <p className="text-muted-foreground text-lg mb-4 max-w-lg mx-auto">
 Track every dollar and watch your wealth grow with AI-powered insights
 </p>
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
 <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/50">
 <div className="w-12 h-12 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
 <BarChart3 className="h-6 w-6 text-white" />
 </div>
 <h4 className="font-bold mb-2 text-blue-800 dark:text-blue-200">Smart Insights</h4>
 <p className="text-sm text-blue-600 dark:text-blue-300">AI analyzes spending patterns</p>
 </div>
 
 <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-cyan-200/50 dark:border-cyan-700/50">
 <div className="w-12 h-12 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
 <Target className="h-6 w-6 text-white" />
 </div>
 <h4 className="font-bold mb-2 text-cyan-800 dark:text-cyan-200">Budget Tracking</h4>
 <p className="text-sm text-cyan-600 dark:text-cyan-300">Stay on top of spending goals</p>
 </div>
 
 <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-green-200/50 dark:border-green-700/50">
 <div className="w-12 h-12 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
 <TrendingUp className="h-6 w-6 text-white" />
 </div>
 <h4 className="font-bold mb-2 text-green-800 dark:text-green-200">Cash Flow</h4>
 <p className="text-sm text-green-600 dark:text-green-300">Visualize income vs expenses</p>
 </div>
 </div>
 
 <Button 
 data-testid="button-add-first-transaction"
 onClick={() => setIsCreateDialogOpen(true)}
 size="lg"
 className="bg-blue-500 text-white font-semibold px-8 h-14 text-lg shadow-lg transition-all"
 >
 <Plus size={20} className="mr-2" />
 Add Your First Transaction
 </Button>
 </div>
 ) : (
 <div className="text-center py-12">
 <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
 <h3 className="text-lg font-semibold mb-2">No transactions match your filters</h3>
 <p className="text-muted-foreground mb-6">
 Try adjusting your date range or category filters to see more transactions
 </p>
 </div>
 )
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
 {transaction.type ==="income" ?"+" :"-"}${Math.abs(parseFloat(transaction.amount)).toLocaleString()}
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

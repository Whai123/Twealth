import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Wallet, Download, Lightbulb, PiggyBank, Filter, X,
  Home, Car, Utensils, ShoppingBag, Heart, Zap, DollarSign,
  CreditCard, Briefcase, Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ResponsiveTransactionDialog } from "@/components/dialogs/responsive-transaction-dialog";
import { useUserCurrency } from "@/lib/userContext";

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
    shopping: <CreditCard className="w-4 h-4" />,
    gift: <Gift className="w-4 h-4" />,
    savings: <PiggyBank className="w-4 h-4" />,
    other: <Wallet className="w-4 h-4" />,
  };
  return icons[category?.toLowerCase()] || <DollarSign className="w-4 h-4" />;
};

// Quick tips data
const quickTips = [
  { title: "50/30/20 Rule", desc: "Needs, wants, savings" },
  { title: "Emergency Fund", desc: "3-6 months expenses" },
  { title: "Pay Yourself First", desc: "Auto-save 20%" },
];

export default function MoneyTracking() {
  const { formatAmount, currencySymbol } = useUserCurrency();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [timeRange, setTimeRange] = useState("30");
  const [showFilters, setShowFilters] = useState(false);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: () => fetch(`/api/transactions?limit=100`).then(res => res.json()),
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((t: any) => {
      const typeMatch = activeTab === 'all' || t.type === activeTab;
      const transactionDate = new Date(t.date);
      const daysAgo = new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
      const dateMatch = transactionDate >= daysAgo;
      return typeMatch && dateMatch;
    });
  }, [transactions, activeTab, timeRange]);

  // Calculate stats
  const { totalIncome, totalExpenses, netCashFlow, savingsRate } = useMemo(() => {
    const income = filteredTransactions
      .filter((t: any) => t.type === "income")
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
    const expenses = filteredTransactions
      .filter((t: any) => t.type === "expense")
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
    const net = income - expenses;
    const rate = income > 0 ? Math.round((net / income) * 100) : 0;
    return { totalIncome: income, totalExpenses: expenses, netCashFlow: net, savingsRate: rate };
  }, [filteredTransactions]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">My Money</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Track and manage your finances</p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-5 font-medium shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Main Content - Left Side (3 cols) */}
          <div className="lg:col-span-3 space-y-6">

            {/* Segmented Pill Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                {(['all', 'income', 'expense'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all capitalize ${activeTab === tab
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-zinc-200 dark:bg-zinc-700' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  <Filter className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </button>
                <button
                  onClick={() => {
                    const days = parseInt(timeRange);
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - days);
                    window.location.href = `/api/transactions/export?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
                  }}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Download className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Compact Filter Bar */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="w-[140px] h-9 text-sm border-zinc-200 dark:border-zinc-700 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 3 months</SelectItem>
                        <SelectItem value="365">Last year</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => { setTimeRange("30"); setActiveTab("all"); }}
                      className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      Clear
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* KPI Row - 4 Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Income */}
              <motion.div
                className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800"
                whileHover={{ y: -2, boxShadow: '0 8px 30px -12px rgba(0,0,0,0.1)' }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Income</span>
                </div>
                <p className="text-xl font-bold text-zinc-900 dark:text-white">{formatAmount(totalIncome)}</p>
              </motion.div>

              {/* Expenses */}
              <motion.div
                className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800"
                whileHover={{ y: -2, boxShadow: '0 8px 30px -12px rgba(0,0,0,0.1)' }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Expenses</span>
                </div>
                <p className="text-xl font-bold text-zinc-900 dark:text-white">{formatAmount(totalExpenses)}</p>
              </motion.div>

              {/* Net Cash Flow */}
              <motion.div
                className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800"
                whileHover={{ y: -2, boxShadow: '0 8px 30px -12px rgba(0,0,0,0.1)' }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${netCashFlow >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-rose-50 dark:bg-rose-900/30'}`}>
                    {netCashFlow >= 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                  </div>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Net Flow</span>
                </div>
                <p className={`text-xl font-bold ${netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {netCashFlow >= 0 ? '+' : ''}{formatAmount(netCashFlow)}
                </p>
              </motion.div>

              {/* Savings Rate */}
              <motion.div
                className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800"
                whileHover={{ y: -2, boxShadow: '0 8px 30px -12px rgba(0,0,0,0.1)' }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <PiggyBank className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Savings</span>
                </div>
                <p className="text-xl font-bold text-zinc-900 dark:text-white">{savingsRate}%</p>
              </motion.div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-white">Transactions</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{filteredTransactions.length} total</p>
              </div>

              {filteredTransactions.length === 0 ? (
                /* Empty State */
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-zinc-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">No transactions yet</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">
                    Start tracking your money by adding your first transaction.
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-6 font-medium"
                  >
                    Add your first transaction
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredTransactions.slice(0, 20).map((transaction: any, index: number) => (
                    <motion.div
                      key={transaction.id}
                      className="px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${transaction.type === 'income'
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}>
                            {getCategoryIcon(transaction.category)}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-white">{transaction.description || transaction.category}</p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">{transaction.category}</p>
                          </div>
                        </div>
                        <p className={`font-semibold text-right ${transaction.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-zinc-900 dark:text-white'
                          }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatAmount(parseFloat(transaction.amount))}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Quick Tips */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Quick Tips</h3>

            {quickTips.map((tip, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800"
                whileHover={{ y: -2, boxShadow: '0 8px 30px -12px rgba(0,0,0,0.1)' }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white text-sm">{tip.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{tip.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-200 rounded-2xl p-5 text-white dark:text-zinc-900">
              <p className="text-xs font-medium opacity-60 mb-2">This Month</p>
              <p className="text-2xl font-bold mb-1">{formatAmount(Math.abs(netCashFlow))}</p>
              <p className="text-sm opacity-70">{netCashFlow >= 0 ? 'Saved' : 'Over budget'}</p>
            </div>
          </div>
        </div>
      </main>

      <ResponsiveTransactionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}

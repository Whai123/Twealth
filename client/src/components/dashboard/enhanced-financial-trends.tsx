import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  ArrowUp,
  ArrowDown,
  BarChart3,
  PieChart,
  Activity,
  Zap
} from "lucide-react";

interface TrendData {
  label: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  status: 'up' | 'down' | 'neutral';
  category: 'income' | 'savings' | 'goals' | 'efficiency';
}

export default function EnhancedFinancialTrends() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: currentStats, isLoading: currentStatsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats", period],
    queryFn: () => fetch(`/api/dashboard/stats?period=${period}`).then(res => res.json()),
  });

  const { data: previousStats, isLoading: previousStatsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats", period, "previous"],
    queryFn: () => fetch(`/api/dashboard/stats?period=${period}&previous=true`).then(res => res.json()),
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: () => fetch("/api/transactions?limit=100").then(res => res.json()),
  });

  // Calculate trend data
  const getTrendData = (): TrendData[] => {
    if (!currentStats || !previousStats) return [];

    const trends: TrendData[] = [];
    
    // Total Savings Trend
    const currentSavings = (currentStats as any).totalSavings || 0;
    const previousSavings = (previousStats as any).totalSavings || 0;
    const savingsChange = currentSavings - previousSavings;
    const savingsChangePercent = previousSavings ? (savingsChange / previousSavings) * 100 : 0;
    
    trends.push({
      label: 'Total Savings',
      current: currentSavings,
      previous: previousSavings,
      change: savingsChange,
      changePercent: savingsChangePercent,
      status: savingsChange > 0 ? 'up' : savingsChange < 0 ? 'down' : 'neutral',
      category: 'savings'
    });

    // Active Goals Trend
    const currentGoals = parseInt((currentStats as any).activeGoals || "0");
    const previousGoals = parseInt((previousStats as any).activeGoals || "0");
    const goalsChange = currentGoals - previousGoals;
    const goalsChangePercent = previousGoals ? (goalsChange / previousGoals) * 100 : 0;
    
    trends.push({
      label: 'Active Goals',
      current: currentGoals,
      previous: previousGoals,
      change: goalsChange,
      changePercent: goalsChangePercent,
      status: goalsChange > 0 ? 'up' : goalsChange < 0 ? 'down' : 'neutral',
      category: 'goals'
    });

    return trends;
  };

  // Calculate spending insights
  const getSpendingInsights = () => {
    if (!transactions || !Array.isArray(transactions)) return null;
    
    const recentTransactions = transactions.filter((t: any) => {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return new Date(t.date) >= cutoff;
    });

    const totalIncome = recentTransactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const totalExpenses = recentTransactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Top spending categories
    const categorySpending = recentTransactions
      .filter((t: any) => t.type === 'expense')
      .reduce((acc: any, t: any) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
        return acc;
      }, {});

    const topCategories = Object.entries(categorySpending)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3);

    return {
      totalIncome,
      totalExpenses,
      savingsRate,
      topCategories,
      netCashFlow: totalIncome - totalExpenses
    };
  };

  // Loading state
  const isLoading = currentStatsLoading || previousStatsLoading || transactionsLoading;
  
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted rounded-lg" />
              <div className="h-5 bg-muted rounded w-32" />
            </div>
            <div className="flex gap-2">
              {[1,2,3].map(i => <div key={i} className="w-12 h-8 bg-muted rounded" />)}
            </div>
          </div>
          <div className="h-4 bg-muted rounded w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2].map(i => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="h-4 bg-muted rounded w-24 mb-3" />
                <div className="h-8 bg-muted rounded w-16 mb-2" />
                <div className="h-3 bg-muted rounded w-40" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-5 bg-muted rounded w-32" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="h-4 bg-muted rounded w-20 mb-2" />
                  <div className="h-6 bg-muted rounded w-12" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const trends = getTrendData();
  const spendingInsights = getSpendingInsights();

  const getTrendIcon = (status: string) => {
    switch (status) {
      case 'up':
        return <ArrowUp size={16} className="text-green-600" />;
      case 'down':
        return <ArrowDown size={16} className="text-red-600" />;
      default:
        return <Activity size={16} className="text-muted-foreground" />;
    }
  };

  const getTrendColor = (status: string) => {
    switch (status) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const periodLabels = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days'
  };

  return (
    <Card className="shadow-sm hover-lift">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-primary" size={18} />
            </div>
            <CardTitle className="text-lg font-semibold text-foreground">
              Financial Trends
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
                data-testid={`button-period-${p}`}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {periodLabels[period]} • Track your financial progress over time
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Trend Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trends.map((trend, index) => (
            <Card key={trend.label} className="p-4 border-l-4 border-l-indigo-500 bg-white dark:bg-gray-900 dark:from-indigo-950/20 dark:to-purple-950/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">{trend.label}</h4>
                <Badge 
                  variant={trend.status === 'up' ? 'default' : trend.status === 'down' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {trend.status === 'up' ? 'Growth' : trend.status === 'down' ? 'Decline' : 'Stable'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">
                    {trend.category === 'savings' ? '$' : ''}{trend.current.toLocaleString()}
                  </p>
                  <div className={`flex items-center gap-1 ${getTrendColor(trend.status)}`}>
                    {getTrendIcon(trend.status)}
                    <span className="text-sm font-medium">
                      {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {trend.change > 0 ? '+' : ''}{trend.category === 'savings' ? '$' : ''}{trend.change.toLocaleString()} vs previous period
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Spending Insights */}
        {spendingInsights ? (
          <div className="space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <PieChart size={16} className="text-indigo-600" />
              Spending Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Savings Rate */}
              <Card className="p-4 bg-white dark:bg-gray-900 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="text-green-600" size={16} />
                  <span className="text-sm font-medium">Savings Rate</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {spendingInsights.savingsRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {spendingInsights.savingsRate >= 15 ? 'Excellent!' : spendingInsights.savingsRate >= 10 ? 'Good' : 'Needs improvement'}
                </p>
              </Card>

              {/* Net Cash Flow */}
              <Card className={`p-4 border-2 ${spendingInsights.netCashFlow >= 0 ? 'bg-white dark:bg-gray-900 dark:from-blue-950/20 dark:to-sky-950/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-900 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className={spendingInsights.netCashFlow >= 0 ? "text-blue-600" : "text-red-600"} size={16} />
                  <span className="text-sm font-medium">Net Cash Flow</span>
                </div>
                <p className={`text-2xl font-bold ${spendingInsights.netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ${Math.abs(spendingInsights.netCashFlow).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {spendingInsights.netCashFlow >= 0 ? 'Positive flow' : 'Spending exceeds income'}
                </p>
              </Card>

              {/* Top Spending */}
              <Card className="p-4 bg-white dark:bg-gray-900 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="text-orange-600" size={16} />
                  <span className="text-sm font-medium">Top Category</span>
                </div>
                {spendingInsights.topCategories.length > 0 ? (
                  <>
                    <p className="text-lg font-bold text-orange-600 capitalize">
                      {spendingInsights.topCategories[0][0]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${(spendingInsights.topCategories[0][1] as number).toLocaleString()} spent
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No expenses recorded</p>
                )}
              </Card>
            </div>

            {/* Top Categories List */}
            {spendingInsights.topCategories.length > 0 && (
              <Card className="p-4">
                <h4 className="font-medium text-sm mb-3">Top Spending Categories</h4>
                <div className="space-y-2">
                  {spendingInsights.topCategories.map(([category, amount], index) => {
                    const percentage = spendingInsights.totalExpenses > 0 
                      ? ((amount as number) / spendingInsights.totalExpenses) * 100 
                      : 0;
                    
                    return (
                      <div key={category} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-orange-500' : index === 1 ? 'bg-blue-500' : 'bg-purple-500'}`} />
                          <span className="text-sm capitalize">{category}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">${(amount as number).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <PieChart size={32} className="mx-auto mb-2 opacity-50" />
            <p className="font-medium">No spending data available</p>
            <p className="text-sm">Add some transactions to see spending insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays } from "date-fns";

interface AdvancedSpendingAnalyticsProps {
  transactions: any[];
  timeRange: string;
}

export default function AdvancedSpendingAnalytics({ transactions, timeRange }: AdvancedSpendingAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');

  // Calculate spending by category
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const categorySpending = expenseTransactions.reduce((acc: any, transaction) => {
    const category = transaction.category || 'other';
    acc[category] = (acc[category] || 0) + parseFloat(transaction.amount);
    return acc;
  }, {});

  const totalExpenses = Object.values(categorySpending).reduce((sum: number, amount: any) => sum + amount, 0);
  const sortedCategories = Object.entries(categorySpending)
    .sort(([,a]: any, [,b]: any) => b - a)
    .slice(0, 6);

  // Guard against division by zero
  const safeTotalExpenses = Math.max(totalExpenses, 0.01);

  // Calculate monthly trends
  const now = new Date();
  const currentMonth = startOfMonth(now);
  const lastMonth = startOfMonth(subMonths(now, 1));
  
  const currentMonthExpenses = expenseTransactions
    .filter(t => new Date(t.date) >= currentMonth)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const lastMonthExpenses = expenseTransactions
    .filter(t => {
      const date = new Date(t.date);
      return date >= lastMonth && date < currentMonth;
    })
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const monthlyChange = lastMonthExpenses > 0 
    ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
    : 0;

  // Calculate daily average
  const daysInPeriod = parseInt(timeRange);
  const dailyAverage = totalExpenses / daysInPeriod;

  // Get spending velocity (spending rate)
  const recentDays = 7;
  const recentExpenses = expenseTransactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      const daysAgo = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
      return transactionDate >= daysAgo;
    })
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const weeklyVelocity = recentExpenses / recentDays;
  const velocityChange = weeklyVelocity > dailyAverage ? 'increasing' : 'stable';

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-red-500',
      'bg-orange-500', 
      'bg-yellow-500',
      'bg-green-500',
      'bg-blue-500',
      'bg-purple-500'
    ];
    return colors[index % colors.length];
  };

  const getCategoryIcon = (category: string) => {
    const icons: any = {
      rent: '🏠',
      utilities: '',
      groceries: '🛒',
      dining: '🍽️',
      transport: '🚗',
      healthcare: '🏥',
      entertainment: '🎬',
      shopping: '🛍️',
      other: ''
    };
    return icons[category] || '';
  };

  return (
    <div className="space-y-6">
      {/* Spending Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Change</p>
              <p className={`text-2xl font-bold ${monthlyChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {monthlyChange >= 0 ? '+' : ''}{monthlyChange.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                vs last month
              </p>
            </div>
            <div className={`w-12 h-12 ${monthlyChange >= 0 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'} rounded-lg flex items-center justify-center`}>
              {monthlyChange >= 0 ? (
                <ArrowUpRight className="text-red-600" size={24} />
              ) : (
                <ArrowDownRight className="text-green-600" size={24} />
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Daily Average</p>
              <p className="text-2xl font-bold text-blue-600">
                ${dailyAverage.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                last {timeRange} days
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Spending Velocity</p>
              <p className="text-2xl font-bold text-orange-600">
                ${weeklyVelocity.toFixed(0)}/day
              </p>
              <Badge 
                variant={velocityChange === 'increasing' ? 'destructive' : 'secondary'}
                className="mt-1"
              >
                {velocityChange === 'increasing' ? 'High' : 'Stable'}
              </Badge>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <PieChart className="mr-2" size={20} />
            Spending by Category
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="space-y-4">
            {sortedCategories.map(([category, amount]: any, index) => {
              const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getCategoryIcon(category)}</span>
                      <span className="font-medium capitalize">
                        {category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2"
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Spending Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2" size={20} />
              Top Spending Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-3">
              {sortedCategories.slice(0, 3).map(([category, amount]: any, index) => (
                <div key={category} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 ${getCategoryColor(index)} rounded-full mr-3`}></div>
                    <div>
                      <p className="font-medium capitalize">{category.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        {totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0}% of spending
                      </p>
                    </div>
                  </div>
                  <p className="font-bold">${amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center">
              <Target className="mr-2" size={20} />
              Spending Health
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="text-green-600 mr-3" size={20} />
                  <div>
                    <p className="font-medium">Consistent Spending</p>
                    <p className="text-sm text-muted-foreground">Good weekly patterns</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20">
                  Healthy
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="text-yellow-600 mr-3" size={20} />
                  <div>
                    <p className="font-medium">High Dining Expenses</p>
                    <p className="text-sm text-muted-foreground">Consider meal planning</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20">
                  Watch
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="text-blue-600 mr-3" size={20} />
                  <div>
                    <p className="font-medium">Savings Opportunity</p>
                    <p className="text-sm text-muted-foreground">Reduce entertainment by 15%</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20">
                  Opportunity
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
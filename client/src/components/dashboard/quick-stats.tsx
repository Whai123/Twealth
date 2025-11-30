import { memo } from 'react';
import { useQuery } from"@tanstack/react-query";
import { Card, CardContent } from"@/components/ui/card";
import { PiggyBank, TrendingUp, DollarSign, Wallet, ArrowUpCircle, ArrowDownCircle, TrendingDown, Minus } from"lucide-react";
import { UserPreferences } from"@shared/schema";
import { SkeletonStat } from"@/components/ui/skeleton";
import Sparkline from"@/components/ui/sparkline";
import { useLocation } from"wouter";

function QuickStats() {
 const [, setLocation] = useLocation();
 
 const { data: stats, isLoading: statsLoading } = useQuery({
  queryKey: ["/api/dashboard/stats"],
 });

 const { data: financialHealth, isLoading: healthLoading } = useQuery({
  queryKey: ["/api/financial-health"],
 });
 
 const { data: transactions } = useQuery({
  queryKey: ["/api/transactions"],
 });

 if (statsLoading || healthLoading) {
  return (
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
    {[...Array(4)].map((_, i) => (
     <SkeletonStat key={i} />
    ))}
   </div>
  );
 }

 // Real financial data - use same calculation as Financial Health Service
 const totalSavings = (stats as any)?.totalSavings || 0;
 const monthlyIncome = (stats as any)?.monthlyIncome || 0;
 
 // Calculate actual monthly expenses from last 30 days of transactions (same as financialHealthService.ts)
 const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
 const transactionList = Array.isArray(transactions) ? transactions : [];
 const recentExpenses = transactionList
  .filter((t: any) => t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo)
  .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
 
 const monthlyExpenses = recentExpenses;
 const monthlySavingsCapacity = monthlyIncome - monthlyExpenses;
 const savingsRate = monthlyIncome > 0 ? ((monthlySavingsCapacity / monthlyIncome) * 100) : 0;
 
 // Generate 7-day sparkline data for each metric
 const generateSparklineData = (type: 'savings' | 'income' | 'expenses' | 'capacity') => {
  const data: number[] = [];
  const now = new Date();
  
  // For savings, calculate cumulative net worth at end of each day
  if (type === 'savings') {
    for (let i = 6; i >= 0; i--) {
      const dayEnd = new Date(now);
      dayEnd.setDate(dayEnd.getDate() - i);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Calculate net worth as of that day (all transactions up to that point)
      const transactionsUpToDay = transactionList.filter((t: any) => {
        const tDate = new Date(t.date);
        return tDate <= dayEnd;
      });
      
      const netWorth = transactionsUpToDay.reduce((sum: number, t: any) => {
        const amount = parseFloat(t.amount);
        return sum + (t.type === 'income' ? amount : -amount);
      }, 0);
      
      data.push(netWorth); // Allow negative values to show true financial state
    }
  } else {
    // For income, expenses, capacity - daily values
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayTransactions = transactionList.filter((t: any) => {
        const tDate = new Date(t.date);
        return tDate >= dayStart && tDate <= dayEnd;
      });
      
      if (type === 'income') {
        const dayIncome = dayTransactions
          .filter((t: any) => t.type === 'income')
          .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
        data.push(dayIncome);
      } else if (type === 'expenses') {
        const dayExpenses = dayTransactions
          .filter((t: any) => t.type === 'expense')
          .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
        data.push(dayExpenses);
      } else if (type === 'capacity') {
        const dayIncome = dayTransactions
          .filter((t: any) => t.type === 'income')
          .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
        const dayExpenses = dayTransactions
          .filter((t: any) => t.type === 'expense')
          .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
        data.push(dayIncome - dayExpenses);
      }
    }
  }
  
  return data.length > 0 ? data : [0, 0, 0, 0, 0, 0, 0];
 };
 
 // Calculate 7-day trends with proper handling of all scenarios
 const calculateTrend = (sparklineData: number[]) => {
  if (sparklineData.length < 2) return { direction: 'neutral' as const, percent: 0 };
  
  const recent = sparklineData.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const older = sparklineData.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const absoluteChange = recent - older;
  const epsilon = 0.01;
  
  // Handle near-zero baseline (both positive and negative)
  if (Math.abs(older) < epsilon) {
    if (Math.abs(recent) < epsilon) {
      // Both near zero = neutral
      return { direction: 'neutral' as const, percent: 0 };
    } else if (recent > epsilon) {
      // Starting from zero, now positive = upward trend
      const magnitude = Math.min(Math.abs(recent), 1000);
      return { direction: 'up' as const, percent: magnitude };
    } else if (recent < -epsilon) {
      // Starting from zero, now negative = downward trend
      const magnitude = Math.min(Math.abs(recent), 1000);
      return { direction: 'down' as const, percent: magnitude };
    }
  }
  
  // Normal case: calculate percentage change based on absolute value of baseline
  const percentChange = (absoluteChange / Math.abs(older)) * 100;
  
  // Direction is based on whether we're getting better or worse
  // For negative values: -2000 → -500 is UP (recovery)
  // For positive values: 1000 → 2000 is UP (growth)
  const direction = absoluteChange > 1 ? 'up' as const : 
                    absoluteChange < -1 ? 'down' as const : 
                    'neutral' as const;
  
  return {
    direction,
    percent: Math.min(Math.abs(percentChange), 999) // Cap at 999% for display
  };
 };
 
 // Generate sparkline and trend data for each metric
 const savingsSparkline = generateSparklineData('savings');
 const incomeSparkline = generateSparklineData('income');
 const expensesSparkline = generateSparklineData('expenses');
 const capacitySparkline = generateSparklineData('capacity');
 
 const savingsTrend = calculateTrend(savingsSparkline);
 const incomeTrend = calculateTrend(incomeSparkline);
 const expensesTrend = calculateTrend(expensesSparkline);
 const capacityTrend = calculateTrend(capacitySparkline);
 
 const statCards = [
  {
   title:"Total Savings",
   value: `$${totalSavings.toLocaleString()}`,
   subtext:"Current net worth",
   insight: savingsTrend.direction === 'up' ? "Net worth growing steadily!" : savingsTrend.direction === 'down' ? "Review recent expenses." : "Track your progress daily.",
   icon: PiggyBank,
   iconBg:"bg-green-100 dark:bg-green-900/20",
   iconColor:"text-green-600 dark:text-green-300",
   valueColor:"text-green-600 dark:text-green-400",
   sparklineData: savingsSparkline,
   sparklineColor: savingsTrend.direction === 'down' ? 'red' as const : 'green' as const,
   trend: savingsTrend,
   badge: totalSavings >= 10000 ?"Excellent" : totalSavings >= 5000 ?"Good" : totalSavings >= 1000 ?"Building" :"Start Now",
   onClick: () => setLocation('/money')
  },
  {
   title:"Monthly Income",
   value: `$${monthlyIncome.toLocaleString()}`,
   subtext:"Earnings per month",
   insight: incomeTrend.direction === 'up' ? "Income trending upward" : incomeTrend.direction === 'down' ? "Income decreased recently" : "Income stable this week",
   icon: ArrowUpCircle,
   iconBg:"bg-blue-100 dark:bg-blue-900/20",
   iconColor:"text-blue-600 dark:text-blue-300",
   valueColor:"text-blue-600 dark:text-blue-400",
   sparklineData: incomeSparkline,
   sparklineColor: 'blue' as const,
   trend: incomeTrend,
   badge: monthlyIncome > 0 ?"Active" :"Set Income",
   onClick: () => setLocation('/money?filter=income')
  },
  {
   title:"Monthly Expenses",
   value: `$${monthlyExpenses.toLocaleString()}`,
   subtext:"Spending per month",
   insight: expensesTrend.direction === 'down' ? "Spending decreased - nice work!" : expensesTrend.direction === 'up' ? "Spending increased recently" : "Spending stable this week",
   icon: ArrowDownCircle,
   iconBg:"bg-orange-100 dark:bg-orange-900/20",
   iconColor:"text-orange-600 dark:text-orange-300",
   valueColor:"text-orange-600 dark:text-orange-400",
   sparklineData: expensesSparkline,
   sparklineColor: expensesTrend.direction === 'down' ? 'green' as const : 'red' as const,
   trend: expensesTrend,
   badge: monthlyExpenses > 0 ? (monthlyExpenses < monthlyIncome ?"Healthy" :"Review") :"Track Expenses",
   onClick: () => setLocation('/money?filter=expense')
  },
  {
   title:"Savings Capacity",
   value: `$${monthlySavingsCapacity.toLocaleString()}`,
   subtext: `${savingsRate.toFixed(1)}% savings rate`,
   insight: savingsRate >= 20 ? "Excellent! Consider investing." : savingsRate >= 10 ? "Good progress. Aim higher!" : monthlySavingsCapacity > 0 ? "Build your savings buffer." : "Review expenses to improve.",
   icon: Wallet,
   iconBg: monthlySavingsCapacity > 0 ?"bg-blue-100 dark:bg-blue-900/20" :"bg-red-100 dark:bg-red-900/20",
   iconColor: monthlySavingsCapacity > 0 ?"text-blue-600 dark:text-blue-300" :"text-red-600 dark:text-red-300",
   valueColor: monthlySavingsCapacity > 0 ?"text-blue-600 dark:text-blue-400" :"text-red-600 dark:text-red-400",
   sparklineData: capacitySparkline,
   sparklineColor: monthlySavingsCapacity > 0 ? 'blue' as const : 'red' as const,
   trend: capacityTrend,
   badge: monthlySavingsCapacity > 0 ? (savingsRate >= 20 ?"Excellent" : savingsRate >= 10 ?"Good" :"Fair") :"Deficit",
   onClick: () => setLocation('/budgets')
  }
 ];

 return (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
   {statCards.map((stat, index) => (
    <Card 
     key={index} 
     className="card-interactive cursor-pointer touch-target bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 md:p-6" 
     onClick={stat.onClick}
     data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
     role="button"
     tabIndex={0}
     onKeyDown={(e) => {
       if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         stat.onClick();
       }
     }}
    >
     <CardContent className="p-0 space-y-4">
      {/* Header with icon and badge */}
      <div className="flex items-start justify-between gap-3">
       <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
         <p 
          className="text-sm text-gray-600 dark:text-gray-400 font-medium" 
          data-testid={`text-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
         >
          {stat.title}
         </p>
         {stat.badge && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium border border-gray-200 dark:border-gray-600">
           {stat.badge}
          </span>
         )}
        </div>
        
        {/* Trend indicator */}
        {stat.trend && stat.trend.percent > 0 && (
         <div className={`flex items-center gap-1 text-xs ${
           stat.trend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 
           stat.trend.direction === 'down' ? 'text-red-600 dark:text-red-400' : 
           'text-gray-600 dark:text-gray-400'
         }`}>
          {stat.trend.direction === 'up' && <TrendingUp size={12} />}
          {stat.trend.direction === 'down' && <TrendingDown size={12} />}
          {stat.trend.direction === 'neutral' && <Minus size={12} />}
          <span className="font-medium">{stat.trend.percent.toFixed(1)}% (7d)</span>
         </div>
        )}
       </div>
       <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
        <stat.icon className={stat.iconColor} size={18} />
       </div>
      </div>
      
      {/* Value */}
      <div>
       <p 
        className={`headline-card ${stat.valueColor} mb-1`}
        data-testid={`value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
       >
        {stat.value}
       </p>
       <p className="text-xs text-gray-600 dark:text-gray-400">
        {stat.subtext}
       </p>
      </div>
      
      {/* Sparkline */}
      {stat.sparklineData && stat.sparklineData.length > 0 && (
       <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <Sparkline 
         data={stat.sparklineData} 
         color={stat.sparklineColor} 
         className="h-8 w-full"
        />
       </div>
      )}
      
      {/* Contextual insight */}
      {stat.insight && (
       <p className="text-xs text-gray-600 dark:text-gray-400 italic pt-1">
        {stat.insight}
       </p>
      )}
     </CardContent>
    </Card>
   ))}
  </div>
 );
}

// Export with React.memo for mobile performance optimization
export default memo(QuickStats);

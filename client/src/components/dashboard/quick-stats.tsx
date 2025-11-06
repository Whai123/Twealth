import { memo } from 'react';
import { useQuery } from"@tanstack/react-query";
import { Card, CardContent } from"@/components/ui/card";
import { PiggyBank, TrendingUp, DollarSign, Wallet, ArrowUpCircle, ArrowDownCircle } from"lucide-react";
import { UserPreferences } from"@shared/schema";
import { SkeletonStat } from"@/components/ui/skeleton";

function QuickStats() {
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
 
 const statCards = [
  {
   title:"Total Savings",
   value: `$${totalSavings.toLocaleString()}`,
   subtext:"Current net worth",
   icon: PiggyBank,
   iconBg:"bg-green-100 dark:bg-green-900/20",
   iconColor:"text-green-600 dark:text-green-300",
   valueColor:"text-green-600",
   badge: totalSavings >= 10000 ?"Excellent" : totalSavings >= 5000 ?"Good" : totalSavings >= 1000 ?"Building" :"Start Now"
  },
  {
   title:"Monthly Income",
   value: `$${monthlyIncome.toLocaleString()}`,
   subtext:"Earnings per month",
   icon: ArrowUpCircle,
   iconBg:"bg-blue-100 dark:bg-blue-900/20",
   iconColor:"text-blue-600 dark:text-blue-300",
   valueColor:"text-blue-600",
   badge: monthlyIncome > 0 ?"Active" :"Set Income"
  },
  {
   title:"Monthly Expenses",
   value: `$${monthlyExpenses.toLocaleString()}`,
   subtext:"Spending per month",
   icon: ArrowDownCircle,
   iconBg:"bg-orange-100 dark:bg-orange-900/20",
   iconColor:"text-orange-600 dark:text-orange-300",
   valueColor:"text-orange-600",
   badge: monthlyExpenses > 0 ? (monthlyExpenses < monthlyIncome ?"Healthy" :"Review") :"Track Expenses"
  },
  {
   title:"Savings Capacity",
   value: `$${monthlySavingsCapacity.toLocaleString()}`,
   subtext: `${savingsRate.toFixed(1)}% savings rate`,
   icon: Wallet,
   iconBg: monthlySavingsCapacity > 0 ?"bg-purple-100 dark:bg-purple-900/20" :"bg-red-100 dark:bg-red-900/20",
   iconColor: monthlySavingsCapacity > 0 ?"text-purple-600 dark:text-purple-300" :"text-red-600 dark:text-red-300",
   valueColor: monthlySavingsCapacity > 0 ?"text-purple-600" :"text-red-600",
   badge: monthlySavingsCapacity > 0 ? (savingsRate >= 20 ?"Excellent" : savingsRate >= 10 ?"Good" :"Fair") :"Deficit"
  }
 ];

 return (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
   {statCards.map((stat, index) => (
    <Card 
     key={index} 
     className="group transition-all hover:shadow-lg p-4 md:p-6" 
     style={{ animationDelay: `${index * 50}ms` }}
     data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
    >
     <CardContent className="p-0">
      <div className="flex items-center justify-between gap-4">
       <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-3">
         <p 
          className="text-sm text-muted-foreground font-medium" 
          data-testid={`text-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
         >
          {stat.title}
         </p>
         {stat.badge && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
           {stat.badge}
          </span>
         )}
        </div>
        <p 
         className={`text-2xl font-bold ${stat.valueColor} mb-1`}
         data-testid={`value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
        >
         {stat.value}
        </p>
        <p className="text-xs text-muted-foreground">
         {stat.subtext}
        </p>
       </div>
       <div className={`w-12 h-12 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
        <stat.icon className={stat.iconColor} size={20} />
       </div>
      </div>
     </CardContent>
    </Card>
   ))}
  </div>
 );
}

// Export with React.memo for mobile performance optimization
export default memo(QuickStats);

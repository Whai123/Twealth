import { memo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { PiggyBank, TrendingUp, DollarSign, Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { UserPreferences } from "@shared/schema";

function QuickStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ['/api/user-preferences'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 md:p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Real financial data
  const totalSavings = (stats as any)?.totalSavings || 0;
  const monthlyIncome = (stats as any)?.monthlyIncome || 0;
  const monthlyExpenses = parseFloat((preferences as any)?.monthlyExpensesEstimate || '0');
  const monthlySavingsCapacity = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? ((monthlySavingsCapacity / monthlyIncome) * 100) : 0;
  
  const statCards = [
    {
      title: "Total Savings",
      value: `$${totalSavings.toLocaleString()}`,
      subtext: "Current net worth",
      icon: PiggyBank,
      iconBg: "bg-green-100 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-300",
      valueColor: "text-green-600",
      badge: totalSavings >= 10000 ? "Excellent" : totalSavings >= 5000 ? "Good" : totalSavings >= 1000 ? "Building" : "Start Now"
    },
    {
      title: "Monthly Income",
      value: `$${monthlyIncome.toLocaleString()}`,
      subtext: "Earnings per month",
      icon: ArrowUpCircle,
      iconBg: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-300",
      valueColor: "text-blue-600",
      badge: monthlyIncome > 0 ? "Active" : "Set Income"
    },
    {
      title: "Monthly Expenses",
      value: `$${monthlyExpenses.toLocaleString()}`,
      subtext: "Spending per month",
      icon: ArrowDownCircle,
      iconBg: "bg-orange-100 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-300",
      valueColor: "text-orange-600",
      badge: monthlyExpenses > 0 ? (monthlyExpenses < monthlyIncome ? "Healthy" : "Review") : "Track Expenses"
    },
    {
      title: "Savings Capacity",
      value: `$${monthlySavingsCapacity.toLocaleString()}`,
      subtext: `${savingsRate.toFixed(1)}% savings rate`,
      icon: Wallet,
      iconBg: monthlySavingsCapacity > 0 ? "bg-purple-100 dark:bg-purple-900/20" : "bg-red-100 dark:bg-red-900/20",
      iconColor: monthlySavingsCapacity > 0 ? "text-purple-600 dark:text-purple-300" : "text-red-600 dark:text-red-300",
      valueColor: monthlySavingsCapacity > 0 ? "text-purple-600" : "text-red-600",
      badge: monthlySavingsCapacity > 0 ? (savingsRate >= 20 ? "Excellent" : savingsRate >= 10 ? "Good" : "Fair") : "Deficit"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {statCards.map((stat, index) => (
        <Card 
          key={index} 
          className="group transition-all duration-300 hover:shadow-lg p-4 md:p-6" 
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

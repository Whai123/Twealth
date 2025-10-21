import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MonthlyProgressChart() {
  const [period, setPeriod] = useState("6months");
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });
  
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });
  
  const monthlyTarget = Math.max(parseFloat((stats as any)?.monthlyIncome || "5000"), 5000);
  
  const monthsToShow = period === "12months" ? 12 : period === "year" ? 12 : 6;
  
  const generateMonthlyData = () => {
    const now = new Date();
    const months = [];
    const monthlyIncome: Record<string, number> = {};
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
      months.push({ key: monthKey, label: monthLabel, date });
      monthlyIncome[monthKey] = 0;
    }
    
    if (Array.isArray(transactions)) {
      transactions.forEach((transaction: any) => {
        if (transaction.type === 'income') {
          const transactionDate = new Date(transaction.date);
          const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
          if (monthlyIncome.hasOwnProperty(monthKey)) {
            monthlyIncome[monthKey] += parseFloat(transaction.amount);
          }
        }
      });
    }
    
    return months.map((month, index) => ({
      month: month.label,
      income: Math.round(monthlyIncome[month.key]),
      target: monthlyTarget,
      projected: index === months.length - 1 && month.date.getMonth() === now.getMonth(),
    }));
  };
  
  const monthlyData = isLoading ? [] : generateMonthlyData();
  const maxValue = Math.max(monthlyTarget, ...monthlyData.map(d => d.income), 1);
  const currentMonth = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : { month: "Now", income: 0, target: monthlyTarget };

  if (isLoading) {
    return (
      <Card className="p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-muted/20 rounded-lg mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-sm">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Monthly Financial Progress</CardTitle>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Chart Area */}
        <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center relative overflow-hidden">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-4 text-xs text-muted-foreground space-y-8">
            <div>$6k</div>
            <div>$4k</div>
            <div>$2k</div>
            <div>$0</div>
          </div>
          
          {/* Chart bars */}
          <div className="flex items-end justify-center space-x-6 h-full pt-8 pl-12 pr-4 pb-8">
            {monthlyData.map((data, index) => {
              const height = Math.max((data.income / maxValue) * 100, 5); // Ensure minimum visible height
              const isProjected = data.projected;
              
              return (
                <div key={data.month} className="flex flex-col items-center h-full justify-end">
                  <div 
                    className={`w-8 rounded-t transition-all duration-300 min-h-[8px] ${
                      isProjected 
                        ? "bg-primary/60 border-2 border-primary border-dashed" 
                        : "bg-primary"
                    }`}
                    style={{ 
                      height: `${height}%`,
                      minHeight: '8px'
                    }}
                    title={`${data.month}: $${data.income.toLocaleString()}`}
                    data-testid={`chart-bar-${data.month.toLowerCase()}`}
                  />
                </div>
              );
            })}
          </div>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-12 right-4 flex justify-between text-xs text-muted-foreground">
            {monthlyData.map((data) => (
              <span key={data.month}>{data.month}</span>
            ))}
          </div>
          
          {/* Chart Legend */}
          <div className="absolute top-4 right-4 flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-primary rounded"></div>
              <span className="text-muted-foreground">Income</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 border-2 border-primary border-dashed rounded"></div>
              <span className="text-muted-foreground">Target</span>
            </div>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-lg font-semibold text-foreground" data-testid="text-current-month-income">
              ${currentMonth.income.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Monthly Target</p>
            <p className="text-lg font-semibold text-foreground" data-testid="text-monthly-target">
              ${currentMonth.target.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-lg font-semibold text-primary" data-testid="text-remaining-target">
              ${(currentMonth.target - currentMonth.income).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

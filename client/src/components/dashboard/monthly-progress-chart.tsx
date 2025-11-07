import { useState } from"react";
import { useQuery } from"@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function MonthlyProgressChart() {
 const [period, setPeriod] = useState("6months");
 
 const { data: transactions, isLoading } = useQuery({
  queryKey: ["/api/transactions"],
 });
 
 const { data: stats } = useQuery({
  queryKey: ["/api/dashboard/stats"],
 });
 
 const monthlyTarget = Math.max(parseFloat((stats as any)?.monthlyIncome ||"5000"), 5000);
 
 const monthsToShow = period ==="12months" ? 12 : period ==="year" ? 12 : 6;
 
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
 const currentMonth = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : { month:"Now", income: 0, target: monthlyTarget };

 if (isLoading) {
  return (
   <Card className="p-6 shadow-sm">
    <div>
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
    {/* Beautiful Recharts Visualization */}
    <div className="h-80">
     <ResponsiveContainer width="100%" height="100%">
      <BarChart 
       data={monthlyData} 
       margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
       <defs>
        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
         <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
         <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.9}/>
        </linearGradient>
        <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
         <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
         <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0.6}/>
        </linearGradient>
       </defs>
       <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
       <XAxis 
        dataKey="month" 
        tick={{ fill: '#6b7280', fontSize: 12 }}
        tickLine={false}
       />
       <YAxis 
        tick={{ fill: '#6b7280', fontSize: 12 }}
        tickLine={false}
        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
       />
       <Tooltip 
        contentStyle={{ 
         backgroundColor: 'rgba(255, 255, 255, 0.95)', 
         border: '1px solid #e5e7eb',
         borderRadius: '8px',
         boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
        formatter={(value: any) => [`$${value.toLocaleString()}`, '']}
        labelStyle={{ fontWeight: 600, marginBottom: 4 }}
       />
       <Legend 
        wrapperStyle={{ paddingTop: 20 }}
        iconType="square"
       />
       <Bar 
        dataKey="income" 
        name="Income" 
        fill="url(#colorIncome)" 
        radius={[8, 8, 0, 0]}
        animationDuration={1000}
        data-testid="chart-bar-income"
       />
       <Bar 
        dataKey="target" 
        name="Target" 
        fill="url(#colorTarget)" 
        radius={[8, 8, 0, 0]}
        animationDuration={1000}
        fillOpacity={0.7}
        data-testid="chart-bar-target"
       />
      </BarChart>
     </ResponsiveContainer>
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

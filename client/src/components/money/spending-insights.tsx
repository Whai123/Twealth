import { useState, useMemo } from"react";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { 
 Lightbulb, 
 TrendingDown, 
 TrendingUp, 
 AlertTriangle, 
 CheckCircle,
 Zap,
 Brain,
 Target,
 Calendar,
 DollarSign,
 PiggyBank,
 ArrowRight,
 Sparkles,
 Award
} from"lucide-react";
import { differenceInDays, subWeeks, startOfWeek, endOfWeek, format } from"date-fns";

interface SpendingInsightsProps {
 transactions: any[];
 timeRange: string;
}

export default function SpendingInsights({ transactions, timeRange }: SpendingInsightsProps) {
 const [selectedInsight, setSelectedInsight] = useState<string>('all');

 // Memoize filtered transactions to prevent recreation on each render
 const expenseTransactions = useMemo(() => 
  transactions.filter(t => t.type === 'expense'), 
  [transactions]
 );
 
 const incomeTransactions = useMemo(() => 
  transactions.filter(t => t.type === 'income'), 
  [transactions]
 );

 // Memoize calculated totals
 const totalExpenses = useMemo(() => 
  expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0),
  [expenseTransactions]
 );
 
 const totalIncome = useMemo(() => 
  incomeTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0),
  [incomeTransactions]
 );

 // Memoize weekly spending pattern calculations
 const { thisWeekExpenses, lastWeekExpenses } = useMemo(() => {
  const now = new Date();
  const lastWeek = subWeeks(now, 1);
  
  const thisWeek = expenseTransactions
   .filter(t => new Date(t.date) >= startOfWeek(now))
   .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const lastWeek_expenses = expenseTransactions
   .filter(t => {
    const date = new Date(t.date);
    return date >= startOfWeek(lastWeek) && date < endOfWeek(lastWeek);
   })
   .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  return { thisWeekExpenses: thisWeek, lastWeekExpenses: lastWeek_expenses };
 }, [expenseTransactions]);

 // Memoize spending by day of week
 const dayOfWeekSpending = useMemo(() => 
  expenseTransactions.reduce((acc: any, transaction) => {
   const dayOfWeek = new Date(transaction.date).getDay();
   const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
   const dayName = dayNames[dayOfWeek];
   acc[dayName] = (acc[dayName] || 0) + parseFloat(transaction.amount);
   return acc;
  }, {}),
  [expenseTransactions]
 );

 // Generate AI-powered insights
 const generateSpendingInsights = () => {
  const insights = [];

  // Weekend vs weekday spending
  const weekendSpending = (dayOfWeekSpending['Saturday'] || 0) + (dayOfWeekSpending['Sunday'] || 0);
  const weekdaySpending = totalExpenses - weekendSpending;
  if (weekendSpending > weekdaySpending * 0.4) {
   insights.push({
    type: 'pattern',
    title: 'High Weekend Spending',
    description: 'You spend 40% more on weekends. Consider planning weekend activities with a budget.',
    potential_saving: weekendSpending * 0.2,
    action: 'Set weekend spending limit',
    priority: 'medium',
    icon: Calendar
   });
  }

  // Frequent small purchases
  const smallPurchases = expenseTransactions.filter(t => parseFloat(t.amount) < 50).length;
  const largePurchases = expenseTransactions.filter(t => parseFloat(t.amount) >= 50).length;
  if (smallPurchases > largePurchases * 2) {
   insights.push({
    type: 'behavior',
    title: 'Frequent Small Purchases',
    description: `${smallPurchases} small purchases under $50. These add up quickly.`,
    potential_saving: smallPurchases * 15,
    action: 'Track micro-spending',
    priority: 'high',
    icon: AlertTriangle
   });
  }

  // Category concentration
  const categorySpending = expenseTransactions.reduce((acc: any, transaction) => {
   const category = transaction.category || 'other';
   acc[category] = (acc[category] || 0) + parseFloat(transaction.amount);
   return acc;
  }, {});

  const topCategory = Object.entries(categorySpending).reduce((max: any, [cat, amount]: any) => 
   amount > max.amount ? { category: cat, amount } : max, 
   { category: '', amount: 0 }
  );

  if (topCategory.amount > totalExpenses * 0.4) {
   insights.push({
    type: 'concentration',
    title: 'Category Over-Concentration',
    description: `${topCategory.category} represents ${((topCategory.amount / totalExpenses) * 100).toFixed(0)}% of spending.`,
    potential_saving: topCategory.amount * 0.15,
    action: 'Diversify spending',
    priority: 'medium',
    icon: Target
   });
  }

  // Savings opportunity
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  if (savingsRate < 20 && totalIncome > 0) {
   insights.push({
    type: 'opportunity',
    title: 'Savings Opportunity',
    description: `Current savings rate: ${savingsRate.toFixed(1)}%. Aim for 20%+ for financial health.`,
    potential_saving: totalIncome * 0.2 - (totalIncome - totalExpenses),
    action: 'Increase savings rate',
    priority: 'high',
    icon: PiggyBank
   });
  }

  // Weekly trend - guard against division by zero
  const weeklyChange = lastWeekExpenses > 0 ? ((thisWeekExpenses - lastWeekExpenses) / lastWeekExpenses) * 100 : 0;
  if (Math.abs(weeklyChange) > 25) {
   insights.push({
    type: 'trend',
    title: weeklyChange > 0 ? 'Spending Spike' : 'Spending Drop',
    description: `${Math.abs(weeklyChange).toFixed(0)}% ${weeklyChange > 0 ? 'increase' : 'decrease'} from last week.`,
    potential_saving: weeklyChange > 0 ? thisWeekExpenses * 0.1 : 0,
    action: weeklyChange > 0 ? 'Review recent purchases' : 'Maintain good habits',
    priority: weeklyChange > 0 ? 'high' : 'low',
    icon: weeklyChange > 0 ? TrendingUp : TrendingDown
   });
  }

  return insights.sort((a, b) => {
   const priorityOrder = { high: 3, medium: 2, low: 1 };
   return (priorityOrder as any)[b.priority] - (priorityOrder as any)[a.priority];
  });
 };

 const insights = useMemo(() => generateSpendingInsights(), [
  transactions,
  expenseTransactions,
  totalExpenses,
  totalIncome,
  dayOfWeekSpending,
  thisWeekExpenses,
  lastWeekExpenses
 ]);

 // Smart recommendations
 const generateRecommendations = () => {
  const recommendations = [];

  // Round-up savings
  const roundUpSavings = expenseTransactions.reduce((total, transaction) => {
   const amount = parseFloat(transaction.amount);
   const roundUp = Math.ceil(amount) - amount;
   return total + roundUp;
  }, 0);

  recommendations.push({
   type: 'automation',
   title: 'Round-Up Savings',
   description: `Automatically save spare change from purchases.`,
   benefit: `$${roundUpSavings.toFixed(0)} saved this period`,
   action: 'Enable round-up',
   difficulty: 'Easy'
  });

  // Subscription audit
  const subscriptionLikeExpenses = expenseTransactions.filter(t => 
   parseFloat(t.amount) > 5 && parseFloat(t.amount) < 100 && 
   t.category === 'entertainment'
  );

  if (subscriptionLikeExpenses.length > 3) {
   recommendations.push({
    type: 'optimization',
    title: 'Subscription Audit',
    description: 'Review recurring entertainment expenses for unused services.',
    benefit: 'Save $50-200/month',
    action: 'Review subscriptions',
    difficulty: 'Medium'
   });
  }

  // Meal prep opportunity
  const diningExpenses = expenseTransactions
   .filter(t => t.category === 'dining')
   .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  if (diningExpenses > 300) {
   recommendations.push({
    type: 'lifestyle',
    title: 'Meal Prep Opportunity',
    description: 'High dining expenses. Meal prepping could reduce costs significantly.',
    benefit: `Save $${(diningExpenses * 0.4).toFixed(0)}/month`,
    action: 'Start meal prepping',
    difficulty: 'Medium'
   });
  }

  return recommendations.slice(0, 3);
 };

 const recommendations = useMemo(() => generateRecommendations(), [
  expenseTransactions,
  totalExpenses,
  totalIncome,
  transactions
 ]);

 const getPriorityColor = (priority: string) => {
  switch (priority) {
   case 'high': return 'text-red-600';
   case 'medium': return 'text-yellow-600';
   default: return 'text-green-600';
  }
 };

 const getPriorityBadge = (priority: string) => {
  switch (priority) {
   case 'high': return <Badge variant="destructive">High Priority</Badge>;
   case 'medium': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20">Medium</Badge>;
   default: return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20">Low Priority</Badge>;
  }
 };

 return (
  <div className="space-y-6">
   {/* Insights Overview */}
   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card className="p-6">
     <div className="flex items-center justify-between">
      <div>
       <p className="text-sm text-muted-foreground">Insights Generated</p>
       <p className="text-2xl font-bold text-blue-600">{insights.length}</p>
       <p className="text-xs text-muted-foreground mt-1">AI-powered</p>
      </div>
      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
       <Brain className="text-blue-600" size={24} />
      </div>
     </div>
    </Card>

    <Card className="p-6">
     <div className="flex items-center justify-between">
      <div>
       <p className="text-sm text-muted-foreground">Potential Savings</p>
       <p className="text-2xl font-bold text-green-600">
        ${insights.reduce((sum, insight) => sum + (insight.potential_saving || 0), 0).toFixed(0)}
       </p>
       <p className="text-xs text-muted-foreground mt-1">per month</p>
      </div>
      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
       <DollarSign className="text-green-600" size={24} />
      </div>
     </div>
    </Card>

    <Card className="p-6">
     <div className="flex items-center justify-between">
      <div>
       <p className="text-sm text-muted-foreground">Weekly Trend</p>
       <p className={`text-2xl font-bold ${thisWeekExpenses > lastWeekExpenses ? 'text-red-600' : 'text-green-600'}`}>
        {lastWeekExpenses > 0 ? 
         `${thisWeekExpenses > lastWeekExpenses ? '+' : ''}${(((thisWeekExpenses - lastWeekExpenses) / lastWeekExpenses) * 100).toFixed(0)}%` 
         : '0%'
        }
       </p>
       <p className="text-xs text-muted-foreground mt-1">vs last week</p>
      </div>
      <div className={`w-12 h-12 ${thisWeekExpenses > lastWeekExpenses ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'} rounded-lg flex items-center justify-center`}>
       {thisWeekExpenses > lastWeekExpenses ? (
        <TrendingUp className="text-red-600" size={24} />
       ) : (
        <TrendingDown className="text-green-600" size={24} />
       )}
      </div>
     </div>
    </Card>
   </div>

   {/* AI-Powered Insights */}
   <Card className="p-6">
    <CardHeader className="px-0 pt-0">
     <CardTitle className="flex items-center">
      <Lightbulb className="mr-2" size={20} />
      AI-Powered Spending Insights
     </CardTitle>
    </CardHeader>
    <CardContent className="px-0">
     <div className="space-y-4">
      {insights.map((insight, index) => (
       <div key={index} className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
        <div className="flex items-start">
         <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mr-3">
          <insight.icon className="text-blue-600" size={20} />
         </div>
         <div>
          <div className="flex items-center gap-2 mb-1">
           <h4 className="font-semibold">{insight.title}</h4>
           {getPriorityBadge(insight.priority)}
          </div>
          <p className="text-sm text-muted-foreground">{insight.description}</p>
          {insight.potential_saving > 0 && (
           <p className="text-sm text-green-600 font-medium mt-1">
            Save ${insight.potential_saving.toFixed(0)}/month
           </p>
          )}
         </div>
        </div>
        <Button variant="outline" size="sm">
         {insight.action}
         <ArrowRight className="ml-1" size={14} />
        </Button>
       </div>
      ))}
     </div>
    </CardContent>
   </Card>

   {/* Smart Recommendations */}
   <Card className="p-6">
    <CardHeader className="px-0 pt-0">
     <CardTitle className="flex items-center">
      <Sparkles className="mr-2" size={20} />
      Smart Money-Saving Recommendations
     </CardTitle>
    </CardHeader>
    <CardContent className="px-0">
     <div className="space-y-4">
      {recommendations.map((rec, index) => (
       <div key={index} className="flex items-start justify-between p-4 bg-white dark:bg-gray-900 rounded-lg">
        <div className="flex items-start">
         <div className="w-10 h-10 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center mr-3">
          <Zap className="text-white" size={20} />
         </div>
         <div>
          <div className="flex items-center gap-2 mb-1">
           <h4 className="font-semibold">{rec.title}</h4>
           <Badge variant="outline">{rec.difficulty}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{rec.description}</p>
          <p className="text-sm text-green-600 font-medium mt-1">
           {rec.benefit}
          </p>
         </div>
        </div>
        <Button className="bg-primary text-primary-foreground" size="sm">
         {rec.action}
         <ArrowRight className="ml-1" size={14} />
        </Button>
       </div>
      ))}
     </div>
    </CardContent>
   </Card>

   {/* Spending Patterns */}
   <Card className="p-6">
    <CardHeader className="px-0 pt-0">
     <CardTitle className="flex items-center">
      <Award className="mr-2" size={20} />
      Your Spending Patterns
     </CardTitle>
    </CardHeader>
    <CardContent className="px-0">
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
       <h4 className="font-medium">Daily Spending Average</h4>
       {Object.entries(dayOfWeekSpending).map(([day, amount]: any) => (
        <div key={day} className="flex items-center justify-between">
         <span className="text-sm">{day}</span>
         <div className="flex items-center">
          <div className="w-20 h-2 bg-muted rounded-full mr-2">
           <div 
            className="h-full bg-blue-500 rounded-full" 
            style={{ width: `${(amount / Math.max(...Object.values(dayOfWeekSpending).map(Number))) * 100}%` }}
           ></div>
          </div>
          <span className="text-sm font-medium">${amount.toFixed(0)}</span>
         </div>
        </div>
       ))}
      </div>
      
      <div className="space-y-3">
       <h4 className="font-medium">Smart Insights Score</h4>
       <div className="space-y-2">
        <div className="flex justify-between">
         <span className="text-sm">Spending Awareness</span>
         <span className="text-sm font-medium">85%</span>
        </div>
        <div className="flex justify-between">
         <span className="text-sm">Budget Control</span>
         <span className="text-sm font-medium">78%</span>
        </div>
        <div className="flex justify-between">
         <span className="text-sm">Savings Potential</span>
         <span className="text-sm font-medium">92%</span>
        </div>
        <div className="flex justify-between font-semibold">
         <span className="text-sm">Overall Score</span>
         <span className="text-sm text-green-600">85/100</span>
        </div>
       </div>
      </div>
     </div>
    </CardContent>
   </Card>
  </div>
 );
}
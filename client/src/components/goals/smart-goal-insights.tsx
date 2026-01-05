import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { 
 Lightbulb, 
 TrendingUp, 
 Target, 
 AlertTriangle, 
 Award,
 Zap,
 Brain,
 Calendar,
 DollarSign,
 PieChart,
 Clock,
 CheckCircle
} from"lucide-react";
import { differenceInDays, differenceInMonths, addMonths } from"date-fns";
import { useQuery } from"@tanstack/react-query";
import { useUserCurrency } from"@/lib/userContext";
import { safeString } from "@/lib/safe-render";

interface Goal {
 id: string;
 title: string;
 description?: string;
 targetAmount: string;
 currentAmount: string;
 targetDate: string;
 category?: string;
 priority: string;
 status: string;
 createdAt?: string;
}

interface Transaction {
 id: string;
 amount: string;
 type: string;
 category?: string;
 date: string;
 goalId?: string;
}

interface SmartGoalInsightsProps {
 goals: Goal[];
 onActionClick?: (action: string, goalId?: string) => void;
}

export default function SmartGoalInsights({ goals, onActionClick }: SmartGoalInsightsProps) {
 const { formatAmount } = useUserCurrency();
 
 // Fetch transaction data for analysis
 const { data: transactions } = useQuery({
  queryKey: ["/api/transactions"],
  queryFn: () => fetch("/api/transactions").then(res => res.json()),
 });

 const activeGoals = goals.filter(goal => goal.status === 'active');
 const completedGoals = goals.filter(goal => goal.status === 'completed');
 
 // Calculate insights
 const generateInsights = () => {
  const insights: Array<{
   id: string;
   type: 'success' | 'warning' | 'info' | 'achievement';
   icon: any;
   title: string;
   description: string;
   action?: string;
   goalId?: string;
   priority: number;
  }> = [];

  // Achievement insights
  if (completedGoals.length > 0) {
   insights.push({
    id: 'completion-celebration',
    type: 'achievement',
    icon: Award,
    title: `${completedGoals.length} Goal${completedGoals.length > 1 ? 's' : ''} Completed!`,
    description: `You've successfully completed ${completedGoals.length} financial goal${completedGoals.length > 1 ? 's' : ''}. Your dedication is paying off!`,
    priority: 1
   });
  }

  // Goals needing attention
  const riskyGoals = activeGoals.filter(goal => {
   const daysRemaining = differenceInDays(new Date(goal.targetDate), new Date());
   const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
   const monthsRemaining = daysRemaining / 30;
   const requiredMonthlyRate = monthsRemaining > 0 
    ? (parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount)) / monthsRemaining
    : Infinity;
   
   return daysRemaining < 60 && progress < 80 && requiredMonthlyRate > 1000;
  });

  if (riskyGoals.length > 0) {
   insights.push({
    id: 'goals-need-attention',
    type: 'warning',
    icon: AlertTriangle,
    title: 'Goals Need Attention',
    description: `${riskyGoals.length} goal${riskyGoals.length > 1 ? 's are' : ' is'} at risk of missing target dates. Consider adjusting timelines or increasing contributions.`,
    action: 'review-timeline',
    goalId: riskyGoals[0].id,
    priority: 2
   });
  }

  // High-performing goals
  const excellentGoals = activeGoals.filter(goal => {
   const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
   const daysRemaining = differenceInDays(new Date(goal.targetDate), new Date());
   const expectedProgress = goal.createdAt 
    ? (1 - (daysRemaining / differenceInDays(new Date(goal.targetDate), new Date(goal.createdAt)))) * 100
    : 0;
   
   return progress > expectedProgress + 20 && progress >= 30;
  });

  if (excellentGoals.length > 0) {
   insights.push({
    id: 'excellent-progress',
    type: 'success',
    icon: TrendingUp,
    title: 'Excellent Progress!',
    description: `You're ahead of schedule on ${excellentGoals.length} goal${excellentGoals.length > 1 ? 's' : ''}. Keep up the great work!`,
    priority: 3
   });
  }

  // Savings potential analysis
  if (transactions && transactions.length > 0) {
   const monthlyIncome = transactions
    .filter((t: Transaction) => t.type === 'income' && new Date(t.date) >= addMonths(new Date(), -1))
    .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0);
   
   const monthlyExpenses = transactions
    .filter((t: Transaction) => t.type === 'expense' && new Date(t.date) >= addMonths(new Date(), -1))
    .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0);
   
   const potentialSavings = monthlyIncome - monthlyExpenses;
   
   if (potentialSavings > 500 && activeGoals.length > 0) {
    insights.push({
     id: 'savings-opportunity',
     type: 'info',
     icon: DollarSign,
     title: 'Savings Opportunity Identified',
     description: `Based on your income patterns, you could potentially save an additional ${formatAmount(potentialSavings)} monthly towards your goals.`,
     action: 'optimize-budget',
     priority: 4
    });
   }
  }

  // Goal diversification insight
  const categories = new Set(activeGoals.map(goal => goal.category).filter(Boolean));
  if (activeGoals.length >= 3 && categories.size === 1) {
   insights.push({
    id: 'diversify-goals',
    type: 'info',
    icon: PieChart,
    title: 'Consider Goal Diversification',
    description: 'All your goals are in the same category. Consider diversifying across emergency funds, investments, and lifestyle goals.',
    action: 'diversify-portfolio',
    priority: 5
   });
  }

  // Time-based insights
  const shortTermGoals = activeGoals.filter(goal => 
   differenceInMonths(new Date(goal.targetDate), new Date()) <= 12
  );
  const longTermGoals = activeGoals.filter(goal => 
   differenceInMonths(new Date(goal.targetDate), new Date()) > 12
  );

  if (shortTermGoals.length === 0 && longTermGoals.length > 0) {
   insights.push({
    id: 'need-short-term-goals',
    type: 'info',
    icon: Clock,
    title: 'Consider Short-term Goals',
    description: 'Having some short-term goals (under 1 year) can help maintain motivation and create quick wins.',
    action: 'create-short-term',
    priority: 6
   });
  }

  // Momentum insights
  const goalContributions = transactions?.filter((t: Transaction) => 
   t.goalId && activeGoals.some(g => g.id === t.goalId)
  ) || [];
  
  const recentContributions = goalContributions.filter((t: Transaction) => 
   differenceInDays(new Date(), new Date(t.date)) <= 7
  );

  if (recentContributions.length === 0 && activeGoals.length > 0) {
   insights.push({
    id: 'maintain-momentum',
    type: 'info',
    icon: Zap,
    title: 'Maintain Your Momentum',
    description: 'No contributions to goals this week. Small, consistent contributions lead to big results!',
    action: 'quick-contribute',
    priority: 7
   });
  }

  return insights.sort((a, b) => a.priority - b.priority);
 };

 const insights = generateInsights();

 const getInsightColor = (type: string) => {
  switch (type) {
   case 'success': return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20';
   case 'warning': return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20';
   case 'achievement': return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20';
   default: return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20';
  }
 };

 const getIconColor = (type: string) => {
  switch (type) {
   case 'success': return 'text-green-600';
   case 'warning': return 'text-yellow-600';
   case 'achievement': return 'text-blue-600';
   default: return 'text-blue-600';
  }
 };

 if (insights.length === 0) {
  return (
   <Card>
    <CardHeader>
     <CardTitle className="flex items-center">
      <Brain className="mr-2 h-5 w-5" />
      Smart Insights
     </CardTitle>
    </CardHeader>
    <CardContent>
     <div className="text-center py-8">
      <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Building Your Profile</h3>
      <p className="text-muted-foreground">
       Create some goals and start saving to unlock personalized insights and recommendations.
      </p>
     </div>
    </CardContent>
   </Card>
  );
 }

 return (
  <Card>
   <CardHeader>
    <CardTitle className="flex items-center">
     <Brain className="mr-2 h-5 w-5" />
     Smart Insights
    </CardTitle>
   </CardHeader>
   <CardContent>
    <div className="space-y-4">
     {insights.slice(0, 5).map((insight) => (
      <div 
       key={insight.id}
       className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
       data-testid={`insight-${insight.id}`}
      >
       <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
         <insight.icon className={`h-5 w-5 mt-0.5 ${getIconColor(insight.type)}`} />
         <div className="flex-1">
          <h4 className="font-medium mb-1">{safeString(insight.title)}</h4>
          <p className="text-sm text-muted-foreground">{safeString(insight.description)}</p>
         </div>
        </div>
        {insight.action && (
         <Button 
          size="sm" 
          variant="outline"
          onClick={() => onActionClick?.(insight.action!, insight.goalId)}
          data-testid={`button-insight-action-${insight.id}`}
          className="ml-4 shrink-0"
         >
          Take Action
         </Button>
        )}
       </div>
      </div>
     ))}
     
     {insights.length > 5 && (
      <div className="text-center pt-2">
       <Button variant="ghost" size="sm" className="text-muted-foreground">
        View {insights.length - 5} More Insights
       </Button>
      </div>
     )}
    </div>
   </CardContent>
  </Card>
 );
}
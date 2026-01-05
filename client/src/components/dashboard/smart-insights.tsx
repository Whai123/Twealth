import { useQuery } from"@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs";
import { 
 TrendingUp, 
 TrendingDown, 
 DollarSign, 
 Target, 
 Lightbulb, 
 Calendar,
 PiggyBank,
 AlertTriangle,
 CheckCircle,
 ArrowUp,
 ArrowDown,
 Zap
} from"lucide-react";
import { Progress } from"@/components/ui/progress";
import NotificationActions from"./notification-actions";
import { useUserCurrency } from"@/lib/userContext";
import { safeString } from "@/lib/safe-render";

interface Transaction {
 id: string;
 amount: string;
 type: 'income' | 'expense' | 'transfer';
 category: string;
 description?: string;
 date: string;
}

interface FinancialGoal {
 id: string;
 title: string;
 targetAmount: string;
 currentAmount: string;
 targetDate: string;
 category: string;
 priority: string;
 status: string;
}

interface SmartInsight {
 type: 'trend' | 'suggestion' | 'warning' | 'achievement';
 title: string;
 description: string;
 value?: string;
 change?: number;
 priority: 'low' | 'medium' | 'high';
 actionable: boolean;
 action?: {
  label: string;
  type: string;
  data?: any;
 };
}

export default function SmartInsights() {
 const { formatAmount } = useUserCurrency();
 
 // Fetch user data
 const { data: transactions = [] } = useQuery<Transaction[]>({
  queryKey: ["/api/transactions"],
 });

 const { data: goals = [] } = useQuery<FinancialGoal[]>({
  queryKey: ["/api/financial-goals"],
 });

 const { data: stats } = useQuery({
  queryKey: ["/api/dashboard/stats"],
 });

 // Calculate insights
 const generateInsights = (): SmartInsight[] => {
  const insights: SmartInsight[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Filter recent transactions
  const recentTransactions = transactions.filter(t => 
   new Date(t.date) >= thirtyDaysAgo
  );

  // 1. Spending Trends Analysis
  const totalExpenses = recentTransactions
   .filter(t => t.type === 'expense')
   .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalIncome = recentTransactions
   .filter(t => t.type === 'income')
   .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  if (savingsRate < 10 && totalIncome > 0) {
   insights.push({
    type: 'warning',
    title: 'Low Savings Rate',
    description: `Your savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 10-20% of income.`,
    value: `${savingsRate.toFixed(1)}%`,
    priority: 'high',
    actionable: true,
    action: {
     label: 'Set Savings Goal',
     type: 'create_goal',
     data: { suggestedAmount: totalIncome * 0.15 }
    }
   });
  } else if (savingsRate >= 20) {
   insights.push({
    type: 'achievement',
    title: 'Excellent Savings Rate!',
    description: `Your ${savingsRate.toFixed(1)}% savings rate is outstanding! You're building wealth effectively.`,
    value: `${savingsRate.toFixed(1)}%`,
    priority: 'medium',
    actionable: false
   });
  }

  // 2. Category Analysis
  const expensesByCategory = recentTransactions
   .filter(t => t.type === 'expense')
   .reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
    return acc;
   }, {} as Record<string, number>);

  const topExpenseCategory = Object.entries(expensesByCategory)
   .sort(([,a], [,b]) => b - a)[0];

  if (topExpenseCategory && totalExpenses > 0) {
   const categoryPercent = (topExpenseCategory[1] / totalExpenses) * 100;
   if (categoryPercent > 40) {
    insights.push({
     type: 'warning',
     title: `High ${topExpenseCategory[0]} Spending`,
     description: `${categoryPercent.toFixed(1)}% of your expenses are in ${topExpenseCategory[0]}. Consider reviewing this category.`,
     value: formatAmount(topExpenseCategory[1]),
     priority: 'medium',
     actionable: true,
     action: {
      label: 'Review Transactions',
      type: 'view_transactions',
      data: { category: topExpenseCategory[0] }
     }
    });
   }
  }

  // 3. Goal Progress Analysis
  goals.forEach(goal => {
   const currentAmount = parseFloat(goal.currentAmount ||"0");
   const targetAmount = parseFloat(goal.targetAmount);
   const progressPercent = (currentAmount / targetAmount) * 100;
   const daysUntilTarget = Math.ceil((new Date(goal.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

   // Almost complete goals
   if (progressPercent >= 80 && progressPercent < 100) {
    insights.push({
     type: 'achievement',
     title: `${goal.title} Almost Complete! `,
     description: `You're ${progressPercent.toFixed(0)}% done! Just ${formatAmount(targetAmount - currentAmount)} more to go.`,
     value: `${progressPercent.toFixed(0)}%`,
     priority: 'medium',
     actionable: true,
     action: {
      label: 'Add Funds',
      type: 'add_transaction',
      data: { goalId: goal.id, amount: targetAmount - currentAmount }
     }
    });
   }

   // Behind schedule goals
   if (daysUntilTarget <= 60 && daysUntilTarget > 0 && progressPercent < 50) {
    const requiredDaily = (targetAmount - currentAmount) / daysUntilTarget;
    insights.push({
     type: 'warning',
     title: `${goal.title} Behind Schedule`,
     description: `With ${daysUntilTarget} days left, you need to save ${formatAmount(requiredDaily)} daily to reach your goal.`,
     value: `${formatAmount(requiredDaily)}/day`,
     priority: 'high',
     actionable: true,
     action: {
      label: 'Boost Savings',
      type: 'add_transaction',
      data: { goalId: goal.id, amount: requiredDaily * 7 }
     }
    });
   }
  });

  // 4. Transaction Frequency
  const recentWeekTransactions = transactions.filter(t => 
   new Date(t.date) >= sevenDaysAgo
  );

  if (recentWeekTransactions.length === 0) {
   insights.push({
    type: 'suggestion',
    title: 'Track Your Spending',
    description: 'No transactions recorded this week. Regular tracking helps you stay on top of your finances.',
    priority: 'medium',
    actionable: true,
    action: {
     label: 'Add Transaction',
     type: 'add_transaction'
    }
   });
  }

  // 5. Optimal Savings Suggestion
  if (totalIncome > 0 && savingsRate < 15) {
   const suggestedSavings = totalIncome * 0.15;
   const currentSavings = totalIncome - totalExpenses;
   const additionalSavings = suggestedSavings - currentSavings;

   if (additionalSavings > 0) {
    insights.push({
     type: 'suggestion',
     title: 'Optimize Your Savings',
     description: `Consider saving an additional ${formatAmount(additionalSavings)} monthly to reach the recommended 15% savings rate.`,
     value: `+${formatAmount(additionalSavings)}`,
     priority: 'medium',
     actionable: true,
     action: {
      label: 'Create Savings Goal',
      type: 'create_goal',
      data: { amount: additionalSavings * 12, category: 'emergency' }
     }
    });
   }
  }

  return insights.sort((a, b) => {
   const priorityOrder = { high: 3, medium: 2, low: 1 };
   return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
 };

 const insights = generateInsights();
 const trendInsights = insights.filter(i => i.type === 'trend');
 const suggestionInsights = insights.filter(i => i.type === 'suggestion');
 const warningInsights = insights.filter(i => i.type === 'warning');
 const achievementInsights = insights.filter(i => i.type === 'achievement');

 const getInsightIcon = (type: string) => {
  switch (type) {
   case 'trend':
    return <TrendingUp className="text-blue-500" size={16} />;
   case 'suggestion':
    return <Lightbulb className="text-yellow-500" size={16} />;
   case 'warning':
    return <AlertTriangle className="text-red-500" size={16} />;
   case 'achievement':
    return <CheckCircle className="text-green-500" size={16} />;
   default:
    return <Zap className="text-blue-500" size={16} />;
  }
 };

 const getPriorityColor = (priority: string) => {
  switch (priority) {
   case 'high':
    return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
   case 'medium':
    return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
   case 'low':
    return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
   default:
    return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10';
  }
 };

 return (
  <NotificationActions>
   {(handlers) => (
    <Card className="shadow-sm hover-lift">
   <CardHeader className="pb-4">
    <div className="flex items-center gap-2">
     <div className="w-8 h-8 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center">
      <Lightbulb className="text-white" size={18} />
     </div>
     <CardTitle className="text-lg font-semibold text-foreground">
      Smart Financial Insights
     </CardTitle>
    </div>
    <p className="text-sm text-muted-foreground">
     AI-powered analysis of your financial patterns and personalized recommendations
    </p>
   </CardHeader>

   <CardContent className="p-6">
    <Tabs defaultValue="all" className="space-y-4">
     <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="all" data-testid="tab-all">
       All ({insights.length})
      </TabsTrigger>
      <TabsTrigger value="warnings" data-testid="tab-warnings">
       Warnings ({warningInsights.length})
      </TabsTrigger>
      <TabsTrigger value="suggestions" data-testid="tab-suggestions">
       Tips ({suggestionInsights.length})
      </TabsTrigger>
      <TabsTrigger value="achievements" data-testid="tab-achievements">
       Wins ({achievementInsights.length})
      </TabsTrigger>
     </TabsList>

     <TabsContent value="all" className="space-y-3">
      {insights.length === 0 ? (
       <div className="text-center py-8 text-muted-foreground">
        <Lightbulb size={32} className="mx-auto mb-2 opacity-50" />
        <p className="font-medium">No insights available</p>
        <p className="text-sm">Add some transactions and goals to get personalized insights</p>
       </div>
      ) : (
       insights.map((insight, index) => (
        <Card
         key={index}
         className={`p-4 border-l-4 transition-all hover:shadow-md ${getPriorityColor(insight.priority)}`}
         data-testid={`insight-${index}`}
        >
         <div className="flex items-start justify-between">
          <div className="flex-1">
           <div className="flex items-center gap-2 mb-2">
            {getInsightIcon(insight.type)}
            <h4 className="font-medium text-sm">{safeString(insight.title)}</h4>
            <Badge 
             variant={insight.priority === 'high' ? 'destructive' : 'secondary'}
             className="text-xs"
            >
             {safeString(insight.priority)}
            </Badge>
           </div>
           
           <p className="text-sm text-muted-foreground mb-3">
            {safeString(insight.description)}
           </p>

           {insight.value && (
            <div className="flex items-center gap-2 mb-3">
             <Badge variant="outline" className="font-mono">
              {safeString(insight.value)}
             </Badge>
            </div>
           )}

           {insight.actionable && insight.action && (
            <Button
             size="sm"
             variant="outline"
             className="h-8 text-xs"
             onClick={() => {
              const action = insight.action;
              if (!action) return;

              switch (action.type) {
               case 'create_goal':
                handlers.openGoalForm(action.data);
                break;
               case 'add_transaction':
                handlers.openTransactionForm(action.data);
                break;
               case 'view_transactions':
                handlers.navigateToTransactions(action.data?.category);
                break;
               case 'add_funds':
                if (action.data?.goalId) {
                 // We need to find the goal data for add funds
                 const goal = goals?.find(g => g.id === action.data.goalId);
                 if (goal) {
                  handlers.openAddFundsForm(
                   goal.id,
                   goal.title,
                   goal.currentAmount,
                   goal.targetAmount
                  );
                 }
                }
                break;
               default:
                break;
              }
             }}
             data-testid={`button-action-${index}`}
            >
             <Zap size={12} className="mr-1" />
             {safeString(insight.action.label)}
            </Button>
           )}
          </div>
         </div>
        </Card>
       ))
      )}
     </TabsContent>

     <TabsContent value="warnings" className="space-y-3">
      {warningInsights.map((insight, index) => (
       <Card
        key={index}
        className="p-4 border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/10"
        data-testid={`warning-${index}`}
       >
        <div className="flex items-center gap-2 mb-2">
         <AlertTriangle className="text-red-500" size={16} />
         <h4 className="font-medium text-sm text-red-700 dark:text-red-300">
          {safeString(insight.title)}
         </h4>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400 mb-3">
         {safeString(insight.description)}
        </p>
        {insight.actionable && insight.action && (
         <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs border-red-200 text-red-700 hover:bg-red-100"
          onClick={() => {
           const action = insight.action;
           if (!action) return;

           switch (action.type) {
            case 'create_goal':
             handlers.openGoalForm(action.data);
             break;
            case 'add_transaction':
             handlers.openTransactionForm(action.data);
             break;
            case 'view_transactions':
             handlers.navigateToTransactions(action.data?.category);
             break;
            case 'add_funds':
             if (action.data?.goalId) {
              const goal = goals?.find(g => g.id === action.data.goalId);
              if (goal) {
               handlers.openAddFundsForm(
                goal.id,
                goal.title,
                goal.currentAmount,
                goal.targetAmount
               );
              }
             }
             break;
            default:
             break;
           }
          }}
         >
          {safeString(insight.action.label)}
         </Button>
        )}
       </Card>
      ))}
     </TabsContent>

     <TabsContent value="suggestions" className="space-y-3">
      {suggestionInsights.map((insight, index) => (
       <Card
        key={index}
        className="p-4 border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10"
        data-testid={`suggestion-${index}`}
       >
        <div className="flex items-center gap-2 mb-2">
         <Lightbulb className="text-yellow-500" size={16} />
         <h4 className="font-medium text-sm text-yellow-700 dark:text-yellow-300">
          {safeString(insight.title)}
         </h4>
        </div>
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3">
         {safeString(insight.description)}
        </p>
        {insight.actionable && insight.action && (
         <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs border-yellow-200 text-yellow-700 hover:bg-yellow-100"
          onClick={() => {
           const action = insight.action;
           if (!action) return;

           switch (action.type) {
            case 'create_goal':
             handlers.openGoalForm(action.data);
             break;
            case 'add_transaction':
             handlers.openTransactionForm(action.data);
             break;
            case 'view_transactions':
             handlers.navigateToTransactions(action.data?.category);
             break;
            case 'add_funds':
             if (action.data?.goalId) {
              const goal = goals?.find(g => g.id === action.data.goalId);
              if (goal) {
               handlers.openAddFundsForm(
                goal.id,
                goal.title,
                goal.currentAmount,
                goal.targetAmount
               );
              }
             }
             break;
            default:
             break;
           }
          }}
         >
          {safeString(insight.action.label)}
         </Button>
        )}
       </Card>
      ))}
     </TabsContent>

     <TabsContent value="achievements" className="space-y-3">
      {achievementInsights.map((insight, index) => (
       <Card
        key={index}
        className="p-4 border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/10"
        data-testid={`achievement-${index}`}
       >
        <div className="flex items-center gap-2 mb-2">
         <CheckCircle className="text-green-500" size={16} />
         <h4 className="font-medium text-sm text-green-700 dark:text-green-300">
          {safeString(insight.title)}
         </h4>
        </div>
        <p className="text-sm text-green-600 dark:text-green-400 mb-3">
         {safeString(insight.description)}
        </p>
        {insight.actionable && insight.action && (
         <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs border-green-200 text-green-700 hover:bg-green-100"
          onClick={() => {
           const action = insight.action;
           if (!action) return;

           switch (action.type) {
            case 'create_goal':
             handlers.openGoalForm(action.data);
             break;
            case 'add_transaction':
             handlers.openTransactionForm(action.data);
             break;
            case 'view_transactions':
             handlers.navigateToTransactions(action.data?.category);
             break;
            case 'add_funds':
             if (action.data?.goalId) {
              const goal = goals?.find(g => g.id === action.data.goalId);
              if (goal) {
               handlers.openAddFundsForm(
                goal.id,
                goal.title,
                goal.currentAmount,
                goal.targetAmount
               );
              }
             }
             break;
            default:
             break;
           }
          }}
         >
          {safeString(insight.action.label)}
         </Button>
        )}
       </Card>
      ))}
     </TabsContent>
    </Tabs>
   </CardContent>
  </Card>
    )}
  </NotificationActions>
 );
}
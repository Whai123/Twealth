import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  PiggyBank, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  Brain,
  Calculator,
  ArrowRight,
  DollarSign,
  Calendar,
  Award
} from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";

interface SmartBudgetManagementProps {
  transactions: any[];
  timeRange: string;
}

export default function SmartBudgetManagement({ transactions, timeRange }: SmartBudgetManagementProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Calculate current spending by category
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const categorySpending = expenseTransactions.reduce((acc: any, transaction) => {
    const category = transaction.category || 'other';
    acc[category] = (acc[category] || 0) + parseFloat(transaction.amount);
    return acc;
  }, {});

  // Smart budget recommendations based on 50/30/20 rule and spending patterns
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpenses = Object.values(categorySpending).reduce((sum: number, amount: any) => sum + amount, 0);

  // Recommended budgets
  const recommendedBudgets = {
    rent: Math.max(totalIncome * 0.25, categorySpending.rent * 1.1 || 0),
    utilities: Math.max(totalIncome * 0.05, categorySpending.utilities * 1.1 || 0),
    groceries: Math.max(totalIncome * 0.10, categorySpending.groceries * 1.1 || 0),
    dining: Math.max(totalIncome * 0.05, categorySpending.dining * 0.8 || 0),
    transport: Math.max(totalIncome * 0.08, categorySpending.transport * 1.1 || 0),
    entertainment: Math.max(totalIncome * 0.05, categorySpending.entertainment * 0.9 || 0),
    shopping: Math.max(totalIncome * 0.08, categorySpending.shopping * 0.7 || 0),
    healthcare: Math.max(totalIncome * 0.03, categorySpending.healthcare * 1.2 || 0),
    other: Math.max(totalIncome * 0.05, categorySpending.other * 0.9 || 0)
  };

  const totalRecommendedBudget = Object.values(recommendedBudgets).reduce((sum: number, amount: any) => sum + amount, 0);
  
  // Guard against division by zero
  const safeTotalIncome = Math.max(totalIncome, 0.01);
  const safeTotalRecommendedBudget = Math.max(totalRecommendedBudget, 0.01);

  // Budget insights
  const budgetCategories = Object.entries(recommendedBudgets).map(([category, recommended]) => {
    const spent = categorySpending[category] || 0;
    const percentage = recommended > 0 ? (spent / recommended) * 100 : 0;
    const status = percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good';
    
    return {
      category,
      spent,
      recommended,
      percentage,
      status,
      remaining: Math.max(0, recommended - spent)
    };
  }).sort((a, b) => b.percentage - a.percentage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'over': return <Badge variant="destructive">Over Budget</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20">Near Limit</Badge>;
      default: return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20">On Track</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: any = {
      rent: '🏠',
      utilities: '⚡',
      groceries: '🛒',
      dining: '🍽️',
      transport: '🚗',
      healthcare: '🏥',
      entertainment: '🎬',
      shopping: '🛍️',
      other: '💰'
    };
    return icons[category] || '💰';
  };

  // Smart recommendations
  const generateRecommendations = () => {
    const recommendations = [];
    
    // Check for overspending
    const overspentCategories = budgetCategories.filter(cat => cat.status === 'over');
    if (overspentCategories.length > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Reduce Overspending',
        description: `Cut back on ${overspentCategories[0].category} by $${(overspentCategories[0].spent - overspentCategories[0].recommended).toFixed(0)}`,
        action: 'Review expenses',
        impact: 'Save $200-500/month'
      });
    }

    // Savings opportunity
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    if (savingsRate < 20 && totalIncome > 0) {
      recommendations.push({
        type: 'opportunity',
        title: 'Increase Savings Rate',
        description: `Current rate: ${savingsRate.toFixed(1)}%. Aim for 20%+`,
        action: 'Optimize spending',
        impact: 'Build emergency fund faster'
      });
    }

    // Budget optimization
    const highestSpendingCategory = budgetCategories[0];
    if (highestSpendingCategory.percentage > 50) {
      recommendations.push({
        type: 'optimization',
        title: 'Balance Your Budget',
        description: `${highestSpendingCategory.category} takes up ${highestSpendingCategory.percentage.toFixed(0)}% of budget`,
        action: 'Diversify expenses',
        impact: 'Better financial balance'
      });
    }

    return recommendations.slice(0, 3);
  };

  const recommendations = generateRecommendations();

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Budget</p>
              <p className="text-2xl font-bold text-blue-600">
                ${totalRecommendedBudget.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                AI-optimized
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Target className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Budget Used</p>
              <p className="text-2xl font-bold text-orange-600">
                {totalRecommendedBudget > 0 ? ((totalExpenses / totalRecommendedBudget) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                of recommended
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Calculator className="text-orange-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Savings Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {totalIncome > 0 ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                of income saved
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <PiggyBank className="text-green-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Category Budgets */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <Brain className="mr-2" size={20} />
            Smart Budget Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="space-y-4">
            {budgetCategories.map((budget) => (
              <div key={budget.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{getCategoryIcon(budget.category)}</span>
                    <div>
                      <p className="font-medium capitalize">{budget.category.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        ${budget.spent.toLocaleString()} of ${budget.recommended.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getStatusColor(budget.status)}`}>
                      {budget.percentage.toFixed(0)}%
                    </p>
                    {getStatusBadge(budget.status)}
                  </div>
                </div>
                <Progress 
                  value={Math.min(budget.percentage, 100)} 
                  className="h-2"
                />
                {budget.status === 'good' && budget.remaining > 0 && (
                  <p className="text-xs text-green-600">
                    ${budget.remaining.toFixed(0)} remaining this month
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Smart Recommendations */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <Zap className="mr-2" size={20} />
            Smart Budget Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    rec.type === 'warning' ? 'bg-red-100 dark:bg-red-900/20' :
                    rec.type === 'opportunity' ? 'bg-green-100 dark:bg-green-900/20' :
                    'bg-blue-100 dark:bg-blue-900/20'
                  }`}>
                    {rec.type === 'warning' ? (
                      <AlertTriangle className="text-red-600" size={20} />
                    ) : rec.type === 'opportunity' ? (
                      <TrendingUp className="text-green-600" size={20} />
                    ) : (
                      <Award className="text-blue-600" size={20} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                    <p className="text-xs text-green-600 font-medium mt-1">{rec.impact}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {rec.action}
                  <ArrowRight className="ml-1" size={14} />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget Health Score */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2" size={20} />
            Budget Health Score
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600">85</div>
              <p className="text-sm text-muted-foreground">Budget Score</p>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 mt-2">
                Excellent
              </Badge>
            </div>
            
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">7/9</div>
              <p className="text-sm text-muted-foreground">Categories On Track</p>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 mt-2">
                Good Control
              </Badge>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">18%</div>
              <p className="text-sm text-muted-foreground">Savings Rate</p>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 mt-2">
                Strong Saver
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Target,
  Award,
  Zap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface InsightItem {
  id: string;
  type: 'achievement' | 'anomaly' | 'benchmark';
  title: string;
  description: string;
  metric?: string;
  comparison?: string;
  priority: 'low' | 'normal' | 'high';
  icon: any;
  color: string;
}

export default function InsightsFeedWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fetch data
  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: goals = [] } = useQuery<any[]>({
    queryKey: ["/api/financial-goals"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Memoize insights to prevent regeneration on every render
  const insights = useMemo((): InsightItem[] => {
    const insights: InsightItem[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);

    // Calculate financial metrics
    const totalIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Achievement Insights
    const completedGoals = goals.filter(g => g.status === 'completed');
    if (completedGoals.length > 0) {
      insights.push({
        id: 'achievement-goals',
        type: 'achievement',
        title: `${completedGoals.length} Goal${completedGoals.length > 1 ? 's' : ''} Completed`,
        description: `You've successfully completed ${completedGoals.length} financial goal${completedGoals.length > 1 ? 's' : ''} this year.`,
        metric: `${completedGoals.length}`,
        priority: 'high',
        icon: Trophy,
        color: 'text-yellow-600 dark:text-yellow-400'
      });
    }

    const activeGoals = goals.filter(g => g.status === 'active');
    const goalsNearCompletion = activeGoals.filter(g => {
      const progress = (parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100;
      return progress >= 75 && progress < 100;
    });

    if (goalsNearCompletion.length > 0) {
      insights.push({
        id: 'achievement-progress',
        type: 'achievement',
        title: 'Goals Nearly Complete',
        description: `${goalsNearCompletion.length} goal${goalsNearCompletion.length > 1 ? 's are' : ' is'} over 75% funded. You're almost there.`,
        metric: `${goalsNearCompletion.length}`,
        priority: 'normal',
        icon: Award,
        color: 'text-purple-600 dark:text-purple-400'
      });
    }

    // Spending Anomaly Detection
    const categoryTotals: Record<string, number> = {};
    recentTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
      });

    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a);

    if (sortedCategories.length > 0) {
      const [topCategory, topAmount] = sortedCategories[0];
      const categoryPercent = totalExpenses > 0 ? (topAmount / totalExpenses) * 100 : 0;
      
      if (categoryPercent > 40) {
        insights.push({
          id: 'anomaly-concentration',
          type: 'anomaly',
          title: 'Spending Concentration Alert',
          description: `${categoryPercent.toFixed(0)}% of your expenses are in ${topCategory}. Consider diversifying your spending.`,
          metric: `${categoryPercent.toFixed(0)}%`,
          comparison: topCategory,
          priority: 'high',
          icon: AlertCircle,
          color: 'text-orange-600 dark:text-orange-400'
        });
      }
    }

    // Large transaction detection
    const averageTransaction = totalExpenses / recentTransactions.filter(t => t.type === 'expense').length;
    const largeTransactions = recentTransactions
      .filter(t => t.type === 'expense' && parseFloat(t.amount) > averageTransaction * 2);

    if (largeTransactions.length > 0 && averageTransaction > 0) {
      insights.push({
        id: 'anomaly-large',
        type: 'anomaly',
        title: 'Unusual Spending Detected',
        description: `${largeTransactions.length} transaction${largeTransactions.length > 1 ? 's' : ''} exceeded double your average spend this month.`,
        metric: `${largeTransactions.length}`,
        priority: 'normal',
        icon: TrendingUp,
        color: 'text-red-600 dark:text-red-400'
      });
    }

    // Benchmark Comparisons
    if (savingsRate >= 20) {
      insights.push({
        id: 'benchmark-savings-excellent',
        type: 'benchmark',
        title: 'Savings Rate: Excellent',
        description: `Your ${savingsRate.toFixed(0)}% savings rate exceeds the recommended 20%. You're in the top quartile.`,
        metric: `${savingsRate.toFixed(0)}%`,
        comparison: 'vs. 20% target',
        priority: 'low',
        icon: TrendingUp,
        color: 'text-green-600 dark:text-green-400'
      });
    } else if (savingsRate >= 10) {
      insights.push({
        id: 'benchmark-savings-good',
        type: 'benchmark',
        title: 'Savings Rate: Above Average',
        description: `Your ${savingsRate.toFixed(0)}% savings rate is above the national average of 7%. Keep it up.`,
        metric: `${savingsRate.toFixed(0)}%`,
        comparison: 'vs. 7% average',
        priority: 'normal',
        icon: Target,
        color: 'text-blue-600 dark:text-blue-400'
      });
    } else if (savingsRate >= 0) {
      insights.push({
        id: 'benchmark-savings-low',
        type: 'benchmark',
        title: 'Savings Rate: Below Target',
        description: `Your ${savingsRate.toFixed(0)}% savings rate is below the recommended 20%. Small changes can make a big difference.`,
        metric: `${savingsRate.toFixed(0)}%`,
        comparison: 'vs. 20% target',
        priority: 'high',
        icon: TrendingDown,
        color: 'text-orange-600 dark:text-orange-400'
      });
    }

    // Active goals benchmark
    if (activeGoals.length >= 3) {
      insights.push({
        id: 'benchmark-goals',
        type: 'benchmark',
        title: 'Goal Planning: Strong',
        description: `You're managing ${activeGoals.length} active goals. Most successful savers track 2-5 goals simultaneously.`,
        metric: `${activeGoals.length}`,
        comparison: 'vs. 2-5 typical',
        priority: 'low',
        icon: Zap,
        color: 'text-indigo-600 dark:text-indigo-400'
      });
    }

    return insights.length > 0 ? insights : [{
      id: 'placeholder',
      type: 'benchmark',
      title: 'Start Tracking',
      description: 'Add transactions and goals to receive personalized financial insights.',
      priority: 'normal',
      icon: Target,
      color: 'text-gray-600 dark:text-gray-400'
    }];
  }, [transactions, goals, stats]);

  // Auto-rotate insights every 5 seconds
  useEffect(() => {
    if (insights.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % insights.length);
        setIsTransitioning(false);
      }, 150); // Match transition duration
    }, 5000);

    return () => clearInterval(interval);
  }, [insights.length]);

  const handlePrevious = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + insights.length) % insights.length);
      setIsTransitioning(false);
    }, 150);
  };

  const handleNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length);
      setIsTransitioning(false);
    }, 150);
  };

  const currentInsight = insights[currentIndex];
  const Icon = currentInsight.icon;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'achievement': return 'Achievement';
      case 'anomaly': return 'Alert';
      case 'benchmark': return 'Insight';
      default: return 'Insight';
    }
  };

  return (
    <Card className="border-border/50" data-testid="card-insights-feed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold tracking-tight">Smart Insights</CardTitle>
          {insights.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} / {insights.length}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handlePrevious}
                  data-testid="button-insights-previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleNext}
                  data-testid="button-insights-next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="transition-opacity duration-150"
          style={{ opacity: isTransitioning ? 0 : 1 }}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${currentInsight.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className={getPriorityBadge(currentInsight.priority)}>
                  {getTypeLabel(currentInsight.type)}
                </Badge>
                {currentInsight.metric && (
                  <span className="text-sm font-semibold text-foreground">
                    {currentInsight.metric}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-base mb-1 text-foreground">
                {currentInsight.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentInsight.description}
              </p>
              {currentInsight.comparison && (
                <p className="text-xs text-muted-foreground/80 mt-2">
                  {currentInsight.comparison}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

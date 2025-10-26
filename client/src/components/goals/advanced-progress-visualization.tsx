import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  DollarSign, 
  PieChart, 
  BarChart3,
  Clock,
  Award,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { format, differenceInDays, differenceInMonths } from "date-fns";

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

interface AdvancedProgressVisualizationProps {
  goals: Goal[];
  onGoalClick?: (goal: Goal) => void;
}

export default function AdvancedProgressVisualization({ 
  goals, 
  onGoalClick 
}: AdvancedProgressVisualizationProps) {
  // Memoize filtered goals to prevent recreation on each render
  const activeGoals = useMemo(() => 
    goals.filter(goal => goal.status === 'active'),
    [goals]
  );
  
  const completedGoals = useMemo(() => 
    goals.filter(goal => goal.status === 'completed'),
    [goals]
  );
  
  // Memoize calculated totals
  const { totalSaved, totalTargets, overallProgress } = useMemo(() => {
    const saved = goals.reduce((sum, goal) => sum + parseFloat(goal.currentAmount), 0);
    const targets = goals.reduce((sum, goal) => sum + parseFloat(goal.targetAmount), 0);
    const progress = targets > 0 ? (saved / targets) * 100 : 0;
    return { totalSaved: saved, totalTargets: targets, overallProgress: progress };
  }, [goals]);
  
  // Calculate velocity (savings rate)
  const calculateVelocity = (goal: Goal) => {
    if (!goal.createdAt) return 0;
    const daysActive = differenceInDays(new Date(), new Date(goal.createdAt));
    if (daysActive <= 0) return 0;
    return parseFloat(goal.currentAmount) / daysActive;
  };

  // Calculate projected completion
  const calculateProjection = (goal: Goal) => {
    const velocity = calculateVelocity(goal);
    if (velocity <= 0) return null;
    
    const remaining = parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount);
    const daysNeeded = Math.ceil(remaining / velocity);
    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + daysNeeded);
    
    return projectedDate;
  };

  // Get goal status with smart insights
  const getGoalStatus = (goal: Goal) => {
    const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
    const daysRemaining = differenceInDays(new Date(goal.targetDate), new Date());
    const velocity = calculateVelocity(goal);
    const projectedDate = calculateProjection(goal);
    
    if (progress >= 100) {
      return { type: 'success', label: 'Completed', icon: CheckCircle, color: 'text-green-600' };
    }
    
    if (daysRemaining < 0) {
      return { type: 'danger', label: 'Overdue', icon: AlertTriangle, color: 'text-red-600' };
    }
    
    if (projectedDate && projectedDate > new Date(goal.targetDate)) {
      return { type: 'warning', label: 'At Risk', icon: AlertTriangle, color: 'text-yellow-600' };
    }
    
    if (progress >= 80) {
      return { type: 'success', label: 'On Track', icon: TrendingUp, color: 'text-green-600' };
    }
    
    if (velocity > 0) {
      return { type: 'info', label: 'Building', icon: TrendingUp, color: 'text-blue-600' };
    }
    
    return { type: 'neutral', label: 'Getting Started', icon: Target, color: 'text-gray-600' };
  };

  // Category performance analysis
  const categoryAnalysis = () => {
    const categories = activeGoals.reduce((acc, goal) => {
      const category = goal.category || 'other';
      if (!acc[category]) {
        acc[category] = { totalTarget: 0, totalSaved: 0, count: 0 };
      }
      acc[category].totalTarget += parseFloat(goal.targetAmount);
      acc[category].totalSaved += parseFloat(goal.currentAmount);
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { totalTarget: number; totalSaved: number; count: number }>);

    return Object.entries(categories).map(([category, data]) => ({
      category,
      progress: data.totalTarget > 0 ? (data.totalSaved / data.totalTarget) * 100 : 0,
      saved: data.totalSaved,
      target: data.totalTarget,
      count: data.count
    }));
  };

  const categoryData = useMemo(() => categoryAnalysis(), [activeGoals]);

  return (
    <div className="space-y-6">
      {/* Overall Progress Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-blue-900 dark:text-blue-100">
            <PieChart className="mr-2 h-5 w-5" />
            Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{activeGoals.length}</div>
              <div className="text-xs text-blue-600/70">Active Goals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedGoals.length}</div>
              <div className="text-xs text-green-600/70">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">${totalSaved.toLocaleString()}</div>
              <div className="text-xs text-purple-600/70">Total Saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{Math.round(overallProgress)}%</div>
              <div className="text-xs text-indigo-600/70">Overall Progress</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Portfolio Progress</span>
              <span>${totalSaved.toLocaleString()} of ${totalTargets.toLocaleString()}</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Category Performance Analysis */}
      {categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map(({ category, progress, saved, target, count }) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium capitalize">{category}</span>
                      <Badge variant="secondary" className="text-xs">{count} goals</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ${saved.toLocaleString()} / ${target.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {Math.round(progress)}% complete
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Goal Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Goal Analytics</h3>
        {activeGoals.map((goal) => {
          const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
          const status = getGoalStatus(goal);
          const velocity = calculateVelocity(goal);
          const projectedDate = calculateProjection(goal);
          const daysRemaining = differenceInDays(new Date(goal.targetDate), new Date());
          const monthlyNeeded = daysRemaining > 0 
            ? (parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount)) / (daysRemaining / 30)
            : 0;

          return (
            <Card key={goal.id} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onGoalClick?.(goal)}
                  data-testid={`card-goal-analytics-${goal.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg mb-1 truncate">{goal.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <status.icon className={`h-4 w-4 mr-1 ${status.color}`} />
                        <span className={status.color}>{status.label}</span>
                      </div>
                      {goal.category && (
                        <Badge variant="outline" className="capitalize">
                          {goal.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      ${parseFloat(goal.currentAmount).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      of ${parseFloat(goal.targetAmount).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{daysRemaining} days</div>
                        <div className="text-xs text-muted-foreground">remaining</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">${velocity.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">daily rate</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">${monthlyNeeded.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">monthly needed</div>
                      </div>
                    </div>
                    
                    {projectedDate && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {format(projectedDate, 'MMM dd')}
                          </div>
                          <div className="text-xs text-muted-foreground">projected</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {status.type === 'warning' && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Goal at risk
                          </div>
                          <div className="text-xs text-yellow-700 dark:text-yellow-300">
                            Current pace may not meet target date. Consider increasing contributions.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
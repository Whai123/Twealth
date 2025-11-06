import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, Target, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { ErrorState } from "@/components/ui/error-state";
import { queryClient } from "@/lib/queryClient";

export default function FinancialGoalsProgress() {
  const { data: goals, isLoading, error } = useQuery({
    queryKey: ["/api/financial-goals"],
    queryFn: () => fetch("/api/financial-goals").then(res => res.json()),
  });

  if (isLoading) {
    return (
      <Card className="p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-6"></div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 shadow-sm">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="text-lg font-semibold">Financial Goals Progress</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ErrorState 
            message="Failed to load goals. Please try again."
            onRetry={() => queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] })}
          />
        </CardContent>
      </Card>
    );
  }

  const activeGoals = goals?.filter((goal: any) => goal.status === "active") || [];

  return (
    <Card className="p-6 shadow-sm">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Financial Goals Progress</CardTitle>
          <Button variant="ghost" size="sm" data-testid="button-view-all-goals" asChild>
            <Link href="/financial-goals">View All</Link>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {activeGoals.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                <Target className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Start Your Financial Journey</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Set your first goal and track your progress towards financial freedom
              </p>
            </div>
            <Button data-testid="button-create-first-goal" asChild className="shadow-sm hover:shadow-md transition-shadow">
              <Link href="/financial-goals?create=1">
                <TrendingUp className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {activeGoals.slice(0, 3).map((goal: any) => {
              const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
              const remaining = parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount);
              
              return (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-foreground" data-testid={`text-goal-${goal.id}`}>
                        {goal.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Target: ${parseFloat(goal.targetAmount).toLocaleString()} by {new Date(goal.targetDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      ${parseFloat(goal.currentAmount).toLocaleString()} / ${parseFloat(goal.targetAmount).toLocaleString()}
                    </span>
                  </div>
                  <Progress value={progress} className="h-3 mb-1" />
                  <p className="text-xs text-muted-foreground">
                    {Math.round(progress)}% complete • ${remaining.toLocaleString()} remaining
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <Lightbulb className="text-primary mt-1" size={16} />
            <div>
              <h4 className="font-medium text-foreground">Smart Suggestion</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first financial goal to start tracking your progress towards your savings targets.
                Set realistic deadlines and amounts to stay motivated.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Lightbulb } from "lucide-react";

export default function FinancialGoalsProgress() {
  const { data: goals, isLoading } = useQuery({
    queryKey: ["/api/financial-goals"],
    queryFn: () => fetch("/api/financial-goals?userId=demo").then(res => res.json()),
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

  const activeGoals = goals?.filter((goal: any) => goal.status === "active") || [];

  return (
    <Card className="p-6 shadow-sm">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Financial Goals Progress</CardTitle>
          <Button variant="ghost" size="sm" data-testid="button-view-all-goals">
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {activeGoals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No active financial goals yet</p>
            <Button data-testid="button-create-first-goal">Create Your First Goal</Button>
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

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, MoreHorizontal, Edit, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import GoalForm from "@/components/forms/goal-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FinancialGoals() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFirstGoalDialogOpen, setIsFirstGoalDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: ["/api/financial-goals"],
    queryFn: () => fetch("/api/financial-goals").then(res => res.json()),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => apiRequest("DELETE", `/api/financial-goals/${goalId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
      toast({
        title: "Goal deleted",
        description: "The financial goal has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteGoal = (goalId: string) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      deleteGoalMutation.mutate(goalId);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20">Completed</Badge>;
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20">Paused</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <>
        {/* Header - Modern Design (Loading State) */}
        <header 
          className="bg-card/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-30"
          style={{ 
            paddingLeft: 'var(--space-4)', 
            paddingRight: 'var(--space-4)',
            paddingTop: 'var(--space-4)',
            paddingBottom: 'var(--space-4)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 
                className="text-xl md:text-2xl font-bold text-brand flex items-center"
                style={{ fontSize: 'clamp(var(--text-xl), 4vw, var(--text-2xl))' }}
              >
                <Target className="mr-2 text-brand" size={20} />
                Financial Goals
              </h1>
              <p 
                className="text-muted-foreground font-medium truncate"
                style={{ 
                  fontSize: 'var(--text-sm)',
                  marginTop: 'var(--space-1)'
                }}
              >
                Track your savings targets and progress
              </p>
            </div>
            <div className="flex items-center">
              <Button 
                disabled
                className="bg-primary/50 text-primary-foreground min-h-[44px]"
                style={{ 
                  borderRadius: 'var(--radius)',
                  padding: 'var(--space-3) var(--space-4)'
                }}
              >
                <Plus size={16} className="mr-2" />
                <span className="hidden sm:inline">New Goal</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          </div>
        </header>

        <div style={{ padding: 'var(--space-6)', paddingTop: 'var(--space-4)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  const financialGoals = goals || [];

  return (
    <>
      {/* Header - Modern Design */}
      <header 
        className="bg-card/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-30"
        style={{ 
          paddingLeft: 'var(--space-4)', 
          paddingRight: 'var(--space-4)',
          paddingTop: 'var(--space-4)',
          paddingBottom: 'var(--space-4)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 
              className="text-xl md:text-2xl font-bold text-brand flex items-center"
              style={{ fontSize: 'clamp(var(--text-xl), 4vw, var(--text-2xl))' }}
            >
              <Target className="mr-2 text-brand" size={20} />
              Financial Goals
            </h1>
            <p 
              className="text-muted-foreground font-medium truncate"
              style={{ 
                fontSize: 'var(--text-sm)',
                marginTop: 'var(--space-1)'
              }}
            >
              Track your savings targets and progress
            </p>
          </div>
          <div className="flex items-center">
            <Drawer open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DrawerTrigger asChild>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-px min-h-[44px]"
                  style={{ 
                    borderRadius: 'var(--radius)',
                    padding: 'var(--space-3) var(--space-4)'
                  }}
                  data-testid="button-create-goal"
                >
                  <Plus size={16} className="mr-2" />
                  <span className="hidden sm:inline">New Goal</span>
                  <span className="sm:hidden">+</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[90vh]">
                <div className="p-4 pb-6">
                  <DrawerTitle className="text-xl font-semibold mb-2">Create New Goal</DrawerTitle>
                  <DrawerDescription className="text-muted-foreground mb-4">
                    Set up a new financial goal to track your savings progress
                  </DrawerDescription>
                  <GoalForm onSuccess={() => setIsCreateDialogOpen(false)} />
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </header>

      <div style={{ padding: 'var(--space-6)', paddingTop: 'var(--space-4)' }}>

      {/* Goals Grid */}
      {financialGoals.length === 0 ? (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No financial goals yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first financial goal to start tracking your savings progress
          </p>
          <Drawer open={isFirstGoalDialogOpen} onOpenChange={setIsFirstGoalDialogOpen}>
            <DrawerTrigger asChild>
              <Button data-testid="button-create-first-goal" className="min-h-[44px]">
                <Plus size={16} className="mr-2" />
                Create Your First Goal
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[90vh]">
              <div className="p-4 pb-6">
                <DrawerTitle className="text-xl font-semibold mb-2">Create Your First Goal</DrawerTitle>
                <DrawerDescription className="text-muted-foreground mb-4">
                  Start your financial journey by setting up your first savings goal
                </DrawerDescription>
                <GoalForm onSuccess={() => setIsFirstGoalDialogOpen(false)} />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Saved</p>
                  <p className="text-2xl font-bold">
                    ${financialGoals.reduce((sum: number, goal: any) => sum + parseFloat(goal.currentAmount), 0).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Goals</p>
                  <p className="text-2xl font-bold">
                    {financialGoals.filter((goal: any) => goal.status === "active").length}
                  </p>
                </div>
                <Target className="text-blue-600" size={24} />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Progress</p>
                  <p className="text-2xl font-bold">
                    {Math.round(
                      financialGoals.reduce((sum: number, goal: any) => {
                        const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
                        return sum + progress;
                      }, 0) / financialGoals.length
                    )}%
                  </p>
                </div>
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </Card>
          </div>

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {financialGoals.map((goal: any) => {
              const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
              const remaining = parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount);
              const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <Card key={goal.id} className="p-6 hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0 mb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg" data-testid={`text-goal-title-${goal.id}`}>
                        {goal.title}
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-goal-menu-${goal.id}`}>
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit size={16} className="mr-2" />
                            Edit Goal
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 size={16} className="mr-2" />
                            Delete Goal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between mb-2">
                      {getStatusBadge(goal.status)}
                      <span className="text-sm text-muted-foreground">
                        {goal.category && goal.category.charAt(0).toUpperCase() + goal.category.slice(1)}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>${parseFloat(goal.currentAmount).toLocaleString()}</span>
                        <span>${parseFloat(goal.targetAmount).toLocaleString()}</span>
                      </div>
                      <Progress 
                        value={progress} 
                        className="h-3"
                        // Apply dynamic color class
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{Math.round(progress)}% complete</span>
                        <span>${remaining.toLocaleString()} remaining</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Date:</span>
                        <span>{new Date(goal.targetDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Days Left:</span>
                        <span className={daysLeft < 30 ? "text-red-600" : daysLeft < 90 ? "text-yellow-600" : "text-green-600"}>
                          {daysLeft > 0 ? `${daysLeft} days` : "Overdue"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        Add Funds
                      </Button>
                      <Button size="sm" className="flex-1">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
      </div>
    </>
  );
}

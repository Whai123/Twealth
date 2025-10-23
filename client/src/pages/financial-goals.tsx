import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, MoreHorizontal, Edit, Trash2, TrendingUp, DollarSign, Calendar, BarChart3, Lightbulb, Award, Settings, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GoalForm from "@/components/forms/goal-form";
import EditGoalForm from "@/components/forms/edit-goal-form";
import AddFundsForm from "@/components/forms/add-funds-form";
import AdvancedProgressVisualization from "@/components/goals/advanced-progress-visualization";
import SmartGoalInsights from "@/components/goals/smart-goal-insights";
import AutomatedSavingsSuggestions from "@/components/goals/automated-savings-suggestions";
import AchievementMilestones from "@/components/goals/achievement-milestones";
import ShareGoalDialog from "@/components/sharing/share-goal-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Component to show recent contributions for a goal
function RecentContributions({ goalId }: { goalId: string }) {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions", goalId],
    queryFn: () => fetch(`/api/transactions?goalId=${goalId}&limit=5`).then(res => res.json()),
  });

  if (isLoading) {
    return (
      <div>
        <h4 className="font-semibold mb-3">Recent Contributions</h4>
        <div className="animate-pulse space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <div className="h-3 bg-muted rounded w-20"></div>
                <div className="h-2 bg-muted rounded w-32"></div>
              </div>
              <div className="h-4 bg-muted rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const recentTransactions = transactions || [];

  return (
    <div>
      <h4 className="font-semibold mb-3">Recent Contributions</h4>
      {recentTransactions.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <DollarSign className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">No contributions yet</p>
          <p className="text-xs">Start adding funds or income to see contributions here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentTransactions.map((transaction: any) => (
            <div key={transaction.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className={`p-1.5 rounded-full ${transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                  {transaction.type === 'income' ? (
                    <TrendingUp className={`h-3 w-3 ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
                  ) : (
                    <DollarSign className={`h-3 w-3 ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {transaction.type === 'income' ? 'Income' : 'Transfer'}
                    {transaction.category && ` • ${transaction.category}`}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {transaction.description || `${transaction.type === 'income' ? 'Income' : 'Transfer'} contribution`}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  +${parseFloat(transaction.amount).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
          {recentTransactions.length === 5 && (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">Showing last 5 contributions</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FinancialGoals() {
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFirstGoalDialogOpen, setIsFirstGoalDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Check for create query parameter and open dialog automatically
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === '1') {
      setIsCreateDialogOpen(true);
      // Clean up URL by removing the query parameter
      window.history.replaceState({}, '', '/financial-goals');
    }
  }, []);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddFundsDialogOpen, setIsAddFundsDialogOpen] = useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: ["/api/financial-goals"],
    queryFn: () => fetch("/api/financial-goals").then(res => res.json()),
  });

  const financialGoals = goals || [];

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

  const handleEditGoal = (goal: any) => {
    setSelectedGoal(goal);
    setIsEditDialogOpen(true);
  };

  const handleAddFunds = (goal: any) => {
    setSelectedGoal(goal);
    setIsAddFundsDialogOpen(true);
  };

  const handleViewDetails = (goal: any) => {
    setSelectedGoal(goal);
    setIsViewDetailsDialogOpen(true);
  };

  const handleShareGoal = (goal: any) => {
    setSelectedGoal(goal);
    setIsShareDialogOpen(true);
  };

  const handleInsightAction = (action: string, goalId?: string) => {
    switch (action) {
      case 'review-timeline':
        if (goalId) {
          const goal = financialGoals.find((g: any) => g.id === goalId);
          if (goal) handleEditGoal(goal);
        }
        break;
      case 'quick-contribute':
        if (goalId) {
          const goal = financialGoals.find((g: any) => g.id === goalId);
          if (goal) handleAddFunds(goal);
        } else if (financialGoals.length > 0) {
          handleAddFunds(financialGoals[0]);
        }
        break;
      case 'create-short-term':
        setIsCreateDialogOpen(true);
        break;
      default:
        toast({
          title: "Coming Soon",
          description: "This feature will be available in a future update.",
        });
    }
  };

  const handleSavingsSuggestion = (suggestion: any) => {
    toast({
      title: "Suggestion Noted",
      description: `We'll help you implement: ${suggestion.title}`,
    });
  };

  const handleCelebrateMilestone = (milestone: any) => {
    toast({
      title: "🎉 Congratulations!",
      description: `You've unlocked: ${milestone.title}`,
    });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/30 dark:via-emerald-900/30 dark:to-teal-900/30">
      {/* Mobile-First Responsive Header */}
      <header className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/50 dark:via-emerald-900/50 dark:to-teal-900/50 border-b border-border/50 sticky top-0 z-30 backdrop-blur-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg sm:shadow-xl animate-pulse flex-shrink-0">
                  <Target className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent truncate">
                    🎯 Financial Goals
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground truncate">AI-powered savings optimization and goal tracking</p>
                </div>
              </div>
              
              {/* Mobile-First Goals Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 transition-all hover:scale-105 active:scale-95">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    <span className="text-xs sm:text-sm font-medium truncate">Total Saved</span>
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                    ${financialGoals.reduce((sum: number, goal: any) => sum + parseFloat(goal.currentAmount), 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">Across all goals</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 transition-all hover:scale-105 active:scale-95">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                    <span className="text-xs sm:text-sm font-medium truncate">Active Goals</span>
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600">
                    {financialGoals.filter((goal: any) => goal.status === "active").length}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">In progress</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 transition-all hover:scale-105 active:scale-95">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" />
                    <span className="text-xs sm:text-sm font-medium truncate">Progress</span>
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-teal-600">
                    {financialGoals.length > 0 ? Math.round(
                      financialGoals.reduce((sum: number, goal: any) => {
                        const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
                        return sum + progress;
                      }, 0) / financialGoals.length
                    ) : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground truncate">Average completion</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 transition-all hover:scale-105 active:scale-95">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                    <span className="text-xs sm:text-sm font-medium truncate">Completed</span>
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">
                    {financialGoals.filter((goal: any) => goal.status === "completed").length}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">Goals achieved</div>
                </div>
              </div>
            </div>
            
            {/* Mobile-First Action Button */}
            <div className="flex items-center gap-2 sm:gap-3 sm:ml-4 md:ml-6 w-full sm:w-auto">
              <Drawer open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DrawerTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white font-semibold px-4 sm:px-6 min-h-[44px] h-11 sm:h-12 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl active:scale-95 flex-1 sm:flex-initial"
                    data-testid="button-create-goal"
                  >
                    <Plus size={16} className="sm:mr-2" />
                    <span className="hidden sm:inline">💰 New Goal</span>
                    <span className="sm:hidden text-xs">New Goal</span>
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
          
          {/* Mobile-First Welcome Message */}
          <div className="bg-gradient-to-r from-white/80 to-green-50/80 dark:from-gray-800/80 dark:to-green-900/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/20">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-green-800 dark:text-green-200">Smart Savings 💡</h2>
                <p className="text-xs sm:text-sm md:text-base text-green-600 dark:text-green-300 line-clamp-2 sm:line-clamp-none">AI optimizes your savings strategy and suggests the best paths to reach your financial goals faster.</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 p-1">
            <TabsTrigger value="overview" className="flex items-center justify-center gap-1.5 px-2 text-sm" data-testid="tab-overview">
              <Target className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center justify-center gap-1.5 px-2 text-sm" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center justify-center gap-1.5 px-2 text-sm" data-testid="tab-insights">
              <Lightbulb className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center justify-center gap-1.5 px-2 text-sm" data-testid="tab-achievements">
              <Award className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Awards</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
          {/* Mobile-First Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
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

          {/* Mobile-First Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {financialGoals.map((goal: any) => {
              const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
              const remaining = parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount);
              const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <Card key={goal.id} className="p-6 hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0 mb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle 
                        className="text-lg truncate pr-2" 
                        data-testid={`text-goal-title-${goal.id}`}
                        title={goal.title}
                      >
                        {goal.title}
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-goal-menu-${goal.id}`}>
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditGoal(goal)}>
                            <Edit size={16} className="mr-2" />
                            Edit Goal
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareGoal(goal)}>
                            <Share2 size={16} className="mr-2" />
                            Share with Friends
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
                      <p 
                        className="text-sm text-muted-foreground line-clamp-2" 
                        title={goal.description}
                      >
                        {goal.description}
                      </p>
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleAddFunds(goal)}
                        data-testid={`button-add-funds-${goal.id}`}
                      >
                        Add Funds
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewDetails(goal)}
                        data-testid={`button-view-details-${goal.id}`}
                      >
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
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <AdvancedProgressVisualization 
          goals={financialGoals} 
          onGoalClick={handleViewDetails}
        />
      </TabsContent>

      <TabsContent value="insights" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SmartGoalInsights 
            goals={financialGoals}
            onActionClick={handleInsightAction}
          />
          <AutomatedSavingsSuggestions 
            goals={financialGoals}
            onImplementSuggestion={handleSavingsSuggestion}
          />
        </div>
      </TabsContent>

      <TabsContent value="achievements" className="space-y-6">
        <AchievementMilestones 
          goals={financialGoals}
          onCelebrate={handleCelebrateMilestone}
        />
      </TabsContent>
      
      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedGoal && (
            <EditGoalForm 
              goal={selectedGoal} 
              onSuccess={() => setIsEditDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add Funds Dialog */}
      <Dialog open={isAddFundsDialogOpen} onOpenChange={setIsAddFundsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          {selectedGoal && (
            <AddFundsForm 
              goalId={selectedGoal.id}
              goalTitle={selectedGoal.title}
              currentAmount={selectedGoal.currentAmount}
              targetAmount={selectedGoal.targetAmount}
              onSuccess={() => setIsAddFundsDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Share Goal Dialog */}
      {selectedGoal && (
        <ShareGoalDialog
          goalId={selectedGoal.id}
          goalTitle={selectedGoal.title}
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
        />
      )}
      
      {/* View Details Dialog */}
      <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {selectedGoal && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{selectedGoal.title}</h3>
                  {selectedGoal.description && (
                    <p className="text-muted-foreground">{selectedGoal.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-sm text-muted-foreground">Current Amount</h4>
                    <p className="text-2xl font-bold text-green-600">
                      ${parseFloat(selectedGoal.currentAmount).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-sm text-muted-foreground">Target Amount</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      ${parseFloat(selectedGoal.targetAmount).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Progress</h4>
                  <Progress 
                    value={(parseFloat(selectedGoal.currentAmount) / parseFloat(selectedGoal.targetAmount)) * 100} 
                    className="h-4 mb-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{Math.round((parseFloat(selectedGoal.currentAmount) / parseFloat(selectedGoal.targetAmount)) * 100)}% complete</span>
                    <span>${(parseFloat(selectedGoal.targetAmount) - parseFloat(selectedGoal.currentAmount)).toLocaleString()} remaining</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Target Date</h4>
                    <p className="text-lg">{new Date(selectedGoal.targetDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Status</h4>
                    <div className="mt-1">{getStatusBadge(selectedGoal.status)}</div>
                  </div>
                </div>
                
                {/* Recent Contributions */}
                <RecentContributions goalId={selectedGoal.id} />
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsViewDetailsDialogOpen(false);
                      handleEditGoal(selectedGoal);
                    }}
                    className="flex-1"
                    data-testid="button-edit-from-details"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit Goal
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsViewDetailsDialogOpen(false);
                      handleAddFunds(selectedGoal);
                    }}
                    className="flex-1"
                    data-testid="button-add-funds-from-details"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Funds
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </Tabs>
      </div>
    </div>
  );
}

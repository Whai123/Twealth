import { useState, useEffect } from"react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from"@tanstack/react-query";
import { Plus, Target, MoreHorizontal, Edit, Trash2, TrendingUp, DollarSign, Calendar, BarChart3, Lightbulb, Award, Settings, Share2, CheckCircle2, AlertCircle } from"lucide-react";
import { Button } from"@/components/ui/button";
import EmptyState from"@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Progress } from"@/components/ui/progress";
import { Badge } from"@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from"@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle, DrawerDescription } from"@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from"@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs";
import GoalForm from"@/components/forms/goal-form";
import EditGoalForm from"@/components/forms/edit-goal-form";
import AddFundsForm from"@/components/forms/add-funds-form";
import AdvancedProgressVisualization from"@/components/goals/advanced-progress-visualization";
import SmartGoalInsights from"@/components/goals/smart-goal-insights";
import AutomatedSavingsSuggestions from"@/components/goals/automated-savings-suggestions";
import AchievementMilestones from"@/components/goals/achievement-milestones";
import ShareGoalDialog from"@/components/sharing/share-goal-dialog";
import { apiRequest } from"@/lib/queryClient";
import { useToast } from"@/hooks/use-toast";

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
    <div className="space-y-2">
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
    title:"Goal deleted",
    description:"The financial goal has been successfully deleted.",
    icon: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
   });
  },
  onError: (error: any) => {
   toast({
    title:"Couldn't Delete Goal",
    description: error.message ||"Something went wrong. Please try again.",
    variant:"destructive",
    icon: <AlertCircle className="h-5 w-5" />,
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
     title:"Coming Soon",
     description:"This feature will be available in a future update.",
    });
  }
 };

 const handleSavingsSuggestion = (suggestion: any) => {
  toast({
   title:"Suggestion Noted",
   description: `We'll help you implement: ${suggestion.title}`,
  });
 };

 const handleCelebrateMilestone = (milestone: any) => {
  toast({
   title:"Congratulations!",
   description: `You've unlocked: ${milestone.title}`,
  });
 };

 const getProgressColor = (progress: number) => {
  if (progress >= 80) return"bg-green-500";
  if (progress >= 50) return"bg-blue-500";
  if (progress >= 25) return"bg-yellow-500";
  return"bg-red-500";
 };

 const getStatusBadge = (status: string) => {
  switch (status) {
   case"active":
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20">Active</Badge>;
   case"completed":
    return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20">Completed</Badge>;
   case"paused":
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20">Paused</Badge>;
   default:
    return <Badge variant="secondary">{status}</Badge>;
  }
 };

 if (isLoading) {
  return (
   <div className="min-h-screen bg-background">
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
     <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
      <div className="h-8 bg-muted/50 rounded w-48 mb-2" />
      <div className="h-4 bg-muted/50 rounded w-64" />
     </div>
    </header>
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
       <Card key={i} className="p-6 border-border/50">
        <div className="h-6 bg-muted/50 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-muted/50 rounded w-1/2 mb-4"></div>
        <div className="h-3 bg-muted/50 rounded w-full mb-2"></div>
        <div className="h-4 bg-muted/50 rounded w-1/3"></div>
       </Card>
      ))}
     </div>
    </div>
   </div>
  );
 }

 }

 return (
  <div className="min-h-screen bg-background">
   {/* First Goal Drawer - Must be mounted before empty state renders */}
   <Drawer open={isFirstGoalDialogOpen} onOpenChange={setIsFirstGoalDialogOpen}>
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
   
   {/* Clean Professional Header - Stripe/Coinbase Style */}
   <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
     <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
       <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
        Financial Goals
       </h1>
       <p className="text-sm text-muted-foreground mt-1">Track your savings progress and achieve your financial targets</p>
      </div>
      
      <Drawer open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
       <DrawerTrigger asChild>
        <Button 
         className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm min-h-[44px]"
         data-testid="button-create-goal"
        >
         <Plus className="h-4 w-4 sm:mr-2" />
         <span className="hidden sm:inline">New Goal</span>
         <span className="sm:hidden">New</span>
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
   
   <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8">
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
     <TabsList className="grid w-full grid-cols-4 h-auto">
      <TabsTrigger value="overview" data-testid="tab-overview" className="text-xs sm:text-sm min-h-[44px] py-3 sm:py-2.5" aria-label="Overview">
       <Target className="h-4 w-4 sm:mr-2" />
       <span className="sr-only sm:not-sr-only">Overview</span>
      </TabsTrigger>
      <TabsTrigger value="analytics" data-testid="tab-analytics" className="text-xs sm:text-sm min-h-[44px] py-3 sm:py-2.5" aria-label="Analytics">
       <BarChart3 className="h-4 w-4 sm:mr-2" />
       <span className="sr-only sm:not-sr-only">Analytics</span>
      </TabsTrigger>
      <TabsTrigger value="insights" data-testid="tab-insights" className="text-xs sm:text-sm min-h-[44px] py-3 sm:py-2.5" aria-label="Insights">
       <Lightbulb className="h-4 w-4 sm:mr-2" />
       <span className="sr-only sm:not-sr-only">Insights</span>
      </TabsTrigger>
      <TabsTrigger value="achievements" data-testid="tab-achievements" className="text-xs sm:text-sm min-h-[44px] py-3 sm:py-2.5" aria-label="Achievements">
       <Award className="h-4 w-4 sm:mr-2" />
       <span className="sr-only sm:not-sr-only">Achievements</span>
      </TabsTrigger>
     </TabsList>

     <TabsContent value="overview" className="space-y-6">
      {/* Goals Grid */}
      {financialGoals.length === 0 ? (
       <EmptyState
        illustration="goals"
        title="No Financial Goals Yet"
        description="Create your first financial goal to start tracking your savings progress and build your future."
        actionLabel="Create Your First Goal"
        onAction={() => setIsFirstGoalDialogOpen(true)}
        actionTestId="button-create-first-goal"
       />
      ) : (
    <>
     {/* Premium Summary Cards - Mobile Optimized */}
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="group relative overflow-hidden p-4 sm:p-6 border-border/50">
       <div className="relative">
        <div className="flex items-center gap-2 mb-3">
         <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 dark:bg-green-950/30">
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
         </div>
         <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Saved</span>
        </div>
        <p className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-green-600 dark:text-green-400">
         ${financialGoals.reduce((sum: number, goal: any) => sum + parseFloat(goal.currentAmount), 0).toLocaleString()}
        </p>
       </div>
      </Card>
      
      <Card className="group relative overflow-hidden p-4 sm:p-6 border-border/50">
       <div className="relative">
        <div className="flex items-center gap-2 mb-3">
         <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 dark:bg-blue-950/30">
          <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
         </div>
         <span className="text-xs sm:text-sm font-medium text-muted-foreground">Active Goals</span>
        </div>
        <p className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
         {financialGoals.filter((goal: any) => goal.status ==="active").length}
        </p>
       </div>
      </Card>
      
      <Card className="group relative overflow-hidden p-4 sm:p-6 border-border/50">
       <div className="relative">
        <div className="flex items-center gap-2 mb-3">
         <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 dark:bg-purple-950/30">
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
         </div>
         <span className="text-xs sm:text-sm font-medium text-muted-foreground">Avg Progress</span>
        </div>
        <p className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
         {Math.round(
          financialGoals.reduce((sum: number, goal: any) => {
           const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
           return sum + progress;
          }, 0) / financialGoals.length
         )}<span className="text-lg sm:text-xl md:text-2xl text-muted-foreground/60">%</span>
        </p>
       </div>
      </Card>
     </div>

     {/* Mobile-First Goals Grid */}
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {financialGoals.map((goal: any) => {
       const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
       const remaining = parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount);
       const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
       
       return (
        <Card key={goal.id} className="p-4 sm:p-6">
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
            <span className={daysLeft < 30 ?"text-red-600" : daysLeft < 90 ?"text-yellow-600" :"text-green-600"}>
             {daysLeft > 0 ? `${daysLeft} days` :"Overdue"}
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

import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Target, MoreHorizontal, Edit, Trash2, TrendingUp, DollarSign, 
  Calendar, BarChart3, Lightbulb, Award, Settings, Share2, CheckCircle2, 
  AlertCircle, Sparkles, Clock, Zap, Trophy, Star, PiggyBank
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import { Skeleton, SkeletonGoal } from "@/components/ui/skeleton";
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
import { CollapsibleList } from "@/components/virtual-list";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function AnimatedNumber({ value, prefix = "$", delay = 0 }: { value: number; prefix?: string; delay?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(current);
        }
      }, duration / steps);
      
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return <span>{prefix}{Math.round(displayValue).toLocaleString()}</span>;
}

function CircularProgress({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  delay = 0 
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  delay?: number;
}) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedProgress / 100) * circumference;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1200;
      const steps = 60;
      const increment = progress / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= progress) {
          setAnimatedProgress(progress);
          clearInterval(interval);
        } else {
          setAnimatedProgress(current);
        }
      }, duration / steps);
      
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [progress, delay]);
  
  const getProgressColor = () => {
    if (animatedProgress >= 80) return "stroke-green-500";
    if (animatedProgress >= 50) return "stroke-primary";
    if (animatedProgress >= 25) return "stroke-amber-500";
    return "stroke-red-500";
  };
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="stroke-muted"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${getProgressColor()} transition-all duration-300`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl sm:text-2xl font-bold">{Math.round(animatedProgress)}%</span>
      </div>
    </div>
  );
}

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
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
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
          {recentTransactions.map((transaction: any, index: number) => (
            <motion.div 
              key={transaction.id} 
              className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
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
                    {transaction.category && ` - ${transaction.category}`}
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
            </motion.div>
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

function GoalCard({ 
  goal, 
  onEdit, 
  onDelete, 
  onAddFunds, 
  onViewDetails, 
  onShare,
  delay = 0
}: { 
  goal: any; 
  onEdit: () => void; 
  onDelete: () => void; 
  onAddFunds: () => void; 
  onViewDetails: () => void;
  onShare: () => void;
  delay?: number;
}) {
  const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
  const remaining = parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount);
  const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  const getDaysColor = () => {
    if (daysLeft < 0) return "text-red-600 dark:text-red-400";
    if (daysLeft < 30) return "text-amber-600 dark:text-amber-400";
    return "text-green-600 dark:text-green-400";
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">Completed</Badge>;
      case "paused":
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">Paused</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="group relative overflow-hidden border-border/40 hover:shadow-lg hover:border-border transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" 
          style={{ 
            clipPath: `inset(0 ${100 - Math.min(progress, 100)}% 0 0)` 
          }} 
        />
        
        <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getStatusBadge(goal.status)}
                {progress >= 100 && (
                  <Badge className="bg-primary/10 text-primary border-0">
                    <Trophy className="w-3 h-3 mr-1" />
                    Goal Reached
                  </Badge>
                )}
              </div>
              <CardTitle 
                className="text-base sm:text-lg font-semibold truncate" 
                data-testid={`text-goal-title-${goal.id}`}
                title={goal.title}
              >
                {goal.title}
              </CardTitle>
              {goal.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1" title={goal.description}>
                  {goal.description}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`button-goal-menu-${goal.id}`}>
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit size={16} className="mr-2" />
                  Edit Goal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onShare}>
                  <Share2 size={16} className="mr-2" />
                  Share with Friends
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  <Trash2 size={16} className="mr-2" />
                  Delete Goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
            <CircularProgress progress={Math.min(progress, 100)} size={80} strokeWidth={6} delay={delay * 1000 + 200} />
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="text-lg sm:text-xl font-bold text-primary">
                  <AnimatedNumber value={parseFloat(goal.currentAmount)} delay={delay * 1000 + 100} />
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="text-sm font-medium">${parseFloat(goal.targetAmount).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-muted/50">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Time Left</p>
                <p className={`text-xs sm:text-sm font-semibold ${getDaysColor()}`}>
                  {daysLeft > 0 ? `${daysLeft} days` : daysLeft === 0 ? "Due today" : "Overdue"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-muted/50">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Remaining</p>
                <p className="text-xs sm:text-sm font-semibold">${remaining.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {daysLeft > 0 && remaining > 0 && (
            <div className="p-2.5 sm:p-3 rounded-lg bg-primary/5 border border-primary/10 mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Save <span className="font-semibold text-foreground">${Math.ceil(remaining / daysLeft).toLocaleString()}/day</span> to reach your goal
                </p>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs h-9"
              onClick={onAddFunds}
              data-testid={`button-add-funds-${goal.id}`}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Funds
            </Button>
            <Button 
              size="sm" 
              className="flex-1 text-xs h-9"
              onClick={onViewDetails}
              data-testid={`button-view-details-${goal.id}`}
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SummaryCard({ 
  title, 
  value, 
  icon: Icon, 
  colorClass, 
  bgClass,
  delay = 0,
  suffix = ""
}: { 
  title: string; 
  value: number; 
  icon: any; 
  colorClass: string; 
  bgClass: string;
  delay?: number;
  suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="border-border/40 hover:shadow-md transition-shadow">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className={`p-2 rounded-xl ${bgClass}`}>
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClass}`} />
            </div>
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</span>
          </div>
          <p className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${colorClass}`}>
            <AnimatedNumber value={value} prefix={suffix ? "" : "$"} delay={delay * 1000} />
            {suffix && <span className="text-lg sm:text-xl text-muted-foreground/60">{suffix}</span>}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function FinancialGoals() {
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFirstGoalDialogOpen, setIsFirstGoalDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === '1') {
      setIsCreateDialogOpen(true);
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
        icon: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Couldn't Delete Goal",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
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
      title: "Congratulations!",
      description: `You've unlocked: ${milestone.title}`,
    });
  };

  const totalSaved = financialGoals.reduce((sum: number, goal: any) => sum + parseFloat(goal.currentAmount || 0), 0);
  const activeGoals = financialGoals.filter((goal: any) => goal.status === "active").length;
  const avgProgress = financialGoals.length > 0 
    ? Math.round(financialGoals.reduce((sum: number, goal: any) => {
        const progress = (parseFloat(goal.currentAmount || 0) / parseFloat(goal.targetAmount || 1)) * 100;
        return sum + progress;
      }, 0) / financialGoals.length)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </header>
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-10 w-10 rounded-xl mb-3" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonGoal key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
      
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <motion.div 
              className="flex-1 min-w-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                Financial Goals
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                Track your savings progress and achieve your financial targets
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Drawer open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DrawerTrigger asChild>
                  <Button 
                    className="shadow-sm min-h-[44px]"
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
            </motion.div>
          </div>
        </div>
      </header>
      
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TabsList className="grid w-full grid-cols-4 h-auto bg-muted/50">
              <TabsTrigger value="overview" data-testid="tab-overview" className="text-xs sm:text-sm min-h-[44px] py-2.5 sm:py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm" aria-label="Overview">
                <Target className="h-4 w-4 sm:mr-2" />
                <span className="sr-only sm:not-sr-only">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" data-testid="tab-analytics" className="text-xs sm:text-sm min-h-[44px] py-2.5 sm:py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm" aria-label="Analytics">
                <BarChart3 className="h-4 w-4 sm:mr-2" />
                <span className="sr-only sm:not-sr-only">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="insights" data-testid="tab-insights" className="text-xs sm:text-sm min-h-[44px] py-2.5 sm:py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm" aria-label="Insights">
                <Lightbulb className="h-4 w-4 sm:mr-2" />
                <span className="sr-only sm:not-sr-only">Insights</span>
              </TabsTrigger>
              <TabsTrigger value="achievements" data-testid="tab-achievements" className="text-xs sm:text-sm min-h-[44px] py-2.5 sm:py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm" aria-label="Achievements">
                <Award className="h-4 w-4 sm:mr-2" />
                <span className="sr-only sm:not-sr-only">Achievements</span>
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <SummaryCard
                    title="Total Saved"
                    value={totalSaved}
                    icon={PiggyBank}
                    colorClass="text-green-600 dark:text-green-400"
                    bgClass="bg-green-100 dark:bg-green-900/30"
                    delay={0}
                  />
                  <SummaryCard
                    title="Active Goals"
                    value={activeGoals}
                    icon={Target}
                    colorClass="text-primary"
                    bgClass="bg-primary/10"
                    delay={0.1}
                    suffix=""
                  />
                  <SummaryCard
                    title="Avg Progress"
                    value={avgProgress}
                    icon={TrendingUp}
                    colorClass="text-blue-600 dark:text-blue-400"
                    bgClass="bg-blue-100 dark:bg-blue-900/30"
                    delay={0.2}
                    suffix="%"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <AnimatePresence mode="popLayout">
                    {financialGoals.map((goal: any, index: number) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onEdit={() => handleEditGoal(goal)}
                        onDelete={() => handleDeleteGoal(goal.id)}
                        onAddFunds={() => handleAddFunds(goal)}
                        onViewDetails={() => handleViewDetails(goal)}
                        onShare={() => handleShareGoal(goal)}
                        delay={index * 0.1}
                      />
                    ))}
                  </AnimatePresence>
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
        </Tabs>
        
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
        
        {selectedGoal && (
          <ShareGoalDialog
            goalId={selectedGoal.id}
            goalTitle={selectedGoal.title}
            open={isShareDialogOpen}
            onOpenChange={setIsShareDialogOpen}
          />
        )}
        
        <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedGoal && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">{selectedGoal.title}</h2>
                  {selectedGoal.description && (
                    <p className="text-muted-foreground text-sm">{selectedGoal.description}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-center py-6">
                  <CircularProgress 
                    progress={Math.min((parseFloat(selectedGoal.currentAmount) / parseFloat(selectedGoal.targetAmount)) * 100, 100)} 
                    size={160} 
                    strokeWidth={12}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Current Amount</p>
                    <p className="text-xl font-bold text-green-600">${parseFloat(selectedGoal.currentAmount).toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Target Amount</p>
                    <p className="text-xl font-bold">${parseFloat(selectedGoal.targetAmount).toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                    <p className="text-xl font-bold">${(parseFloat(selectedGoal.targetAmount) - parseFloat(selectedGoal.currentAmount)).toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Target Date</p>
                    <p className="text-xl font-bold">{new Date(selectedGoal.targetDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <RecentContributions goalId={selectedGoal.id} />
                
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => handleEditGoal(selectedGoal)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Goal
                  </Button>
                  <Button className="flex-1" onClick={() => { setIsViewDetailsDialogOpen(false); handleAddFunds(selectedGoal); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Funds
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

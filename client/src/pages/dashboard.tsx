import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Target, Sparkles, TrendingUp, TrendingDown, Brain, ChevronRight, Award, Star, Zap, DollarSign, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import NotificationsBell from "@/components/dashboard/notifications-bell";
import OnboardingWizard from "@/components/onboarding/onboarding-wizard";
import { useOnboarding } from "@/hooks/use-onboarding";
import { UserPreferences, FinancialGoal } from "@shared/schema";
import { SmartNudgeBanner } from "@/components/smart-nudges";
import { StreakWidget, AchievementBadges } from "@/components/streak-system";

interface DashboardStats {
  totalTransactions: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  totalGoals: number;
  activeGoalsCount: number;
  netWorth?: number;
}

interface FinancialHealthResponse {
  overall: number;
  grade: string;
  breakdown: {
    savingsRate?: { value: number; score: number; weight: number };
    emergencyFund?: { months: number; score: number; weight: number };
    goalProgress?: { value: number; score: number; weight: number };
    budgetAdherence?: { value: number; score: number; weight: number };
    debtRatio?: { value: number; score: number; weight: number };
  };
  insights: string[];
  recommendations: string[];
}

interface SubscriptionResponse {
  plan: {
    name: string;
    scoutLimit: number;
    sonnetLimit: number;
    gpt5Limit: number;
    opusLimit: number;
  };
  usage: {
    scoutQueriesUsed: number;
    sonnetQueriesUsed: number;
    gpt5QueriesUsed: number;
    opusQueriesUsed: number;
  };
}

function AnimatedNumber({ value, suffix = "", prefix = "", decimals = 0 }: { value: number; suffix?: string; prefix?: string; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const startTime = Date.now();
    const startValue = displayValue;
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = startValue + (value - startValue) * easeOutQuart;
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return (
    <span>
      {prefix}{decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toLocaleString()}{suffix}
    </span>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getMotivationalMessage(healthScore: number, savingsRate: number): string {
  if (healthScore >= 80) return "Outstanding financial discipline. Keep it up!";
  if (healthScore >= 60) return "You're making solid progress toward your goals.";
  if (savingsRate > 15) return "Great savings rate! Consider investing the surplus.";
  return "Small steps lead to big changes. Start with one goal.";
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { showOnboarding, completeOnboarding } = useOnboarding();
  
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });
  
  const { data: financialHealth, isLoading: healthLoading } = useQuery<FinancialHealthResponse>({
    queryKey: ["/api/financial-health"],
  });
  
  const { data: goals, isLoading: goalsLoading } = useQuery<FinancialGoal[]>({
    queryKey: ["/api/financial-goals"],
  });

  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ['/api/user-preferences'],
  });

  const { data: subscription } = useQuery<SubscriptionResponse>({
    queryKey: ["/api/subscription"],
  });
  
  const healthScore = financialHealth?.overall ?? 0;
  const healthGrade = financialHealth?.grade ?? 'Building';
  const savingsRate = financialHealth?.breakdown?.savingsRate?.value ?? 0;
  const emergencyFundMonths = financialHealth?.breakdown?.emergencyFund?.months ?? 0;
  
  const activeGoals = Array.isArray(goals) ? goals.filter((g) => g.status === "active") : [];
  const nextGoal = activeGoals.length > 0 ? activeGoals[0] : null;
  const nextGoalProgress = nextGoal 
    ? Math.min(100, (parseFloat(nextGoal.currentAmount || '0') / parseFloat(String(nextGoal.targetAmount))) * 100)
    : 0;
  
  const tierName = subscription?.plan?.name ?? 'Free';
  const scoutUsed = subscription?.usage?.scoutQueriesUsed ?? 0;
  const scoutLimit = subscription?.plan?.scoutLimit ?? 50;
  const queriesRemaining = scoutLimit - scoutUsed;
  
  const monthlyIncome = stats?.monthlyIncome ?? 0;
  const monthlyExpenses = stats?.monthlyExpenses ?? 0;
  const netCashFlow = monthlyIncome - monthlyExpenses;
  const monthlySavingsCapacity = monthlyIncome - parseFloat(String(preferences?.monthlyExpensesEstimate ?? '0'));
  
  const isPositiveCashFlow = netCashFlow >= 0;
  
  if (showOnboarding) {
    return <OnboardingWizard onComplete={completeOnboarding} />;
  }

  const aiNextSteps = useMemo(() => {
    const steps = [];
    
    if (emergencyFundMonths < 3) {
      steps.push({
        icon: Star,
        title: "Build Emergency Fund",
        description: `${emergencyFundMonths.toFixed(1)} months saved. Target: 3-6 months.`,
        action: "Create Goal",
        href: "/financial-goals",
        priority: "high"
      });
    }
    
    if (savingsRate < 20 && monthlySavingsCapacity > 0) {
      steps.push({
        icon: TrendingUp,
        title: "Increase Savings Rate",
        description: `Currently ${savingsRate.toFixed(0)}%. Potential: $${monthlySavingsCapacity.toLocaleString()}/mo.`,
        action: "Optimize",
        href: "/money-tracking",
        priority: "medium"
      });
    }
    
    if (nextGoal && nextGoalProgress < 50 && nextGoal.targetDate) {
      const daysToTarget = Math.ceil((new Date(nextGoal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysToTarget > 0) {
        steps.push({
          icon: Target,
          title: `Accelerate "${nextGoal.title}"`,
          description: `${daysToTarget} days left. ${nextGoalProgress.toFixed(0)}% complete.`,
          action: "Review",
          href: "/financial-goals",
          priority: "medium"
        });
      }
    }
    
    if (queriesRemaining > 10) {
      steps.push({
        icon: Brain,
        title: "Get AI Advice",
        description: `${queriesRemaining} queries available. Ask anything!`,
        action: "Chat",
        href: "/ai-assistant",
        priority: "low"
      });
    }
    
    return steps.slice(0, 3);
  }, [emergencyFundMonths, savingsRate, monthlySavingsCapacity, nextGoal, nextGoalProgress, queriesRemaining]);

  const getHealthColor = (score: number) => {
    if (score >= 75) return { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500", light: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800" };
    if (score >= 60) return { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500", light: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800" };
    if (score >= 40) return { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500", light: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800" };
    return { text: "text-red-600 dark:text-red-400", bg: "bg-red-500", light: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800" };
  };

  const healthColors = getHealthColor(healthScore);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="bg-background/80 backdrop-blur-xl border-b border-border/40 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
                  {getGreeting()}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                  {getMotivationalMessage(healthScore, savingsRate)}
                </p>
              </motion.div>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationsBell />
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-10">
        
        <SmartNudgeBanner />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="p-6 sm:p-8 lg:p-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge 
                      className={`${healthColors.light} ${healthColors.text} ${healthColors.border} border text-xs font-medium px-3 py-1`}
                    >
                      {healthGrade}
                    </Badge>
                    <span className="text-xs text-muted-foreground">AI-Powered Analysis</span>
                  </div>
                  
                  <h2 className="text-sm sm:text-base font-medium text-muted-foreground mb-3">
                    Financial Health Score
                  </h2>
                  
                  {healthLoading ? (
                    <Skeleton className="h-24 w-40" />
                  ) : (
                    <div className="flex items-end gap-3 mb-4">
                      <span 
                        className={`text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tighter ${healthColors.text}`}
                        data-testid="hero-health-score"
                      >
                        <AnimatedNumber value={healthScore} />
                      </span>
                      <span className="text-2xl sm:text-3xl font-semibold text-muted-foreground/30 mb-2">/100</span>
                    </div>
                  )}
                  
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
                    <motion.div 
                      className={`h-full ${healthColors.bg} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${healthScore}%` }}
                      transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    />
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Based on savings rate, emergency fund, debt ratio, and goal progress
                  </p>
                </div>
                
                <div className="bg-gray-50/50 dark:bg-gray-800/30 p-6 sm:p-8 lg:p-10 border-t lg:border-t-0 lg:border-l border-border/30">
                  <h3 className="text-sm font-medium text-muted-foreground mb-6">Key Metrics</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <motion.div 
                      className="space-y-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                      data-testid="metric-savings-rate"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                          <PiggyBank className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-xs text-muted-foreground">Savings Rate</span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-foreground">
                        <AnimatedNumber value={savingsRate} suffix="%" decimals={1} />
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                      data-testid="metric-emergency-fund"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                          <Star className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs text-muted-foreground">Emergency Fund</span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-foreground">
                        <AnimatedNumber value={emergencyFundMonths} suffix=" mo" decimals={1} />
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                      data-testid="metric-cash-flow"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${isPositiveCashFlow ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                          {isPositiveCashFlow ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">Monthly Flow</span>
                      </div>
                      <div className={`text-2xl sm:text-3xl font-bold ${isPositiveCashFlow ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isPositiveCashFlow ? '+' : ''}<AnimatedNumber value={netCashFlow} prefix="$" />
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 }}
                      data-testid="metric-goals"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                          <Target className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-xs text-muted-foreground">Active Goals</span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-foreground">
                        <AnimatedNumber value={activeGoals.length} />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="h-full border-border/40 hover:border-border/60 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">AI Insights</h3>
                    <p className="text-xs text-muted-foreground">Personalized recommendations</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <AnimatePresence>
                    {aiNextSteps.length > 0 ? (
                      aiNextSteps.map((step, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.1 }}
                        >
                          <Link href={step.href}>
                            <button 
                              className="w-full text-left p-4 rounded-xl border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                              data-testid={`ai-step-${idx}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${
                                  step.priority === 'high' 
                                    ? 'bg-orange-100 dark:bg-orange-900/30' 
                                    : step.priority === 'medium' 
                                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                                    : 'bg-gray-100 dark:bg-gray-800'
                                }`}>
                                  <step.icon className={`w-4 h-4 ${
                                    step.priority === 'high' 
                                      ? 'text-orange-600 dark:text-orange-400' 
                                      : step.priority === 'medium' 
                                      ? 'text-blue-600 dark:text-blue-400' 
                                      : 'text-muted-foreground'
                                  }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="font-medium text-sm text-foreground">{step.title}</span>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                                </div>
                              </div>
                            </button>
                          </Link>
                        </motion.div>
                      ))
                    ) : (
                      <motion.div 
                        className="text-center py-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                          <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Excellent work!</p>
                        <p className="text-xs text-muted-foreground mt-1">No urgent actions needed</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <Link href="/ai-assistant">
                  <Button className="w-full mt-6 group" data-testid="button-view-ai-insights">
                    <Brain className="w-4 h-4 mr-2" />
                    Ask AI Anything
                    <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="h-full border-border/40 hover:border-border/60 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Next Goal</h3>
                    <p className="text-xs text-muted-foreground">Track your progress</p>
                  </div>
                </div>
                
                {nextGoal ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-1 truncate">{nextGoal.title}</h4>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-foreground">
                          ${parseFloat(nextGoal.currentAmount || '0').toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / ${parseFloat(String(nextGoal.targetAmount)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span className="font-medium">{nextGoalProgress.toFixed(0)}% complete</span>
                        {nextGoal.targetDate && (
                          <span>{new Date(nextGoal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        )}
                      </div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, nextGoalProgress)}%` }}
                          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                    
                    {nextGoal.targetDate && (
                      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                        <p className="text-xs text-muted-foreground mb-1">Monthly contribution needed</p>
                        <p className="text-xl font-bold text-foreground">
                          ${Math.max(0, (parseFloat(String(nextGoal.targetAmount)) - parseFloat(nextGoal.currentAmount || '0')) / 
                            Math.max(1, Math.ceil((new Date(nextGoal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))).toFixed(0)}
                          <span className="text-sm font-normal text-muted-foreground">/month</span>
                        </p>
                      </div>
                    )}
                    
                    <Link href="/financial-goals">
                      <Button variant="outline" className="w-full group" data-testid="button-manage-goals">
                        Manage Goals
                        <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                      <Target className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">No active goals</p>
                    <p className="text-xs text-muted-foreground mb-6">Set a target to start tracking</p>
                    <Link href="/financial-goals?create=1">
                      <Button className="w-full" data-testid="button-create-first-goal">
                        <Target className="w-4 h-4 mr-2" />
                        Create First Goal
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="h-full border-border/40 hover:border-border/60 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Quick Actions</h3>
                    <p className="text-xs text-muted-foreground">Common tasks</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Link href="/money-tracking?add=1">
                    <Button variant="outline" className="w-full justify-start h-12 group" data-testid="button-add-transaction">
                      <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 mr-3">
                        <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      Add Transaction
                      <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  
                  <Link href="/money-tracking">
                    <Button variant="outline" className="w-full justify-start h-12 group" data-testid="button-view-spending">
                      <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 mr-3">
                        <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      View Spending
                      <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  
                  <Link href="/subscription">
                    <Button variant="outline" className="w-full justify-start h-12 group" data-testid="button-upgrade-plan">
                      <div className="p-1.5 rounded-md bg-violet-100 dark:bg-violet-900/30 mr-3">
                        <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      AI Plan
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {tierName}
                      </Badge>
                    </Button>
                  </Link>
                </div>
                
                <div className="mt-6 pt-6 border-t border-border/40">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">AI Queries</span>
                    <span className="text-sm text-muted-foreground">{queriesRemaining} remaining</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, (queriesRemaining / scoutLimit) * 100)}%` }}
                      transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {scoutUsed} of {scoutLimit} used this month
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="border-border/40 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Explore More</h3>
                  <p className="text-sm text-muted-foreground">
                    Access detailed analytics, transaction history, and advanced features
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/money-tracking">
                    <Button variant="outline" size="sm" className="group" data-testid="button-view-transactions">
                      Transactions
                      <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/financial-goals">
                    <Button variant="outline" size="sm" className="group" data-testid="button-all-goals">
                      All Goals
                      <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/groups">
                    <Button variant="outline" size="sm" className="group" data-testid="button-groups">
                      Groups
                      <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 }}
          >
            <StreakWidget />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <AchievementBadges />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

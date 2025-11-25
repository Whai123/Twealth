import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Target, Sparkles, TrendingUp, Brain, ChevronRight, Award, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NotificationsBell from "@/components/dashboard/notifications-bell";
import OnboardingWizard from "@/components/onboarding/onboarding-wizard";
import { useOnboarding } from "@/hooks/use-onboarding";
import { UserPreferences, FinancialGoal } from "@shared/schema";

// Type-safe API response interfaces
interface DashboardStats {
  totalTransactions: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  totalGoals: number;
  activeGoalsCount: number;
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

export default function Dashboard() {
  const { t } = useTranslation();
  const { showOnboarding, completeOnboarding } = useOnboarding();
  
  // Type-safe queries with proper interfaces
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
  
  // Type-safe metrics from financial health calculation
  const healthScore = financialHealth?.overall ?? 0;
  const healthGrade = financialHealth?.grade ?? 'Building';
  const savingsRate = financialHealth?.breakdown?.savingsRate?.value ?? 0;
  const emergencyFundMonths = financialHealth?.breakdown?.emergencyFund?.months ?? 0;
  
  // Type-safe goal tracking
  const activeGoals = Array.isArray(goals) ? goals.filter((g) => g.status === "active") : [];
  const nextGoal = activeGoals.length > 0 ? activeGoals[0] : null;
  const nextGoalProgress = nextGoal 
    ? Math.min(100, (parseFloat(nextGoal.currentAmount || '0') / parseFloat(String(nextGoal.targetAmount))) * 100)
    : 0;
  
  // Type-safe AI tier info
  const tierName = subscription?.plan?.name ?? 'Free';
  const scoutUsed = subscription?.usage?.scoutQueriesUsed ?? 0;
  const scoutLimit = subscription?.plan?.scoutLimit ?? 50;
  const queriesRemaining = scoutLimit - scoutUsed;
  
  // Type-safe financial capacity
  const monthlyIncome = stats?.monthlyIncome ?? 0;
  const monthlyExpenses = parseFloat(String(preferences?.monthlyExpensesEstimate ?? '0'));
  const monthlySavingsCapacity = monthlyIncome - monthlyExpenses;
  
  // Show onboarding wizard for new users
  if (showOnboarding) {
    return <OnboardingWizard onComplete={completeOnboarding} />;
  }

  // Generate AI-powered next steps based on real data
  const getAINextSteps = () => {
    const steps = [];
    
    // Emergency fund priority
    if (emergencyFundMonths < 3) {
      steps.push({
        icon: Star,
        title: "Build Emergency Fund",
        description: `You have ${emergencyFundMonths.toFixed(1)} months saved. Aim for 3-6 months of expenses.`,
        action: "Create Goal",
        href: "/financial-goals",
        priority: "high"
      });
    }
    
    // Savings rate optimization
    if (savingsRate < 20 && monthlySavingsCapacity > 0) {
      steps.push({
        icon: TrendingUp,
        title: "Increase Savings Rate",
        description: `Currently saving ${savingsRate.toFixed(1)}%. You can save $${monthlySavingsCapacity.toLocaleString()}/mo.`,
        action: "Optimize Budget",
        href: "/planning",
        priority: "medium"
      });
    }
    
    // Goal progress - with null safety
    if (nextGoal && nextGoalProgress < 50 && nextGoal.targetDate) {
      const daysToTarget = Math.ceil((new Date(nextGoal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysToTarget > 0) {
        steps.push({
          icon: Target,
          title: `Accelerate "${nextGoal.title}"`,
          description: `${daysToTarget} days remaining. ${nextGoalProgress.toFixed(0)}% complete.`,
          action: "Review Plan",
          href: "/financial-goals",
          priority: "medium"
        });
      }
    }
    
    // AI chat suggestion
    if (queriesRemaining > 0) {
      steps.push({
        icon: Brain,
        title: "Get AI Financial Advice",
        description: `${queriesRemaining} GPT-5 queries remaining this month. Ask anything!`,
        action: "Ask AI",
        href: "/ai-assistant",
        priority: "low"
      });
    }
    
    return steps.slice(0, 3); // Max 3 steps
  };

  const aiNextSteps = getAINextSteps();

  return (
    <>
      {/* Clean Stripe-style Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                {t('dashboard.title')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">AI-powered financial command center</p>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationsBell />
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 space-y-8 sm:space-y-12">
        {/* HERO KPI - Financial Health Score */}
        <div className="relative">
          <Card className="border-2 border-border/50 overflow-hidden">
            <CardContent className="p-6 sm:p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">
                {/* Score Section */}
                <div className="flex-1 w-full lg:w-auto">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-medium px-2.5 sm:px-3 py-1 ${
                        healthScore >= 75 
                          ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
                          : healthScore >= 60 
                          ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                          : 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                      }`}
                    >
                      {healthGrade}
                    </Badge>
                    <span className="text-xs sm:text-sm text-muted-foreground">Powered by GPT-5</span>
                  </div>
                  
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-medium text-muted-foreground mb-2">
                    Your Financial Health
                  </h2>
                  
                  {healthLoading ? (
                    <div className="h-24 sm:h-32 w-32 sm:w-48 bg-muted rounded animate-pulse"></div>
                  ) : (
                    <div className="flex items-baseline gap-2 sm:gap-3">
                      <span 
                        className={`text-7xl sm:text-8xl lg:text-9xl font-bold tracking-tighter ${
                          healthScore >= 75 
                            ? 'text-green-600 dark:text-green-400' 
                            : healthScore >= 60 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-orange-600 dark:text-orange-400'
                        }`}
                        data-testid="hero-health-score"
                      >
                        {healthScore}
                      </span>
                      <span className="text-3xl sm:text-4xl font-bold text-muted-foreground/40">/100</span>
                    </div>
                  )}
                  
                  <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4 max-w-md">
                    Based on savings rate, emergency fund, debt ratio, and goal progress
                  </p>
                </div>
                
                {/* Quick Metrics Grid - Mobile optimized */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8 w-full lg:w-auto">
                  {/* Savings Rate */}
                  <div className="text-left" data-testid="metric-savings-rate">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Savings Rate</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-foreground">
                      {savingsRate.toFixed(1)}<span className="text-lg sm:text-xl text-muted-foreground">%</span>
                    </div>
                  </div>
                  
                  {/* Emergency Fund */}
                  <div className="text-left" data-testid="metric-emergency-fund">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Emergency</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-foreground">
                      {emergencyFundMonths.toFixed(1)}<span className="text-lg sm:text-xl text-muted-foreground">mo</span>
                    </div>
                  </div>
                  
                  {/* Goals */}
                  <div className="text-left" data-testid="metric-goals">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Goals</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-foreground">
                      {activeGoals.length}
                    </div>
                  </div>
                  
                  {/* Net Worth */}
                  <div className="text-left" data-testid="metric-net-worth">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Net Worth</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                      ${((stats as any)?.netWorth || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3 PRIORITY CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CARD 1: AI-Powered Next Steps */}
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-lg bg-foreground">
                  <Sparkles className="w-5 h-5 text-background" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">AI Recommendations</h3>
              </div>
              
              <div className="space-y-4">
                {aiNextSteps.length > 0 ? (
                  aiNextSteps.map((step, idx) => (
                    <Link key={idx} href={step.href}>
                      <button 
                        className="w-full text-left p-4 rounded-lg border border-border/50 hover:border-border hover:bg-accent/50 transition-all group"
                        data-testid={`ai-step-${idx}`}
                      >
                        <div className="flex items-start gap-3">
                          <step.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            step.priority === 'high' 
                              ? 'text-orange-500' 
                              : step.priority === 'medium' 
                              ? 'text-blue-500' 
                              : 'text-muted-foreground'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-medium text-sm text-foreground">{step.title}</span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                          </div>
                        </div>
                      </button>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground">You're doing great!</p>
                    <p className="text-xs text-muted-foreground mt-1">No urgent actions needed</p>
                  </div>
                )}
              </div>
              
              <Link href="/ai-assistant">
                <Button variant="outline" className="w-full mt-6" data-testid="button-view-ai-insights">
                  <Brain className="w-4 h-4 mr-2" />
                  Ask AI Anything
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* CARD 2: Next Goal Progress */}
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-950/30">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Next Milestone</h3>
              </div>
              
              {nextGoal ? (
                <div>
                  <div className="mb-4">
                    <h4 className="font-medium text-foreground mb-1">{nextGoal.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      ${parseFloat(nextGoal.currentAmount || '0').toLocaleString()} / ${parseFloat(String(nextGoal.targetAmount)).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{nextGoalProgress.toFixed(0)}% complete</span>
                      {nextGoal.targetDate && <span>{new Date(nextGoal.targetDate).toLocaleDateString()}</span>}
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, nextGoalProgress)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {nextGoal.targetDate && (
                    <div className="bg-accent/50 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-foreground mb-1">Monthly contribution needed</p>
                      <p className="text-2xl font-bold text-foreground">
                        ${Math.max(0, (parseFloat(String(nextGoal.targetAmount)) - parseFloat(nextGoal.currentAmount || '0')) / 
                          Math.max(1, Math.ceil((new Date(nextGoal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))).toFixed(0)}
                        <span className="text-sm text-muted-foreground">/month</span>
                      </p>
                    </div>
                  )}
                  
                  <Link href="/financial-goals">
                    <Button variant="outline" className="w-full" data-testid="button-manage-goals">
                      Manage Goals
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-2">No active goals</p>
                  <p className="text-xs text-muted-foreground mb-6">Set a financial target to track progress</p>
                  <Link href="/financial-goals">
                    <Button className="w-full" data-testid="button-create-first-goal">
                      <Target className="w-4 h-4 mr-2" />
                      Create Your First Goal
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* CARD 3: Quick Actions */}
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950/30">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
              </div>
              
              <div className="space-y-3">
                <Link href="/money-tracking">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-add-transaction">
                    <TrendingUp className="w-4 h-4 mr-3" />
                    Log Transaction
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
                
                <Link href="/planning">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-view-budget">
                    <Target className="w-4 h-4 mr-3" />
                    View Budget
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
                
                <Link href="/subscription">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-upgrade-plan">
                    <Sparkles className="w-4 h-4 mr-3" />
                    Upgrade AI Plan
                    <Badge variant="outline" className="ml-auto text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                      {tierName}
                    </Badge>
                  </Button>
                </Link>
              </div>
              
              {/* AI Queries Remaining */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">GPT-5 Queries</span>
                  <span className="text-sm font-medium text-foreground">{queriesRemaining} / {scoutLimit}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.max(0, (queriesRemaining / scoutLimit) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Detailed Analytics CTA */}
        <Card className="border-border/50 bg-accent/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">Want more details?</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-2xl mx-auto">
              Access comprehensive analytics, transaction history, budget tracking, and advanced insights
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/money-tracking">
                <Button variant="outline" data-testid="button-view-transactions">
                  View All Transactions
                </Button>
              </Link>
              <Link href="/predictive-insights">
                <Button variant="outline" data-testid="button-view-analytics">
                  Advanced Analytics
                </Button>
              </Link>
              <Link href="/financial-goals">
                <Button variant="outline" data-testid="button-all-goals">
                  All Goals & Progress
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

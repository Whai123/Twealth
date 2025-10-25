import { useState } from "react";
import { Link } from "wouter";
import { Plus, Clock, DollarSign, Brain, MessageCircle, Zap, TrendingUp, Star, Award, Target, Sparkles, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import QuickStats from "@/components/dashboard/quick-stats";
import QuickActions from "@/components/dashboard/quick-actions";
import TimeValueInsights from "@/components/dashboard/time-value-insights";
import FinancialGoalsProgress from "@/components/dashboard/financial-goals-progress";
import UpcomingEvents from "@/components/dashboard/upcoming-events";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import GroupsOverview from "@/components/dashboard/groups-overview";
import MonthlyProgressChart from "@/components/dashboard/monthly-progress-chart";
import GoalForm from "@/components/forms/goal-form";
import NotificationsBell from "@/components/dashboard/notifications-bell";
import SmartInsights from "@/components/dashboard/smart-insights";
import EnhancedFinancialTrends from "@/components/dashboard/enhanced-financial-trends";
import AIChatButton from "@/components/chat/ai-chat-button";
import AIInsightsCard from "@/components/dashboard/ai-insights-card";
import CryptoPortfolioWidget from "@/components/dashboard/crypto-portfolio-widget";
import MultiCurrencyCalculator from "@/components/wealth/multi-currency-calculator";
import OnboardingWizard from "@/components/onboarding/onboarding-wizard";
import { useOnboarding } from "@/hooks/use-onboarding";
import { UserPreferences } from "@shared/schema";

export default function Dashboard() {
  const { t } = useTranslation();
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { showOnboarding, completeOnboarding } = useOnboarding();
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });
  
  const { data: financialHealth, isLoading: healthLoading } = useQuery({
    queryKey: ["/api/financial-health"],
  });
  
  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ["/api/financial-goals"],
  });

  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ['/api/user-preferences'],
  });
  
  // Real metrics from financial health calculation
  const healthScore = (financialHealth as any)?.overall || 0;
  const healthGrade = (financialHealth as any)?.grade || 'Building';
  const savingsRate = (financialHealth as any)?.breakdown?.savingsRate?.value || 0;
  const emergencyFundMonths = (financialHealth as any)?.breakdown?.emergencyFund?.months || 0;
  const savingsRateLabel = (financialHealth as any)?.breakdown?.savingsRate?.label || 'No data';
  const emergencyFundLabel = (financialHealth as any)?.breakdown?.emergencyFund?.label || 'No data';
  
  // Real goal tracking
  const activeGoalsCount = Array.isArray(goals) ? goals.filter((g: any) => g.status === "active").length : 0;
  const goalsOnTrack = Array.isArray(goals) 
    ? goals.filter((g: any) => {
        if (g.status !== "active") return false;
        const progress = (parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100;
        const timeElapsed = Date.now() - new Date(g.createdAt).getTime();
        const totalTime = new Date(g.targetDate).getTime() - new Date(g.createdAt).getTime();
        const expectedProgress = (timeElapsed / totalTime) * 100;
        return progress >= expectedProgress;
      }).length
    : 0;
  
  // Real financial capacity
  const monthlyIncome = (stats as any)?.monthlyIncome || 0;
  const totalSavings = (stats as any)?.totalSavings || 0;
  const monthlyExpenses = parseFloat((preferences as any)?.monthlyExpensesEstimate || '0');
  const monthlySavingsCapacity = monthlyIncome - monthlyExpenses;
  
  // Show onboarding wizard for new users
  if (showOnboarding) {
    return <OnboardingWizard onComplete={completeOnboarding} />;
  }

  return (
    <>
      {/* AI Chat Button - Floating */}
      <AIChatButton />
      
      {/* Clean Stripe-style Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                {t('dashboard.title')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Drawer open={isCreateGoalOpen} onOpenChange={setIsCreateGoalOpen}>
                <DrawerTrigger asChild>
                  <Button 
                    size="default"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm min-h-[44px]"
                    data-testid="button-new-goal"
                  >
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('dashboard.newGoal')}</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="max-h-[90vh]">
                  <div className="p-4 pb-6">
                    <DrawerTitle className="text-xl font-semibold mb-2">Create New Goal</DrawerTitle>
                    <DrawerDescription className="text-muted-foreground mb-4">
                      Set a savings target and track your progress
                    </DrawerDescription>
                    <GoalForm onSuccess={() => setIsCreateGoalOpen(false)} />
                  </div>
                </DrawerContent>
              </Drawer>
              <NotificationsBell />
            </div>
          </div>
        </div>
      </header>

      <div 
        className="w-full max-w-full overflow-x-hidden space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8"
      >
        {/* Welcome Message */}
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 sm:p-5" role="banner">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground mb-1">{t('dashboard.welcome')}</h2>
              <p className="text-sm text-muted-foreground">{t('dashboard.welcomeMessage')}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics - Real Financial Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Financial Health Score - REAL calculation */}
          {healthLoading ? (
            <Card className="p-6">
              <div className="space-y-3">
                <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            </Card>
          ) : (
            <Card className="p-6" data-testid="stat-health-score">
              <div className="flex items-center gap-2 mb-3">
                <Award className={`w-4 h-4 ${healthScore >= 75 ? 'text-green-600' : healthScore >= 60 ? 'text-blue-600' : healthScore >= 40 ? 'text-orange-600' : 'text-red-600'}`} aria-hidden="true" />
                <span className="text-sm font-medium text-muted-foreground">Financial Health</span>
              </div>
              <div className={`text-3xl font-semibold ${healthScore >= 75 ? 'text-green-600' : healthScore >= 60 ? 'text-blue-600' : healthScore >= 40 ? 'text-orange-600' : 'text-red-600'}`} data-testid="value-health-score">
                {healthScore}/100
              </div>
              <p className="text-xs text-muted-foreground mt-1">{healthGrade}</p>
            </Card>
          )}
          
          {/* Savings Rate - REAL from transactions */}
          {healthLoading ? (
            <Card className="p-6">
              <div className="space-y-3">
                <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            </Card>
          ) : (
            <Card className="p-6" data-testid="stat-savings-rate">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className={`w-4 h-4 ${savingsRate >= 20 ? 'text-green-600' : savingsRate >= 10 ? 'text-blue-600' : savingsRate >= 5 ? 'text-orange-600' : 'text-red-600'}`} aria-hidden="true" />
                <span className="text-sm font-medium text-muted-foreground">Savings Rate</span>
              </div>
              <div className={`text-3xl font-semibold ${savingsRate >= 20 ? 'text-green-600' : savingsRate >= 10 ? 'text-blue-600' : savingsRate >= 5 ? 'text-orange-600' : 'text-red-600'}`} data-testid="value-savings-rate">
                {savingsRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">{savingsRateLabel}</p>
            </Card>
          )}
          
          {/* Emergency Fund - REAL months of expenses */}
          {healthLoading ? (
            <Card className="p-6">
              <div className="space-y-3">
                <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            </Card>
          ) : (
            <Card className="p-6" data-testid="stat-emergency-fund">
              <div className="flex items-center gap-2 mb-3">
                <Star className={`w-4 h-4 ${emergencyFundMonths >= 6 ? 'text-green-600' : emergencyFundMonths >= 3 ? 'text-blue-600' : emergencyFundMonths >= 1 ? 'text-orange-600' : 'text-red-600'}`} aria-hidden="true" />
                <span className="text-sm font-medium text-muted-foreground">Emergency Fund</span>
              </div>
              <div className={`text-3xl font-semibold ${emergencyFundMonths >= 6 ? 'text-green-600' : emergencyFundMonths >= 3 ? 'text-blue-600' : emergencyFundMonths >= 1 ? 'text-orange-600' : 'text-red-600'}`} data-testid="value-emergency-fund">
                {emergencyFundMonths.toFixed(1)}mo
              </div>
              <p className="text-xs text-muted-foreground mt-1">{emergencyFundLabel}</p>
            </Card>
          )}
          
          {/* Goals Tracking - REAL progress */}
          {goalsLoading ? (
            <Card className="p-6">
              <div className="space-y-3">
                <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            </Card>
          ) : (
            <Card className="p-6" data-testid="stat-goals">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-purple-600" aria-hidden="true" />
                <span className="text-sm font-medium text-muted-foreground">Goals</span>
              </div>
              <div className="text-3xl font-semibold text-purple-600" data-testid="value-goals">
                {goalsOnTrack}/{activeGoalsCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">On Track</p>
            </Card>
          )}
        </div>

        {/* Quick Stats Cards */}
        <QuickStats />

        {/* Quick Actions - Modern fintech-style action center */}
        <QuickActions />

        {/* Enhanced Financial Trends */}
        <EnhancedFinancialTrends />

        {/* Smart Financial Insights */}
        <SmartInsights />

        {/* Multi-Currency Calculator - Only show when crypto features are enabled */}
        {preferences?.cryptoEnabled && (
          <MultiCurrencyCalculator />
        )}

        {/* AI Assistant CTA Banner */}
        <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t('dashboard.aiAssistant.title')}</h3>
                  <p className="text-muted-foreground text-sm">{t('dashboard.aiAssistant.description')}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsChatOpen(true)}
                  data-testid="button-try-ai-chat"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t('dashboard.aiAssistant.tryChat')}
                </Button>
                <Link href="/ai-assistant">
                  <Button data-testid="button-explore-ai">
                    <Zap className="w-4 h-4 mr-2" />
                    {t('dashboard.aiAssistant.exploreFeatures')}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <AIInsightsCard onOpenChat={() => setIsChatOpen(true)} />

        {/* Mobile-First Layout - Single Column on Mobile */}
        <div className="space-y-4 md:space-y-6">
          {/* Financial Goals Progress - Full width on mobile, 2/3 on desktop */}
          <div className="w-full">
            <FinancialGoalsProgress />
          </div>
          
          {/* Secondary Cards Grid - Stack on mobile, side-by-side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Upcoming Events */}
            <UpcomingEvents />
            
            {/* Recent Transactions */}
            <RecentTransactions />

            {/* Crypto Portfolio */}
            <CryptoPortfolioWidget />
          </div>
          
          {/* Tertiary Cards - Full width */}
          <div className="w-full">
            <GroupsOverview />
          </div>

          {/* Monthly Progress Chart - Full width */}
          <MonthlyProgressChart />
        </div>
      </div>
    </>
  );
}

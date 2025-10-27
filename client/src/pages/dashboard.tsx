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
        className="w-full max-w-full overflow-x-hidden space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 fade-in"
      >
        {/* Welcome Message - Clean Professional Design */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50/30 to-purple-50/20 dark:from-purple-950/20 dark:via-pink-950/10 dark:to-purple-950/5 border border-purple-200/40 dark:border-purple-800/30 rounded-2xl p-5 sm:p-6 slide-up" role="banner">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 tracking-tight">{t('dashboard.welcome')}</h2>
              <p className="text-sm text-muted-foreground/90 leading-relaxed">{t('dashboard.welcomeMessage')}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics - Real Financial Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Financial Health Score - REAL calculation */}
          {healthLoading ? (
            <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="space-y-3">
                <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            </Card>
          ) : (
            <Card className="group relative overflow-hidden p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 border-border/50" data-testid="stat-health-score">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/5 pointer-events-none"></div>
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={`p-2 rounded-lg ${healthScore >= 75 ? 'bg-green-100 dark:bg-green-950/30' : healthScore >= 60 ? 'bg-blue-100 dark:bg-blue-950/30' : healthScore >= 40 ? 'bg-orange-100 dark:bg-orange-950/30' : 'bg-red-100 dark:bg-red-950/30'}`}>
                    <Award className={`w-4 h-4 ${healthScore >= 75 ? 'text-green-600 dark:text-green-400' : healthScore >= 60 ? 'text-blue-600 dark:text-blue-400' : healthScore >= 40 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`} aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Financial Health</span>
                </div>
                <div className={`text-4xl font-bold tracking-tight mb-2 ${healthScore >= 75 ? 'text-green-600 dark:text-green-400' : healthScore >= 60 ? 'text-blue-600 dark:text-blue-400' : healthScore >= 40 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`} data-testid="value-health-score">
                  {healthScore}<span className="text-2xl text-muted-foreground/60">/100</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">{healthGrade}</p>
              </div>
            </Card>
          )}
          
          {/* Savings Rate - REAL from transactions */}
          {healthLoading ? (
            <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="space-y-3">
                <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            </Card>
          ) : (
            <Card className="group relative overflow-hidden p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 border-border/50" data-testid="stat-savings-rate">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/5 pointer-events-none"></div>
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={`p-2 rounded-lg ${savingsRate >= 20 ? 'bg-green-100 dark:bg-green-950/30' : savingsRate >= 10 ? 'bg-blue-100 dark:bg-blue-950/30' : savingsRate >= 5 ? 'bg-orange-100 dark:bg-orange-950/30' : 'bg-red-100 dark:bg-red-950/30'}`}>
                    <TrendingUp className={`w-4 h-4 ${savingsRate >= 20 ? 'text-green-600 dark:text-green-400' : savingsRate >= 10 ? 'text-blue-600 dark:text-blue-400' : savingsRate >= 5 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`} aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Savings Rate</span>
                </div>
                <div className={`text-4xl font-bold tracking-tight mb-2 ${savingsRate >= 20 ? 'text-green-600 dark:text-green-400' : savingsRate >= 10 ? 'text-blue-600 dark:text-blue-400' : savingsRate >= 5 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`} data-testid="value-savings-rate">
                  {savingsRate.toFixed(1)}<span className="text-2xl text-muted-foreground/60">%</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">{savingsRateLabel}</p>
              </div>
            </Card>
          )}
          
          {/* Emergency Fund - REAL months of expenses */}
          {healthLoading ? (
            <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="space-y-3">
                <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            </Card>
          ) : (
            <Card className="group relative overflow-hidden p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 border-border/50" data-testid="stat-emergency-fund">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/5 pointer-events-none"></div>
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={`p-2 rounded-lg ${emergencyFundMonths >= 6 ? 'bg-green-100 dark:bg-green-950/30' : emergencyFundMonths >= 3 ? 'bg-blue-100 dark:bg-blue-950/30' : emergencyFundMonths >= 1 ? 'bg-orange-100 dark:bg-orange-950/30' : 'bg-red-100 dark:bg-red-950/30'}`}>
                    <Star className={`w-4 h-4 ${emergencyFundMonths >= 6 ? 'text-green-600 dark:text-green-400' : emergencyFundMonths >= 3 ? 'text-blue-600 dark:text-blue-400' : emergencyFundMonths >= 1 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`} aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Emergency Fund</span>
                </div>
                <div className={`text-4xl font-bold tracking-tight mb-2 ${emergencyFundMonths >= 6 ? 'text-green-600 dark:text-green-400' : emergencyFundMonths >= 3 ? 'text-blue-600 dark:text-blue-400' : emergencyFundMonths >= 1 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`} data-testid="value-emergency-fund">
                  {emergencyFundMonths.toFixed(1)}<span className="text-xl text-muted-foreground/60">mo</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">{emergencyFundLabel}</p>
              </div>
            </Card>
          )}
          
          {/* Goals Tracking - REAL progress */}
          {goalsLoading ? (
            <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="space-y-3">
                <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            </Card>
          ) : (
            <Card className="group relative overflow-hidden p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 border-border/50" data-testid="stat-goals">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/5 pointer-events-none"></div>
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/30">
                    <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Goals</span>
                </div>
                <div className="text-4xl font-bold tracking-tight mb-2 text-purple-600 dark:text-purple-400" data-testid="value-goals">
                  {goalsOnTrack}<span className="text-2xl text-muted-foreground/60">/{activeGoalsCount}</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">On Track</p>
              </div>
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

        {/* AI Assistant CTA Banner - Premium design */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50/50 to-pink-50/30 dark:from-blue-950/30 dark:via-purple-950/20 dark:to-pink-950/10 border-blue-200/50 dark:border-blue-800/30 hover:shadow-xl transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-300/20 to-transparent dark:from-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <CardContent className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start space-x-4 flex-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-1.5 tracking-tight text-foreground">{t('dashboard.aiAssistant.title')}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">{t('dashboard.aiAssistant.description')}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button 
                  variant="outline" 
                  onClick={() => setIsChatOpen(true)}
                  className="border-border/60 hover:bg-muted/50 min-h-[44px]"
                  data-testid="button-try-ai-chat"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t('dashboard.aiAssistant.tryChat')}
                </Button>
                <Link href="/ai-assistant">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 min-h-[44px]" data-testid="button-explore-ai">
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

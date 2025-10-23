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
  
  const { data: timeStats, isLoading: timeStatsLoading } = useQuery({
    queryKey: ["/api/dashboard/time-stats"],
  });
  
  const { data: prevTimeStats } = useQuery({
    queryKey: ["/api/dashboard/time-stats-previous"],
    queryFn: () => fetch("/api/dashboard/time-stats?previous=true").then(res => res.json()),
  });
  
  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ["/api/financial-goals"],
  });

  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ['/api/user-preferences'],
  });
  
  const activeGoalsCount = Array.isArray(goals) ? goals.filter((g: any) => g.status === "active").length : 0;
  const totalGoalsCount = Array.isArray(goals) ? goals.length : 0;
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
  
  const currentTimeValue = (timeStats as any)?.timeValue || 0;
  const prevTimeValue = (prevTimeStats as any)?.timeValue || 0;
  const growthPercent = prevTimeValue ? Math.round(((currentTimeValue - prevTimeValue) / prevTimeValue) * 100) : 0;
  
  const totalSavings = (stats as any)?.totalSavings || 0;
  const financialScore = Math.min(850, Math.round(200 + (totalSavings / 100) + (activeGoalsCount * 50) + (goalsOnTrack * 100)));
  
  const userCreatedAt = new Date();
  userCreatedAt.setMonth(userCreatedAt.getMonth() - 2);
  const daysActive = Math.floor((Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
  const streak = Math.min(daysActive, 42);
  
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

        {/* Key Metrics - Stripe-style stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {timeStatsLoading ? (
            <Card className="p-6">
              <div className="space-y-3">
                <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            </Card>
          ) : (
            <Card className="p-6" data-testid="stat-growth">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className={`w-4 h-4 ${growthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`} aria-hidden="true" />
                <span className="text-sm font-medium text-muted-foreground">{t('dashboard.stats.growth')}</span>
              </div>
              <div className={`text-3xl font-semibold ${growthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="value-growth">
                {growthPercent >= 0 ? '+' : ''}{growthPercent}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.stats.thisPeriod')}</p>
            </Card>
          )}
          
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
                <Target className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span className="text-sm font-medium text-muted-foreground">{t('dashboard.stats.goals')}</span>
              </div>
              <div className="text-3xl font-semibold text-blue-600" data-testid="value-goals">
                {goalsOnTrack}/{activeGoalsCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.stats.onTrack')}</p>
            </Card>
          )}
          
          {statsLoading ? (
            <Card className="p-6">
              <div className="space-y-3">
                <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            </Card>
          ) : (
            <Card className="p-6" data-testid="stat-score">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-orange-600" aria-hidden="true" />
                <span className="text-sm font-medium text-muted-foreground">{t('dashboard.stats.score')}</span>
              </div>
              <div className="text-3xl font-semibold text-orange-600" data-testid="value-score">
                {financialScore}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {financialScore >= 800 ? t('dashboard.stats.excellent') : financialScore >= 600 ? t('dashboard.stats.good') : financialScore >= 400 ? t('dashboard.stats.fair') : t('dashboard.stats.building')}
              </p>
            </Card>
          )}
          
          <Card className="p-6" data-testid="stat-streak">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-purple-600" aria-hidden="true" />
              <span className="text-sm font-medium text-muted-foreground">{t('dashboard.stats.streak')}</span>
            </div>
            <div className="text-3xl font-semibold text-purple-600" data-testid="value-streak">
              {streak}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.stats.daysActive')}</p>
          </Card>
        </div>

        {/* Quick Stats Cards */}
        <QuickStats />

        {/* Quick Actions - Modern fintech-style action center */}
        <QuickActions />

        {/* Time-Value Insights */}
        <TimeValueInsights />

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

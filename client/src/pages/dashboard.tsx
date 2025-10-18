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
import { UserPreferences } from "@shared/schema";

export default function Dashboard() {
  const { t } = useTranslation();
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
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
  
  return (
    <>
      {/* AI Chat Button - Floating */}
      <AIChatButton />
      
      {/* Mobile-First Responsive Header */}
      <header className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-900/50 dark:via-blue-900/50 dark:to-purple-900/50 border-b border-border/50 sticky top-0 z-30 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 md:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4 md:mb-6">
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-3 md:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-600 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg sm:shadow-xl animate-pulse flex-shrink-0">
                  <div className="relative">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
                    <DollarSign className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-yellow-300 absolute -top-1 -right-1" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                    {t('dashboard.title')}
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base lg:text-xl text-muted-foreground truncate">{t('dashboard.subtitle')}</p>
                </div>
              </div>
              
              {/* Mobile-First Responsive Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {timeStatsLoading ? (
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/20 animate-pulse">
                    <div className="h-3 sm:h-4 md:h-5 w-12 sm:w-16 md:w-20 bg-muted rounded mb-1.5 sm:mb-2"></div>
                    <div className="h-5 sm:h-6 md:h-8 w-10 sm:w-12 md:w-16 bg-muted rounded mb-1"></div>
                    <div className="h-2 md:h-3 w-16 sm:w-20 md:w-24 bg-muted rounded"></div>
                  </div>
                ) : (
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95" data-testid="stat-growth">
                    <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                      <TrendingUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ${growthPercent >= 0 ? 'text-green-500' : 'text-red-500'}`} aria-hidden="true" />
                      <span className="text-xs md:text-sm font-medium truncate">{t('dashboard.stats.growth')}</span>
                    </div>
                    <div className={`text-lg sm:text-xl md:text-2xl font-bold ${growthPercent >= 0 ? 'text-green-600' : 'text-red-600'} transition-colors duration-300`} data-testid="value-growth">
                      {growthPercent >= 0 ? '+' : ''}{growthPercent}%
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{t('dashboard.stats.thisPeriod')}</div>
                  </div>
                )}
                
                {goalsLoading ? (
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/20 animate-pulse">
                    <div className="h-3 sm:h-4 md:h-5 w-12 sm:w-16 md:w-20 bg-muted rounded mb-1.5 sm:mb-2"></div>
                    <div className="h-5 sm:h-6 md:h-8 w-10 sm:w-12 md:w-16 bg-muted rounded mb-1"></div>
                    <div className="h-2 md:h-3 w-16 sm:w-20 md:w-24 bg-muted rounded"></div>
                  </div>
                ) : (
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95" data-testid="stat-goals">
                    <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                      <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-500" aria-hidden="true" />
                      <span className="text-xs md:text-sm font-medium truncate">{t('dashboard.stats.goals')}</span>
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 transition-colors duration-300" data-testid="value-goals">
                      {goalsOnTrack}/{activeGoalsCount}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{t('dashboard.stats.onTrack')}</div>
                  </div>
                )}
                
                {statsLoading ? (
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/20 animate-pulse">
                    <div className="h-3 sm:h-4 md:h-5 w-12 sm:w-16 md:w-20 bg-muted rounded mb-1.5 sm:mb-2"></div>
                    <div className="h-5 sm:h-6 md:h-8 w-10 sm:w-12 md:w-16 bg-muted rounded mb-1"></div>
                    <div className="h-2 md:h-3 w-16 sm:w-20 md:w-24 bg-muted rounded"></div>
                  </div>
                ) : (
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95" data-testid="stat-score">
                    <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                      <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-orange-500" aria-hidden="true" />
                      <span className="text-xs md:text-sm font-medium truncate">{t('dashboard.stats.score')}</span>
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 transition-colors duration-300" data-testid="value-score">
                      {financialScore}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {financialScore >= 800 ? t('dashboard.stats.excellent') : financialScore >= 600 ? t('dashboard.stats.good') : financialScore >= 400 ? t('dashboard.stats.fair') : t('dashboard.stats.building')}
                    </div>
                  </div>
                )}
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95" data-testid="stat-streak">
                  <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                    <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-500" aria-hidden="true" />
                    <span className="text-xs md:text-sm font-medium truncate">{t('dashboard.stats.streak')}</span>
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 transition-colors duration-300" data-testid="value-streak">
                    {streak}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{t('dashboard.stats.daysActive')}</div>
                </div>
              </div>
            </div>
            
            {/* Mobile-First Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 sm:ml-4 md:ml-6 w-full sm:w-auto">
              <Drawer open={isCreateGoalOpen} onOpenChange={setIsCreateGoalOpen}>
                <DrawerTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-3 sm:px-4 md:px-6 min-h-[44px] h-11 sm:h-12 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl active:scale-95 flex-1 sm:flex-initial"
                    data-testid="button-new-goal"
                  >
                    <Plus size={16} className="sm:mr-2" />
                    <span className="hidden sm:inline">{t('dashboard.newGoal')}</span>
                    <span className="sm:hidden text-xs">New Goal</span>
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="max-h-[90vh]">
                  <div className="p-4 pb-6">
                    <DrawerTitle className="text-xl font-semibold mb-2">{t('goals.createNew')}</DrawerTitle>
                    <DrawerDescription className="text-muted-foreground mb-4">
                      {t('goals.createNewDesc')}
                    </DrawerDescription>
                    <GoalForm onSuccess={() => setIsCreateGoalOpen(false)} />
                  </div>
                </DrawerContent>
              </Drawer>
              <NotificationsBell />
            </div>
          </div>
          
          {/* Mobile-First Welcome Message */}
          <div className="bg-gradient-to-r from-white/80 to-indigo-50/80 dark:from-gray-800/80 dark:to-indigo-900/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/20 transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-700" role="banner">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-indigo-500 animate-pulse flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-indigo-800 dark:text-indigo-200">{t('dashboard.welcome')}</h2>
                <p className="text-xs sm:text-sm md:text-base text-indigo-600 dark:text-indigo-300 line-clamp-2 sm:line-clamp-none">{t('dashboard.welcomeMessage')}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div 
        className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-3 sm:py-4 md:py-6"
      >
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

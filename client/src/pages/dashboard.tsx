import { useState } from "react";
import { Link } from "wouter";
import { Plus, Clock, DollarSign, Brain, MessageCircle, Zap, TrendingUp, Star, Award, Target, Sparkles, Crown } from "lucide-react";
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

export default function Dashboard() {
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  return (
    <>
      {/* AI Chat Button - Floating */}
      <AIChatButton />
      
      {/* Spectacular Header */}
      <header className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-900/50 dark:via-blue-900/50 dark:to-purple-900/50 border-b border-border/50 sticky top-0 z-30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
                  <div className="relative">
                    <Clock className="w-8 h-8 text-white" />
                    <DollarSign className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    💎 Twealth Dashboard
                  </h1>
                  <p className="text-xl text-muted-foreground">Transform time into wealth with smart financial management</p>
                </div>
              </div>
              
              {/* Dashboard Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">Growth</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">+23%</div>
                  <div className="text-xs text-muted-foreground">This month</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">Goals</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">7/11</div>
                  <div className="text-xs text-muted-foreground">On track</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium">Score</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">850</div>
                  <div className="text-xs text-muted-foreground">Excellent</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium">Streak</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">42</div>
                  <div className="text-xs text-muted-foreground">Days</div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 ml-6">
              <Drawer open={isCreateGoalOpen} onOpenChange={setIsCreateGoalOpen}>
                <DrawerTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-6 py-3 h-12 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                    data-testid="button-new-goal"
                  >
                    <Plus size={18} className="mr-2" />
                    <span className="hidden sm:inline">🎯 New Goal</span>
                    <span className="sm:hidden">+</span>
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="max-h-[90vh]">
                  <div className="p-4 pb-6">
                    <DrawerTitle className="text-xl font-semibold mb-2">Create New Goal</DrawerTitle>
                    <DrawerDescription className="text-muted-foreground mb-4">
                      Set up a new financial goal to track your savings progress
                    </DrawerDescription>
                    <GoalForm onSuccess={() => setIsCreateGoalOpen(false)} />
                  </div>
                </DrawerContent>
              </Drawer>
              <NotificationsBell />
            </div>
          </div>
          
          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-white/80 to-indigo-50/80 dark:from-gray-800/80 dark:to-indigo-900/20 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-indigo-500" />
              <div>
                <h2 className="text-lg font-semibold text-indigo-800 dark:text-indigo-200">Welcome back! 👋</h2>
                <p className="text-indigo-600 dark:text-indigo-300">You're making excellent progress on your financial journey. Here's what's happening today.</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div 
        className="space-y-6" 
        style={{ 
          padding: 'var(--space-6)',
          paddingTop: 'var(--space-4)'
        }}
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

        {/* AI Assistant CTA Banner */}
        <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Meet Your AI Financial Assistant</h3>
                  <p className="text-muted-foreground text-sm">Get personalized budget analysis, savings strategies, and investment guidance</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsChatOpen(true)}
                  data-testid="button-try-ai-chat"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Try AI Chat
                </Button>
                <Link href="/ai-assistant">
                  <Button data-testid="button-explore-ai">
                    <Zap className="w-4 h-4 mr-2" />
                    Explore AI Features
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Upcoming Events */}
            <UpcomingEvents />
            
            {/* Recent Transactions */}
            <RecentTransactions />
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

import { useState } from "react";
import { Link } from "wouter";
import { Plus, Clock, DollarSign, Brain, MessageCircle, Zap } from "lucide-react";
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
      
      {/* Header - Modern Design */}
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
              className="text-xl md:text-3xl font-bold text-brand flex items-center"
              style={{ fontSize: 'clamp(var(--text-xl), 4vw, var(--text-3xl))' }}
            >
              <Clock className="mr-2 text-brand" size={20} />
              <span className="hidden sm:inline">Twealth</span>
              <span className="sm:hidden">TW</span>
              <DollarSign className="ml-2 text-success" size={20} />
            </h1>
            <p 
              className="text-muted-foreground font-medium truncate"
              style={{ 
                fontSize: 'var(--text-sm)',
                marginTop: 'var(--space-1)'
              }}
            >
              <span className="hidden md:inline">Time = Money • Track, optimize, and maximize your productivity ROI</span>
              <span className="md:hidden">Track time & maximize ROI</span>
            </p>
          </div>
          <div className="flex items-center" style={{ gap: 'var(--space-3)' }}>
            <Drawer open={isCreateGoalOpen} onOpenChange={setIsCreateGoalOpen}>
              <DrawerTrigger asChild>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-px min-h-[44px]" 
                  style={{ 
                    borderRadius: 'var(--radius)',
                    padding: 'var(--space-3) var(--space-4)'
                  }}
                  data-testid="button-new-goal"
                >
                  <Plus size={16} className="mr-2" />
                  <span className="hidden sm:inline">💰 New Goal</span>
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

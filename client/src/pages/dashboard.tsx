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
      
      {/* Professional Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <div className="relative">
                    <Clock className="w-6 h-6 text-white" />
                    <DollarSign className="w-3 h-3 text-blue-200 absolute -top-0.5 -right-0.5" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
                    Twealth Dashboard
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">Professional wealth management platform</p>
                </div>
              </div>
              
              {/* Professional Trust Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="text-security-status">Security Status</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">Verified</div>
                  <div className="text-xs text-gray-500">256-bit encryption</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="text-data-sync">Data Sync</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">Live</div>
                  <div className="text-xs text-gray-500">Real-time updates</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="text-backup-status">Backup Status</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">Protected</div>
                  <div className="text-xs text-gray-500">Auto-backup enabled</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="text-uptime-status">Service Uptime</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">99.9%</div>
                  <div className="text-xs text-gray-500">Last 30 days</div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 ml-6">
              <Drawer open={isCreateGoalOpen} onOpenChange={setIsCreateGoalOpen}>
                <DrawerTrigger asChild>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 h-10 transition-colors shadow-sm"
                    data-testid="button-new-goal"
                  >
                    <Plus size={16} className="mr-2" />
                    <span className="hidden sm:inline">New Goal</span>
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
          
          {/* Professional Status Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="text-account-status">Account Status: Active</h2>
                <p className="text-gray-600 dark:text-gray-400">Your financial portfolio is secure and up-to-date. Last synchronized: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-4 py-6">
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

        {/* AI Advisory Services */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">AI Financial Advisory</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Professional financial analysis, portfolio optimization, and strategic planning</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsChatOpen(true)}
                  data-testid="button-try-ai-chat"
                  className="border-gray-300 dark:border-gray-600"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Consult AI
                </Button>
                <Link href="/ai-assistant">
                  <Button data-testid="button-explore-ai" className="bg-blue-600 hover:bg-blue-700">
                    <Brain className="w-4 h-4 mr-2" />
                    Advisory Services
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

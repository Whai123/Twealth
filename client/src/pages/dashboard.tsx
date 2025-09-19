import { Plus, Bell, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuickStats from "@/components/dashboard/quick-stats";
import TimeValueInsights from "@/components/dashboard/time-value-insights";
import FinancialGoalsProgress from "@/components/dashboard/financial-goals-progress";
import UpcomingEvents from "@/components/dashboard/upcoming-events";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import GroupsOverview from "@/components/dashboard/groups-overview";
import MonthlyProgressChart from "@/components/dashboard/monthly-progress-chart";

export default function Dashboard() {
  return (
    <>
      {/* Header - Mobile Optimized */}
      <header className="bg-card border-b border-border px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold time-money-gradient">
              <Clock className="inline mr-1 md:mr-2 text-time" size={20} />
              <span className="hidden sm:inline">ScheduleMoney</span>
              <span className="sm:hidden">SM</span>
              <DollarSign className="inline ml-1 md:ml-2 text-money" size={20} />
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium truncate">
              <span className="hidden md:inline">Time = Money • Track, optimize, and maximize your productivity ROI</span>
              <span className="md:hidden">Track time & maximize ROI</span>
            </p>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button 
              className="hidden sm:flex bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
              data-testid="button-new-goal"
            >
              <Plus size={16} className="mr-2" />
              💰 New Goal
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="min-w-[44px] min-h-[44px]"
              data-testid="button-notifications"
            >
              <Bell size={16} />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Quick Stats Cards */}
        <QuickStats />

        {/* Time-Value Insights */}
        <TimeValueInsights />

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

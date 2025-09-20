import { useState } from "react";
import { Plus, Bell, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function Dashboard() {
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
  return (
    <>
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
              <span className="hidden sm:inline">ScheduleLife</span>
              <span className="sm:hidden">SM</span>
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
            <Button 
              variant="outline" 
              size="icon" 
              className="transition-all duration-200 hover:-translate-y-px"
              style={{ 
                minWidth: '44px', 
                minHeight: '44px',
                borderRadius: 'var(--radius)'
              }}
              data-testid="button-notifications"
            >
              <Bell size={16} />
            </Button>
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

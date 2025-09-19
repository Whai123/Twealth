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
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold time-money-gradient">
              <Clock className="inline mr-2 text-time" size={28} />
              ScheduleMoney
              <DollarSign className="inline ml-2 text-money" size={28} />
            </h1>
            <p className="text-muted-foreground font-medium">Time = Money • Track, optimize, and maximize your productivity ROI</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="hidden sm:flex bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" data-testid="button-new-goal">
              <Plus size={16} className="mr-2" />
              💰 New Wealth Goal
            </Button>
            <Button variant="outline" size="icon" data-testid="button-notifications">
              <Bell size={16} />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Quick Stats Cards */}
        <QuickStats />

        {/* Time-Value Insights */}
        <TimeValueInsights />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Goals Progress */}
          <div className="lg:col-span-2">
            <FinancialGoalsProgress />
          </div>
          
          {/* Upcoming Events */}
          <UpcomingEvents />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <RecentTransactions />
          
          {/* Groups Overview */}
          <GroupsOverview />
        </div>

        {/* Monthly Progress Chart */}
        <MonthlyProgressChart />
      </div>
    </>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { PiggyBank, Target, Users, TrendingUp, ArrowUp } from "lucide-react";

export default function QuickStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Savings",
      value: `$${(stats as any)?.totalSavings?.toLocaleString() || '0'}`,

      change: "+8.2% this month",
      icon: PiggyBank,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      changeColor: "text-green-600"
    },
    {
      title: "Active Goals",
      value: (stats as any)?.activeGoals || '0',
      change: "67% avg progress",
      icon: Target,
      iconBg: "bg-blue-100", 
      iconColor: "text-primary",
      changeColor: "text-primary"
    },
    {
      title: "Group Events",
      value: (stats as any)?.upcomingEvents || '0',
      change: "This week",
      icon: Users,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      changeColor: "text-amber-600"
    },
    {
      title: "Monthly Income",
      value: `$${(stats as any)?.monthlyIncome?.toLocaleString() || '0'}`,
      change: "Target: $6,000",
      icon: TrendingUp,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      changeColor: "text-muted-foreground"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="p-6 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" data-testid={`text-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-foreground" data-testid={`value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </p>
                <p className={`text-xs mt-1 ${stat.changeColor}`}>
                  {index === 0 && <ArrowUp size={12} className="inline mr-1" />}
                  {stat.change}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={stat.iconColor} size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

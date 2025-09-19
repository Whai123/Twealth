import { memo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { PiggyBank, Target, Users, TrendingUp, ArrowUp, Clock, DollarSign, Zap, BarChart3 } from "lucide-react";

function QuickStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });
  
  const { data: timeStats, isLoading: timeStatsLoading } = useQuery({
    queryKey: ["/api/dashboard/time-stats"],
  });

  if (isLoading || timeStatsLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 md:p-6">
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

  const currency = (timeStats as any)?.currency || 'USD';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;
  
  const statCards = [
    {
      title: "Time Value",
      value: `${currencySymbol}${Math.round((timeStats as any)?.timeValue || 0).toLocaleString()}`,
      change: `${Math.round((timeStats as any)?.totalTimeHours || 0)}h tracked`,
      icon: Clock,
      iconBg: "productivity-gradient",
      iconColor: "text-white",
      changeColor: "text-time",
      badge: "time-badge",
      gradient: true
    },
    {
      title: "Hourly Rate",
      value: `${currencySymbol}${(timeStats as any)?.hourlyRate || 50}/hr`,
      change: `${(timeStats as any)?.timeEfficiencyPercent || 0}% efficiency`,
      icon: DollarSign,
      iconBg: "value-gradient",
      iconColor: "text-white",
      changeColor: "text-money",
      badge: "money-badge",
      gradient: true
    },
    {
      title: "Net Impact",
      value: `${currencySymbol}${Math.round((timeStats as any)?.netImpact || 0).toLocaleString()}`,
      change: (timeStats as any)?.netImpact >= 0 ? "Positive ROI" : "Needs optimization",
      icon: (timeStats as any)?.netImpact >= 0 ? TrendingUp : BarChart3,
      iconBg: (timeStats as any)?.netImpact >= 0 ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20",
      iconColor: (timeStats as any)?.netImpact >= 0 ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300",
      changeColor: (timeStats as any)?.netImpact >= 0 ? "text-value-positive" : "text-value-negative",
      badge: (timeStats as any)?.netImpact >= 0 ? "value-badge-positive" : "value-badge-negative"
    },
    {
      title: "Productivity",
      value: `${(timeStats as any)?.averageHourlyValue ? Math.round((timeStats as any).averageHourlyValue) : 0}%`,
      change: "vs target rate",
      icon: Zap,
      iconBg: "insight-gradient",
      iconColor: "text-white",
      changeColor: "text-productivity-medium",
      badge: "productivity-medium",
      gradient: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {statCards.map((stat, index) => (
        <Card 
          key={index} 
          className="card-elevated animate-fade-in" 
          style={{
            animationDelay: `${index * 0.05}s`,
            padding: 'var(--space-6)'
          }}
        >
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <p 
                    className="text-sm text-muted-foreground font-medium" 
                    style={{ fontSize: 'var(--text-sm)' }}
                    data-testid={`text-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {stat.title}
                  </p>
                  {stat.badge && (
                    <span className={stat.badge}>
                      {stat.title === 'Time Value' ? '⏰' : stat.title === 'Hourly Rate' ? '💰' : stat.title === 'Net Impact' ? (stat.changeColor.includes('positive') ? '📈' : '📉') : '⚡'}
                    </span>
                  )}
                </div>
                <p 
                  className={`text-2xl font-bold counter-animate ${stat.title === 'Time Value' ? 'text-mono text-brand' : stat.title === 'Hourly Rate' ? 'text-tabular text-success' : 'text-foreground'}`} 
                  style={{ fontSize: 'var(--text-2xl)' }}
                  data-testid={`value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {stat.value}
                </p>
                <p 
                  className={`text-xs font-medium ${stat.changeColor}`}
                  style={{ 
                    fontSize: 'var(--text-xs)',
                    marginTop: 'var(--space-2)'
                  }}
                >
                  {(stat.title === 'Net Impact' && (timeStats as any)?.netImpact >= 0) && <ArrowUp size={12} className="inline mr-1" />}
                  {stat.change}
                </p>
              </div>
              <div 
                className={`w-12 h-12 ${stat.gradient ? stat.iconBg : stat.iconBg} flex items-center justify-center`}
                style={{ 
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <stat.icon className={stat.iconColor} size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Export with React.memo for mobile performance optimization
export default memo(QuickStats);

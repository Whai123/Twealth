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

  const { data: prevTimeStats } = useQuery({
    queryKey: ["/api/dashboard/time-stats-previous"],
    queryFn: () => fetch("/api/dashboard/time-stats?previous=true").then(res => res.json()),
    enabled: !timeStatsLoading && !!timeStats,
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
  
  // Calculate period-over-period changes
  const currentTimeValue = (timeStats as any)?.timeValue || 0;
  const prevTimeValue = (prevTimeStats as any)?.timeValue || 0;
  const timeValueChange = prevTimeValue ? ((currentTimeValue - prevTimeValue) / prevTimeValue) * 100 : 0;
  
  const currentNetImpact = (timeStats as any)?.netImpact || 0;
  const prevNetImpact = (prevTimeStats as any)?.netImpact || 0;
  const netImpactChange = prevNetImpact ? ((currentNetImpact - prevNetImpact) / prevNetImpact) * 100 : 0;
  
  const currentEfficiency = (timeStats as any)?.timeEfficiencyPercent || 0;
  const prevEfficiency = (prevTimeStats as any)?.timeEfficiencyPercent || 0;
  const efficiencyChange = prevEfficiency ? ((currentEfficiency - prevEfficiency) / prevEfficiency) * 100 : 0;
  
  const getTrendIcon = (change: number) => {
    if (Math.abs(change) < 1) return null;
    return change > 0 ? '📈' : '📉';
  };
  
  const getChangeText = (change: number, format: 'percentage' | 'absolute' = 'percentage') => {
    if (Math.abs(change) < 0.1) return 'No change';
    const sign = change > 0 ? '+' : '';
    if (format === 'percentage') {
      return `${sign}${change.toFixed(1)}% vs last period`;
    }
    return `${sign}${change.toFixed(0)}`;
  };
  
  const statCards = [
    {
      title: "Time Value",
      value: `${currencySymbol}${Math.round((timeStats as any)?.timeValue || 0).toLocaleString()}`,
      change: getChangeText(timeValueChange),
      trend: getTrendIcon(timeValueChange),
      rawChange: timeValueChange,
      subtext: `${Math.round((timeStats as any)?.totalTimeHours || 0)}h tracked`,
      icon: Clock,
      iconBg: "productivity-gradient",
      iconColor: "text-white",
      changeColor: timeValueChange > 0 ? "text-green-600" : timeValueChange < 0 ? "text-red-600" : "text-muted-foreground",
      badge: "time-badge",
      gradient: true
    },
    {
      title: "Hourly Rate",
      value: `${currencySymbol}${(timeStats as any)?.hourlyRate || 50}/hr`,
      change: getChangeText(efficiencyChange),
      trend: getTrendIcon(efficiencyChange),
      rawChange: efficiencyChange,
      subtext: `${(timeStats as any)?.timeEfficiencyPercent || 0}% efficiency`,
      icon: DollarSign,
      iconBg: "value-gradient",
      iconColor: "text-white",
      changeColor: efficiencyChange > 0 ? "text-green-600" : efficiencyChange < 0 ? "text-red-600" : "text-muted-foreground",
      badge: "money-badge",
      gradient: true
    },
    {
      title: "Net Impact",
      value: `${currencySymbol}${Math.round((timeStats as any)?.netImpact || 0).toLocaleString()}`,
      change: getChangeText(netImpactChange),
      trend: getTrendIcon(netImpactChange),
      rawChange: netImpactChange,
      subtext: (timeStats as any)?.netImpact >= 0 ? "Positive ROI" : "Needs optimization",
      icon: (timeStats as any)?.netImpact >= 0 ? TrendingUp : BarChart3,
      iconBg: (timeStats as any)?.netImpact >= 0 ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20",
      iconColor: (timeStats as any)?.netImpact >= 0 ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300",
      changeColor: netImpactChange > 0 ? "text-green-600" : netImpactChange < 0 ? "text-red-600" : "text-muted-foreground",
      badge: (timeStats as any)?.netImpact >= 0 ? "value-badge-positive" : "value-badge-negative"
    },
    {
      title: "Productivity",
      value: `${(timeStats as any)?.averageHourlyValue ? Math.round((timeStats as any).averageHourlyValue) : 0}%`,
      change: "Performance index",
      trend: null,
      rawChange: 0,
      subtext: "vs target rate",
      icon: Zap,
      iconBg: "insight-gradient",
      iconColor: "text-white",
      changeColor: "text-productivity-medium",
      badge: "productivity-medium",
      gradient: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
      {statCards.map((stat, index) => (
        <Card 
          key={index} 
          className="fade-in bg-gradient-card border-0 cursor-pointer group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 touch-manipulation p-4 md:p-6 backdrop-blur-sm" 
          style={{
            animationDelay: `${index * 0.1}s`,
            minHeight: 'clamp(140px, 20vw, 180px)'
          }}
          data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
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
                      {stat.title === 'Time Value' ? '⏰' : stat.title === 'Hourly Rate' ? '💰' : stat.title === 'Net Impact' ? ((timeStats as any)?.netImpact >= 0 ? '📈' : '📉') : '⚡'}
                    </span>
                  )}
                </div>
                <p 
                  className={`font-bold counter-up transition-all duration-300 group-hover:scale-110 ${stat.title === 'Time Value' ? 'text-primary' : stat.title === 'Hourly Rate' ? 'text-success' : stat.title === 'Net Impact' ? stat.iconColor : 'text-foreground'}`} 
                  style={{ 
                    fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: '1.2'
                  }}
                  data-testid={`value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {stat.value}
                </p>
                <div className="space-y-1">
                  <p 
                    className={`text-xs font-medium ${stat.changeColor} flex items-center gap-1`}
                    style={{ 
                      fontSize: 'var(--text-xs)'
                    }}
                  >
                    {stat.trend && <span className="text-xs">{stat.trend}</span>}
                    {stat.rawChange && Math.abs(stat.rawChange) >= 1 && (
                      <ArrowUp 
                        size={10} 
                        className={`${stat.rawChange > 0 ? 'text-green-600' : 'text-red-600 rotate-180'}`} 
                      />
                    )}
                    {stat.change}
                  </p>
                  {stat.subtext && (
                    <p 
                      className="text-xs text-muted-foreground"
                      style={{ fontSize: 'var(--text-xs)' }}
                    >
                      {stat.subtext}
                    </p>
                  )}
                </div>
              </div>
              <div 
                className={`w-14 h-14 bg-gradient-primary flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}
                style={{ 
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <stat.icon className="text-primary-foreground" size={24} />
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

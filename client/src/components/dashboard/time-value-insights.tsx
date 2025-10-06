import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, LineChart, Area, AreaChart } from "recharts";
import { Clock, DollarSign, TrendingUp, Calendar, Target, BarChart3 } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";
import { useState } from "react";

export default function TimeValueInsights() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  const { data: insights, isLoading } = useQuery({
    queryKey: ["/api/insights/time-value", range],
    queryFn: () => fetch(`/api/insights/time-value?range=${range}`).then(res => res.json()),
  });

  const { data: timeStats } = useQuery({
    queryKey: ["/api/dashboard/time-stats", range],
    queryFn: () => fetch(`/api/dashboard/time-stats?range=${range}`).then(res => res.json()),
  });

  if (isLoading) {
    return (
      <Card className="p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-64 bg-muted rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const currency = timeStats?.currency || 'USD';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;

  // Generate sample data for time vs money visualization
  const chartData = insights?.topCategories?.map((category: any, index: number) => ({
    category: category.category.length > 15 ? category.category.substring(0, 15) + '...' : category.category,
    timeHours: category.timeHours,
    value: category.value,
    efficiency: category.timeHours > 0 ? (category.value / category.timeHours) : 0,
  })) || [];

  // Time distribution data for the area chart
  const timeDistribution = insights?.topCategories?.map((category: any) => ({
    name: category.category.length > 10 ? category.category.substring(0, 10) + '...' : category.category,
    hours: category.timeHours,
    value: category.value,
  })) || [];

  const rangeLabels = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
  };

  return (
    <Card className="shadow-sm hover-lift">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 productivity-gradient rounded-lg flex items-center justify-center">
              <BarChart3 className="text-white" size={18} />
            </div>
            <CardTitle className="text-lg font-semibold time-money-gradient">
              Time = Money Insights
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <Button
                key={r}
                variant={range === r ? "default" : "outline"}
                size="sm"
                onClick={() => setRange(r)}
                className={range === r ? "productivity-gradient text-white" : ""}
                data-testid={`button-range-${r}`}
              >
                {r}
              </Button>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {rangeLabels[range]} • Track how your time converts to value
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="efficiency" data-testid="tab-efficiency">Efficiency</TabsTrigger>
            <TabsTrigger value="distribution" data-testid="tab-distribution">Distribution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="text-time" size={16} />
                  <span className="text-sm font-medium text-time">Total Time</span>
                </div>
                <p className="text-2xl font-bold time-format" data-testid="metric-total-time">
                  {Math.round(insights?.totalTimeHours || 0)}h
                </p>
                <p className="text-xs text-muted-foreground">
                  {range === '7d' ? 'this week' : range === '30d' ? 'this month' : 'this quarter'}
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/10 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="text-money" size={16} />
                  <span className="text-sm font-medium text-money">Time Value</span>
                </div>
                <p className="text-2xl font-bold currency-format" data-testid="metric-time-value">
                  {currencySymbol}{Math.round(insights?.timeValue || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  @ {currencySymbol}{timeStats?.hourlyRate || 50}/hr
                </p>
              </div>
              
              <div className={`p-4 rounded-lg ${insights?.netImpact >= 0 ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 border border-green-200 dark:border-green-800' : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 border border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className={insights?.netImpact >= 0 ? "text-value-positive" : "text-value-negative"} size={16} />
                  <span className={`text-sm font-medium ${insights?.netImpact >= 0 ? "text-value-positive" : "text-value-negative"}`}>
                    Net Impact
                  </span>
                </div>
                <p className={`text-2xl font-bold currency-format ${insights?.netImpact >= 0 ? "text-value-positive" : "text-value-negative"}`} data-testid="metric-net-impact">
                  {currencySymbol}{Math.round(insights?.netImpact || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {insights?.netImpact >= 0 ? "Positive ROI" : "Needs optimization"}
                </p>
              </div>
            </div>

            {/* Time vs Value Chart */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Target size={16} className="text-primary" />
                Category Performance
              </h3>
              <div className="h-80">
                <ChartContainer config={{
                  timeHours: { label: "Time Hours", color: "hsl(var(--time-primary))" },
                  value: { label: "Value", color: "hsl(var(--money-primary))" }
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart 
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="category" 
                        fontSize={11}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        yAxisId="time"
                        orientation="left"
                        fontSize={12}
                        tick={{ fill: 'hsl(var(--time-primary))' }}
                      />
                      <YAxis 
                        yAxisId="value"
                        orientation="right"
                        fontSize={12}
                        tick={{ fill: 'hsl(var(--money-primary))' }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const hours = Number(payload[0]?.value || 0);
                            const value = Number(payload[1]?.value || 0);
                            const efficiency = hours > 0 ? value / hours : 0;
                            return (
                              <div className="bg-card border rounded-lg p-3 shadow-lg min-w-[200px]">
                                <p className="font-medium mb-2 truncate">{label}</p>
                                <p className="text-sm text-time">
                                  ⏰ {hours.toFixed(1)}h tracked
                                </p>
                                <p className="text-sm text-money">
                                  💰 {currencySymbol}{Math.round(value).toLocaleString()} earned
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Efficiency: {currencySymbol}{Math.round(efficiency)}/hr
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        yAxisId="time"
                        dataKey="timeHours" 
                        fill="hsl(var(--time-primary))" 
                        radius={[2, 2, 0, 0]}
                        opacity={0.8}
                      />
                      <Bar 
                        yAxisId="value"
                        dataKey="value" 
                        fill="hsl(var(--money-primary))" 
                        radius={[2, 2, 0, 0]}
                        opacity={0.8}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="efficiency" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Hourly Rate by Category</h3>
              <div className="h-64">
                <ChartContainer config={{
                  efficiency: { label: "Efficiency", color: "hsl(var(--productivity-medium))" }
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="category" 
                        fontSize={12}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        fontSize={12}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-card border rounded-lg p-3 shadow-lg">
                                <p className="font-medium mb-2">{label}</p>
                                <p className="text-sm">
                                  Efficiency: {currencySymbol}{Math.round(Number(payload[0]?.value || 0))}/hr
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="efficiency" 
                        fill="hsl(var(--productivity-medium))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="distribution" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Time Distribution</h3>
              <div className="h-64">
                <ChartContainer config={{
                  hours: { label: "Hours", color: "hsl(var(--time-primary))" }
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="name" 
                        fontSize={12}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        fontSize={12}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const hours = Number(payload[0]?.value || 0);
                            const percentage = Math.round((hours / (insights?.totalTimeHours || 1)) * 100);
                            const value = Number(payload[1]?.value || 0);
                            return (
                              <div className="bg-card border rounded-lg p-3 shadow-lg min-w-[200px]">
                                <p className="font-medium mb-2 truncate">{label}</p>
                                <p className="text-sm text-time">
                                  ⏰ {hours.toFixed(1)}h ({percentage}%)
                                </p>
                                <p className="text-sm text-money">
                                  💰 {currencySymbol}{Math.round(value).toLocaleString()}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        dataKey="hours" 
                        fill="hsl(var(--time-primary))" 
                        stroke="hsl(var(--time-primary))"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Upcoming High-Impact Events */}
        {insights?.upcomingHighImpact && insights.upcomingHighImpact.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              High-Impact Events Coming Up
            </h3>
            <div className="space-y-2">
              {insights.upcomingHighImpact.slice(0, 3).map((event: any, index: number) => (
                <div key={event.eventId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                  <div>
                    <p className="font-medium text-sm" data-testid={`upcoming-event-${index}`}>
                      {event.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Estimated value: {currencySymbol}{Math.round(event.estimatedValue).toLocaleString()}
                    </p>
                  </div>
                  <div className="value-badge-positive">
                    💡 High ROI
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
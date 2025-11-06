import { Brain, Clock, DollarSign, Calendar, TrendingUp, TrendingDown, AlertCircle, Lightbulb, Zap } from"lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Badge } from"@/components/ui/badge";
import { Button } from"@/components/ui/button";
import { Progress } from"@/components/ui/progress";

interface SmartInsight {
 type: 'opportunity' | 'warning' | 'suggestion' | 'achievement';
 title: string;
 description: string;
 action?: string;
 value?: string;
 icon?: React.ReactNode;
}

interface CalendarInsightProps {
 events: any[];
 timeRange: 'week' | 'month' | 'quarter';
}

export default function SmartCalendarInsights({ events, timeRange }: CalendarInsightProps) {
 const generateInsights = (): SmartInsight[] => {
  if (!events || !Array.isArray(events)) return [];
  
  const insights: SmartInsight[] = [];
  const now = new Date();
  const upcomingEvents = events.filter(event => new Date(event.startTime) > now);
  const pastEvents = events.filter(event => new Date(event.startTime) <= now);
  
  // Time value analysis
  const totalTimeValue = pastEvents.reduce((acc, event) => {
   const duration = event.actualDurationMinutes || event.plannedDurationMinutes || 0;
   return acc + (duration / 60) * 50; // $50/hr default
  }, 0);
  
  // High-value time slots analysis
  const eventsByDayOfWeek = pastEvents.reduce((acc, event) => {
   const dayOfWeek = new Date(event.startTime).getDay();
   const timeValue = ((event.actualDurationMinutes || event.plannedDurationMinutes || 0) / 60) * 50;
   acc[dayOfWeek] = (acc[dayOfWeek] || 0) + timeValue;
   return acc;
  }, {} as Record<number, number>);
  
  const bestDay = Object.entries(eventsByDayOfWeek)
   .sort(([,a], [,b]) => (b as number) - (a as number))[0];
  
  if (bestDay && (bestDay[1] as number) > 200) {
   const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
   insights.push({
    type: 'achievement',
    title: `${dayNames[parseInt(bestDay[0])]} is your most productive day`,
    description: `You generate $${Math.round(bestDay[1] as number)} average time value on ${dayNames[parseInt(bestDay[0])]}s`,
    action: `Schedule important tasks on ${dayNames[parseInt(bestDay[0])]}s`,
    icon: <Zap className="text-yellow-500" size={16} />
   });
  }
  
  // Budget efficiency analysis
  const budgetEvents = pastEvents.filter(event => event.budget && parseFloat(event.budget) > 0);
  const underBudgetEvents = budgetEvents.filter(event => {
   const budget = parseFloat(event.budget);
   const actual = parseFloat(event.actualCost || '0');
   return actual <= budget;
  });
  
  if (budgetEvents.length > 0) {
   const budgetEfficiency = (underBudgetEvents.length / budgetEvents.length) * 100;
   if (budgetEfficiency >= 80) {
    insights.push({
     type: 'achievement',
     title: 'Excellent budget management',
     description: `${budgetEfficiency.toFixed(0)}% of your events stayed within budget`,
     value: `${budgetEfficiency.toFixed(0)}%`,
     icon: <DollarSign className="text-green-500" size={16} />
    });
   } else if (budgetEfficiency < 50) {
    insights.push({
     type: 'warning',
     title: 'Budget overruns detected',
     description: `${(100 - budgetEfficiency).toFixed(0)}% of events exceeded budget`,
     action: 'Review event planning process',
     icon: <AlertCircle className="text-red-500" size={16} />
    });
   }
  }
  
  // Time estimation accuracy
  const trackedEvents = pastEvents.filter(event => 
   event.plannedDurationMinutes > 0 && event.actualDurationMinutes > 0
  );
  
  if (trackedEvents.length >= 3) {
   const avgAccuracy = trackedEvents.reduce((acc, event) => {
    const planned = event.plannedDurationMinutes;
    const actual = event.actualDurationMinutes;
    const accuracy = Math.min(planned, actual) / Math.max(planned, actual);
    return acc + accuracy;
   }, 0) / trackedEvents.length;
   
   if (avgAccuracy >= 0.8) {
    insights.push({
     type: 'achievement',
     title: 'Great time estimation skills',
     description: `Your time estimates are ${(avgAccuracy * 100).toFixed(0)}% accurate on average`,
     value: `${(avgAccuracy * 100).toFixed(0)}%`,
     icon: <Clock className="text-blue-500" size={16} />
    });
   } else if (avgAccuracy < 0.6) {
    insights.push({
     type: 'suggestion',
     title: 'Improve time estimation',
     description: `Your estimates are ${((1 - avgAccuracy) * 100).toFixed(0)}% off on average`,
     action: 'Add buffer time to future events',
     icon: <Clock className="text-orange-500" size={16} />
    });
   }
  }
  
  // Upcoming opportunities
  const highValueUpcoming = upcomingEvents.filter(event => {
   const duration = event.plannedDurationMinutes || 0;
   const timeValue = (duration / 60) * 50;
   return timeValue > 300;
  });
  
  if (highValueUpcoming.length > 0) {
   insights.push({
    type: 'opportunity',
    title: `${highValueUpcoming.length} high-value event${highValueUpcoming.length === 1 ? '' : 's'} coming up`,
    description: 'Potential time value over $300 each',
    action: 'Optimize preparation for maximum ROI',
    icon: <TrendingUp className="text-green-500" size={16} />
   });
  }
  
  // Calendar density analysis
  const thisWeekEvents = upcomingEvents.filter(event => {
   const eventDate = new Date(event.startTime);
   const weekFromNow = new Date();
   weekFromNow.setDate(weekFromNow.getDate() + 7);
   return eventDate <= weekFromNow;
  });
  
  if (thisWeekEvents.length > 15) {
   insights.push({
    type: 'warning',
    title: 'Busy week ahead',
    description: `${thisWeekEvents.length} events scheduled in the next 7 days`,
    action: 'Consider rescheduling non-essential items',
    icon: <AlertCircle className="text-orange-500" size={16} />
   });
  } else if (thisWeekEvents.length < 3) {
   insights.push({
    type: 'opportunity',
    title: 'Light schedule ahead',
    description: 'Great time to focus on important projects',
    action: 'Block time for deep work sessions',
    icon: <Lightbulb className="text-blue-500" size={16} />
   });
  }
  
  return insights;
 };
 
 const insights = generateInsights();
 
 if (insights.length === 0) {
  return (
   <Card className="border-dashed">
    <CardContent className="flex flex-col items-center justify-center py-8">
     <Brain className="h-12 w-12 text-muted-foreground mb-4" />
     <h3 className="font-semibold text-muted-foreground mb-2">No insights yet</h3>
     <p className="text-sm text-muted-foreground text-center">
      Add more events and track time to get smart calendar insights
     </p>
    </CardContent>
   </Card>
  );
 }
 
 return (
  <div className="space-y-4">
   <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold flex items-center gap-2">
     <Brain className="text-purple-600" size={20} />
     Smart Insights
    </h3>
    <Badge variant="outline" className="text-xs">
     AI-Powered
    </Badge>
   </div>
   
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {insights.map((insight, index) => {
     const getInsightStyle = (type: SmartInsight['type']) => {
      switch (type) {
       case 'achievement':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
       case 'warning':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
       case 'opportunity':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
       case 'suggestion':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20';
       default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20';
      }
     };
     
     return (
      <Card 
       key={index} 
       className={`transition-all hover:shadow-md ${getInsightStyle(insight.type)}`}
       data-testid={`insight-card-${insight.type}-${index}`}
      >
       <CardContent className="p-4">
        <div className="space-y-3">
         <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1">
           {insight.icon}
           <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-tight">
             {insight.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
             {insight.description}
            </p>
           </div>
          </div>
          {insight.value && (
           <Badge variant="secondary" className="text-xs font-bold">
            {insight.value}
           </Badge>
          )}
         </div>
         
         {insight.action && (
          <div className="pt-2 border-t border-gray-200/50">
           <Button 
            size="sm" 
            variant="ghost"
            className="text-xs h-7 w-full justify-start text-left p-2 hover:bg-white/50"
            data-testid={`insight-action-${index}`}
           >
            <Lightbulb size={12} className="mr-1" />
            {insight.action}
           </Button>
          </div>
         )}
        </div>
       </CardContent>
      </Card>
     );
    })}
   </div>
   
   {/* Calendar Health Score */}
   <Card className="bg-white dark:bg-gray-900">
    <CardContent className="p-4">
     <div className="flex items-center justify-between mb-3">
      <h4 className="font-semibold flex items-center gap-2">
       <TrendingUp className="text-purple-600" size={16} />
       Calendar Health Score
      </h4>
      <Badge className="bg-purple-600 text-white">
       {Math.min(100, Math.max(0, 75 + (insights.filter(i => i.type === 'achievement').length * 10) - (insights.filter(i => i.type === 'warning').length * 15)))}%
      </Badge>
     </div>
     <Progress 
      value={Math.min(100, Math.max(0, 75 + (insights.filter(i => i.type === 'achievement').length * 10) - (insights.filter(i => i.type === 'warning').length * 15)))}
      className="h-2"
     />
     <div className="flex justify-between text-xs text-muted-foreground mt-2">
      <span>Needs work</span>
      <span>Excellent</span>
     </div>
    </CardContent>
   </Card>
  </div>
 );
}
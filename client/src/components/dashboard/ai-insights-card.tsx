import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Progress } from"@/components/ui/progress";
import { Badge } from"@/components/ui/badge";
import { Brain, RefreshCw, MessageCircle, Crown, AlertTriangle } from"lucide-react";
import { useQuery } from"@tanstack/react-query";
import { Skeleton } from"@/components/ui/skeleton";
import { safeString } from "@/lib/safe-render";

interface AIInsightsCardProps {
 onOpenChat?: () => void;
}

interface AIInsights {
 insight: string;
 error?: string;
}

interface UsageInfo {
 chatUsage: {
  used: number;
  limit: number;
  remaining: number;
  allowed: boolean;
 };
 analysisUsage: {
  used: number;
  limit: number;
  remaining: number;
  allowed: boolean;
 };
 insights: number;
 totalTokens: number;
 estimatedCost: string;
}

export default function AIInsightsCard({ onOpenChat }: AIInsightsCardProps) {
 const { data: insights, isLoading, refetch, isRefetching, error } = useQuery<AIInsights>({
  queryKey: ["/api/ai/insights"],
  refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  retry: (failureCount, error: any) => {
   // Don't retry on 429 rate limit errors
   if (error?.message?.includes('429') || error?.message?.includes('rate limit')) {
    return false;
   }
   return failureCount < 2;
  }
 });

 const { data: usage } = useQuery<UsageInfo>({
  queryKey: ["/api/subscription/usage"],
  refetchInterval: 30 * 1000 // Refetch every 30 seconds
 });

 return (
  <Card className="h-full">
   <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
     <CardTitle className="text-lg flex items-center gap-2">
      <Brain className="h-5 w-5 text-primary" />
      AI Insights
     </CardTitle>
     <Button
      variant="ghost"
      size="sm"
      onClick={() => refetch()}
      disabled={isRefetching}
      data-testid="button-refresh-insights"
     >
      <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
     </Button>
    </div>
   </CardHeader>
   
   <CardContent className="space-y-4">
    {isLoading ? (
     <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
     </div>
    ) : error ? (
     <div className="space-y-3">
      <div className="text-sm text-muted-foreground leading-relaxed">
       <p data-testid="text-ai-insight">
        Track your daily expenses to identify spending patterns and savings opportunities.
       </p>
       <p className="text-xs text-muted-foreground mt-2">
        {(error as any)?.message?.includes('429') || (error as any)?.message?.includes('rate limit') 
         ? 'AI insights temporarily unavailable due to high demand. Try again in a few minutes.' 
         : '* Showing fallback insight'}
       </p>
      </div>
     </div>
    ) : (
     <>
      <div className="text-sm text-foreground leading-relaxed">
       <p data-testid="text-ai-insight">
        {safeString(insights?.insight) ||"Focus on tracking your spending patterns this week."}
       </p>
       {insights?.error && (
        <p className="text-xs text-muted-foreground mt-2">
         * Generated offline insight
        </p>
       )}
      </div>

      {/* Usage Information */}
      {usage && (
       <div className="space-y-3 pt-3 border-t">
        <div className="flex justify-between items-center text-xs">
         <span className="text-muted-foreground">AI Chats this month</span>
         <span className="font-medium">
          {usage.chatUsage.used} / {usage.chatUsage.limit}
         </span>
        </div>
        <Progress 
         value={(usage.chatUsage.used / usage.chatUsage.limit) * 100} 
         className="h-2"
        />
        
        {usage.chatUsage.used >= usage.chatUsage.limit * 0.8 && (
         <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
          <AlertTriangle className="h-3 w-3" />
          <span>Running low on chat quota</span>
         </div>
        )}
       </div>
      )}

      <div className="pt-2">
       <Button
        onClick={onOpenChat}
        variant="outline"
        className="w-full text-sm"
        data-testid="button-chat-with-ai"
       >
        <MessageCircle className="h-4 w-4 mr-2" />
        Chat with AI for more advice
       </Button>
      </div>
     </>
    )}
   </CardContent>
  </Card>
 );
}
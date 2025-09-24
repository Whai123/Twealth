import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, RefreshCw, MessageCircle, Crown, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { data: insights, isLoading, refetch, isRefetching } = useQuery<AIInsights>({
    queryKey: ["/api/ai/insights"],
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
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
        ) : (
          <>
            <div className="text-sm text-foreground leading-relaxed">
              <p data-testid="text-ai-insight">
                {insights?.insight || "Focus on tracking your spending patterns this week."}
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
                disabled={usage && !usage.chatUsage.allowed}
                data-testid="button-chat-with-ai"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {usage && !usage.chatUsage.allowed ? (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to continue chatting
                  </>
                ) : (
                  "Chat with AI for more advice"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
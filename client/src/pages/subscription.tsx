import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Check, Zap, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  priceThb: string;
  priceUsd: string;
  currency: string;
  billingInterval: string;
  aiChatLimit: number;
  aiDeepAnalysisLimit: number;
  aiInsightsFrequency: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

interface Subscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  plan: SubscriptionPlan;
}

interface SubscriptionData {
  subscription: Subscription;
  usage: {
    aiChatsUsed: number;
    aiDeepAnalysisUsed: number;
    aiInsightsGenerated: number;
    totalTokensUsed: number;
    estimatedCostUsd: string;
  };
  addOns: any[];
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

const getFeatureIcon = (feature: string) => {
  switch (feature) {
    case 'ai_chat': return <Sparkles className="h-4 w-4" />;
    case 'advanced_goals': return <TrendingUp className="h-4 w-4" />;
    case 'priority_support': return <Crown className="h-4 w-4" />;
    case 'advanced_analytics': return <TrendingUp className="h-4 w-4" />;
    default: return <Check className="h-4 w-4" />;
  }
};

const formatFeatureName = (feature: string) => {
  const map: Record<string, string> = {
    'basic_tracking': 'Basic expense tracking',
    'ai_chat': 'AI financial assistant',
    'advanced_goals': 'Advanced goal setting',
    'group_planning': 'Group event planning',
    'transaction_import': 'Import transactions',
    'priority_support': 'Priority support',
    'advanced_analytics': 'Advanced analytics',
    'api_access': 'API access'
  };
  return map[feature] || feature.replace(/_/g, ' ');
};

export default function SubscriptionPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription/plans"]
  });

  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery<SubscriptionData>({
    queryKey: ["/api/subscription/current"]
  });

  const { data: usage } = useQuery<UsageInfo>({
    queryKey: ["/api/subscription/usage"],
    refetchInterval: 30 * 1000
  });

  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      return apiRequest("POST", "/api/subscription/upgrade", { planId });
    },
    onSuccess: () => {
      toast({
        title: "Subscription upgraded!",
        description: "Your subscription has been upgraded successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/usage"] });
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade failed",
        description: error.message || "Failed to upgrade subscription",
        variant: "destructive"
      });
    }
  });

  if (plansLoading || subscriptionLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  const currentPlan = currentSubscription?.subscription?.plan;

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground">
          Manage your Twealth subscription and unlock powerful AI features
        </p>
      </div>

      {/* Current Plan Status */}
      {currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Current Plan: {currentPlan.displayName}
            </CardTitle>
            <CardDescription>
              {currentPlan.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {usage && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>AI Chats</span>
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
                      <span>Running low on quota</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Deep Analysis</span>
                    <span className="font-medium">
                      {usage.analysisUsage.used} / {usage.analysisUsage.limit}
                    </span>
                  </div>
                  <Progress 
                    value={(usage.analysisUsage.used / usage.analysisUsage.limit) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2 md:grid-cols-3 text-sm">
              <div>
                <span className="text-muted-foreground">Insights Generated:</span>
                <span className="ml-2 font-medium">{usage?.insights || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tokens Used:</span>
                <span className="ml-2 font-medium">{usage?.totalTokens || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">AI Costs:</span>
                <span className="ml-2 font-medium">${usage?.estimatedCost || '0.0000'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Choose Your Plan</h2>
          <Button 
            variant="outline"
            onClick={() => setLocation('/upgrade')}
            data-testid="button-view-all-plans"
          >
            <Zap className="w-4 h-4 mr-2" />
            View All Plans
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {plans?.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isPremium = plan.name !== 'Free';
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${isPremium ? 'border-primary' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                data-testid={`card-plan-${plan.name.toLowerCase()}`}
              >
                {isPremium && (
                  <Badge className="absolute -top-2 left-4 bg-primary">
                    Popular
                  </Badge>
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                    {isCurrentPlan && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        ฿{parseFloat(plan.priceThb).toFixed(0)}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    {plan.priceUsd !== '0.00' && (
                      <div className="text-sm text-muted-foreground">
                        ~${parseFloat(plan.priceUsd).toFixed(2)} USD
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>AI Chats per month</span>
                      <span className="font-medium">{plan.aiChatLimit}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Deep Analysis queries</span>
                      <span className="font-medium">{plan.aiDeepAnalysisLimit}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>AI Insights</span>
                      <span className="font-medium capitalize">{plan.aiInsightsFrequency}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Features included:</h4>
                    <ul className="space-y-1 text-sm">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          {getFeatureIcon(feature)}
                          <span>{formatFeatureName(feature)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? "secondary" : "default"}
                    disabled={isCurrentPlan || upgradeMutation.isPending}
                    onClick={() => upgradeMutation.mutate(plan.id)}
                    data-testid={`button-upgrade-${plan.name.toLowerCase()}`}
                  >
                    {upgradeMutation.isPending ? (
                      "Upgrading..."
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : plan.name === 'Free' ? (
                      "Downgrade to Free"
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cost Savings Info */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-lg">Powered by Google Gemini</h3>
              <p className="text-sm text-muted-foreground">
                Our AI features are 25x more cost-effective than competitors, 
                allowing us to offer premium AI assistance at these affordable prices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
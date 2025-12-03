import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Check, Zap, TrendingUp, AlertTriangle, Sparkles, ArrowRight, Shield, Clock, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { getLocalizedPrice, formatCurrency, getCurrencySymbol } from "@/lib/currency";
import AIROICalculator from "@/components/ai-roi-calculator";

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  priceThb: string;
  priceUsd: string;
  currency: string;
  billingInterval: string;
  scoutLimit: number;
  sonnetLimit: number;
  gpt5Limit: number;
  opusLimit: number;
  aiChatLimit: number;
  aiDeepAnalysisLimit: number;
  aiInsightsFrequency: string;
  isLifetimeLimit: boolean;
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
  scoutUsage: { used: number; limit: number; remaining: number; };
  sonnetUsage: { used: number; limit: number; remaining: number; };
  gpt5Usage: { used: number; limit: number; remaining: number; };
  opusUsage: { used: number; limit: number; remaining: number; };
  chatUsage: { used: number; limit: number; remaining: number; allowed: boolean; };
  analysisUsage: { used: number; limit: number; remaining: number; allowed: boolean; };
  insights: number;
  totalTokens: number;
  estimatedCost: string;
}

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 800;
      const steps = 40;
      const increment = value / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(current);
        }
      }, duration / steps);
      
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return <span>{Math.round(displayValue).toLocaleString()}</span>;
}

function AnimatedProgress({ value, className }: { value: number; className?: string }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);
  
  return <Progress value={animatedValue} className={className} />;
}

function UsageCard({ 
  title, 
  used, 
  limit, 
  icon: Icon, 
  color, 
  badge,
  delay = 0
}: { 
  title: string; 
  used: number; 
  limit: number; 
  icon: any; 
  color: string;
  badge: string;
  delay?: number;
}) {
  const percentage = limit === 999999 ? 0 : (used / limit) * 100;
  const isWarning = percentage >= 80;
  const isUnlimited = limit === 999999;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`p-4 sm:p-5 bg-card rounded-xl border ${
        color === 'blue' ? 'border-blue-200/30 dark:border-blue-800/30' :
        color === 'emerald' ? 'border-emerald-200/30 dark:border-emerald-800/30' :
        color === 'amber' ? 'border-amber-200/30 dark:border-amber-800/30' :
        'border-border/30'
      } space-y-4`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${
            color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
            color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
            color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
            'text-primary'
          }`} />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <Badge className={`text-xs px-2 py-0.5 ${
          color === 'blue' ? 'bg-blue-500 text-white' :
          color === 'emerald' ? 'bg-emerald-500 text-white' :
          color === 'amber' ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white' :
          'bg-primary text-primary-foreground'
        }`}>
          {badge}
        </Badge>
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${
          color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
          color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
          color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
          'text-primary'
        }`}>
          <AnimatedNumber value={used} delay={delay * 1000} />
        </span>
        <span className="text-muted-foreground text-sm">
          / {isUnlimited ? 'Unlimited' : limit.toLocaleString()}
        </span>
      </div>
      
      {!isUnlimited && (
        <>
          <AnimatedProgress 
            value={percentage} 
            className={`h-2 ${
              color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
              color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
              color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30' :
              'bg-muted'
            }`}
          />
          {isWarning && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 rounded-lg p-2"
            >
              <AlertTriangle className="h-3 w-3" />
              <span className="font-medium">Running low!</span>
            </motion.div>
          )}
        </>
      )}
      
      {isUnlimited && (
        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
          Unlimited queries available
        </div>
      )}
    </motion.div>
  );
}

function PlanCard({ 
  plan, 
  isCurrentPlan, 
  userCurrency,
  onUpgrade,
  delay = 0
}: { 
  plan: SubscriptionPlan; 
  isCurrentPlan: boolean; 
  userCurrency: string;
  onUpgrade: () => void;
  delay?: number;
}) {
  const isPro = plan.name === 'pro';
  const isEnterprise = plan.name === 'enterprise';
  const isFree = plan.priceUsd === '0.00' || plan.name === 'free';
  
  const basePrice = parseFloat(plan.priceUsd);
  const localizedPrice = getLocalizedPrice(basePrice, userCurrency);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="h-full"
    >
      <Card 
        className={`relative h-full flex flex-col transition-all duration-300 ${
          isPro 
            ? 'border-primary/40 shadow-lg ring-1 ring-primary/20 hover:shadow-xl' 
            : 'border-border/40 hover:border-border hover:shadow-lg'
        } ${isCurrentPlan ? 'ring-2 ring-primary bg-primary/5' : ''}`}
        data-testid={`card-plan-${plan.name.toLowerCase()}`}
      >
        {isPro && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.2 }}
          >
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 text-xs font-medium z-10">
              MOST POPULAR
            </Badge>
          </motion.div>
        )}
        {isEnterprise && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.2 }}
          >
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-1 text-xs font-medium z-10">
              BEST FOR CFO TEAMS
            </Badge>
          </motion.div>
        )}
        
        <CardHeader className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">{plan.displayName}</CardTitle>
            {isCurrentPlan && (
              <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-medium">
                Active
              </Badge>
            )}
          </div>
          <CardDescription className="text-sm leading-relaxed">{plan.description}</CardDescription>
          
          <div className="space-y-2 pt-2">
            {isFree ? (
              <div className="flex items-baseline">
                <span className="text-4xl sm:text-5xl font-bold">Free</span>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold">
                    {localizedPrice.currency.symbol}{localizedPrice.amount.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground text-base">/month</span>
                </div>
                {localizedPrice.isDiscounted && localizedPrice.originalAmount && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground line-through">
                      {formatCurrency(localizedPrice.originalAmount, userCurrency)}
                    </span>
                    <Badge className="bg-green-500 text-white text-xs">
                      {Math.round((1 - localizedPrice.amount / localizedPrice.originalAmount) * 100)}% OFF
                    </Badge>
                  </div>
                )}
                {userCurrency !== 'USD' && (
                  <p className="text-xs text-muted-foreground">~${basePrice.toFixed(2)} USD</p>
                )}
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-6 p-5 sm:p-6 pt-0">
          <div className="space-y-4 flex-1">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Model Quotas
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm">Scout (Fast)</span>
                </div>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400" data-testid={`text-${plan.name.toLowerCase()}-scout-limit`}>
                  {plan.scoutLimit === 999999 ? 'Unlimited' : plan.scoutLimit}
                </span>
              </div>
              
              {plan.sonnetLimit > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm">Sonnet (Smart)</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400" data-testid={`text-${plan.name.toLowerCase()}-sonnet-limit`}>
                    {plan.sonnetLimit}
                  </span>
                </div>
              )}
              
              {plan.gpt5Limit > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm">GPT-5 (Math)</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400" data-testid={`text-${plan.name.toLowerCase()}-gpt5-limit`}>
                    {plan.gpt5Limit}
                  </span>
                </div>
              )}
              
              {plan.opusLimit > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm">Opus (CFO)</span>
                  </div>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400" data-testid={`text-${plan.name.toLowerCase()}-opus-limit`}>
                    {plan.opusLimit === 999999 ? 'Unlimited' : plan.opusLimit}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Features Included
              </h4>
              <ul className="space-y-2">
                {plan.features.slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2.5 text-sm">
                    <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-muted-foreground capitalize">{feature.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button
            className={`w-full h-12 text-base font-semibold ${
              isCurrentPlan 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : isPro || isEnterprise
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
            disabled={isCurrentPlan}
            onClick={onUpgrade}
            data-testid={`button-upgrade-${plan.name.toLowerCase()}`}
          >
            {isCurrentPlan ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Current Plan
              </>
            ) : isFree ? (
              <>
                Start Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Upgrade to {plan.name}
                <Crown className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

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
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: userPreferences } = useQuery<{ currency?: string }>({
    queryKey: ["/api/user-preferences"],
  });

  const handleUpgrade = async (planId: string, planName: string) => {
    if (planName === 'free') {
      apiRequest("POST", "/api/subscription/upgrade", { planId })
        .then(() => {
          toast({
            title: "Switched to Free Plan",
            description: "You're now on the Free plan."
          });
          queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
          queryClient.invalidateQueries({ queryKey: ["/api/subscription/usage"] });
        })
        .catch((error: any) => {
          toast({
            title: "Upgrade failed",
            description: error.message || "Failed to change plan",
            variant: "destructive"
          });
        });
    } else {
      try {
        const response = await apiRequest("POST", "/api/subscription/create-checkout-session", { planId });
        const data = await response.json();
        const { url } = data;
        
        if (url) {
          window.location.href = url;
        } else {
          throw new Error("No checkout URL received from Stripe");
        }
      } catch (error: any) {
        toast({
          title: "Checkout Failed",
          description: error.message || "Failed to create checkout session",
          variant: "destructive"
        });
      }
    }
  };

  if (plansLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background/95 backdrop-blur border-b border-border/40 sticky top-0 z-30">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </header>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <Card className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            </div>
          </Card>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[500px] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = currentSubscription?.subscription?.plan;
  const userCurrency = userPreferences?.currency || 'USD';

  return (
    <div className="min-h-screen-mobile bg-background pb-20 md:pb-0">
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold tracking-tight text-foreground">
              Subscription Plans
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
              Upgrade your account to unlock advanced features
            </p>
          </motion.div>
        </div>
      </header>
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-12">
        {currentPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-border/40 overflow-hidden">
              <CardHeader className="space-y-3 pb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Your Current Plan</h2>
                    <p className="text-sm text-muted-foreground">{currentPlan.displayName}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {usage && (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <UsageCard
                      title="Scout Queries"
                      used={usage.scoutUsage.used}
                      limit={usage.scoutUsage.limit}
                      icon={Zap}
                      color="blue"
                      badge="Fast"
                      delay={0}
                    />
                    
                    {usage.sonnetUsage.limit > 0 && (
                      <UsageCard
                        title="Sonnet Queries"
                        used={usage.sonnetUsage.used}
                        limit={usage.sonnetUsage.limit}
                        icon={Sparkles}
                        color="blue"
                        badge="Smart"
                        delay={0.1}
                      />
                    )}
                    
                    {usage.gpt5Usage && usage.gpt5Usage.limit > 0 && (
                      <UsageCard
                        title="GPT-5 Queries"
                        used={usage.gpt5Usage.used}
                        limit={usage.gpt5Usage.limit}
                        icon={TrendingUp}
                        color="emerald"
                        badge="Math"
                        delay={0.2}
                      />
                    )}
                    
                    {usage.opusUsage.limit > 0 && (
                      <UsageCard
                        title="Opus Queries"
                        used={usage.opusUsage.used}
                        limit={usage.opusUsage.limit}
                        icon={Crown}
                        color="amber"
                        badge="CFO"
                        delay={0.3}
                      />
                    )}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: 'Insights Generated', value: usage?.insights || 0, icon: Sparkles },
                    { label: 'Tokens Used', value: usage?.totalTokens || 0, icon: Zap },
                    { label: 'AI Costs', value: `$${usage?.estimatedCost || '0.00'}`, icon: TrendingUp },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                      className="text-center p-4 sm:p-5 bg-muted/50 rounded-xl"
                    >
                      <stat.icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xl sm:text-2xl font-bold">
                        {typeof stat.value === 'number' ? <AnimatedNumber value={stat.value} delay={400 + index * 100} /> : stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <AIROICalculator 
          userCurrency={userCurrency}
          currentTier={
            currentPlan?.name === 'enterprise' ? 'enterprise' :
            currentPlan?.name === 'pro' ? 'pro' : 'free'
          }
        />

        <div className="space-y-8 sm:space-y-10">
          <motion.div 
            className="text-center space-y-3 sm:space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Choose Your Plan
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as you grow. Unlock AI-powered financial insights.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground pt-2">
              {[
                { icon: Shield, text: 'Cancel anytime' },
                { icon: Zap, text: 'Instant activation' },
                { icon: Star, text: 'No setup fees' },
              ].map((item, index) => (
                <motion.div
                  key={item.text}
                  className="flex items-center gap-1.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                >
                  <item.icon className="w-4 h-4 text-green-500" />
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto px-1">
            {plans?.sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 3).map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={currentPlan?.id === plan.id}
                userCurrency={userCurrency}
                onUpgrade={() => handleUpgrade(plan.id, plan.name)}
                delay={index * 0.15}
              />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="relative overflow-hidden border-border/40">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5" />
            <CardContent className="relative p-6 sm:p-8">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-4">
                  <div className="p-3 sm:p-4 bg-primary/10 rounded-2xl">
                    <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                      Why Choose Twealth AI?
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Advanced AI technology at unbeatable prices
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
                  {[
                    { value: '25x', label: 'Cheaper than hiring a CFO' },
                    { value: '4', label: 'AI models working for you' },
                    { value: '24/7', label: 'Financial insights available' },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                      className="text-center p-4 sm:p-6 bg-card rounded-xl border border-border/40"
                    >
                      <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

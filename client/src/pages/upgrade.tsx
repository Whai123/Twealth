import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import PaymentForm from "@/components/payment-form";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

export default function UpgradePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'upgrade' | 'payment'>('upgrade');

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['/api/subscription/plans'],
  }) as { data: any[], isLoading: boolean };

  const { data: currentData } = useQuery({
    queryKey: ['/api/subscription/current'],
  });

  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/subscription/upgrade", { planId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresPayment) {
        if (!stripePromise) {
          toast({
            title: "Payment Not Available",
            description: "Payment processing is being set up. Please try again later or contact support.",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "Payment Required",
          description: "Redirecting to payment...",
        });
        paymentMutation.mutate(selectedPlan!);
      } else {
        toast({
          title: "Plan Updated",
          description: `You're now on ${data.subscription?.plan?.displayName}`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
        queryClient.invalidateQueries({ queryKey: ['/api/subscription/usage'] });
        setLocation('/subscription');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/subscription/create-payment-intent", { planId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresSetup) {
        toast({
          title: "Payment Setup Required",
          description: "Payment processing is not configured. Contact support.",
          variant: "destructive",
        });
        return;
      }
      setClientSecret(data.clientSecret);
      setPaymentMode('payment');
    },
    onError: (error: any) => {
      toast({
        title: "Payment Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    const plan = plans.find((p: any) => p.id === planId);
    
    if (plan?.name === 'free' || parseFloat(plan?.priceUsd || '0') === 0) {
      upgradeMutation.mutate(planId);
    } else {
      if (stripePromise) {
        paymentMutation.mutate(planId);
      } else {
        toast({
          title: "Payment Not Available",
          description: "Payment processing is being set up. Please try again later or contact support.",
          variant: "destructive",
        });
      }
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'free': return <Sparkles className="w-5 h-5" />;
      case 'pro': return <Crown className="w-5 h-5" />;
      case 'enterprise': return <Zap className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const formatPrice = (priceUsd: string | undefined, billingInterval: string) => {
    const price = parseFloat(priceUsd || "0");
    if (isNaN(price) || price === 0) return { amount: "$0", period: "forever" };
    return { 
      amount: `$${price.toFixed(2)}`, 
      period: `/${billingInterval === "monthly" ? "mo" : billingInterval}` 
    };
  };

  const isCurrentPlan = (planId: string) => {
    return (currentData as any)?.subscription?.planId === planId;
  };

  const getPlanFeatures = (plan: any) => {
    const features: string[] = [];
    
    if (plan.name === "free") {
      features.push("50 Scout AI queries/month");
      features.push("Basic financial tracking");
      features.push("Up to 3 financial goals");
      features.push("30-day transaction history");
    } else if (plan.name === "pro") {
      features.push("Unlimited Scout AI queries");
      features.push("25 Sonnet reasoning queries/month");
      features.push("5 GPT-5 math queries/month");
      features.push("Unlimited goals & history");
      features.push("Crypto portfolio tracking");
      features.push("Advanced analytics");
    } else if (plan.name === "enterprise") {
      features.push("Everything in Pro, plus:");
      features.push("60 Sonnet reasoning/month");
      features.push("10 GPT-5 math/month");
      features.push("20 Opus CFO queries/month");
      features.push("Team collaboration");
      features.push("API access");
    }
    
    return features;
  };

  const sortedPlans = [...plans].sort((a: any, b: any) => {
    const order: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };
    return (order[a.name] || 0) - (order[b.name] || 0);
  });

  if (paymentMode === 'payment' && clientSecret && stripePromise) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="max-w-md mx-auto px-6 py-12">
          <Button
            variant="ghost"
            onClick={() => {
              setPaymentMode('upgrade');
              setClientSecret(null);
            }}
            className="mb-8"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to plans
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
              Complete Payment
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Secure payment powered by Stripe
            </p>
          </div>

          <Card className="border border-gray-200 dark:border-gray-800">
            <CardContent className="p-6">
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#000000',
                      colorBackground: '#ffffff',
                      colorText: '#000000',
                      fontFamily: '"Inter", system-ui, sans-serif',
                      borderRadius: '8px',
                    },
                  },
                }}
              >
                <PaymentForm 
                  onSuccess={() => {
                    toast({
                      title: "Payment Successful",
                      description: "Your subscription has been upgraded.",
                    });
                    queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/subscription/usage'] });
                    setLocation('/subscription');
                  }}
                  onError={(error: string) => {
                    toast({
                      title: "Payment Failed",
                      description: error,
                      variant: "destructive",
                    });
                  }}
                />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-black" />
      
      <div className="relative">
        <header className="max-w-6xl mx-auto px-6 py-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/subscription')}
            className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
            data-testid="button-back-subscription"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to subscription
          </Button>
        </header>

        <div className="max-w-6xl mx-auto px-6 pb-20">
          <div className="text-center mb-12">
            <Badge 
              variant="outline" 
              className="mb-6 px-4 py-1.5 text-sm font-medium border-gray-200 dark:border-gray-800"
            >
              Upgrade
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-black dark:text-white mb-4">
              Choose your plan
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Unlock AI-powered financial insights and advanced features
            </p>
          </div>

          {plansLoading ? (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[450px] bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {sortedPlans.map((plan: any) => {
                const isPro = plan.name === 'pro';
                const isEnterprise = plan.name === 'enterprise';
                const isCurrent = isCurrentPlan(plan.id);
                const { amount, period } = formatPrice(plan.priceUsd, plan.billingInterval);
                const features = getPlanFeatures(plan);

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl p-8 ${
                      isPro
                        ? "border-2 border-black dark:border-white bg-gray-50 dark:bg-gray-950"
                        : "border border-gray-200 dark:border-gray-800"
                    } ${isCurrent ? "ring-2 ring-green-500" : ""}`}
                    data-testid={`card-plan-${plan.name.toLowerCase()}`}
                  >
                    {isPro && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black px-4 py-1 text-xs font-medium">
                        Most Popular
                      </Badge>
                    )}
                    {isEnterprise && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-1 text-xs font-medium">
                        Best for Teams
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge className="absolute -top-3 right-4 bg-green-500 text-white px-3 py-1 text-xs font-medium">
                        Current
                      </Badge>
                    )}

                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isPro 
                            ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                            : isEnterprise
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                            : "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400"
                        }`}>
                          {getPlanIcon(plan.name)}
                        </div>
                        <h2 className="text-xl font-semibold text-black dark:text-white">
                          {plan.displayName}
                        </h2>
                      </div>

                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-bold text-black dark:text-white">
                          {amount}
                        </span>
                        <span className="text-gray-500">{period}</span>
                      </div>

                      <Button
                        className={`w-full h-12 font-medium rounded-xl ${
                          isPro
                            ? "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                            : "bg-gray-100 dark:bg-gray-900 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={isCurrent || upgradeMutation.isPending || paymentMutation.isPending}
                        data-testid={`button-upgrade-${plan.name.toLowerCase()}`}
                      >
                        {(upgradeMutation.isPending || paymentMutation.isPending) && selectedPlan === plan.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : isCurrent ? (
                          "Current plan"
                        ) : parseFloat(plan.priceUsd) === 0 ? (
                          "Get started"
                        ) : (
                          `Upgrade to ${plan.name}`
                        )}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-black dark:text-white flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <p className="text-sm text-gray-500">
              Secure payments powered by Stripe. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

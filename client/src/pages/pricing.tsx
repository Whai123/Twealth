import { Link, useLocation } from "wouter";
import { Check, ArrowRight, Zap, Crown, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoUrl from "@assets/5-removebg-preview_1761748275134.png";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  priceThb: string;
  priceUsd: string;
  billingInterval: string;
  features: string[];
  scoutLimit: number;
  sonnetLimit: number;
  gpt5Limit: number;
  opusLimit: number;
}

export default function Pricing() {
  const [, setLocation] = useLocation();

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/subscription/plans"],
  });

  const { data: currentSubscription } = useQuery({
    queryKey: ["/api/subscription/current"],
  });

  const currentPlanName = (currentSubscription as any)?.subscription?.plan?.name || "Free";

  const sortedPlans = [...plans].sort((a, b) => {
    const order = { Free: 0, Pro: 1, Enterprise: 2 };
    return (order[a.name as keyof typeof order] || 0) - (order[b.name as keyof typeof order] || 0);
  });

  const getPlanFeatures = (plan: Plan) => {
    const features: string[] = [];
    
    if (plan.name === "Free") {
      features.push("50 Scout AI queries/month");
      features.push("Basic financial tracking");
      features.push("Up to 3 financial goals");
      features.push("30-day transaction history");
      features.push("11 language support");
    } else if (plan.name === "Pro") {
      features.push("Unlimited Scout AI queries");
      features.push("25 Sonnet reasoning queries/month");
      features.push("5 GPT-5 math queries/month");
      features.push("Unlimited financial goals");
      features.push("Full transaction history");
      features.push("Crypto portfolio tracking");
      features.push("Advanced analytics & reports");
      features.push("Priority support");
    } else if (plan.name === "Enterprise") {
      features.push("Everything in Pro, plus:");
      features.push("60 Sonnet reasoning queries/month");
      features.push("10 GPT-5 math queries/month");
      features.push("20 Opus CFO queries/month");
      features.push("CFO-level financial analysis");
      features.push("Team collaboration features");
      features.push("API access");
      features.push("Dedicated support");
    }
    
    return features;
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "Free": return <Sparkles className="w-5 h-5" />;
      case "Pro": return <Crown className="w-5 h-5" />;
      case "Enterprise": return <Zap className="w-5 h-5" />;
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

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <header className="border-b border-gray-100 dark:border-gray-900 bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-3">
              <img src={logoUrl} alt="Twealth" className="w-8 h-8" />
              <span className="text-xl font-semibold text-black dark:text-white">Twealth</span>
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-sm font-medium"
              onClick={() => setLocation("/login")}
            >
              Sign in
            </Button>
            <Button 
              size="sm"
              className="text-sm font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              onClick={() => setLocation("/login")}
            >
              Get started
            </Button>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-12 text-center">
        <Badge 
          variant="outline" 
          className="mb-6 px-4 py-1.5 text-sm font-medium border-gray-200 dark:border-gray-800"
        >
          Pricing
        </Badge>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-black dark:text-white mb-6">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Start free and scale as you grow. Unlock AI-powered financial insights with Pro or Enterprise.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 lg:px-8 pb-24">
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[500px] bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {sortedPlans.map((plan) => {
              const isCurrentPlan = currentPlanName === plan.name;
              const isPro = plan.name === "Pro";
              const isEnterprise = plan.name === "Enterprise";
              const { amount, period } = formatPrice(plan.priceUsd, plan.billingInterval);
              const features = getPlanFeatures(plan);

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-8 ${
                    isPro
                      ? "border-2 border-black dark:border-white bg-gray-50 dark:bg-gray-950"
                      : "border border-gray-200 dark:border-gray-800"
                  }`}
                  data-testid={`card-plan-${plan.name.toLowerCase()}`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-black dark:bg-white text-white dark:text-black px-4 py-1 text-xs font-medium">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {isEnterprise && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-1 text-xs font-medium">
                        Best for Teams
                      </Badge>
                    </div>
                  )}

                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isPro 
                          ? "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
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
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 h-10">
                      {plan.description}
                    </p>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-bold text-black dark:text-white">
                        {amount}
                      </span>
                      <span className="text-gray-500 dark:text-gray-500">
                        {period}
                      </span>
                    </div>

                    <Button
                      className={`w-full h-12 font-medium rounded-xl ${
                        isPro
                          ? "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                          : "bg-gray-100 dark:bg-gray-900 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
                      }`}
                      disabled={isCurrentPlan}
                      onClick={() => setLocation(isCurrentPlan ? "/subscription" : "/subscription")}
                      data-testid={`button-${plan.name.toLowerCase()}-plan`}
                    >
                      {isCurrentPlan ? (
                        "Current plan"
                      ) : (
                        <>
                          Get started
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
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
      </section>

      <section className="border-t border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold text-black dark:text-white mb-4">
            Ready to take control of your finances?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            Join thousands of users who trust Twealth for their financial management. Start free today.
          </p>
          <Button
            size="lg"
            className="h-14 px-8 text-base font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-xl"
            onClick={() => setLocation("/login")}
          >
            Start for free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      <footer className="border-t border-gray-100 dark:border-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Twealth" className="w-6 h-6" />
            <span className="text-sm text-gray-500">2025 Twealth</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>Terms</span>
            <span>Privacy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

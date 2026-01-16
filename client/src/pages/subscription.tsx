import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Crown, Check, Zap, Star, Shield, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getLocalizedPrice, formatCurrency } from "@/lib/currency";
import GlassmorphismCheckoutModal from "@/components/glassmorphism-checkout-modal";

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  priceUsd: string;
  billingInterval: string;
  scoutLimit: number;
  sonnetLimit: number;
  features: string[];
  sortOrder: number;
}

interface SubscriptionData {
  subscription: { plan: SubscriptionPlan };
}

export default function SubscriptionPage() {
  const { toast } = useToast();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription/plans"]
  });

  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery<SubscriptionData>({
    queryKey: ["/api/subscription/current"]
  });

  const { data: userPreferences } = useQuery<{ currency?: string }>({
    queryKey: ["/api/user-preferences"],
  });

  const handleUpgrade = (plan: SubscriptionPlan) => {
    if (plan.name === 'free') {
      apiRequest("POST", "/api/subscription/upgrade", { planId: plan.id })
        .then(() => {
          toast({ title: "Switched to Free", description: "You're now on the Free plan." });
          queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
        });
    } else {
      setSelectedPlan(plan);
      setIsCheckoutModalOpen(true);
    }
  };

  if (plansLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  const currentPlan = currentSubscription?.subscription?.plan;
  const userCurrency = userPreferences?.currency || 'USD';
  const sortedPlans = plans?.sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Hero */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-0">
              Simple pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
              Your Personal CFO, Powered by AI
            </h1>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-8">
              Get intelligent financial insights, automated tracking, and personalized advice.
              Start free, upgrade when you're ready.
            </p>

            {/* Trust Signals */}
            <div className="flex items-center justify-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
              {[
                { icon: Shield, text: "Cancel anytime" },
                { icon: Zap, text: "Instant access" },
                { icon: Star, text: "No setup fees" },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  className="flex items-center gap-1.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <item.icon className="w-4 h-4 text-emerald-500" />
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {sortedPlans.map((plan, index) => {
            const isPro = plan.name === 'pro';
            const isEnterprise = plan.name === 'enterprise';
            const isFree = plan.priceUsd === '0.00' || plan.name === 'free';
            const isCurrentPlan = currentPlan?.id === plan.id;
            const price = parseFloat(plan.priceUsd);
            const localizedPrice = getLocalizedPrice(price, userCurrency);

            return (
              <motion.div
                key={plan.id}
                className={`relative bg-white dark:bg-zinc-900 rounded-2xl p-6 border ${isPro
                    ? 'border-blue-200 dark:border-blue-800 shadow-lg shadow-blue-500/10 ring-1 ring-blue-100 dark:ring-blue-900'
                    : 'border-zinc-200 dark:border-zinc-800'
                  } ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 12px 40px -12px rgba(0,0,0,0.15)' }}
              >
                {/* Badge */}
                {isPro && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1">
                    Most Popular
                  </Badge>
                )}
                {isEnterprise && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-1">
                    Best Value
                  </Badge>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                    {plan.displayName}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {isFree ? (
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-zinc-900 dark:text-white">Free</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-zinc-900 dark:text-white">
                        {localizedPrice.currency.symbol}{localizedPrice.amount.toFixed(0)}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400">/mo</span>
                    </div>
                  )}
                  {!isFree && userCurrency !== 'USD' && (
                    <p className="text-xs text-zinc-400 mt-1">~{formatCurrency(price, 'USD')} USD</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.slice(0, 6).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-zinc-600 dark:text-zinc-300 capitalize">
                        {feature.replace(/_/g, ' ')}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  className={`w-full rounded-xl h-12 font-medium transition-all ${isCurrentPlan
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : isPro || isEnterprise
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                        : 'bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900'
                    }`}
                  disabled={isCurrentPlan}
                  onClick={() => handleUpgrade(plan)}
                >
                  {isCurrentPlan ? (
                    <><Check className="w-4 h-4 mr-2" /> Current Plan</>
                  ) : isFree ? (
                    <>Get Started <ArrowRight className="w-4 h-4 ml-2" /></>
                  ) : (
                    <>Upgrade to {plan.displayName} <Crown className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Compare Plans Table */}
        <motion.div
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Compare Plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="text-left py-3 pr-4 text-zinc-500 dark:text-zinc-400 font-medium">Feature</th>
                  {sortedPlans.map(plan => (
                    <th key={plan.id} className="text-center py-3 px-4 text-zinc-900 dark:text-white font-semibold">
                      {plan.displayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "AI Quick Queries", values: sortedPlans.map(p => p.scoutLimit === 999999 ? "Unlimited" : `${p.scoutLimit}/mo`) },
                  { name: "Deep Analysis", values: sortedPlans.map(p => p.sonnetLimit > 0 ? `${p.sonnetLimit}/mo` : "—") },
                  { name: "Transaction Tracking", values: ["Basic", "Advanced", "Unlimited"] },
                  { name: "Goal Setting", values: ["3 goals", "Unlimited", "Unlimited"] },
                  { name: "Priority Support", values: ["—", "Email", "24/7 Priority"] },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-zinc-50 dark:border-zinc-800/50">
                    <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-300">{row.name}</td>
                    {row.values.map((val, j) => (
                      <td key={j} className="text-center py-3 px-4 text-zinc-900 dark:text-white">
                        {val === "—" ? <span className="text-zinc-400">—</span> : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Trust Section */}
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">Why teams choose Twealth</span>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-8">
            {[
              { value: "25x", label: "Cheaper than a CFO" },
              { value: "4", label: "AI models working for you" },
              { value: "24/7", label: "Always available" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stat.value}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Checkout Modal */}
      <GlassmorphismCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => { setIsCheckoutModalOpen(false); setSelectedPlan(null); }}
        plan={selectedPlan}
        localizedPrice={selectedPlan ? getLocalizedPrice(parseFloat(selectedPlan.priceUsd), userCurrency) : { amount: 0, currency: { symbol: '$', code: 'USD' } }}
        userCurrency={userCurrency}
        onSuccess={() => {
          toast({ title: "Subscription Activated!", description: `Welcome to ${selectedPlan?.displayName}!` });
          setIsCheckoutModalOpen(false);
          setSelectedPlan(null);
        }}
      />
    </div>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, X, Zap, Crown, Sparkles, TrendingUp, MessageCircle, Target, Users, Bitcoin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  priceUsd: string;
  billingInterval: string;
  features: string[];
  aiChatLimit: number;
  aiDeepAnalysisLimit: number;
}

export default function Pricing() {
  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/subscription/plans"],
  });

  const { data: currentSubscription } = useQuery({
    queryKey: ["/api/subscription/current"],
  });

  const freePlan = plans.find(p => p.name === "Free") || {
    name: "Free",
    displayName: "Free Plan",
    description: "Get started with basic features",
    priceUsd: "0",
    billingInterval: "forever",
    aiChatLimit: 10,
    aiDeepAnalysisLimit: 0,
    features: ["basic_tracking", "10_ai_chats_monthly", "basic_goals", "mobile_app"]
  };

  const proPlan = plans.find(p => p.name === "Pro") || {
    name: "Pro",
    displayName: "Twealth Pro",
    description: "CFO-level AI advisor - 500 chats/month + all features",
    priceUsd: "25.00",
    billingInterval: "monthly",
    aiChatLimit: 500,
    aiDeepAnalysisLimit: 500,
    features: ["full_tracking", "ai_chat_unlimited", "advanced_goals", "group_planning", "crypto_tracking", "advanced_analytics", "priority_insights", "all_features"]
  };

  const currentPlan = (currentSubscription as any)?.subscription?.planName || "Free";

  const featureComparison = [
    {
      category: "AI Financial Advisor",
      icon: MessageCircle,
      features: [
        {
          name: "AI Chat Messages",
          free: "10/month",
          pro: "500/month",
          proHighlight: true
        },
        {
          name: "CFO-Level Advice",
          free: true,
          pro: true
        },
        {
          name: "Luxury Asset Analysis",
          free: "Basic",
          pro: "Advanced + 150+ assets",
          proHighlight: true
        },
        {
          name: "Multi-Language Support",
          free: "11 languages",
          pro: "11 languages"
        },
        {
          name: "Real-Time Market Data",
          free: false,
          pro: true,
          proHighlight: true
        }
      ]
    },
    {
      category: "Financial Tracking",
      icon: TrendingUp,
      features: [
        {
          name: "Income & Expense Tracking",
          free: true,
          pro: true
        },
        {
          name: "Transaction History",
          free: "30 days",
          pro: "Unlimited",
          proHighlight: true
        },
        {
          name: "Financial Goals",
          free: "3 goals",
          pro: "Unlimited",
          proHighlight: true
        },
        {
          name: "Smart Budget Insights",
          free: true,
          pro: true
        },
        {
          name: "Spending Pattern Detection",
          free: "Basic",
          pro: "Advanced AI Analysis",
          proHighlight: true
        }
      ]
    },
    {
      category: "Advanced Features",
      icon: Sparkles,
      features: [
        {
          name: "Crypto Portfolio Tracking",
          free: false,
          pro: true,
          proHighlight: true
        },
        {
          name: "Group Financial Planning",
          free: false,
          pro: true,
          proHighlight: true
        },
        {
          name: "Calendar Integration",
          free: "Basic",
          pro: "Full sync",
          proHighlight: true
        },
        {
          name: "Export & Reports",
          free: false,
          pro: true,
          proHighlight: true
        },
        {
          name: "Priority Support",
          free: false,
          pro: true,
          proHighlight: true
        }
      ]
    }
  ];

  const CheckIcon = () => (
    <CheckCircle2 className="w-5 h-5 text-green-500" />
  );

  const XIcon = () => (
    <X className="w-5 h-5 text-gray-300" />
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">
          <Sparkles className="w-3 h-3 mr-1" />
          Pricing Plans
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Choose Your Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Get CFO-level financial advice at a fraction of the cost. Start free, upgrade when you need more power.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-5xl mx-auto">
        {/* Free Plan */}
        <Card className="relative">
          <CardHeader>
            <div className="mb-4">
              <Zap className="w-10 h-10 text-blue-500 mb-2" />
            </div>
            <CardTitle className="text-2xl">{freePlan.displayName}</CardTitle>
            <CardDescription className="text-base">{freePlan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="text-4xl font-bold mb-2">
                ${freePlan.priceUsd}
                <span className="text-lg font-normal text-muted-foreground ml-2">
                  /{freePlan.billingInterval}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckIcon />
                <span className="text-sm">10 AI chats per month</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon />
                <span className="text-sm">Basic financial tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon />
                <span className="text-sm">Up to 3 financial goals</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon />
                <span className="text-sm">11 language support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon />
                <span className="text-sm">Mobile-first design</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant={currentPlan === "Free" ? "outline" : "default"}
              className="w-full"
              disabled={currentPlan === "Free"}
              data-testid="button-free-plan"
            >
              {currentPlan === "Free" ? "Current Plan" : "Downgrade to Free"}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border-2 border-purple-500 shadow-xl">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
              <Crown className="w-3 h-3 mr-1" />
              Most Popular
            </Badge>
          </div>
          <CardHeader>
            <div className="mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-2">
                <Crown className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {proPlan.displayName}
            </CardTitle>
            <CardDescription className="text-base">{proPlan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="text-4xl font-bold mb-2">
                ${proPlan.priceUsd}
                <span className="text-lg font-normal text-muted-foreground ml-2">
                  /{proPlan.billingInterval}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Compare: Real CFO costs $150/hour = $12,000/month
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckIcon />
                <span className="text-sm font-semibold">500 AI chats per month</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon />
                <span className="text-sm font-semibold">Unlimited financial goals</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon />
                <span className="text-sm font-semibold">Crypto portfolio tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon />
                <span className="text-sm font-semibold">Group financial planning</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon />
                <span className="text-sm font-semibold">Advanced AI analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon />
                <span className="text-sm font-semibold">Priority support</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/upgrade" className="w-full">
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                disabled={currentPlan === "Pro"}
                data-testid="button-pro-plan"
              >
                {currentPlan === "Pro" ? "Current Plan" : "Upgrade to Pro"}
                {currentPlan !== "Pro" && <Sparkles className="ml-2 w-4 h-4" />}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Detailed Feature Comparison */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Full Feature Comparison</h2>
        
        <div className="space-y-8">
          {featureComparison.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl">{category.category}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Feature</th>
                        <th className="text-center py-3 px-4 font-semibold">Free</th>
                        <th className="text-center py-3 px-4 font-semibold bg-purple-50 dark:bg-purple-950/20 rounded-t-lg">Pro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.features.map((feature, idx) => (
                        <tr 
                          key={idx} 
                          className={`border-b last:border-0 ${feature.proHighlight ? 'bg-purple-50/50 dark:bg-purple-950/10' : ''}`}
                        >
                          <td className="py-4 px-4 font-medium">{feature.name}</td>
                          <td className="py-4 px-4 text-center">
                            {typeof feature.free === 'boolean' ? (
                              feature.free ? <CheckIcon /> : <XIcon />
                            ) : (
                              <span className="text-sm">{feature.free}</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center bg-purple-50 dark:bg-purple-950/20">
                            {typeof feature.pro === 'boolean' ? (
                              feature.pro ? <CheckIcon /> : <XIcon />
                            ) : (
                              <span className="text-sm font-semibold">{feature.pro}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-16 text-center">
        <Card className="max-w-3xl mx-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border-2">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4">Ready to upgrade your financial game?</h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of users getting CFO-level financial advice for less than a single consultation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/upgrade">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                  data-testid="button-upgrade-cta"
                >
                  <Crown className="mr-2 w-5 h-5" />
                  Upgrade to Pro
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" data-testid="button-dashboard">
                  Start with Free
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

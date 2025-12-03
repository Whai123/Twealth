import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  TrendingUp,
  Target,
  Sparkles,
  Crown,
  X,
  ArrowRight,
  Zap,
  PiggyBank,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserCurrency } from "@/lib/userContext";

interface Nudge {
  id: string;
  type: "warning" | "opportunity" | "celebration" | "upgrade";
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
  icon: any;
  priority: number;
  dismissable: boolean;
}

const nudgeStyles = {
  warning: {
    bg: "from-orange-500/10 to-red-500/10",
    border: "border-orange-500/30",
    icon: "text-orange-500",
    badge: "bg-orange-500/20 text-orange-600",
  },
  opportunity: {
    bg: "from-green-500/10 to-emerald-500/10",
    border: "border-green-500/30",
    icon: "text-green-500",
    badge: "bg-green-500/20 text-green-600",
  },
  celebration: {
    bg: "from-purple-500/10 to-pink-500/10",
    border: "border-purple-500/30",
    icon: "text-purple-500",
    badge: "bg-purple-500/20 text-purple-600",
  },
  upgrade: {
    bg: "from-blue-500/10 to-primary/10",
    border: "border-primary/30",
    icon: "text-primary",
    badge: "bg-primary/20 text-primary",
  },
};

export function SmartNudgeBanner() {
  const [, setLocation] = useLocation();
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const { formatAmount } = useUserCurrency();

  const { data: subscription } = useQuery<any>({
    queryKey: ['/api/subscription'],
  });

  const { data: stats } = useQuery<any>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: goals } = useQuery<any>({
    queryKey: ['/api/financial-goals'],
  });

  const generateNudges = (): Nudge[] => {
    const nudges: Nudge[] = [];

    if (subscription?.plan?.name === 'free') {
      const scoutUsed = subscription?.usage?.scoutQueriesUsed ?? 0;
      const scoutLimit = subscription?.plan?.scoutLimit ?? 50;
      const usagePercent = (scoutUsed / scoutLimit) * 100;

      if (usagePercent >= 80) {
        nudges.push({
          id: "ai-limit-warning",
          type: "upgrade",
          title: usagePercent >= 100 ? "AI Query Limit Reached" : "Running Low on AI Queries",
          message: usagePercent >= 100
            ? "Upgrade to Pro for unlimited AI conversations and premium insights."
            : `You've used ${scoutUsed}/${scoutLimit} queries. Upgrade for unlimited access.`,
          action: { label: "Upgrade to Pro", href: "/subscription" },
          icon: Crown,
          priority: 1,
          dismissable: false,
        });
      }
    }

    if (stats) {
      const monthlyIncome = stats.monthlyIncome ?? 0;
      const monthlyExpenses = stats.monthlyExpenses ?? 0;
      
      if (monthlyExpenses > monthlyIncome && monthlyIncome > 0) {
        nudges.push({
          id: "overspending-warning",
          type: "warning",
          title: "Spending Exceeds Income",
          message: `You're spending ${formatAmount(monthlyExpenses - monthlyIncome)} more than you earn. Let's fix this.`,
          action: { label: "Review Spending", href: "/money-tracking" },
          icon: AlertTriangle,
          priority: 2,
          dismissable: true,
        });
      }

      const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
      if (savingsRate >= 20 && savingsRate < 30) {
        nudges.push({
          id: "savings-opportunity",
          type: "opportunity",
          title: "Great Savings Rate!",
          message: `You're saving ${savingsRate.toFixed(0)}% of income. A few tweaks could push you to 30%.`,
          action: { label: "Get AI Tips", href: "/ai-assistant" },
          icon: TrendingUp,
          priority: 4,
          dismissable: true,
        });
      }
    }

    if (Array.isArray(goals)) {
      const activeGoals = goals.filter((g: any) => g.status === "active");
      
      activeGoals.forEach((goal: any) => {
        const progress = (parseFloat(goal.currentAmount || "0") / parseFloat(goal.targetAmount)) * 100;
        
        if (progress >= 90 && progress < 100) {
          nudges.push({
            id: `goal-almost-${goal.id}`,
            type: "celebration",
            title: "Almost There!",
            message: `"${goal.title}" is ${progress.toFixed(0)}% complete. One final push!`,
            action: { label: "View Goal", href: "/financial-goals" },
            icon: Target,
            priority: 3,
            dismissable: true,
          });
        }

        if (goal.targetDate) {
          const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 7 && daysLeft > 0 && progress < 80) {
            nudges.push({
              id: `goal-deadline-${goal.id}`,
              type: "warning",
              title: "Deadline Approaching",
              message: `"${goal.title}" is due in ${daysLeft} days with ${progress.toFixed(0)}% progress.`,
              action: { label: "Add Funds", href: "/financial-goals" },
              icon: Bell,
              priority: 2,
              dismissable: true,
            });
          }
        }
      });

      if (activeGoals.length === 0 && (stats?.monthlyIncome ?? 0) > 0) {
        nudges.push({
          id: "no-goals",
          type: "opportunity",
          title: "Set Your First Goal",
          message: "Start your savings journey with a clear target. AI can help you plan.",
          action: { label: "Create Goal", href: "/financial-goals" },
          icon: PiggyBank,
          priority: 5,
          dismissable: true,
        });
      }
    }

    return nudges
      .filter(n => !dismissedNudges.has(n.id))
      .sort((a, b) => a.priority - b.priority);
  };

  const nudges = generateNudges();
  const currentNudge = nudges[currentIndex];

  useEffect(() => {
    if (nudges.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % nudges.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [nudges.length]);

  if (!currentNudge) return null;

  const style = nudgeStyles[currentNudge.type];
  const IconComponent = currentNudge.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentNudge.id}
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="w-full"
      >
        <Card className={`border ${style.border} overflow-hidden`}>
          <CardContent className={`p-0 bg-gradient-to-r ${style.bg}`}>
            <div className="flex items-center gap-3 p-3 sm:p-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className={`p-2 rounded-lg bg-background/80 ${style.icon}`}
              >
                <IconComponent className="w-5 h-5" />
              </motion.div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-semibold text-sm">{currentNudge.title}</h4>
                  {nudges.length > 1 && (
                    <Badge variant="outline" className="text-[10px] px-1.5">
                      {currentIndex + 1}/{nudges.length}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {currentNudge.message}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {currentNudge.action && (
                  <Button
                    size="sm"
                    onClick={() => setLocation(currentNudge.action!.href)}
                    className="hidden sm:flex h-8 text-xs"
                    data-testid={`nudge-action-${currentNudge.id}`}
                  >
                    {currentNudge.action.label}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}

                {currentNudge.dismissable && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDismissedNudges(prev => {
                      const newSet = new Set(Array.from(prev));
                      newSet.add(currentNudge.id);
                      return newSet;
                    })}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    data-testid={`nudge-dismiss-${currentNudge.id}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {nudges.length > 1 && (
              <div className="flex gap-1 px-4 pb-2">
                {nudges.map((_, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1 rounded-full transition-all ${
                      idx === currentIndex 
                        ? 'w-6 bg-foreground/60' 
                        : 'w-2 bg-foreground/20 hover:bg-foreground/40'
                    }`}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

export function UpgradeNudgeCard() {
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  const { data: subscription } = useQuery<any>({
    queryKey: ['/api/subscription'],
  });

  if (!isVisible || subscription?.plan?.name !== 'free') return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 h-6 w-6 text-muted-foreground"
        >
          <X className="w-3 h-3" />
        </Button>

        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25"
            >
              <Crown className="w-6 h-6 text-primary-foreground" />
            </motion.div>

            <div className="flex-1">
              <h3 className="font-semibold mb-1">Unlock Premium AI</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Get GPT-5 & Claude Opus, unlimited queries, and advanced financial tools.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {['Unlimited AI', 'Advanced Insights', 'Priority Support'].map((feature, idx) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {feature}
                    </Badge>
                  </motion.div>
                ))}
              </div>

              <Button
                onClick={() => setLocation("/subscription")}
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25"
                data-testid="upgrade-nudge-button"
              >
                <Zap className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

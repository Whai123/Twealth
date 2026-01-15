import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { ArrowRight, Target, Sparkles, TrendingUp, Brain, DollarSign, ArrowUpRight, ArrowDownRight, Shield, Activity, Flame, Plus, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationsBell from "@/components/dashboard/notifications-bell";
import OnboardingWizard from "@/components/onboarding/onboarding-wizard";
import { useOnboarding } from "@/hooks/use-onboarding";
import { FinancialGoal } from "@shared/schema";
import { SmartNudgeBanner } from "@/components/smart-nudges";
import { StreakWidget, AchievementBadges } from "@/components/streak-system";
import { useUserCurrency } from "@/lib/userContext";

interface DashboardStats {
  monthlyIncome: number;
  monthlyExpenses: number;
}

interface TwealthIndexResponse {
  cashflowScore: number;
  stabilityScore: number;
  growthScore: number;
  behaviorScore: number;
  twealthIndex: number;
  band: string;
  confidence: string;
  drivers: {
    overall: { action: string };
  };
}

interface SubscriptionResponse {
  plan: { name: string; scoutLimit: number };
  usage: { scoutQueriesUsed: number };
}

// Animated counter
function Counter({ value, className = "" }: { value: number; className?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 800;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      setCount(Math.round(value * (1 - Math.pow(1 - progress, 4))));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span className={`tabular-nums ${className}`}>{count}</span>;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const { formatAmount } = useUserCurrency();

  const { data: stats } = useQuery<DashboardStats>({ queryKey: ["/api/dashboard/stats"] });
  const { data: twealthIndex, isLoading } = useQuery<TwealthIndexResponse>({ queryKey: ["/api/twealth-index"] });
  const { data: goals } = useQuery<FinancialGoal[]>({ queryKey: ["/api/financial-goals"] });
  const { data: subscription } = useQuery<SubscriptionResponse>({ queryKey: ["/api/subscription"] });

  const score = twealthIndex?.twealthIndex ?? 0;
  const band = twealthIndex?.band ?? "Building";
  const activeGoals = useMemo(() => Array.isArray(goals) ? goals.filter(g => g.status === "active") : [], [goals]);
  const queriesLeft = (subscription?.plan?.scoutLimit ?? 50) - (subscription?.usage?.scoutQueriesUsed ?? 0);
  const income = stats?.monthlyIncome ?? 0;
  const expenses = stats?.monthlyExpenses ?? 0;
  const netFlow = income - expenses;

  const pillars = [
    { key: "cashflow", label: "Cashflow", score: twealthIndex?.cashflowScore ?? 0, color: "#3B82F6" },
    { key: "stability", label: "Stability", score: twealthIndex?.stabilityScore ?? 0, color: "#10B981" },
    { key: "growth", label: "Growth", score: twealthIndex?.growthScore ?? 0, color: "#8B5CF6" },
    { key: "behavior", label: "Behavior", score: twealthIndex?.behaviorScore ?? 0, color: "#F59E0B" },
  ];

  if (showOnboarding) return <OnboardingWizard onComplete={completeOnboarding} />;

  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (score / 100) * circumference;
  const scoreColor = score >= 80 ? "#10B981" : score >= 60 ? "#3B82F6" : score >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#09090b] pb-24 md:pb-8">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER - Minimal, Apple-style                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-[#f8f9fa]/90 dark:bg-[#09090b]/90 backdrop-blur-2xl border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-[13px] font-medium text-muted-foreground">{getGreeting()}</p>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">Dashboard</h1>
          </motion.div>
          <NotificationsBell />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-6 space-y-6">
        <SmartNudgeBanner />

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* HERO CARD - The Centerpiece                                         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative overflow-hidden rounded-[24px] bg-white dark:bg-[#18181b] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_20px_40px_-20px_rgba(0,0,0,0.1)] dark:shadow-none border border-black/[0.03] dark:border-white/[0.05]">
            {/* Gradient accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500" />

            <div className="p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                {/* Left: Score Visualization */}
                <div className="flex items-center gap-6 lg:gap-8">
                  {/* Circular Score */}
                  <div className="relative flex-shrink-0">
                    <svg className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] -rotate-90" viewBox="0 0 160 160">
                      {/* Background track */}
                      <circle cx="80" cy="80" r="70" fill="none" strokeWidth="8" className="stroke-black/[0.04] dark:stroke-white/[0.06]" />
                      {/* Animated progress */}
                      <motion.circle
                        cx="80" cy="80" r="70"
                        fill="none"
                        stroke={scoreColor}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {isLoading ? (
                        <Skeleton className="w-16 h-12" />
                      ) : (
                        <>
                          <span className="text-[44px] sm:text-[52px] font-bold tracking-[-0.03em] leading-none" style={{ color: scoreColor }}>
                            <Counter value={score} />
                          </span>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mt-1">
                            {band}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Score Details */}
                  <div className="hidden sm:block">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1">
                      Twealth Index™
                    </p>
                    <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[280px]">
                      {twealthIndex?.drivers?.overall?.action || "Track consistently to unlock insights"}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Link href="/financial-score">
                        <Button variant="outline" size="sm" className="h-8 rounded-full text-[13px] font-medium px-3.5 border-black/10 dark:border-white/10">
                          View details
                        </Button>
                      </Link>
                      <Link href="/ai-assistant">
                        <Button size="sm" className="h-8 rounded-full text-[13px] font-medium px-3.5" style={{ background: scoreColor }}>
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                          Get advice
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Right: Pillar Bars - Data Viz */}
                <div className="flex-1 lg:pl-8 lg:border-l border-black/[0.04] dark:border-white/[0.06]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-4">
                    Financial Pillars
                  </p>
                  <div className="space-y-3">
                    {pillars.map((p, i) => (
                      <motion.div
                        key={p.key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        <span className="w-16 text-[13px] font-medium text-muted-foreground">{p.label}</span>
                        <div className="flex-1 h-2 bg-black/[0.03] dark:bg-white/[0.05] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: p.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${p.score}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                          />
                        </div>
                        <span className="w-8 text-[13px] font-semibold text-right tabular-nums">
                          {p.score}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile CTAs */}
              <div className="flex gap-2 mt-6 sm:hidden">
                <Link href="/financial-score" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full h-9 rounded-full text-[13px]">
                    Details
                  </Button>
                </Link>
                <Link href="/ai-assistant" className="flex-1">
                  <Button size="sm" className="w-full h-9 rounded-full text-[13px]" style={{ background: scoreColor }}>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    AI Advice
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* METRICS ROW - Apple Card Style                                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Income", value: formatAmount(income), icon: ArrowUpRight, color: "#10B981" },
            { label: "Expenses", value: formatAmount(expenses), icon: ArrowDownRight, color: "#EF4444" },
            { label: "Net", value: `${netFlow >= 0 ? "+" : ""}${formatAmount(netFlow)}`, icon: DollarSign, color: netFlow >= 0 ? "#10B981" : "#EF4444" },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181b] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none border border-black/[0.03] dark:border-white/[0.05]"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${metric.color}15` }}>
                  <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
                </div>
                <span className="text-[12px] font-medium text-muted-foreground">{metric.label}</span>
              </div>
              <p className="text-[20px] sm:text-[24px] font-semibold tracking-[-0.02em]" style={{ color: metric.label === "Net" ? metric.color : undefined }}>
                {metric.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ACTIONS - Clean Grid                                                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* AI Advisor - Featured */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Link href="/ai-assistant" className="block h-full">
              <div className="h-full p-5 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-white hover:opacity-95 transition-opacity">
                <div className="flex items-start justify-between mb-12">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Brain className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                    {queriesLeft} left
                  </span>
                </div>
                <p className="text-[17px] font-semibold mb-0.5">AI Advisor</p>
                <p className="text-[13px] text-white/70">Get financial guidance</p>
              </div>
            </Link>
          </motion.div>

          {/* Add Transaction */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Link href="/money-tracking?add=1" className="block h-full">
              <div className="h-full p-5 rounded-2xl bg-white dark:bg-[#18181b] border border-black/[0.03] dark:border-white/[0.05] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none hover:border-black/[0.08] dark:hover:border-white/[0.1] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-12">
                  <Plus className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-[17px] font-semibold mb-0.5">Add Transaction</p>
                <p className="text-[13px] text-muted-foreground">Log income or expense</p>
              </div>
            </Link>
          </motion.div>

          {/* Goals */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Link href="/financial-goals" className="block h-full">
              <div className="h-full p-5 rounded-2xl bg-white dark:bg-[#18181b] border border-black/[0.03] dark:border-white/[0.05] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none hover:border-black/[0.08] dark:hover:border-white/[0.1] transition-colors">
                <div className="flex items-start justify-between mb-12">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="text-[28px] font-bold tracking-tight">{activeGoals.length}</span>
                </div>
                <p className="text-[17px] font-semibold mb-0.5">Goals</p>
                <p className="text-[13px] text-muted-foreground">Track your progress</p>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ENGAGEMENT WIDGETS                                                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <StreakWidget />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <AchievementBadges />
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* FOOTER NAV                                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="flex items-center justify-center gap-4 pt-2 text-[13px]"
        >
          {[
            { label: "Transactions", href: "/money-tracking" },
            { label: "Groups", href: "/groups" },
            { label: `Upgrade`, href: "/subscription", badge: subscription?.plan?.name ?? "Free" },
            { label: "Settings", href: "/settings" },
          ].map((item, i) => (
            <Link key={item.label} href={item.href}>
              <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                {item.label}
                {item.badge && (
                  <span className="text-[10px] font-medium bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            </Link>
          ))}
        </motion.div>
      </main>
    </div>
  );
}

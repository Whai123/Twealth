import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    ArrowLeft, ArrowUpRight, Shield, TrendingUp, Brain, Flame,
    Sparkles, Target, Lightbulb, Info, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface TwealthIndexResponse {
    cashflowScore: number;
    stabilityScore: number;
    growthScore: number;
    behaviorScore: number;
    twealthIndex: number;
    band: string;
    confidence: string;
    drivers: {
        cashflow: { drivers: string[]; action: string };
        stability: { drivers: string[]; action: string };
        growth: { drivers: string[]; action: string };
        behavior: { drivers: string[]; action: string };
        overall: { drivers: string[]; action: string };
    };
}

// Animated number for smooth transitions
function AnimatedScore({ value }: { value: number }) {
    return (
        <motion.span
            key={value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="tabular-nums"
        >
            {value}
        </motion.span>
    );
}

// Pillar Detail Card - Clean, minimalist design
function PillarCard({
    title,
    score,
    icon: Icon,
    color,
    drivers,
    action,
    delay = 0,
    rank
}: {
    title: string;
    score: number;
    icon: any;
    color: string;
    drivers: string[];
    action: string;
    delay?: number;
    rank?: number;
}) {
    const colorClasses: Record<string, { bg: string; text: string; border: string; bar: string }> = {
        blue: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200/50 dark:border-blue-800/50", bar: "bg-blue-500" },
        emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200/50 dark:border-emerald-800/50", bar: "bg-emerald-500" },
        violet: { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", border: "border-violet-200/50 dark:border-violet-800/50", bar: "bg-violet-500" },
        amber: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200/50 dark:border-amber-800/50", bar: "bg-amber-500" },
    };

    const classes = colorClasses[color] || colorClasses.blue;

    const getScoreLabel = (score: number) => {
        if (score >= 80) return { label: "Excellent", color: "text-emerald-600 dark:text-emerald-400" };
        if (score >= 60) return { label: "Good", color: "text-blue-600 dark:text-blue-400" };
        if (score >= 40) return { label: "Fair", color: "text-amber-600 dark:text-amber-400" };
        return { label: "Needs Work", color: "text-red-600 dark:text-red-400" };
    };

    const scoreInfo = getScoreLabel(score);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="group"
        >
            <Card className={`h-full border ${classes.border} bg-card hover:shadow-lg hover:border-border transition-all duration-300`}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {rank && rank <= 2 && (
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${rank === 1 ? 'border-red-300 text-red-600 dark:text-red-400' : 'border-amber-300 text-amber-600 dark:text-amber-400'}`}>
                                    {rank === 1 ? "Weakest" : "2nd"}
                                </Badge>
                            )}
                            <div className={`p-2.5 rounded-xl ${classes.bg}`}>
                                <Icon className={`w-5 h-5 ${classes.text}`} />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                                <p className={`text-xs font-medium ${scoreInfo.color}`}>{scoreInfo.label}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`text-3xl font-bold tracking-tight ${classes.text}`}>
                                <AnimatedScore value={score} />
                            </span>
                            <span className="text-sm text-muted-foreground">/100</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full ${classes.bar}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
                        />
                    </div>

                    {/* Drivers */}
                    {drivers && drivers.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Info className="w-3 h-3" />
                                Key Factors
                            </p>
                            <div className="space-y-1.5">
                                {drivers.slice(0, 2).map((driver, idx) => (
                                    <p key={idx} className="text-xs text-muted-foreground leading-relaxed">
                                        • {driver}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action */}
                    {action && (
                        <div className={`p-3 rounded-xl ${classes.bg} border ${classes.border}`}>
                            <div className="flex items-start gap-2">
                                <Lightbulb className={`w-4 h-4 mt-0.5 flex-shrink-0 ${classes.text}`} />
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Recommended Action</p>
                                    <p className="text-xs leading-relaxed">{action}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function FinancialScore() {
    const { data: twealthIndex, isLoading } = useQuery<TwealthIndexResponse>({
        queryKey: ["/api/twealth-index"],
    });

    // Sort pillars by score to identify weakest
    const sortedPillars = useMemo(() => {
        if (!twealthIndex) return [];
        const pillars = [
            { key: "cashflow", title: "Cashflow Resilience", score: twealthIndex.cashflowScore, icon: Activity, color: "blue", drivers: twealthIndex.drivers?.cashflow?.drivers || [], action: twealthIndex.drivers?.cashflow?.action || "" },
            { key: "stability", title: "Stability & Risk", score: twealthIndex.stabilityScore, icon: Shield, color: "emerald", drivers: twealthIndex.drivers?.stability?.drivers || [], action: twealthIndex.drivers?.stability?.action || "" },
            { key: "growth", title: "Wealth Growth", score: twealthIndex.growthScore, icon: TrendingUp, color: "violet", drivers: twealthIndex.drivers?.growth?.drivers || [], action: twealthIndex.drivers?.growth?.action || "" },
            { key: "behavior", title: "Behavioral Alpha", score: twealthIndex.behaviorScore, icon: Flame, color: "amber", drivers: twealthIndex.drivers?.behavior?.drivers || [], action: twealthIndex.drivers?.behavior?.action || "" },
        ];
        return pillars.sort((a, b) => a.score - b.score);
    }, [twealthIndex]);

    const bandConfig = useMemo(() => {
        const band = twealthIndex?.band || "Unknown";
        switch (band) {
            case "Great":
                return { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" };
            case "Good":
                return { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" };
            case "Needs Work":
                return { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" };
            default:
                return { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-600 dark:text-red-400", border: "border-red-200 dark:border-red-800" };
        }
    }, [twealthIndex?.band]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-6">
                <Skeleton className="h-8 w-48 mb-6" />
                <Skeleton className="h-64 w-full mb-4 rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-56 rounded-2xl" />
                    <Skeleton className="h-56 rounded-2xl" />
                    <Skeleton className="h-56 rounded-2xl" />
                    <Skeleton className="h-56 rounded-2xl" />
                </div>
            </div>
        );
    }

    const score = twealthIndex?.twealthIndex ?? 0;
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score / 100) * circumference;

    const getScoreColor = (s: number) => {
        if (s >= 80) return "#10b981";
        if (s >= 60) return "#3b82f6";
        if (s >= 40) return "#f59e0b";
        return "#ef4444";
    };

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-8">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold tracking-tight">Financial Score</h1>
                        <p className="text-xs text-muted-foreground">Detailed breakdown of your Twealth Index</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-medium">
                        {twealthIndex?.confidence || "Low"} Confidence
                    </Badge>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Hero Score Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="border-border/50 bg-gradient-to-br from-card via-card to-muted/20 overflow-hidden">
                        <CardContent className="p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row items-center gap-8">
                                {/* Score Circle */}
                                <div className="relative w-44 h-44 flex-shrink-0">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                        <defs>
                                            <linearGradient id="scoreGradientFull" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor={getScoreColor(score)} />
                                                <stop offset="100%" stopColor={getScoreColor(score)} stopOpacity="0.6" />
                                            </linearGradient>
                                        </defs>
                                        <circle
                                            cx="60" cy="60" r="54"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            className="text-muted/20"
                                        />
                                        <motion.circle
                                            cx="60" cy="60" r="54"
                                            fill="none"
                                            stroke="url(#scoreGradientFull)"
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={circumference}
                                            initial={{ strokeDashoffset: circumference }}
                                            animate={{ strokeDashoffset: offset }}
                                            transition={{ duration: 1.5, ease: [0.32, 0.72, 0, 1] }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <motion.span
                                            className="text-5xl font-black tracking-tight tabular-nums"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                                        >
                                            {score}
                                        </motion.span>
                                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.2em]">Score</span>
                                    </div>
                                </div>

                                {/* Score Info */}
                                <div className="flex-1 text-center sm:text-left space-y-4">
                                    <div>
                                        <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap mb-2">
                                            <h2 className="text-2xl font-bold tracking-tight">Your Twealth Index™</h2>
                                            <Badge
                                                className={`${bandConfig.bg} ${bandConfig.text} ${bandConfig.border} border text-xs font-semibold`}
                                            >
                                                {twealthIndex?.band || "—"}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                                            {twealthIndex?.drivers?.overall?.action || "Keep tracking your finances to improve your score."}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                                        <Link href="/ai-assistant">
                                            <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                                                <Sparkles className="w-4 h-4" />
                                                Get AI Advice
                                            </Button>
                                        </Link>
                                        <Link href="/money-tracking?add=1">
                                            <Button variant="outline" className="gap-2 rounded-xl">
                                                <Target className="w-4 h-4" />
                                                Add Transaction
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between"
                >
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        4-Pillar Breakdown
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Sorted by priority (weakest first)
                    </p>
                </motion.div>

                {/* Pillar Cards - Sorted by score */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedPillars.map((pillar, idx) => (
                        <PillarCard
                            key={pillar.key}
                            title={pillar.title}
                            score={pillar.score}
                            icon={pillar.icon}
                            color={pillar.color}
                            drivers={pillar.drivers}
                            action={pillar.action}
                            delay={0.1 * (idx + 1)}
                            rank={idx + 1}
                        />
                    ))}
                </div>

                {/* How To Improve Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-primary/10">
                                    <Brain className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm mb-2">How to Improve Your Score</h4>
                                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary font-bold">1.</span>
                                            Focus on your weakest pillar first ({sortedPillars[0]?.title || "—"} at {sortedPillars[0]?.score || 0}/100)
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary font-bold">2.</span>
                                            Follow the recommended actions in each pillar card above
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary font-bold">3.</span>
                                            Track transactions regularly to improve your Behavior score
                                        </li>
                                    </ul>
                                    <Link href="/ai-assistant" className="inline-block mt-4">
                                        <Button size="sm" className="gap-2">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            Ask AI for Personalized Plan
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
        </div>
    );
}

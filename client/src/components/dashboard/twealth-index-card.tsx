import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Shield, TrendingUp, Brain, Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface TwealthIndexData {
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

interface TwealthIndexCardProps {
    data?: TwealthIndexData;
    isLoading?: boolean;
}

// Compact Score Ring
function ScoreRing({ score, size = 140, strokeWidth = 10 }: { score: number; size?: number; strokeWidth?: number }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    const getGradientColors = (score: number) => {
        if (score >= 80) return { start: "#10b981", end: "#34d399" };
        if (score >= 60) return { start: "#3b82f6", end: "#60a5fa" };
        if (score >= 40) return { start: "#f59e0b", end: "#fbbf24" };
        return { start: "#ef4444", end: "#f87171" };
    };

    const colors = getGradientColors(score);
    const gradientId = `scoreGradient-${score}`;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={colors.start} />
                        <stop offset="100%" stopColor={colors.end} />
                    </linearGradient>
                </defs>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-muted/20"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className="text-4xl font-black tracking-tight"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    {score}
                </motion.span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">of 100</span>
            </div>
        </div>
    );
}

// Mini Pillar Badge
function PillarBadge({
    label,
    score,
    icon: Icon,
    color
}: {
    label: string;
    score: number;
    icon: any;
    color: string;
}) {
    const bgColor = color.replace('text-', 'bg-').replace('500', '500/10');

    return (
        <motion.div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl ${bgColor} border border-transparent hover:border-white/10 transition-colors cursor-default`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
        >
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className={`text-xs font-bold ${color}`}>{score}</span>
        </motion.div>
    );
}

export function TwealthIndexCard({ data, isLoading }: TwealthIndexCardProps) {
    const bandConfig = useMemo(() => {
        const band = data?.band || "Unknown";
        switch (band) {
            case "Great":
                return { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" };
            case "Good":
                return { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" };
            case "Needs Work":
                return { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" };
            default:
                return { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20" };
        }
    }, [data?.band]);

    if (isLoading) {
        return (
            <Card className="h-full border-0 bg-card shadow-lg">
                <CardContent className="p-5 flex flex-col items-center justify-center h-full">
                    <Skeleton className="w-32 h-32 rounded-full" />
                    <Skeleton className="w-24 h-4 mt-4" />
                </CardContent>
            </Card>
        );
    }

    const score = data?.twealthIndex ?? 0;

    return (
        <Card className="h-full border-0 bg-card shadow-lg overflow-hidden">
            <CardContent className="p-5 flex flex-col h-full">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                Twealth Index™
                            </p>
                            <Badge
                                variant="outline"
                                className={`mt-1 ${bandConfig.bg} ${bandConfig.text} ${bandConfig.border} text-[10px] font-semibold`}
                            >
                                {data?.band || "—"}
                            </Badge>
                        </div>
                    </div>
                    <Link href="/financial-score">
                        <button className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors group">
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                        </button>
                    </Link>
                </div>

                {/* Score + Pillars Row */}
                <div className="flex-1 flex items-center gap-6">
                    {/* Score Ring */}
                    <div className="flex-shrink-0">
                        <ScoreRing score={score} size={130} strokeWidth={10} />
                    </div>

                    {/* Pillars Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-2">
                        <PillarBadge
                            label="Cashflow"
                            score={data?.cashflowScore ?? 0}
                            icon={ArrowUpRight}
                            color="text-emerald-500"
                        />
                        <PillarBadge
                            label="Stability"
                            score={data?.stabilityScore ?? 0}
                            icon={Shield}
                            color="text-blue-500"
                        />
                        <PillarBadge
                            label="Growth"
                            score={data?.growthScore ?? 0}
                            icon={TrendingUp}
                            color="text-violet-500"
                        />
                        <PillarBadge
                            label="Behavior"
                            score={data?.behaviorScore ?? 0}
                            icon={Brain}
                            color="text-amber-500"
                        />
                    </div>
                </div>

                {/* Action Insight */}
                {data?.drivers?.overall?.action && (
                    <motion.div
                        className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">
                                {data.drivers.overall.action}
                            </p>
                        </div>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}

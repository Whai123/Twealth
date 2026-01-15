import { useMemo } from "react";
import { format } from "date-fns";
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, Activity, Shield, BarChart3, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface ScoreSnapshot {
    month: string;
    twealthIndex: number;
    cashflowScore?: number;
    stabilityScore?: number;
    growthScore?: number;
    behaviorScore?: number;
}

export function ScoreTrendChart() {
    const { data: history, isLoading } = useQuery<ScoreSnapshot[]>({
        queryKey: ["/api/twealth-index/history"],
    });

    const chartData = useMemo(() => {
        if (!history || history.length === 0) return [];

        const sorted = [...history].sort((a, b) =>
            new Date(a.month).getTime() - new Date(b.month).getTime()
        );

        return sorted.map(d => ({
            ...d,
            displayDate: format(new Date(d.month), "MMM"),
            fullDate: format(new Date(d.month), "MMM yyyy")
        }));
    }, [history]);

    const trend = useMemo(() => {
        if (!chartData || chartData.length < 2) return { value: 0, label: "—", percent: 0 };
        const last = chartData[chartData.length - 1].twealthIndex;
        const prev = chartData[chartData.length - 2].twealthIndex;
        const diff = last - prev;
        const percent = prev > 0 ? ((diff / prev) * 100).toFixed(1) : "0";
        return {
            value: diff,
            label: diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : "0",
            percent: percent
        };
    }, [chartData]);

    const overallTrend = useMemo(() => {
        if (chartData.length < 2) return { value: 0, label: "—" };
        const first = chartData[0].twealthIndex;
        const last = chartData[chartData.length - 1].twealthIndex;
        const diff = last - first;
        return {
            value: diff,
            label: diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : "0"
        };
    }, [chartData]);

    const latestScore = chartData.length > 0 ? chartData[chartData.length - 1].twealthIndex : 0;
    const highScore = chartData.length > 0 ? Math.max(...chartData.map(d => d.twealthIndex)) : 0;
    const lowScore = chartData.length > 0 ? Math.min(...chartData.map(d => d.twealthIndex)) : 0;

    if (isLoading) {
        return (
            <Card className="h-full border-border/40 bg-card">
                <CardContent className="p-5 h-full">
                    <Skeleton className="h-full w-full rounded-xl" />
                </CardContent>
            </Card>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return "#10b981";
        if (score >= 60) return "#3b82f6";
        if (score >= 40) return "#f59e0b";
        return "#ef4444";
    };

    const scoreColor = getScoreColor(latestScore);

    return (
        <Card className="h-full border-border/40 bg-card overflow-hidden">
            <CardContent className="p-5 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="w-4 h-4 text-muted-foreground" />
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Score Trend
                            </p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <motion.span
                                className="text-3xl font-black tracking-tight tabular-nums"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ color: scoreColor }}
                            >
                                {latestScore}
                            </motion.span>
                            {chartData.length > 1 && (
                                <Badge
                                    variant="secondary"
                                    className={`text-xs font-semibold px-1.5 py-0 ${trend.value > 0
                                            ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
                                            : trend.value < 0
                                                ? "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                                                : "text-muted-foreground bg-muted"
                                        }`}
                                >
                                    {trend.value > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> :
                                        trend.value < 0 ? <TrendingDown className="w-3 h-3 mr-0.5" /> :
                                            <Minus className="w-3 h-3 mr-0.5" />}
                                    {trend.label}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    {chartData.length > 1 && (
                        <div className="text-right text-xs text-muted-foreground">
                            <p>High: <span className="font-semibold text-emerald-500">{highScore}</span></p>
                            <p>Low: <span className="font-semibold text-red-500">{lowScore}</span></p>
                        </div>
                    )}
                </div>

                {/* Chart */}
                <div className="flex-1 min-h-0 -mx-2">
                    {chartData.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                            <BarChart3 className="w-8 h-8 opacity-30" />
                            <p>Track transactions to see your trend</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="trendFillDynamic" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={scoreColor} stopOpacity={0.3} />
                                        <stop offset="100%" stopColor={scoreColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="hsl(var(--border))"
                                    opacity={0.3}
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="displayDate"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                                    dy={5}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                                    ticks={[0, 50, 100]}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-popover/95 backdrop-blur-sm border border-border px-3 py-2 rounded-xl shadow-lg text-xs">
                                                    <p className="font-semibold mb-1.5">{data.fullDate}</p>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-muted-foreground">Overall</span>
                                                            <span className="font-bold" style={{ color: getScoreColor(data.twealthIndex) }}>
                                                                {data.twealthIndex}
                                                            </span>
                                                        </div>
                                                        {data.cashflowScore !== undefined && (
                                                            <>
                                                                <div className="border-t border-border/50 pt-1 mt-1 flex items-center justify-between gap-4">
                                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                                        <Activity className="w-3 h-3 text-blue-500" /> Cashflow
                                                                    </span>
                                                                    <span className="font-medium">{data.cashflowScore}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                                        <Shield className="w-3 h-3 text-emerald-500" /> Stability
                                                                    </span>
                                                                    <span className="font-medium">{data.stabilityScore}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                                        <TrendingUp className="w-3 h-3 text-violet-500" /> Growth
                                                                    </span>
                                                                    <span className="font-medium">{data.growthScore}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                                        <Flame className="w-3 h-3 text-amber-500" /> Behavior
                                                                    </span>
                                                                    <span className="font-medium">{data.behaviorScore}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="twealthIndex"
                                    stroke={scoreColor}
                                    strokeWidth={2.5}
                                    fill="url(#trendFillDynamic)"
                                    animationDuration={1200}
                                    dot={chartData.length <= 6 ? { fill: scoreColor, strokeWidth: 0, r: 3 } : false}
                                    activeDot={{ fill: scoreColor, strokeWidth: 2, stroke: "white", r: 5 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Footer */}
                {chartData.length > 1 && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                        <p className="text-[10px] text-muted-foreground">
                            Last {chartData.length} months
                        </p>
                        <p className={`text-[10px] font-medium ${overallTrend.value > 0 ? "text-emerald-500" :
                                overallTrend.value < 0 ? "text-red-500" : "text-muted-foreground"
                            }`}>
                            {overallTrend.value > 0 ? "↑" : overallTrend.value < 0 ? "↓" : "—"} {overallTrend.label} overall
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

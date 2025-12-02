import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  Circle,
  ArrowUpRight,
  Target,
  Wallet,
  PiggyBank,
  Receipt,
  CreditCard,
  RefreshCw,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";

interface PlaybookInsight {
  text: string;
  tag: string;
  severity: "high" | "medium" | "low";
}

interface PlaybookAction {
  title: string;
  description: string;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  deepLink: string;
}

interface Playbook {
  id: string;
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  financialHealthScore: number;
  scoreDelta: number | null;
  confidenceBand: "improving" | "stable" | "declining" | null;
  insights: PlaybookInsight[];
  insightsCount: number;
  actions: PlaybookAction[];
  actionsCount: number;
  actionsCompleted: number | null;
  completedActionIndices: number[] | null;
  roiSavings: string;
  cumulativeRoi: string;
  forecastLift: string | null;
  tier: string;
  generatedBy: string;
  isViewed: boolean;
  viewedAt: string | null;
  createdAt: string;
}

const tagColors: Record<string, { bg: string; text: string }> = {
  spending: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  saving: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  goal: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  budget: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  investment: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" }
};

const severityStyles: Record<string, string> = {
  high: "border-l-4 border-l-red-500",
  medium: "border-l-4 border-l-amber-500",
  low: "border-l-4 border-l-emerald-500"
};

const effortLabels: Record<string, { text: string; color: string }> = {
  low: { text: "Quick", color: "text-emerald-600" },
  medium: { text: "Moderate", color: "text-amber-600" },
  high: { text: "Involved", color: "text-red-600" }
};

const impactLabels: Record<string, { text: string; color: string }> = {
  low: { text: "Minor", color: "text-gray-600" },
  medium: { text: "Good", color: "text-blue-600" },
  high: { text: "Major", color: "text-violet-600" }
};

function HealthScoreRing({ score, delta }: { score: number; delta: number | null }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#3b82f6";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted/20"
          strokeWidth="8"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={getScoreColor(score)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-3xl font-bold text-foreground"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {score}
        </motion.span>
        {delta !== null && delta !== 0 && (
          <motion.div 
            className={`flex items-center text-xs font-medium ${delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {delta > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
            {delta > 0 ? '+' : ''}{delta}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function WeeklySummaryCard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const { data: playbooks, isLoading } = useQuery<Playbook[]>({
    queryKey: ['/api/playbooks'],
    staleTime: 1000 * 60 * 5,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/playbooks/generate");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playbooks'] });
      toast({
        title: "Weekly Summary Generated",
        description: "Your personalized financial insights are ready",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate weekly summary",
        variant: "destructive",
      });
    }
  });

  const completeActionMutation = useMutation({
    mutationFn: async ({ playbookId, actionIndex }: { playbookId: string; actionIndex: number }) => {
      const response = await apiRequest("POST", `/api/playbooks/${playbookId}/complete-action`, {
        actionIndex,
        estimatedSavings: 0,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playbooks'] });
      toast({
        title: "Action Completed",
        description: "Great progress on your financial health",
      });
    }
  });

  const currentPlaybook = playbooks && playbooks.length > 0 ? playbooks[0] : null;
  const completedIndices = currentPlaybook?.completedActionIndices || [];

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl border border-border/50 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted/30 rounded w-1/3" />
          <div className="h-32 bg-muted/30 rounded-xl" />
          <div className="h-20 bg-muted/30 rounded" />
        </div>
      </div>
    );
  }

  if (!currentPlaybook) {
    return (
      <motion.div 
        className="p-6 rounded-2xl border border-border/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Weekly Financial Summary</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Get personalized AI insights, health scores, and action items tailored to your financial situation
          </p>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-generate-summary"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate My Summary
              </>
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

  const weekStart = new Date(currentPlaybook.weekStartDate);
  const weekEnd = new Date(currentPlaybook.weekEndDate);

  return (
    <motion.div 
      className="rounded-2xl border border-border/50 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid="weekly-summary-card"
    >
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Weekly Financial Pulse</h3>
            <p className="text-xs text-muted-foreground">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs ${
              currentPlaybook.confidenceBand === 'improving' ? 'border-emerald-500 text-emerald-600' :
              currentPlaybook.confidenceBand === 'declining' ? 'border-red-500 text-red-600' :
              'border-gray-500 text-gray-600'
            }`}
          >
            {currentPlaybook.confidenceBand === 'improving' && <TrendingUp className="w-3 h-3 mr-1" />}
            {currentPlaybook.confidenceBand === 'declining' && <TrendingDown className="w-3 h-3 mr-1" />}
            {currentPlaybook.confidenceBand === 'stable' && <Minus className="w-3 h-3 mr-1" />}
            {currentPlaybook.confidenceBand}
          </Badge>
        </div>

        <div className="flex items-center gap-6">
          <HealthScoreRing score={currentPlaybook.financialHealthScore} delta={currentPlaybook.scoreDelta} />
          
          <div className="flex-1 space-y-3">
            <div className="text-sm font-medium text-foreground">Financial Health Score</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-muted-foreground">ROI This Week</div>
                  <div className="font-semibold text-emerald-600">${parseFloat(currentPlaybook.roiSavings || '0').toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-muted-foreground">Total Savings</div>
                  <div className="font-semibold text-blue-600">${parseFloat(currentPlaybook.cumulativeRoi || '0').toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-border/30">
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          AI Insights ({currentPlaybook.insights?.length || 0})
        </h4>
        <div className="space-y-2">
          {currentPlaybook.insights?.slice(0, 3).map((insight, idx) => (
            <motion.div
              key={idx}
              className={`p-3 rounded-lg bg-muted/30 ${severityStyles[insight.severity]}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-foreground/90">{insight.text}</p>
                <Badge 
                  variant="secondary" 
                  className={`text-[10px] shrink-0 ${tagColors[insight.tag]?.bg || ''} ${tagColors[insight.tag]?.text || ''}`}
                >
                  {insight.tag}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            Action Queue
          </h4>
          <span className="text-xs text-muted-foreground">
            {completedIndices.length}/{currentPlaybook.actionsCount} done
          </span>
        </div>
        
        <Progress 
          value={(completedIndices.length / currentPlaybook.actionsCount) * 100} 
          className="h-1.5 mb-4"
        />
        
        <div className="space-y-2">
          {currentPlaybook.actions?.map((action, idx) => {
            const isCompleted = completedIndices.includes(idx);
            
            return (
              <motion.div
                key={idx}
                className={`p-3 rounded-lg border transition-all ${
                  isCompleted 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40' 
                    : 'bg-muted/20 border-border/50 hover:border-blue-500/30 cursor-pointer'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => {
                  if (!isCompleted) {
                    setLocation(action.deepLink);
                  }
                }}
                whileHover={!isCompleted ? { y: -2 } : undefined}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isCompleted) {
                        completeActionMutation.mutate({ 
                          playbookId: currentPlaybook.id, 
                          actionIndex: idx 
                        });
                      }
                    }}
                    className="mt-0.5 shrink-0"
                    data-testid={`action-checkbox-${idx}`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground hover:text-blue-500 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${isCompleted ? 'text-emerald-700 dark:text-emerald-300 line-through' : 'text-foreground'}`}>
                      {action.title}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{action.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px]">
                      <span className={effortLabels[action.effort].color}>
                        {effortLabels[action.effort].text} effort
                      </span>
                      <span className="text-muted-foreground">|</span>
                      <span className={impactLabels[action.impact].color}>
                        {impactLabels[action.impact].text} impact
                      </span>
                    </div>
                  </div>
                  {!isCompleted && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 mt-0.5" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-4 bg-muted/20 border-t border-border/30">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-blue-600"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          data-testid="button-refresh-summary"
        >
          {generateMutation.isPending ? (
            <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-2" />
          )}
          Refresh Summary
        </Button>
      </div>
    </motion.div>
  );
}

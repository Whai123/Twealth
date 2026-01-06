import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Award,
  Bell,
  Lightbulb,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProactiveInsight {
  id: string;
  type: 'spending_anomaly' | 'savings_opportunity' | 'goal_deadline' | 'budget_warning' | 'achievement';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionable: string;
  data?: any;
  createdAt: string;
}

const insightConfig = {
  spending_anomaly: {
    icon: AlertTriangle,
    colors: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200/60 dark:border-amber-800/40',
      icon: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      title: 'text-amber-800 dark:text-amber-200',
      badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
    }
  },
  savings_opportunity: {
    icon: TrendingUp,
    colors: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200/60 dark:border-emerald-800/40',
      icon: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      title: 'text-emerald-800 dark:text-emerald-200',
      badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
    }
  },
  goal_deadline: {
    icon: Target,
    colors: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200/60 dark:border-blue-800/40',
      icon: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      title: 'text-blue-800 dark:text-blue-200',
      badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
    }
  },
  budget_warning: {
    icon: Bell,
    colors: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200/60 dark:border-red-800/40',
      icon: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/50',
      title: 'text-red-800 dark:text-red-200',
      badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
    }
  },
  achievement: {
    icon: Award,
    colors: {
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      border: 'border-violet-200/60 dark:border-violet-800/40',
      icon: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-100 dark:bg-violet-900/50',
      title: 'text-violet-800 dark:text-violet-200',
      badge: 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300'
    }
  }
};

const priorityBadge = {
  high: 'Urgent',
  medium: 'Important',
  low: 'Note'
};

interface ProactiveInsightsPanelProps {
  onAskAbout?: (prompt: string) => void;
  maxItems?: number;
}

export function ProactiveInsightsPanel({ onAskAbout, maxItems = 3 }: ProactiveInsightsPanelProps) {
  const { data: insights, isLoading, error } = useQuery<ProactiveInsight[]>({
    queryKey: ['/api/proactive-insights'],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-muted/30 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !insights || insights.length === 0) {
    return null;
  }

  const displayedInsights = insights.slice(0, maxItems);
  const hasMore = insights.length > maxItems;

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
          <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Insights for You</h3>
        <Badge variant="secondary" className="text-[10px] ml-auto">
          {insights.length} new
        </Badge>
      </div>

      <AnimatePresence mode="popLayout">
        {displayedInsights.map((insight, index) => {
          const config = insightConfig[insight.type];
          const Icon = config.icon;
          const colors = config.colors;

          return (
            <motion.div
              key={insight.id}
              className={`relative p-4 rounded-xl border ${colors.bg} ${colors.border} group transition-all duration-200 hover:shadow-md cursor-pointer`}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -2 }}
              onClick={() => onAskAbout?.(insight.actionable)}
              data-testid={`insight-card-${insight.type}`}
            >
              <div className="flex gap-3">
                <div className={`p-2 rounded-lg ${colors.iconBg} shrink-0`}>
                  <Icon className={`w-4 h-4 ${colors.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`text-sm font-semibold ${colors.title} line-clamp-1`}>
                      {insight.title}
                    </h4>
                    <Badge 
                      variant="secondary" 
                      className={`text-[10px] shrink-0 ${colors.badge}`}
                    >
                      {priorityBadge[insight.priority]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {insight.message}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    <span className="text-muted-foreground/70">Click to ask AI for help</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {hasMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-blue-600"
            onClick={() => onAskAbout?.("What are all my financial insights and what should I focus on first?")}
            data-testid="button-view-all-insights"
          >
            View all {insights.length} insights
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

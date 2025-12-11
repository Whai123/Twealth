import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Target, Sparkles, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import confetti from "canvas-confetti";

interface GoalMilestone {
  id: string;
  goalId: string;
  userId: string;
  milestone: number;
  amountAtMilestone: string;
  celebratedAt: string;
  isSeen: boolean;
  goal: {
    id: string;
    title: string;
    targetAmount: string;
    currentAmount: string;
    category: string;
  };
}

const milestoneMessages: Record<number, { title: string; subtitle: string; icon: typeof Trophy }> = {
  25: {
    title: "Quarter Way There",
    subtitle: "You've reached 25% of your goal. Great momentum!",
    icon: Star,
  },
  50: {
    title: "Halfway Champion",
    subtitle: "50% complete! You're crushing this goal.",
    icon: Target,
  },
  75: {
    title: "Almost There",
    subtitle: "75% done! The finish line is in sight.",
    icon: Sparkles,
  },
  100: {
    title: "Goal Achieved",
    subtitle: "Congratulations! You've reached your target.",
    icon: Trophy,
  },
};

const milestoneColors: Record<number, { bg: string; border: string; text: string }> = {
  25: { bg: "from-blue-500 to-blue-600", border: "border-blue-400", text: "text-blue-50" },
  50: { bg: "from-violet-500 to-purple-600", border: "border-violet-400", text: "text-violet-50" },
  75: { bg: "from-amber-500 to-orange-600", border: "border-amber-400", text: "text-amber-50" },
  100: { bg: "from-emerald-500 to-green-600", border: "border-emerald-400", text: "text-emerald-50" },
};

function triggerConfetti(milestone: number) {
  const intensity = milestone / 100;
  
  confetti({
    particleCount: Math.floor(100 * intensity),
    spread: 70 + (milestone / 4),
    origin: { y: 0.6 },
    colors: milestone === 100 
      ? ['#ffd700', '#22c55e', '#3b82f6', '#f59e0b']
      : ['#3b82f6', '#8b5cf6', '#f59e0b'],
  });

  if (milestone === 100) {
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ffd700', '#22c55e'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ffd700', '#22c55e'],
      });
    }, 250);
  }
}

export function MilestoneCelebration() {
  const [, setLocation] = useLocation();
  const [celebrationQueue, setCelebrationQueue] = useState<GoalMilestone[]>([]);
  const [isShowing, setIsShowing] = useState(false);
  const [lastSeenMilestoneIds, setLastSeenMilestoneIds] = useState<string[]>([]);

  const { data: milestones = [] } = useQuery<GoalMilestone[]>({
    queryKey: ['/api/goal-milestones'],
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 30,
  });

  const markSeenMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/goal-milestones/mark-seen");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goal-milestones'] });
      setLastSeenMilestoneIds([]);
    },
    onError: () => {
      setCelebrationQueue(prev => {
        const restored = milestones.filter(m => lastSeenMilestoneIds.includes(m.id));
        return [...restored, ...prev];
      });
      setIsShowing(true);
    },
  });

  useEffect(() => {
    if (milestones.length > 0) {
      const newMilestones = milestones.filter(
        m => !celebrationQueue.some(q => q.id === m.id) && !lastSeenMilestoneIds.includes(m.id)
      );
      if (newMilestones.length > 0) {
        setCelebrationQueue(prev => [...prev, ...newMilestones]);
        setIsShowing(true);
      }
    }
  }, [milestones]);

  const currentMilestone = celebrationQueue[0];

  useEffect(() => {
    if (currentMilestone && isShowing) {
      triggerConfetti(currentMilestone.milestone);
    }
  }, [currentMilestone?.id, isShowing]);

  const handleDismiss = () => {
    if (!currentMilestone) return;
    
    setLastSeenMilestoneIds(prev => [...prev, currentMilestone.id]);
    setCelebrationQueue(prev => prev.slice(1));
    
    if (celebrationQueue.length <= 1) {
      setIsShowing(false);
      markSeenMutation.mutate();
    }
  };

  const handleViewGoal = () => {
    if (currentMilestone) {
      setLocation(`/financial-goals?highlight=${currentMilestone.goalId}`);
      handleDismiss();
    }
  };

  if (!celebrationQueue.length || !isShowing || !currentMilestone) {
    return null;
  }

  const message = milestoneMessages[currentMilestone.milestone] || milestoneMessages[25];
  const colors = milestoneColors[currentMilestone.milestone] || milestoneColors[25];
  const IconComponent = message.icon;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleDismiss}
        data-testid="milestone-celebration-overlay"
      >
        <motion.div
          className={`relative max-w-md w-full mx-4 rounded-3xl bg-gradient-to-br ${colors.bg} p-8 shadow-2xl border ${colors.border}`}
          initial={{ scale: 0.8, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: 50, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          data-testid="milestone-celebration-card"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            data-testid="button-dismiss-milestone"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>

          <div className="text-center">
            <motion.div
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <IconComponent className="w-10 h-10 text-white" />
            </motion.div>

            <motion.div
              className="mb-2 text-white/80 text-sm font-medium uppercase tracking-wider"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {currentMilestone.milestone}% Milestone
            </motion.div>

            <motion.h2
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {message.title}
            </motion.h2>

            <motion.p
              className={`${colors.text} mb-4`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {message.subtitle}
            </motion.p>

            <motion.div
              className="bg-white/20 rounded-xl p-4 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-white/80 text-sm mb-1">Goal: {currentMilestone.goal.title}</p>
              <p className="text-2xl font-bold text-white">
                ${parseFloat(currentMilestone.amountAtMilestone).toLocaleString()}
                <span className="text-white/60 text-lg font-normal">
                  {" "}/ ${parseFloat(currentMilestone.goal.targetAmount).toLocaleString()}
                </span>
              </p>
            </motion.div>

            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                variant="outline"
                className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white"
                onClick={handleDismiss}
                data-testid="button-continue"
              >
                {celebrationQueue.length > 1 ? 'Next' : 'Continue'}
              </Button>
              <Button
                className="flex-1 bg-white text-gray-900 hover:bg-white/90"
                onClick={handleViewGoal}
                data-testid="button-view-goal"
              >
                View Goal
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>

            {celebrationQueue.length > 1 && (
              <motion.div
                className="mt-4 flex justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {celebrationQueue.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === 0 ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default MilestoneCelebration;

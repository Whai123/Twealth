import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Flame, Trophy, Star, Zap, Calendar, Target, TrendingUp, Award, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

function safeString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value === null || value === undefined) return '';
  return '';
}

function safeNumber(value: unknown): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string | null;
  totalCheckIns: number;
  weeklyProgress: boolean[];
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string | null;
  progress: number;
  target: number;
}

const achievementIcons: Record<string, any> = {
  flame: Flame,
  trophy: Trophy,
  star: Star,
  zap: Zap,
  target: Target,
  trending: TrendingUp,
  award: Award,
};

function triggerStreakConfetti() {
  const count = 100;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#ff6b35', '#f7c59f'] });
  fire(0.2, { spread: 60, colors: ['#ffd700', '#ff6b35'] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#ff6b35', '#ffd700', '#f7c59f'] });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#ffd700'] });
  fire(0.1, { spread: 120, startVelocity: 45, colors: ['#ff6b35'] });
}

export function StreakWidget() {
  const [showCelebration, setShowCelebration] = useState(false);
  const { toast } = useToast();

  const { data: streakData, isLoading } = useQuery<StreakData>({
    queryKey: ['/api/streaks'],
    staleTime: 1000 * 60 * 5,
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/streaks/check-in', {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/streaks'] });
      if (data.streakIncreased) {
        setShowCelebration(true);
        triggerStreakConfetti();
        setTimeout(() => setShowCelebration(false), 3000);
      }
      toast({
        title: data.streakIncreased ? "Streak increased!" : "Already checked in today",
        description: data.streakIncreased 
          ? `You're on a ${data.newStreak}-day streak!` 
          : "Come back tomorrow to keep your streak going.",
      });
    },
  });

  const canCheckIn = () => {
    if (!streakData?.lastCheckIn) return true;
    const lastCheck = new Date(streakData.lastCheckIn);
    const now = new Date();
    return lastCheck.toDateString() !== now.toDateString();
  };

  if (isLoading) {
    return (
      <Card className="border-border/40">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-24" />
            <div className="h-10 bg-muted rounded w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const streak = streakData?.currentStreak ?? 0;
  const weekProgress = streakData?.weeklyProgress ?? [false, false, false, false, false, false, false];

  return (
    <Card className="border-border/40 hover:border-border/60 transition-colors overflow-hidden relative">
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 z-10 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={streak > 0 ? { 
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0],
              } : {}}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className={`p-2 rounded-lg ${streak > 0 ? 'bg-gradient-to-br from-orange-500 to-yellow-500' : 'bg-muted'}`}
            >
              <Flame className={`w-5 h-5 ${streak > 0 ? 'text-white' : 'text-muted-foreground'}`} />
            </motion.div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Daily Streak</p>
              <motion.p 
                key={streak}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-bold"
              >
                {streak}
                <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
              </motion.p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => checkInMutation.mutate()}
            disabled={!canCheckIn() || checkInMutation.isPending}
            className={canCheckIn() 
              ? "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg shadow-orange-500/25"
              : ""
            }
            data-testid="button-check-in"
          >
            {checkInMutation.isPending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-4 h-4" />
              </motion.div>
            ) : canCheckIn() ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Check In
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" />
                Done
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-1 mt-3">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{day}</span>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  weekProgress[idx]
                    ? 'bg-gradient-to-br from-orange-500 to-yellow-500'
                    : 'bg-muted'
                }`}
              >
                {weekProgress[idx] && <Check className="w-3 h-3 text-white" />}
              </motion.div>
            </div>
          ))}
        </div>

        {streak >= 7 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 pt-3 border-t border-border/40"
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">
                Best: {streakData?.longestStreak ?? streak} days
              </span>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export function AchievementBadges() {
  const { data: streakData } = useQuery<StreakData>({
    queryKey: ['/api/streaks'],
  });

  const achievements = streakData?.achievements ?? [];
  const earnedAchievements = achievements.filter(a => a.earnedAt);
  const inProgressAchievements = achievements.filter(a => !a.earnedAt && a.progress > 0);

  if (achievements.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/40">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Achievements</h3>
          <Badge variant="secondary" className="ml-auto">
            {earnedAchievements.length}/{achievements.length}
          </Badge>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {achievements.slice(0, 6).map((achievement, idx) => {
            const IconComponent = achievementIcons[achievement.icon] || Trophy;
            const isEarned = !!achievement.earnedAt;

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="relative group"
              >
                <div
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                    isEarned
                      ? 'bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25'
                      : 'bg-muted/50 grayscale'
                  }`}
                >
                  <IconComponent className={`w-6 h-6 ${isEarned ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </div>

                {!isEarned && achievement.progress > 0 && (
                  <div className="absolute -bottom-1 left-1 right-1">
                    <Progress 
                      value={(achievement.progress / achievement.target) * 100} 
                      className="h-1"
                    />
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute inset-0 bg-black/60 rounded-xl" />
                  <p className="relative text-[10px] text-white text-center px-1 font-medium">
                    {safeString(achievement.title) || 'Achievement'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {inProgressAchievements.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground mb-2">Next achievement</p>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                {(() => {
                  const next = inProgressAchievements[0];
                  const IconComponent = achievementIcons[next.icon] || Trophy;
                  return <IconComponent className="w-4 h-4 text-muted-foreground" />;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{safeString(inProgressAchievements[0].title) || 'Achievement'}</p>
                <Progress 
                  value={(safeNumber(inProgressAchievements[0].progress) / Math.max(1, safeNumber(inProgressAchievements[0].target))) * 100} 
                  className="h-1.5 mt-1"
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {safeNumber(inProgressAchievements[0].progress)}/{safeNumber(inProgressAchievements[0].target)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

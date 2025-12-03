import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { Progress } from"@/components/ui/progress";
import { 
 Award, 
 Trophy, 
 Star, 
 Target, 
 Zap,
 Crown,
 Medal,
 Rocket,
 CheckCircle,
 Calendar,
 TrendingUp,
 Gift,
 Sparkles
} from"lucide-react";
import { differenceInDays, format, addDays } from"date-fns";
import ShareButton from"@/components/social/share-button";
import { getAchievementShareContent, AchievementShareData } from"@/lib/social-sharing";
import { useUserCurrency } from"@/lib/userContext";

interface Goal {
 id: string;
 title: string;
 description?: string;
 targetAmount: string;
 currentAmount: string;
 targetDate: string;
 category?: string;
 priority: string;
 status: string;
 createdAt?: string;
}

interface AchievementMilestonesProps {
 goals: Goal[];
 onCelebrate?: (milestone: any) => void;
}

interface Milestone {
 id: string;
 goalId?: string;
 type: 'progress' | 'streak' | 'achievement' | 'upcoming';
 icon: any;
 title: string;
 description: string;
 status: 'completed' | 'in-progress' | 'upcoming';
 progress?: number;
 reward?: string;
 date?: string;
 category: 'bronze' | 'silver' | 'gold' | 'platinum';
 points: number;
}

export default function AchievementMilestones({ goals, onCelebrate }: AchievementMilestonesProps) {
 const { formatAmount } = useUserCurrency();
 
 const generateMilestones = (): Milestone[] => {
  const milestones: Milestone[] = [];
  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const activeGoals = goals.filter(goal => goal.status === 'active');

  // Progress-based milestones for active goals
  activeGoals.forEach(goal => {
   const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
   const amount = parseFloat(goal.currentAmount);
   
   // 25% milestone
   if (progress >= 25 && progress < 50) {
    milestones.push({
     id: `quarter-${goal.id}`,
     goalId: goal.id,
     type: 'progress',
     icon: Star,
     title: 'Quarter Way There!',
     description: `You've saved 25% towards"${goal.title}" - great start!`,
     status: 'completed',
     progress: 25,
     reward: 'Bronze Achievement',
     category: 'bronze',
     points: 50
    });
   }

   // 50% milestone
   if (progress >= 50 && progress < 75) {
    milestones.push({
     id: `half-${goal.id}`,
     goalId: goal.id,
     type: 'progress',
     icon: Medal,
     title: 'Halfway Hero!',
     description: `Incredible! You're halfway to your"${goal.title}" goal!`,
     status: 'completed',
     progress: 50,
     reward: 'Silver Achievement',
     category: 'silver',
     points: 100
    });
   }

   // 75% milestone
   if (progress >= 75 && progress < 100) {
    milestones.push({
     id: `three-quarter-${goal.id}`,
     goalId: goal.id,
     type: 'progress',
     icon: Trophy,
     title: 'Almost There!',
     description: `You're 75% done with"${goal.title}" - the finish line is in sight!`,
     status: 'completed',
     progress: 75,
     reward: 'Gold Achievement',
     category: 'gold',
     points: 150
    });
   }

   // Upcoming milestone predictions
   if (progress < 25) {
    milestones.push({
     id: `upcoming-quarter-${goal.id}`,
     goalId: goal.id,
     type: 'upcoming',
     icon: Star,
     title: 'First Quarter Goal',
     description: `${formatAmount(parseFloat(goal.targetAmount) * 0.25 - amount)} away from 25% completion`,
     status: 'upcoming',
     progress: progress,
     category: 'bronze',
     points: 50
    });
   } else if (progress < 50) {
    milestones.push({
     id: `upcoming-half-${goal.id}`,
     goalId: goal.id,
     type: 'upcoming',
     icon: Medal,
     title: 'Halfway Point',
     description: `${formatAmount(parseFloat(goal.targetAmount) * 0.5 - amount)} away from 50% completion`,
     status: 'upcoming',
     progress: progress,
     category: 'silver',
     points: 100
    });
   } else if (progress < 75) {
    milestones.push({
     id: `upcoming-three-quarter-${goal.id}`,
     goalId: goal.id,
     type: 'upcoming',
     icon: Trophy,
     title: 'Three-Quarter Mark',
     description: `${formatAmount(parseFloat(goal.targetAmount) * 0.75 - amount)} away from 75% completion`,
     status: 'upcoming',
     progress: progress,
     category: 'gold',
     points: 150
    });
   } else if (progress < 100) {
    milestones.push({
     id: `upcoming-complete-${goal.id}`,
     goalId: goal.id,
     type: 'upcoming',
     icon: Crown,
     title: 'Goal Completion',
     description: `${formatAmount(parseFloat(goal.targetAmount) - amount)} away from completing this goal!`,
     status: 'upcoming',
     progress: progress,
     category: 'platinum',
     points: 500
    });
   }
  });

  // Completion achievements
  completedGoals.forEach(goal => {
   milestones.push({
    id: `completed-${goal.id}`,
    goalId: goal.id,
    type: 'achievement',
    icon: Crown,
    title: 'Goal Conquered!',
    description: `Successfully completed"${goal.title}" - amazing work!`,
    status: 'completed',
    progress: 100,
    reward: 'Platinum Achievement',
    category: 'platinum',
    points: 500
   });
  });

  // Streak and portfolio achievements
  if (activeGoals.length >= 3) {
   milestones.push({
    id: 'multi-goal-manager',
    type: 'achievement',
    icon: Target,
    title: 'Multi-Goal Manager',
    description: `Managing ${activeGoals.length} goals simultaneously - you're a pro!`,
    status: 'completed',
    reward: 'Gold Achievement',
    category: 'gold',
    points: 200
   });
  }

  if (completedGoals.length >= 1) {
   milestones.push({
    id: 'goal-achiever',
    type: 'achievement',
    icon: CheckCircle,
    title: 'Goal Achiever',
    description: `Completed your first financial goal - you're building great habits!`,
    status: 'completed',
    reward: 'Silver Achievement',
    category: 'silver',
    points: 150
   });
  }

  if (completedGoals.length >= 5) {
   milestones.push({
    id: 'goal-master',
    type: 'achievement',
    icon: Rocket,
    title: 'Goal Master',
    description: `Completed 5+ goals - you're a financial planning expert!`,
    status: 'completed',
    reward: 'Platinum Achievement',
    category: 'platinum',
    points: 1000
   });
  }

  // Time-based achievements
  const quickGoals = completedGoals.filter(goal => {
   if (!goal.createdAt) return false;
   const completionTime = differenceInDays(new Date(), new Date(goal.createdAt));
   const targetTime = differenceInDays(new Date(goal.targetDate), new Date(goal.createdAt));
   return completionTime < targetTime * 0.8; // Completed 20% faster than planned
  });

  if (quickGoals.length > 0) {
   milestones.push({
    id: 'speed-saver',
    type: 'achievement',
    icon: Zap,
    title: 'Speed Saver',
    description: `Completed a goal ahead of schedule - excellent planning!`,
    status: 'completed',
    reward: 'Gold Achievement',
    category: 'gold',
    points: 300
   });
  }

  return milestones.sort((a, b) => {
   if (a.status !== b.status) {
    if (a.status === 'completed') return -1;
    if (b.status === 'completed') return 1;
    if (a.status === 'in-progress') return -1;
    if (b.status === 'in-progress') return 1;
   }
   return b.points - a.points;
  });
 };

 const milestones = generateMilestones();
 const totalPoints = milestones
  .filter(m => m.status === 'completed')
  .reduce((sum, m) => sum + m.points, 0);

 const getStatusColor = (status: string) => {
  switch (status) {
   case 'completed': return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20';
   case 'in-progress': return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20';
   case 'upcoming': return 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/20';
   default: return 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/20';
  }
 };

 const getCategoryColor = (category: string) => {
  switch (category) {
   case 'bronze': return 'text-orange-600';
   case 'silver': return 'text-gray-600';
   case 'gold': return 'text-yellow-600';
   case 'platinum': return 'text-blue-600';
   default: return 'text-gray-600';
  }
 };

 const getCategoryBadge = (category: string) => {
  switch (category) {
   case 'bronze': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
   case 'silver': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
   case 'gold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
   case 'platinum': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
   default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
 };

 if (milestones.length === 0) {
  return (
   <Card>
    <CardHeader>
     <CardTitle className="flex items-center">
      <Award className="mr-2 h-5 w-5" />
      Achievement Milestones
     </CardTitle>
    </CardHeader>
    <CardContent>
     <div className="text-center py-8">
      <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Start Your Journey</h3>
      <p className="text-muted-foreground">
       Create goals and start saving to unlock achievements and celebrate your progress!
      </p>
     </div>
    </CardContent>
   </Card>
  );
 }

 return (
  <Card>
   <CardHeader>
    <CardTitle className="flex items-center justify-between">
     <div className="flex items-center">
      <Award className="mr-2 h-5 w-5" />
      Achievement Milestones
     </div>
     <div className="flex items-center space-x-2">
      <Badge variant="secondary" className="flex items-center">
       <Sparkles className="mr-1 h-3 w-3" />
       {totalPoints} points
      </Badge>
     </div>
    </CardTitle>
   </CardHeader>
   <CardContent>
    {/* Achievement Summary */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-800">
     <div className="text-center">
      <div className="text-2xl font-bold text-blue-600">
       {milestones.filter(m => m.status === 'completed').length}
      </div>
      <div className="text-xs text-blue-600/70">Unlocked</div>
     </div>
     <div className="text-center">
      <div className="text-2xl font-bold text-blue-600">
       {milestones.filter(m => m.status === 'in-progress').length}
      </div>
      <div className="text-xs text-blue-600/70">In Progress</div>
     </div>
     <div className="text-center">
      <div className="text-2xl font-bold text-gray-600">
       {milestones.filter(m => m.status === 'upcoming').length}
      </div>
      <div className="text-xs text-gray-600/70">Upcoming</div>
     </div>
     <div className="text-center">
      <div className="text-2xl font-bold text-green-600">{totalPoints}</div>
      <div className="text-xs text-green-600/70">Total Points</div>
     </div>
    </div>

    <div className="space-y-4">
     {milestones.slice(0, 8).map((milestone) => (
      <div 
       key={milestone.id}
       className={`p-4 rounded-lg border ${getStatusColor(milestone.status)}`}
       data-testid={`milestone-${milestone.id}`}
      >
       <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
         <div className={`p-2 rounded-lg ${milestone.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-900/20'}`}>
          <milestone.icon className={`h-5 w-5 ${getCategoryColor(milestone.category)}`} />
         </div>
         <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
           <h4 className="font-medium">{milestone.title}</h4>
           <Badge className={getCategoryBadge(milestone.category)}>
            {milestone.category}
           </Badge>
           {milestone.status === 'completed' && (
            <CheckCircle className="h-4 w-4 text-green-600" />
           )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">
           {milestone.description}
          </p>
          
          {milestone.progress !== undefined && milestone.status === 'upcoming' && (
           <div className="space-y-1">
            <div className="flex justify-between text-xs">
             <span>Progress</span>
             <span>{Math.round(milestone.progress)}%</span>
            </div>
            <Progress value={milestone.progress} className="h-2" />
           </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
           <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span>{milestone.points} points</span>
            {milestone.reward && (
             <span className="flex items-center">
              <Gift className="h-3 w-3 mr-1" />
              {milestone.reward}
             </span>
            )}
           </div>
           {milestone.status === 'completed' && (
            <div className="flex gap-2">
             <Button 
              size="sm" 
              variant="outline"
              onClick={() => onCelebrate?.(milestone)}
              data-testid={`button-celebrate-${milestone.id}`}
             >
              Celebrate
             </Button>
             <ShareButton
              shareData={getAchievementShareContent({
               title: milestone.title,
               description: milestone.description,
               achievementType: milestone.type === 'progress' ? 'milestone' : 'goal_completed',
               goalTitle: goals.find(g => g.id === milestone.goalId)?.title,
               progress: milestone.progress,
               category: milestone.category
              })}
              variant="outline"
              size="sm"
              showText={false}
              achievement={true}
              data-testid={`button-share-${milestone.id}`}
             />
            </div>
           )}
          </div>
         </div>
        </div>
       </div>
      </div>
     ))}
    </div>

    {milestones.length > 8 && (
     <div className="text-center pt-4">
      <Button variant="ghost" size="sm" className="text-muted-foreground">
       View {milestones.length - 8} More Milestones
      </Button>
     </div>
    )}
   </CardContent>
  </Card>
 );
}
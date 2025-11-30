import type { IStorage } from './storage';

export interface GoalProgress {
  goalId: string;
  goalTitle: string;
  targetAmount: number;
  currentAmount: number;
  percentComplete: number;
  milestone: 'started' | '25%' | '50%' | '75%' | 'complete' | null;
  daysRemaining: number;
  targetDate: Date;
  isOnTrack: boolean;
  requiredMonthlyContribution: number;
  celebration?: string;
  motivationalMessage: string;
  nextMilestone: string;
}

export interface MilestoneEvent {
  type: 'milestone_reached' | 'goal_completed' | 'goal_at_risk' | 'ahead_of_schedule';
  goalId: string;
  goalTitle: string;
  message: string;
  celebrationEmoji: string;
  actionRequired?: string;
}

function getMilestoneLevel(percentComplete: number): '25%' | '50%' | '75%' | 'complete' | null {
  if (percentComplete >= 100) return 'complete';
  if (percentComplete >= 75) return '75%';
  if (percentComplete >= 50) return '50%';
  if (percentComplete >= 25) return '25%';
  return null;
}

function getCelebrationMessage(milestone: string, goalTitle: string, percentComplete: number): string {
  switch (milestone) {
    case '25%':
      return `Quarter way there! You've saved 25% for "${goalTitle}". Momentum is building.`;
    case '50%':
      return `Halfway point! You're 50% towards "${goalTitle}". The finish line is in sight.`;
    case '75%':
      return `Three quarters done! You're at 75% for "${goalTitle}". Almost there, keep pushing.`;
    case 'complete':
      return `GOAL ACHIEVED! You did it! "${goalTitle}" is complete at ${percentComplete.toFixed(1)}%. Celebrate this win.`;
    default:
      return `Great start on "${goalTitle}". Every dollar saved brings you closer.`;
  }
}

function getMotivationalMessage(percentComplete: number, isOnTrack: boolean, daysRemaining: number): string {
  if (percentComplete >= 100) {
    return `Incredible discipline! Time to set your next ambitious goal and keep the momentum going.`;
  }
  
  if (isOnTrack) {
    if (percentComplete >= 75) {
      return `You're crushing it! Just ${(100 - percentComplete).toFixed(1)}% to go. The finish line is within reach!`;
    } else if (percentComplete >= 50) {
      return `Excellent progress! You're on pace to hit your goal. Stay consistent with your contributions.`;
    } else if (percentComplete >= 25) {
      return `Solid foundation! You're on track. Keep up the steady contributions to reach your goal on time.`;
    } else {
      return `Great start! You're on schedule. Consistency is key - stick to your monthly savings plan.`;
    }
  } else {
    const remaining = 100 - percentComplete;
    if (daysRemaining < 30) {
      return `Critical: ${daysRemaining} days left, ${remaining.toFixed(1)}% to go. Consider a final push or adjust timeline.`;
    } else if (daysRemaining < 90) {
      return `Behind schedule with ${daysRemaining} days left. Need to increase monthly contributions by 50% to hit target.`;
    } else {
      return `Behind pace but recoverable. Time to reassess and increase monthly contributions to get back on track.`;
    }
  }
}

function getNextMilestone(percentComplete: number): string {
  if (percentComplete >= 100) return 'Goal achieved';
  if (percentComplete >= 75) return 'Next: 100% completion';
  if (percentComplete >= 50) return 'Next: 75% milestone';
  if (percentComplete >= 25) return 'Next: 50% halfway mark';
  return 'Next: 25% first milestone';
}

export async function checkGoalProgress(
  storage: IStorage,
  userId: string
): Promise<{ progress: GoalProgress[]; events: MilestoneEvent[] }> {
  try {
    const goals = await storage.getFinancialGoalsByUserId(userId);
    const activeGoals = goals.filter(g => g.status === 'active');

    const progressList: GoalProgress[] = [];
    const events: MilestoneEvent[] = [];

    for (const goal of activeGoals) {
      const targetAmount = parseFloat(goal.targetAmount);
      const currentAmount = parseFloat(goal.currentAmount || '0');
      const percentComplete = (currentAmount / targetAmount) * 100;
      
      const now = new Date();
      const targetDate = new Date(goal.targetDate);
      const daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const monthsRemaining = Math.max(1, daysRemaining / 30);
      
      const remainingAmount = targetAmount - currentAmount;
      const requiredMonthlyContribution = remainingAmount / monthsRemaining;
      
      // Calculate if on track
      const timeElapsed = now.getTime() - new Date(goal.createdAt || now).getTime();
      const totalTime = targetDate.getTime() - new Date(goal.createdAt || now).getTime();
      const expectedProgress = totalTime > 0 ? (timeElapsed / totalTime) * 100 : 0;
      const isOnTrack = percentComplete >= expectedProgress * 0.9; // 90% of expected is "on track"

      const milestone = getMilestoneLevel(percentComplete);
      const celebration = milestone ? getCelebrationMessage(milestone, goal.title, percentComplete) : undefined;
      const motivationalMessage = getMotivationalMessage(percentComplete, isOnTrack, daysRemaining);
      const nextMilestone = getNextMilestone(percentComplete);

      // Check for milestone events
      const previousPercent = percentComplete - 5; // Assume 5% growth since last check

      // Milestone reached
      if (milestone && previousPercent < 25 && percentComplete >= 25) {
        events.push({
          type: 'milestone_reached',
          goalId: goal.id,
          goalTitle: goal.title,
          message: `25% milestone reached. You've saved $${currentAmount.toLocaleString()} of $${targetAmount.toLocaleString()}`,
          celebrationEmoji: ''
        });
      } else if (milestone && previousPercent < 50 && percentComplete >= 50) {
        events.push({
          type: 'milestone_reached',
          goalId: goal.id,
          goalTitle: goal.title,
          message: `Halfway there. You've saved $${currentAmount.toLocaleString()} of $${targetAmount.toLocaleString()}`,
          celebrationEmoji: ''
        });
      } else if (milestone && previousPercent < 75 && percentComplete >= 75) {
        events.push({
          type: 'milestone_reached',
          goalId: goal.id,
          goalTitle: goal.title,
          message: `75% complete. Just $${remainingAmount.toLocaleString()} left.`,
          celebrationEmoji: ''
        });
      } else if (milestone === 'complete' && previousPercent < 100) {
        events.push({
          type: 'goal_completed',
          goalId: goal.id,
          goalTitle: goal.title,
          message: `GOAL ACHIEVED. "${goal.title}" complete. Celebrate this incredible achievement.`,
          celebrationEmoji: ''
        });
        
        // Mark goal as completed
        await storage.updateFinancialGoal(goal.id, { status: 'completed' });
      }

      // Check if behind schedule
      if (!isOnTrack && daysRemaining < 60 && percentComplete < 90) {
        events.push({
          type: 'goal_at_risk',
          goalId: goal.id,
          goalTitle: goal.title,
          message: `"${goal.title}" is ${(100 - percentComplete).toFixed(1)}% short with ${daysRemaining} days left`,
          celebrationEmoji: '',
          actionRequired: `Increase monthly savings to $${requiredMonthlyContribution.toFixed(0)} to stay on track`
        });
      }

      // Check if ahead of schedule
      if (percentComplete > expectedProgress * 1.2 && percentComplete < 100) {
        events.push({
          type: 'ahead_of_schedule',
          goalId: goal.id,
          goalTitle: goal.title,
          message: `You're ahead of schedule on "${goal.title}".`,
          celebrationEmoji: '',
          actionRequired: `You could reach this goal ${Math.floor((percentComplete - expectedProgress) / 10)} months early.`
        });
      }

      progressList.push({
        goalId: goal.id,
        goalTitle: goal.title,
        targetAmount,
        currentAmount,
        percentComplete,
        milestone,
        daysRemaining,
        targetDate,
        isOnTrack,
        requiredMonthlyContribution,
        celebration,
        motivationalMessage,
        nextMilestone
      });
    }

    return { progress: progressList, events };
  } catch (error) {
    console.error('Error checking goal progress:', error);
    throw error;
  }
}

export async function getGoalMilestones(
  storage: IStorage,
  goalId: string
): Promise<{
  goalTitle: string;
  milestones: Array<{
    level: string;
    targetAmount: number;
    reached: boolean;
    dateReached?: Date;
    percentComplete: number;
  }>;
}> {
  try {
    const goal = await storage.getFinancialGoal(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    const targetAmount = parseFloat(goal.targetAmount);
    const currentAmount = parseFloat(goal.currentAmount || '0');
    const percentComplete = (currentAmount / targetAmount) * 100;

    const milestones = [
      { level: '25% Milestone', targetAmount: targetAmount * 0.25, threshold: 25 },
      { level: '50% Halfway Mark', targetAmount: targetAmount * 0.50, threshold: 50 },
      { level: '75% Almost There', targetAmount: targetAmount * 0.75, threshold: 75 },
      { level: '100% Goal Complete', targetAmount: targetAmount, threshold: 100 }
    ].map(m => ({
      level: m.level,
      targetAmount: m.targetAmount,
      reached: percentComplete >= m.threshold,
      dateReached: percentComplete >= m.threshold ? new Date() : undefined,
      percentComplete: Math.min(percentComplete, m.threshold)
    }));

    return {
      goalTitle: goal.title,
      milestones
    };
  } catch (error) {
    console.error('Error getting goal milestones:', error);
    throw error;
  }
}

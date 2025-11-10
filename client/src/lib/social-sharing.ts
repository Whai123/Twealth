// Social sharing utilities for Twealth

export interface ShareData {
 title: string;
 description: string;
 url?: string;
 hashtags?: string[];
 via?: string;
}

export interface AchievementShareData extends ShareData {
 achievementType: 'milestone' | 'goal_completed' | 'streak' | 'ai_insight';
 value?: string;
 goalTitle?: string;
 category?: 'bronze' | 'silver' | 'gold' | 'platinum';
 progress?: number;
}

/**
 * Generate sharing URLs for different social media platforms
 */
export const getSocialShareUrls = (data: ShareData) => {
 const baseUrl = window.location.origin;
 const shareUrl = data.url || window.location.href;
 const encodedUrl = encodeURIComponent(shareUrl);
 const encodedTitle = encodeURIComponent(data.title);
 const encodedDescription = encodeURIComponent(data.description);
 const hashtags = data.hashtags?.join(',') || 'Twealth,FinancialGoals,AI';
 
 return {
  twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=${hashtags}${data.via ? `&via=${data.via}` : ''}`,
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
  linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
  whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
  email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%20${encodedUrl}`,
  copy: shareUrl
 };
};

/**
 * Generate achievement-specific share content
 */
export const getAchievementShareContent = (achievement: AchievementShareData): ShareData => {
 const { achievementType, value, goalTitle, category, progress } = achievement;
 
 // Get appropriate category labels based on tier
 const categoryLabel = {
  bronze: 'Bronze',
  silver: 'Silver', 
  gold: 'Gold',
  platinum: 'Platinum'
 }[category || 'bronze'];

 // Generate content based on achievement type
 switch (achievementType) {
  case 'milestone':
   return {
    title: `${categoryLabel} Achievement unlocked! ${progress}% progress towards "${goalTitle}"`,
    description: `I'm making great progress on my financial goals with Twealth's AI assistant! ${progress}% closer to achieving "${goalTitle}". Join me on this journey to financial success!`,
    hashtags: ['FinancialGoals', 'Achievement', 'Savings', 'TwealthAI', 'MoneyGoals'],
    via: 'TwealthApp'
   };

  case 'goal_completed':
   return {
    title: `Goal achieved! I just completed "${goalTitle}" with Twealth!`,
    description: `Another financial goal conquered! Just saved ${value} for "${goalTitle}" using Twealth's AI-powered financial planning. Ready to tackle the next one!`,
    hashtags: ['GoalAchieved', 'FinancialSuccess', 'Savings', 'TwealthAI', 'MoneyWins'],
    via: 'TwealthApp'
   };

  case 'streak':
   return {
    title: `${value}-day savings streak! Consistency is key!`,
    description: `I've been consistently saving towards my goals for ${value} days straight using Twealth! The AI insights make it so much easier to stay on track.`,
    hashtags: ['SavingsStreak', 'Consistency', 'FinancialHabits', 'TwealthAI', 'MoneyMotivation'],
    via: 'TwealthApp'
   };

  case 'ai_insight':
   return {
    title: `AI-powered insight: "${achievement.title}"`,
    description: `Twealth's AI just gave me this brilliant financial insight: "${achievement.description}" These personalized tips are game-changers for my money management!`,
    hashtags: ['AIInsights', 'SmartMoney', 'FinancialTips', 'TwealthAI', 'MoneyHacks'],
    via: 'TwealthApp'
   };

  default:
   return {
    title: `Making progress with Twealth!`,
    description: `I'm using Twealth's AI-powered financial planning to achieve my goals! The insights and tracking make saving so much easier.`,
    hashtags: ['FinancialGoals', 'TwealthAI', 'MoneyManagement'],
    via: 'TwealthApp'
   };
 }
};

/**
 * Generate goal progress share content
 */
export const getGoalProgressShareContent = (goal: {
 title: string;
 currentAmount: number;
 targetAmount: number;
 progress: number;
 daysRemaining?: number;
}): ShareData => {
 const { title, currentAmount, targetAmount, progress, daysRemaining } = goal;
 const progressLabel = progress >= 75 ? 'Nearly there' : progress >= 50 ? 'Halfway' : progress >= 25 ? 'Making progress' : 'Just started';
 
 return {
  title: `${progressLabel}: ${Math.round(progress)}% towards my "${title}" goal!`,
  description: `Making solid progress! I've saved $${currentAmount.toLocaleString()} out of $${targetAmount.toLocaleString()} for "${title}" using Twealth's AI assistant.${daysRemaining ? ` ${daysRemaining} days to go!` : ''}`,
  hashtags: ['ProgressUpdate', 'FinancialGoals', 'Savings', 'TwealthAI', 'MoneyProgress'],
  via: 'TwealthApp'
 };
};

/**
 * Generate referral share content
 */
export const getReferralShareContent = (referralCode: string, bonusAmount: number = 10): ShareData => {
 const referralUrl = `${window.location.origin}?ref=${referralCode}`;
 
 return {
  title: `Get ${bonusAmount} FREE AI chats with Twealth!`,
  description: `I'm loving Twealth for managing my finances with AI! Use my code "${referralCode}" to get ${bonusAmount} free AI financial consultations and start your journey to financial success!`,
  url: referralUrl,
  hashtags: ['FreeAI', 'FinancialPlanning', 'TwealthAI', 'MoneyManagement', 'FreeCredits'],
  via: 'TwealthApp'
 };
};

/**
 * Generate group achievement share content
 */
export const getGroupAchievementShareContent = (group: {
 name: string;
 achievement: string;
 memberCount: number;
 totalSaved?: number;
}): ShareData => {
 const { name, achievement, memberCount, totalSaved } = group;
 
 return {
  title: `Group Achievement: "${achievement}" with ${name}!`,
  description: `Our group "${name}" just achieved "${achievement}"! ${memberCount} members collaborating towards our financial goals${totalSaved ? `, saving a total of $${totalSaved.toLocaleString()}` : ''}. Teamwork makes the dream work!`,
  hashtags: ['GroupGoals', 'TeamWork', 'FinancialSuccess', 'TwealthAI', 'CollaborativeSaving'],
  via: 'TwealthApp'
 };
};

/**
 * Open share dialog for different platforms
 */
export const shareToSocialMedia = (platform: string, data: ShareData) => {
 const urls = getSocialShareUrls(data);
 
 switch (platform) {
  case 'copy':
   navigator.clipboard.writeText(urls.copy);
   return { success: true, message: 'Link copied to clipboard!' };
   
  case 'email':
   window.location.href = urls.email;
   return { success: true, message: 'Email client opened' };
   
  default:
   const url = urls[platform as keyof typeof urls];
   if (url && typeof url === 'string') {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
    return { success: true, message: `Shared to ${platform}` };
   }
   return { success: false, message: 'Platform not supported' };
 }
};

/**
 * Check if native sharing is available
 */
export const isNativeShareAvailable = (): boolean => {
 return typeof navigator !== 'undefined' && 'share' in navigator;
};

/**
 * Use native share if available, fallback to custom sharing
 */
export const shareContent = async (data: ShareData) => {
 if (isNativeShareAvailable()) {
  try {
   await navigator.share({
    title: data.title,
    text: data.description,
    url: data.url || window.location.href
   });
   return { success: true, message: 'Shared successfully!' };
  } catch (error) {
   // User cancelled or error occurred, fallback to custom sharing
  }
 }
 
 // Fallback to copy to clipboard
 const shareText = `${data.title}\n\n${data.description}\n\n${data.url || window.location.href}`;
 await navigator.clipboard.writeText(shareText);
 return { success: true, message: 'Content copied to clipboard!' };
};
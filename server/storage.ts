import {
  type User,
  type InsertUser,
  type UpsertUser,
  type Group,
  type InsertGroup,
  type GroupMember,
  type InsertGroupMember,
  type Event,
  type InsertEvent,
  type FinancialGoal,
  type InsertFinancialGoal,
  type Transaction,
  type InsertTransaction,
  type Budget,
  type InsertBudget,
  type GoalContribution,
  type InsertGoalContribution,
  type GoalMilestone,
  type InsertGoalMilestone,
  type UserStreak,
  type InsertUserStreak,
  type UserAchievement,
  type InsertUserAchievement,
  type GroupInvite,
  type InsertGroupInvite,
  type CalendarShare,
  type InsertCalendarShare,
  type FriendRequest,
  type InsertFriendRequest,
  type Friendship,
  type InsertFriendship,
  type SharedGoal,
  type InsertSharedGoal,
  type SharedBudget,
  type InsertSharedBudget,
  type SharedBudgetMember,
  type InsertSharedBudgetMember,
  type SharedBudgetExpense,
  type InsertSharedBudgetExpense,
  type FriendGroupInvitation,
  type InsertFriendGroupInvitation,
  type EventExpense,
  type InsertEventExpense,
  type EventExpenseShare,
  type InsertEventExpenseShare,
  type UserSettings,
  type InsertUserSettings,
  type UserPreferences,
  type InsertUserPreferences,
  type FinancialPreferences,
  type InsertFinancialPreferences,
  type PrivacySettings,
  type InsertPrivacySettings,
  type EventTimeLog,
  type InsertEventTimeLog,
  type Notification,
  type InsertNotification,
  type ChatConversation,
  type InsertChatConversation,
  type ChatMessage,
  type InsertChatMessage,
  type MessageFeedback,
  type InsertMessageFeedback,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Subscription,
  type InsertSubscription,
  type UsageTracking,
  type InsertUsageTracking,
  type SubscriptionAddOn,
  type InsertSubscriptionAddOn,
  type ReferralCode,
  type InsertReferralCode,
  type Referral,
  type InsertReferral,
  type BonusCredit,
  type InsertBonusCredit,
  type CryptoHolding,
  type InsertCryptoHolding,
  type CryptoPriceAlert,
  type InsertCryptoPriceAlert,
  type CryptoTransaction,
  type InsertCryptoTransaction,
  type InvestmentStrategy,
  type InsertInvestmentStrategy,
  type PassiveIncomeOpportunity,
  type InsertPassiveIncomeOpportunity,
  type UserFinancialProfile,
  type InsertUserFinancialProfile,
  type UserExpenseCategory,
  type InsertUserExpenseCategory,
  type UserDebt,
  type InsertUserDebt,
  type UserAsset,
  type InsertUserAsset,
  type AiUsageLog,
  type InsertAiUsageLog,
  type Playbook,
  type InsertPlaybook,
  // World-class scoring system types
  type MonthlyFinancials,
  type InsertMonthlyFinancials,
  type ScoreSnapshot,
  type InsertScoreSnapshot,
  users,
  groups,
  groupMembers,
  events,
  financialGoals,
  transactions,
  budgets,
  goalContributions,
  goalMilestones,
  userStreaks,
  userAchievements,
  groupInvites,
  calendarShares,
  friendRequests,
  friendships,
  sharedGoals,
  sharedBudgets,
  sharedBudgetMembers,
  sharedBudgetExpenses,
  friendGroupInvitations,
  eventExpenses,
  eventExpenseShares,
  userSettings,
  userPreferences,
  financialPreferences,
  privacySettings,
  eventTimeLogs,
  notifications,
  chatConversations,
  chatMessages,
  messageFeedback,
  subscriptionPlans,
  subscriptions,
  usageTracking,
  subscriptionAddOns,
  referralCodes,
  referrals,
  bonusCredits,
  cryptoHoldings,
  cryptoPriceAlerts,
  cryptoTransactions,
  investmentStrategies,
  passiveIncomeOpportunities,
  userFinancialProfiles,
  userExpenseCategories,
  userDebts,
  userAssets,
  aiUsageLogs,
  playbooks,
  webhookEvents,
  // World-class scoring tables
  monthlyFinancials,
  scoreSnapshots
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql, or, exists } from "drizzle-orm";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";

// Safe user type without password
export type SafeUser = Omit<User, 'password'>;

// Event with group information for calendar display
export type EventWithGroup = Event & {
  group?: {
    id: string;
    name: string;
    color: string;
  } | null;
};

// Event with populated attendee user details
export type EventWithAttendees = Event & {
  attendeesWithUsers?: Array<{
    userId: string;
    status: 'yes' | 'no' | 'maybe';
    user: SafeUser;
  }>;
};

export interface IStorage {
  // User methods (IMPORTANT - these are mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<SafeUser>;
  updateUser(id: string, updates: Partial<User>): Promise<SafeUser>;

  // Group methods
  getGroup(id: string): Promise<Group | undefined>;
  getGroupsByUserId(userId: string): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, updates: Partial<Group>): Promise<Group>;
  deleteGroup(id: string): Promise<void>;

  // Group member methods
  getGroupMembers(groupId: string): Promise<GroupMember[]>;
  getGroupMembersWithUserInfo(groupId: string): Promise<Array<GroupMember & { user: SafeUser }>>;
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  removeGroupMember(groupId: string, userId: string): Promise<void>;
  updateGroupMemberRole(groupId: string, userId: string, role: string): Promise<GroupMember>;

  // Event methods
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByUserId(userId: string): Promise<Event[]>;
  getEventsByGroupId(groupId: string): Promise<Event[]>;
  getUserAccessibleEventsWithGroups(userId: string, limit?: number, offset?: number): Promise<EventWithGroup[]>;
  getUpcomingEvents(userId: string, limit?: number): Promise<Event[]>;
  getUpcomingEventsWithAttendees(userId: string, limit?: number): Promise<EventWithAttendees[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, updates: Partial<Event>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;

  // Financial goal methods
  getFinancialGoal(id: string): Promise<FinancialGoal | undefined>;
  getFinancialGoalsByUserId(userId: string): Promise<FinancialGoal[]>;
  createFinancialGoal(goal: InsertFinancialGoal): Promise<FinancialGoal>;
  updateFinancialGoal(id: string, updates: Partial<FinancialGoal>): Promise<FinancialGoal>;
  deleteFinancialGoal(id: string): Promise<void>;

  // Transaction methods
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByUserId(userId: string, limit?: number): Promise<Transaction[]>;
  getTransactionsByGoalId(goalId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  bulkCreateTransactions(transactions: InsertTransaction[]): Promise<Transaction[]>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  getFinancialSummary(userId: string, months?: number): Promise<{
    totalIncome: number;
    totalExpenses: number;
    averageMonthlyIncome: number;
    averageMonthlyExpenses: number;
    netCashFlow: number;
    transactionCount: number;
    categoryBreakdown: Record<string, number>;
  }>;

  // Budget methods
  getBudget(id: string): Promise<Budget | undefined>;
  getBudgetsByUserId(userId: string): Promise<Budget[]>;
  getBudgetByUserAndCategory(userId: string, category: string): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, updates: Partial<Budget>): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;

  // Goal contribution methods
  getGoalContributions(goalId: string): Promise<GoalContribution[]>;
  createGoalContribution(contribution: InsertGoalContribution): Promise<GoalContribution>;

  // Goal milestone methods
  getGoalMilestones(goalId: string): Promise<GoalMilestone[]>;
  getUnseenMilestones(userId: string): Promise<(GoalMilestone & { goal: FinancialGoal })[]>;
  createGoalMilestone(milestone: InsertGoalMilestone): Promise<GoalMilestone>;
  markMilestonesSeen(userId: string): Promise<void>;
  checkAndCreateMilestones(userId: string, goalId: string, currentAmount: number, targetAmount: number): Promise<GoalMilestone[]>;

  // Streak methods
  getUserStreak(userId: string): Promise<UserStreak | null>;
  checkInStreak(userId: string): Promise<{ streakIncreased: boolean; newStreak: number; newAchievements: string[] }>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;

  // Dashboard methods
  getUserStats(userId: string): Promise<{
    totalSavings: number;
    activeGoals: number;
    monthlyIncome: number;
    upcomingEvents: number;
  }>;

  // Group invite methods
  createGroupInvite(invite: InsertGroupInvite): Promise<{ invite: GroupInvite; inviteUrl: string }>;
  getGroupInviteByToken(token: string): Promise<GroupInvite | undefined>;
  acceptGroupInvite(token: string, userId: string): Promise<GroupMember>;
  revokeGroupInvite(token: string): Promise<void>;

  // Calendar share methods  
  createCalendarShare(share: InsertCalendarShare): Promise<{ share: CalendarShare; shareUrl: string }>;
  getCalendarShareByToken(token: string): Promise<CalendarShare | undefined>;
  getEventsForShare(token: string): Promise<Event[]>;

  // Friend request methods
  createFriendRequest(request: InsertFriendRequest): Promise<FriendRequest>;
  getFriendRequest(id: string): Promise<FriendRequest | undefined>;
  getFriendRequestsByUserId(userId: string): Promise<Array<FriendRequest & { fromUser: SafeUser; toUser: SafeUser }>>;
  getPendingFriendRequests(userId: string): Promise<Array<FriendRequest & { fromUser: SafeUser }>>;
  getSentFriendRequests(userId: string): Promise<Array<FriendRequest & { toUser: SafeUser }>>;
  updateFriendRequestStatus(id: string, status: 'accepted' | 'declined'): Promise<FriendRequest>;
  deleteFriendRequest(id: string): Promise<void>;

  // Friendship methods
  createFriendship(friendship: InsertFriendship): Promise<Friendship>;
  getFriendsByUserId(userId: string): Promise<Array<SafeUser>>;
  areFriends(userId: string, friendId: string): Promise<boolean>;
  removeFriendship(userId: string, friendId: string): Promise<void>;
  searchUsers(query: string, excludeUserId: string): Promise<SafeUser[]>;

  // Shared Goals methods
  shareGoal(share: InsertSharedGoal): Promise<SharedGoal>;
  getSharedGoals(userId: string): Promise<Array<SharedGoal & { goal: FinancialGoal; owner: SafeUser }>>;
  getGoalShares(goalId: string): Promise<Array<SharedGoal & { sharedWith: SafeUser | null }>>;
  removeGoalShare(goalId: string, sharedWithUserId: string): Promise<void>;
  updateGoalSharePermission(goalId: string, sharedWithUserId: string, permission: 'view' | 'contribute'): Promise<SharedGoal>;
  shareGoalWithGroup(goalId: string, ownerId: string, groupId: string, permission: 'view' | 'contribute'): Promise<{ groupShare: SharedGoal; memberShares: SharedGoal[]; memberCount: number }>;

  // Shared Budgets methods
  createSharedBudget(budget: InsertSharedBudget): Promise<SharedBudget>;
  getSharedBudget(id: string): Promise<SharedBudget | undefined>;
  getSharedBudgetsByUserId(userId: string): Promise<Array<SharedBudget & { members: Array<SafeUser> }>>;
  updateSharedBudget(id: string, updates: Partial<SharedBudget>): Promise<SharedBudget>;
  deleteSharedBudget(id: string): Promise<void>;

  addSharedBudgetMember(member: InsertSharedBudgetMember): Promise<SharedBudgetMember>;
  getSharedBudgetMembers(budgetId: string): Promise<Array<SharedBudgetMember & { user: SafeUser }>>;
  removeSharedBudgetMember(budgetId: string, userId: string): Promise<void>;

  createSharedBudgetExpense(expense: InsertSharedBudgetExpense): Promise<SharedBudgetExpense>;
  getSharedBudgetExpenses(budgetId: string): Promise<Array<SharedBudgetExpense & { user: SafeUser }>>;
  updateSharedBudgetExpense(id: string, updates: Partial<SharedBudgetExpense>): Promise<SharedBudgetExpense>;
  deleteSharedBudgetExpense(id: string): Promise<void>;

  // Friend Group Invitations methods
  createFriendGroupInvitation(invitation: InsertFriendGroupInvitation): Promise<FriendGroupInvitation>;
  getFriendGroupInvitations(userId: string): Promise<Array<FriendGroupInvitation & { group: Group; invitedBy: SafeUser }>>;
  updateFriendGroupInvitationStatus(id: string, status: 'accepted' | 'declined'): Promise<FriendGroupInvitation>;
  deleteFriendGroupInvitation(id: string): Promise<void>;
  bulkInviteFriendsToGroup(groupId: string, invitedBy: string, friendIds: string[], role?: string): Promise<FriendGroupInvitation[]>;

  // RSVP methods
  updateEventRSVP(eventId: string, userId: string, status: 'yes' | 'no' | 'maybe'): Promise<Event>;

  // Event expense methods
  getEventExpense(id: string): Promise<EventExpense | undefined>;
  getEventExpensesByEventId(eventId: string): Promise<EventExpense[]>;
  createEventExpense(expense: InsertEventExpense): Promise<EventExpense>;
  updateEventExpense(id: string, updates: Partial<EventExpense>): Promise<EventExpense>;
  deleteEventExpense(id: string): Promise<void>;

  // Event expense share methods
  getEventExpenseShare(id: string): Promise<EventExpenseShare | undefined>;
  getEventExpenseSharesByExpenseId(expenseId: string): Promise<EventExpenseShare[]>;
  createEventExpenseShare(share: InsertEventExpenseShare): Promise<EventExpenseShare>;
  updateEventExpenseShare(id: string, updates: Partial<EventExpenseShare>): Promise<EventExpenseShare>;
  deleteEventExpenseShare(id: string): Promise<void>;

  // Event financial summary methods
  getEventFinancialSummary(eventId: string): Promise<{
    budget: number | null;
    totalExpenses: number;
    expensesByCategory: Record<string, number>;
    unpaidShares: number;
    expenseShares: Array<{
      userId: string;
      totalOwed: number;
      totalPaid: number;
    }>;
  }>;

  // Utility methods for user management
  getFirstUser(): Promise<SafeUser | undefined>;

  // User settings methods
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings>;

  // Time tracking methods
  createTimeLog(timeLog: InsertEventTimeLog): Promise<EventTimeLog>;
  getEventTimeLogs(eventId: string): Promise<EventTimeLog[]>;
  getUserTimeLogs(userId: string, startDate?: Date, endDate?: Date): Promise<EventTimeLog[]>;
  updateTimeLog(id: string, updates: Partial<EventTimeLog>): Promise<EventTimeLog>;
  deleteTimeLog(id: string): Promise<void>;

  // Time-value insights methods
  getTimeValueInsights(userId: string, range: '7d' | '30d' | '90d'): Promise<{
    totalTimeHours: number;
    timeValue: number;
    totalCost: number;
    netImpact: number;
    topCategories: Array<{ category: string; timeHours: number; value: number }>;
    upcomingHighImpact: Array<{ eventId: string; title: string; estimatedValue: number }>;
  }>;
  calculateEventTimeValue(eventId: string, userId: string): Promise<{
    plannedTimeValue: number;
    actualTimeValue: number;
    totalImpact: number;
  }>;

  // Notification methods
  getNotification(id: string): Promise<Notification | undefined>;
  getNotificationsByUserId(userId: string, limit?: number, offset?: number, includeRead?: boolean): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  archiveNotification(id: string): Promise<Notification>;

  // Smart notification generation
  generateSmartNotifications(userId: string): Promise<Notification[]>;
  checkGoalDeadlines(userId: string): Promise<Notification[]>;
  checkTransactionReminders(userId: string): Promise<Notification[]>;
  checkBudgetWarnings(userId: string): Promise<Notification[]>;
  checkGoalCompletions(userId: string): Promise<Notification[]>;

  // User preferences methods
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences>;

  // Financial preferences methods
  getFinancialPreferences(userId: string): Promise<FinancialPreferences | undefined>;
  createFinancialPreferences(preferences: InsertFinancialPreferences): Promise<FinancialPreferences>;
  updateFinancialPreferences(userId: string, updates: Partial<FinancialPreferences>): Promise<FinancialPreferences>;

  // Privacy settings methods
  getPrivacySettings(userId: string): Promise<PrivacySettings | undefined>;
  createPrivacySettings(settings: InsertPrivacySettings): Promise<PrivacySettings>;
  updatePrivacySettings(userId: string, updates: Partial<PrivacySettings>): Promise<PrivacySettings>;

  // Data export methods
  exportUserData(userId: string, format: 'json' | 'csv'): Promise<string>;
  deleteUserData(userId: string): Promise<void>;

  // Chat methods
  getChatConversations(userId: string): Promise<ChatConversation[]>;
  getChatConversation(conversationId: string): Promise<ChatConversation | undefined>;
  getChatConversationWithMessages(conversationId: string): Promise<(ChatConversation & { messages: ChatMessage[] }) | undefined>;
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  updateChatConversation(id: string, updates: Partial<ChatConversation>): Promise<ChatConversation>;
  deleteChatConversation(id: string): Promise<void>;

  getChatMessages(conversationId: string, limit?: number, offset?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesByUserId(userId: string, limit?: number): Promise<ChatMessage[]>;

  // Message Feedback methods
  getMessageFeedback(messageId: string, userId: string): Promise<MessageFeedback | undefined>;
  createMessageFeedback(feedback: InsertMessageFeedback): Promise<MessageFeedback>;
  updateMessageFeedback(messageId: string, userId: string, updates: Partial<MessageFeedback>): Promise<MessageFeedback>;
  getMessageFeedbackStats(userId: string): Promise<{ helpful: number; notHelpful: number; total: number }>;

  // Subscription Plan methods
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>;

  // Subscription methods
  getUserSubscription(userId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription>;
  cancelSubscription(id: string): Promise<Subscription>;

  // Usage Tracking methods
  getUserUsage(userId: string): Promise<UsageTracking | undefined>;
  createUsageRecord(usage: InsertUsageTracking): Promise<UsageTracking>;
  updateUsageRecord(id: string, updates: Partial<UsageTracking>): Promise<UsageTracking>;
  incrementUsage(userId: string, type: 'aiChatsUsed' | 'aiDeepAnalysisUsed' | 'aiInsightsGenerated', amount?: number): Promise<UsageTracking>;

  // Add-on methods
  getUserAddOns(userId: string): Promise<SubscriptionAddOn[]>;
  createAddOn(addOn: InsertSubscriptionAddOn): Promise<SubscriptionAddOn>;

  // Subscription helpers
  initializeDefaultSubscription(userId: string): Promise<Subscription>;
  checkUsageLimit(userId: string, type: 'aiChatsUsed' | 'aiDeepAnalysisUsed'): Promise<{ allowed: boolean; usage: number; limit: number }>;
  resetUsage(userId: string): Promise<void>;

  // Webhook idempotency
  isWebhookEventProcessed(eventId: string): Promise<boolean>;
  markWebhookEventProcessed(eventId: string, eventType: string): Promise<void>;
  cleanupOldWebhookEvents(maxAgeHours: number): Promise<number>;

  // Tier-aware AI methods
  getUserSubscriptionWithUsage(userId: string): Promise<{ subscription: Subscription; usage: UsageTracking | null; plan: SubscriptionPlan } | null>;
  incrementUsageCounters(userId: string, subscriptionId: string, modelType: 'scout' | 'sonnet' | 'gpt5' | 'opus'): Promise<void>;
  insertAIUsageLog(log: Omit<InsertAiUsageLog, 'id' | 'createdAt'>): Promise<void>;

  // Referral methods
  getUserReferralCode(userId: string): Promise<ReferralCode | undefined>;
  createReferralCode(referralCode: InsertReferralCode): Promise<ReferralCode>;
  getReferralByCode(code: string): Promise<ReferralCode | undefined>;
  processReferral(referredUserId: string, referralCode: string): Promise<Referral>;
  getUserReferrals(userId: string): Promise<Referral[]>;
  getUserBonusCredits(userId: string): Promise<BonusCredit[]>;
  addBonusCredits(bonusCredit: InsertBonusCredit): Promise<BonusCredit>;
  getAvailableBonusCredits(userId: string): Promise<number>;
  useBonusCredits(userId: string, amount: number): Promise<void>;

  // Crypto methods
  getCryptoHolding(id: string): Promise<CryptoHolding | undefined>;
  getUserCryptoHoldings(userId: string): Promise<CryptoHolding[]>;
  createCryptoHolding(holding: InsertCryptoHolding): Promise<CryptoHolding>;
  updateCryptoHolding(id: string, updates: Partial<CryptoHolding>): Promise<CryptoHolding>;
  deleteCryptoHolding(id: string): Promise<void>;

  getCryptoPriceAlert(id: string): Promise<CryptoPriceAlert | undefined>;
  getUserCryptoPriceAlerts(userId: string): Promise<CryptoPriceAlert[]>;
  createCryptoPriceAlert(alert: InsertCryptoPriceAlert): Promise<CryptoPriceAlert>;
  updateCryptoPriceAlert(id: string, updates: Partial<CryptoPriceAlert>): Promise<CryptoPriceAlert>;
  deleteCryptoPriceAlert(id: string): Promise<void>;

  getCryptoTransaction(id: string): Promise<CryptoTransaction | undefined>;
  getUserCryptoTransactions(userId: string, limit?: number): Promise<CryptoTransaction[]>;
  createCryptoTransaction(transaction: InsertCryptoTransaction): Promise<CryptoTransaction>;

  getUserCryptoPortfolioValue(userId: string): Promise<{
    totalValue: number;
    holdings: Array<{
      symbol: string;
      name: string;
      amount: string;
      currentPrice: string;
      value: number;
      change24h: number;
    }>;
  }>;

  // Financial Profile methods
  getUserFinancialProfile(userId: string): Promise<UserFinancialProfile | undefined>;
  createUserFinancialProfile(profile: InsertUserFinancialProfile): Promise<UserFinancialProfile>;
  updateUserFinancialProfile(userId: string, updates: Partial<UserFinancialProfile>): Promise<UserFinancialProfile>;

  // Expense Categories methods
  getUserExpenseCategories(userId: string): Promise<UserExpenseCategory[]>;
  updateUserExpenseCategories(userId: string, categories: InsertUserExpenseCategory[]): Promise<UserExpenseCategory[]>;

  // Debts methods
  getUserDebts(userId: string): Promise<UserDebt[]>;
  createUserDebt(debt: InsertUserDebt): Promise<UserDebt>;
  updateUserDebt(id: string, updates: Partial<UserDebt>): Promise<UserDebt>;
  deleteUserDebt(id: string): Promise<void>;

  // Assets methods
  getUserAssets(userId: string): Promise<UserAsset[]>;
  createUserAsset(asset: InsertUserAsset): Promise<UserAsset>;
  updateUserAsset(id: string, updates: Partial<UserAsset>): Promise<UserAsset>;
  deleteUserAsset(id: string): Promise<void>;

  // Playbook methods
  getPlaybook(id: string): Promise<Playbook | undefined>;
  getPlaybooksByUserId(userId: string, limit?: number): Promise<Playbook[]>;
  createPlaybook(playbook: InsertPlaybook): Promise<Playbook>;
  updatePlaybook(id: string, updates: Partial<Playbook>): Promise<Playbook>;
  deletePlaybook(id: string): Promise<void>;
  markPlaybookViewed(id: string): Promise<void>;

  // ═══════════════════════════════════════════════════════════════════════
  // WORLD-CLASS SCORING SYSTEM
  // ═══════════════════════════════════════════════════════════════════════

  // Monthly Financials methods (aggregated per-month data)
  getMonthlyFinancials(userId: string, fromMonth: Date, toMonth: Date): Promise<MonthlyFinancials[]>;
  upsertMonthlyFinancials(data: InsertMonthlyFinancials): Promise<MonthlyFinancials>;

  // Score Snapshots methods (4-pillar scoring history)
  getLatestScoreSnapshot(userId: string): Promise<ScoreSnapshot | undefined>;
  getScoreSnapshots(userId: string, limit?: number): Promise<ScoreSnapshot[]>;
  upsertScoreSnapshot(data: InsertScoreSnapshot): Promise<ScoreSnapshot>;
}

export class DatabaseStorage implements IStorage {
  // User methods (IMPORTANT - these are mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // First try to find existing user by ID
      const existingById = await db
        .select()
        .from(users)
        .where(sql`${users.id} = ${userData.id}`)
        .limit(1);

      // If found by ID, update that user
      if (existingById.length > 0) {
        const [user] = await db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date(),
          })
          .where(sql`${users.id} = ${userData.id}`)
          .returning();
        return user;
      }

      // If not found by ID, try by email
      if (userData.email) {
        const existingByEmail = await db
          .select()
          .from(users)
          .where(sql`${users.email} = ${userData.email}`)
          .limit(1);

        if (existingByEmail.length > 0) {
          // Update existing user found by email - DO NOT change ID to avoid FK violations
          const { id, ...updateData } = userData;
          const [user] = await db
            .update(users)
            .set({
              ...updateData,
              updatedAt: new Date(),
            })
            .where(sql`${users.id} = ${existingByEmail[0].id}`)
            .returning();
          return user;
        }
      }

      // No existing user found - insert new
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    } catch (error) {
      console.error('[Storage] ERROR in upsertUser:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // This method is kept for compatibility but not used in Replit Auth
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<SafeUser> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        firstName: insertUser.firstName || null,
        lastName: insertUser.lastName || null,
        profileImageUrl: insertUser.profileImageUrl || null,
      })
      .returning();

    // Return user (no password field to exclude)
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<SafeUser> {
    const updateData = { ...updates, updatedAt: new Date() };

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    // Return user (no password field to exclude)
    return user;
  }

  // Group methods
  async getGroup(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group || undefined;
  }

  async getGroupsByUserId(userId: string): Promise<any[]> {
    const userGroups = await db
      .select({
        group: groups,
        memberCount: sql<number>`count(distinct ${groupMembers.userId})::int`
      })
      .from(groups)
      .leftJoin(groupMembers, eq(groups.id, groupMembers.groupId))
      .where(eq(groupMembers.userId, userId))
      .groupBy(groups.id);

    return userGroups.map(ug => ({ ...ug.group, memberCount: ug.memberCount }));
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const [group] = await db
      .insert(groups)
      .values({
        ...insertGroup,
        description: insertGroup.description || null,
        color: insertGroup.color || "#3B82F6",
        status: insertGroup.status || "active",
      })
      .returning();

    // Auto-add owner as admin member
    await this.addGroupMember({
      groupId: group.id,
      userId: group.ownerId,
      role: "admin",
    });

    return group;
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<Group> {
    const [group] = await db
      .update(groups)
      .set(updates)
      .where(eq(groups.id, id))
      .returning();
    return group;
  }

  async deleteGroup(id: string): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }

  // Group member methods
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
  }

  async getGroupMembersWithUserInfo(groupId: string): Promise<Array<GroupMember & { user: SafeUser }>> {
    const membersWithUsers = await db
      .select({
        member: groupMembers,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId));

    return membersWithUsers.map(({ member, user }) => ({
      ...member,
      user
    }));
  }

  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const [member] = await db
      .insert(groupMembers)
      .values({
        ...insertMember,
        role: insertMember.role || "member",
      })
      .returning();
    return member;
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  }

  async updateGroupMemberRole(groupId: string, userId: string, role: string): Promise<GroupMember> {
    const [member] = await db
      .update(groupMembers)
      .set({ role })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .returning();
    return member;
  }

  // Event methods
  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEventsByUserId(userId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.createdBy, userId));
  }

  async getEventsByGroupId(groupId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.groupId, groupId));
  }

  async getUserAccessibleEventsWithGroups(userId: string, limit = 100, offset = 0): Promise<EventWithGroup[]> {
    // Get personal events (events created by the user with no group)
    const personalEvents = await db
      .select({
        event: events,
        groupName: sql<string | null>`NULL`,
        groupColor: sql<string | null>`NULL`,
      })
      .from(events)
      .where(and(eq(events.createdBy, userId), sql`group_id IS NULL`))
      .orderBy(desc(events.startTime))
      .limit(limit)
      .offset(offset);

    // Get group events (events from groups the user belongs to)
    const groupEvents = await db
      .select({
        event: events,
        groupName: groups.name,
        groupColor: groups.color,
      })
      .from(events)
      .innerJoin(groups, eq(events.groupId, groups.id))
      .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
      .where(eq(groupMembers.userId, userId))
      .orderBy(desc(events.startTime))
      .limit(limit)
      .offset(offset);

    // Combine and format the results
    const combinedEvents: EventWithGroup[] = [
      ...personalEvents.map(({ event }) => ({
        ...event,
        group: null,
      })),
      ...groupEvents.map(({ event, groupName, groupColor }) => ({
        ...event,
        group: groupName && groupColor ? {
          id: event.groupId!,
          name: groupName,
          color: groupColor,
        } : null,
      }))
    ];

    return combinedEvents;
  }


  async getUpcomingEvents(userId: string, limit: number = 10): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(and(eq(events.createdBy, userId), gte(events.startTime, new Date())))
      .orderBy(events.startTime)
      .limit(limit);
  }

  async getUpcomingEventsWithAttendees(userId: string, limit: number = 10): Promise<EventWithAttendees[]> {
    const upcomingEvents = await this.getUpcomingEvents(userId, limit);

    // Populate attendee user details for each event
    const eventsWithAttendees: EventWithAttendees[] = await Promise.all(
      upcomingEvents.map(async (event) => {
        const attendees = Array.isArray(event.attendees) ? event.attendees : [];

        // Fetch user details for each attendee
        const attendeesWithUsers = await Promise.all(
          attendees.map(async (attendee: any) => {
            const user = await this.getUser(attendee.userId);
            return {
              userId: attendee.userId,
              status: attendee.status as 'yes' | 'no' | 'maybe',
              user: user ? {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImageUrl: user.profileImageUrl,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              } as SafeUser : {
                id: attendee.userId,
                email: '',
                firstName: null,
                lastName: null,
                profileImageUrl: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              } as SafeUser,
            };
          })
        );

        return {
          ...event,
          attendeesWithUsers,
        };
      })
    );

    return eventsWithAttendees;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values({
        ...insertEvent,
        description: insertEvent.description || null,
        location: insertEvent.location || null,
        groupId: insertEvent.groupId || null,
        status: insertEvent.status || "scheduled",
        attendees: insertEvent.attendees || [],
      })
      .returning();
    return event;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const [event] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Financial goal methods
  async getFinancialGoal(id: string): Promise<FinancialGoal | undefined> {
    const [goal] = await db.select().from(financialGoals).where(eq(financialGoals.id, id));
    return goal || undefined;
  }

  async getFinancialGoalsByUserId(userId: string): Promise<FinancialGoal[]> {
    return await db.select().from(financialGoals).where(eq(financialGoals.userId, userId));
  }

  async createFinancialGoal(insertGoal: InsertFinancialGoal): Promise<FinancialGoal> {
    const [goal] = await db
      .insert(financialGoals)
      .values({
        ...insertGoal,
        description: insertGoal.description || null,
        currentAmount: insertGoal.currentAmount || "0",
        category: insertGoal.category || null,
        priority: insertGoal.priority || "medium",
        status: insertGoal.status || "active",
      })
      .returning();
    return goal;
  }

  async updateFinancialGoal(id: string, updates: Partial<FinancialGoal>): Promise<FinancialGoal> {
    const [goal] = await db
      .update(financialGoals)
      .set(updates)
      .where(eq(financialGoals.id, id))
      .returning();
    return goal;
  }

  async deleteFinancialGoal(id: string): Promise<void> {
    await db.delete(financialGoals).where(eq(financialGoals.id, id));
  }

  // Transaction methods
  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async getTransactionsByUserId(userId: string, limit: number = 100): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(limit);
  }

  async getTransactionsByGoalId(goalId: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.goalId, goalId));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction as typeof transactions.$inferInsert)
      .returning();

    // If this transaction is for a goal, update the goal's current amount
    // Support both income and transfer transactions contributing to goals
    if (transaction.goalId && (transaction.type === "transfer" || transaction.type === "income")) {
      const goal = await this.getFinancialGoal(transaction.goalId);
      if (goal) {
        const newAmount = parseFloat(goal.currentAmount || "0") + parseFloat(transaction.amount.toString());
        await this.updateFinancialGoal(transaction.goalId, {
          currentAmount: newAmount.toString()
        });

        // Create goal contribution record
        await this.createGoalContribution({
          goalId: transaction.goalId,
          transactionId: transaction.id,
          amount: transaction.amount
        });
      }
    }

    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  async bulkCreateTransactions(insertTransactions: InsertTransaction[]): Promise<Transaction[]> {
    if (insertTransactions.length === 0) return [];

    const createdTransactions = await db
      .insert(transactions)
      .values(insertTransactions as (typeof transactions.$inferInsert)[])
      .returning();

    return createdTransactions;
  }

  async getFinancialSummary(userId: string, months: number = 6): Promise<{
    totalIncome: number;
    totalExpenses: number;
    averageMonthlyIncome: number;
    averageMonthlyExpenses: number;
    netCashFlow: number;
    transactionCount: number;
    categoryBreakdown: Record<string, number>;
  }> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const userTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate)
        )
      );

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryBreakdown: Record<string, number> = {};

    for (const tx of userTransactions) {
      const amount = parseFloat(tx.amount.toString());
      if (tx.type === 'income') {
        totalIncome += amount;
      } else if (tx.type === 'expense') {
        totalExpenses += Math.abs(amount);
      }

      const category = tx.category || 'Other';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Math.abs(amount);
    }

    return {
      totalIncome,
      totalExpenses,
      averageMonthlyIncome: totalIncome / months,
      averageMonthlyExpenses: totalExpenses / months,
      netCashFlow: totalIncome - totalExpenses,
      transactionCount: userTransactions.length,
      categoryBreakdown,
    };
  }

  // Budget methods
  async getBudget(id: string): Promise<Budget | undefined> {
    const result = await db.select().from(budgets).where(eq(budgets.id, id));
    return result[0];
  }

  async getBudgetsByUserId(userId: string): Promise<Budget[]> {
    return await db.select().from(budgets).where(eq(budgets.userId, userId));
  }

  async getBudgetByUserAndCategory(userId: string, category: string): Promise<Budget | undefined> {
    const result = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.category, category)));
    return result[0];
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const [budget] = await db
      .insert(budgets)
      .values(insertBudget as typeof budgets.$inferInsert)
      .returning();
    return budget;
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    const [budget] = await db
      .update(budgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(budgets.id, id))
      .returning();
    return budget;
  }

  async deleteBudget(id: string): Promise<void> {
    await db.delete(budgets).where(eq(budgets.id, id));
  }

  // Goal contribution methods
  async getGoalContributions(goalId: string): Promise<GoalContribution[]> {
    return await db.select().from(goalContributions).where(eq(goalContributions.goalId, goalId));
  }

  async createGoalContribution(insertContribution: InsertGoalContribution): Promise<GoalContribution> {
    const [contribution] = await db
      .insert(goalContributions)
      .values(insertContribution)
      .returning();
    return contribution;
  }

  // Goal milestone methods
  async getGoalMilestones(goalId: string): Promise<GoalMilestone[]> {
    return await db.select().from(goalMilestones).where(eq(goalMilestones.goalId, goalId)).orderBy(goalMilestones.milestone);
  }

  async getUnseenMilestones(userId: string): Promise<(GoalMilestone & { goal: FinancialGoal })[]> {
    const results = await db
      .select()
      .from(goalMilestones)
      .innerJoin(financialGoals, eq(goalMilestones.goalId, financialGoals.id))
      .where(and(eq(goalMilestones.userId, userId), eq(goalMilestones.isSeen, false)))
      .orderBy(desc(goalMilestones.celebratedAt));

    return results.map(r => ({
      ...r.goal_milestones,
      goal: r.financial_goals,
    }));
  }

  async createGoalMilestone(milestone: InsertGoalMilestone): Promise<GoalMilestone> {
    const [created] = await db
      .insert(goalMilestones)
      .values(milestone)
      .returning();
    return created;
  }

  async markMilestonesSeen(userId: string): Promise<void> {
    await db
      .update(goalMilestones)
      .set({ isSeen: true })
      .where(and(eq(goalMilestones.userId, userId), eq(goalMilestones.isSeen, false)));
  }

  async checkAndCreateMilestones(userId: string, goalId: string, currentAmount: number, targetAmount: number): Promise<GoalMilestone[]> {
    const milestoneThresholds = [25, 50, 75, 100];
    const currentPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    const createdMilestones: GoalMilestone[] = [];

    const existingMilestones = await this.getGoalMilestones(goalId);
    const existingMilestoneValues = new Set(existingMilestones.map(m => m.milestone));

    for (const threshold of milestoneThresholds) {
      if (currentPercentage >= threshold && !existingMilestoneValues.has(threshold)) {
        try {
          const milestone = await this.createGoalMilestone({
            goalId,
            userId,
            milestone: threshold,
            amountAtMilestone: currentAmount.toFixed(2),
          });
          createdMilestones.push(milestone);
        } catch (error: any) {
          // Ignore unique constraint violations (milestone already exists)
          if (!error.message?.includes('unique')) {
            console.error('Error creating milestone:', error);
          }
        }
      }
    }

    return createdMilestones;
  }

  // Streak methods
  async getUserStreak(userId: string): Promise<UserStreak | null> {
    const [streak] = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId));
    return streak ?? null;
  }

  private computeWeeklyProgress(existingProgress: boolean[] | null, lastCheckIn: Date | null): boolean[] {
    const now = new Date();
    const todayIndex = now.getDay();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    let weekProgress: boolean[] = [false, false, false, false, false, false, false];

    if (existingProgress && Array.isArray(existingProgress) && lastCheckIn) {
      const lastCheckInDate = new Date(lastCheckIn);
      lastCheckInDate.setHours(0, 0, 0, 0);

      if (lastCheckInDate >= startOfWeek) {
        weekProgress = [...existingProgress];
      }
    }

    weekProgress[todayIndex] = true;

    return weekProgress;
  }

  async checkInStreak(userId: string): Promise<{ streakIncreased: boolean; newStreak: number; newAchievements: string[] }> {
    const existingStreak = await this.getUserStreak(userId);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const newAchievements: string[] = [];

    if (!existingStreak) {
      const weeklyProgress = this.computeWeeklyProgress(null, null);
      await db.insert(userStreaks).values({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        totalCheckIns: 1,
        lastCheckIn: now,
        weeklyProgress,
      });

      await this.checkAndUnlockAchievements(userId, 1, 1, newAchievements);
      return { streakIncreased: true, newStreak: 1, newAchievements };
    }

    // Handle null lastCheckIn - treat as new streak
    if (!existingStreak.lastCheckIn) {
      const weeklyProgress = this.computeWeeklyProgress(null, null);
      await db
        .update(userStreaks)
        .set({
          currentStreak: 1,
          longestStreak: 1,
          totalCheckIns: 1,
          lastCheckIn: now,
          weeklyProgress,
          updatedAt: now,
        })
        .where(eq(userStreaks.userId, userId));

      await this.checkAndUnlockAchievements(userId, 1, 1, newAchievements);
      return { streakIncreased: true, newStreak: 1, newAchievements };
    }

    const lastCheckIn = new Date(existingStreak.lastCheckIn);
    const lastCheckInDate = new Date(lastCheckIn.getFullYear(), lastCheckIn.getMonth(), lastCheckIn.getDate());
    const diffDays = Math.floor((today.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Use nullish coalescing to handle nullable integer fields
    const currentStreakValue = existingStreak.currentStreak ?? 0;
    const longestStreakValue = existingStreak.longestStreak ?? 0;

    if (diffDays === 0) {
      return { streakIncreased: false, newStreak: currentStreakValue, newAchievements: [] };
    }

    const existingProgress = existingStreak.weeklyProgress as boolean[] | null;
    const weeklyProgress = this.computeWeeklyProgress(existingProgress, existingStreak.lastCheckIn);
    const newTotalCheckIns = (existingStreak.totalCheckIns ?? 0) + 1;

    if (diffDays === 1) {
      const newStreak = currentStreakValue + 1;
      const newLongest = Math.max(longestStreakValue, newStreak);
      await db
        .update(userStreaks)
        .set({
          currentStreak: newStreak,
          longestStreak: newLongest,
          totalCheckIns: newTotalCheckIns,
          lastCheckIn: now,
          weeklyProgress,
          updatedAt: now,
        })
        .where(eq(userStreaks.userId, userId));

      await this.checkAndUnlockAchievements(userId, newStreak, newTotalCheckIns, newAchievements);
      return { streakIncreased: true, newStreak, newAchievements };
    } else {
      await db
        .update(userStreaks)
        .set({
          currentStreak: 1,
          totalCheckIns: newTotalCheckIns,
          lastCheckIn: now,
          weeklyProgress,
          updatedAt: now,
        })
        .where(eq(userStreaks.userId, userId));

      await this.checkAndUnlockAchievements(userId, 1, newTotalCheckIns, newAchievements);
      return { streakIncreased: true, newStreak: 1, newAchievements };
    }
  }

  private async checkAndUnlockAchievements(userId: string, currentStreak: number, totalCheckIns: number, newAchievements: string[]): Promise<void> {
    const existingAchievements = await this.getUserAchievements(userId);
    const existingIds = new Set(existingAchievements.map(a => a.achievementId));

    const streakMilestones = [
      { id: 'streak_7', streak: 7, target: 7 },
      { id: 'streak_30', streak: 30, target: 30 },
    ];

    for (const milestone of streakMilestones) {
      if (currentStreak >= milestone.streak && !existingIds.has(milestone.id)) {
        try {
          await db.insert(userAchievements).values({
            userId,
            achievementId: milestone.id,
            progress: currentStreak,
            target: milestone.target,
            earnedAt: new Date(),
          });
          newAchievements.push(milestone.id);
        } catch (e) {
        }
      }
    }

    for (const milestone of streakMilestones) {
      if (!existingIds.has(milestone.id) && currentStreak < milestone.streak) {
        try {
          await db.insert(userAchievements).values({
            userId,
            achievementId: milestone.id,
            progress: currentStreak,
            target: milestone.target,
          }).onConflictDoUpdate({
            target: [userAchievements.userId, userAchievements.achievementId],
            set: { progress: currentStreak },
          });
        } catch (e) {
          // Silently handle conflicts - achievement already exists
        }
      }
    }
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.earnedAt));
  }

  // Dashboard methods
  async getUserStats(userId: string): Promise<{
    totalSavings: number;
    activeGoals: number;
    monthlyIncome: number;
    upcomingEvents: number;
  }> {
    const [userGoals] = await db
      .select({
        activeGoals: sql<number>`count(*)`,
        totalSavings: sql<number>`coalesce(sum(cast(${financialGoals.currentAmount} as decimal)), 0)`,
      })
      .from(financialGoals)
      .where(and(eq(financialGoals.userId, userId), eq(financialGoals.status, "active")));

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [incomeData] = await db
      .select({
        monthlyIncome: sql<number>`coalesce(sum(cast(${transactions.amount} as decimal)), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "income"),
          gte(transactions.date, thirtyDaysAgo)
        )
      );

    const [eventData] = await db
      .select({
        upcomingEvents: sql<number>`count(*)`,
      })
      .from(events)
      .where(
        and(
          eq(events.createdBy, userId),
          gte(events.startTime, new Date())
        )
      );

    // Get user preferences to check for financial estimates
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    // Use actual transaction data if available, otherwise fall back to user estimates
    const actualIncome = parseFloat(incomeData?.monthlyIncome?.toString() || "0");
    const goalsTotal = parseFloat(userGoals?.totalSavings?.toString() || "0");
    const savingsEstimate = parseFloat(prefs?.currentSavingsEstimate?.toString() || "0");

    // Monthly income: use actual transactions if available, otherwise estimate
    const monthlyIncome = actualIncome > 0 ? actualIncome : parseFloat(prefs?.monthlyIncomeEstimate?.toString() || "0");

    // Total savings: use MAX of (goals total, initial estimate) to account for savings not yet allocated to goals
    // This ensures we never show less than what the user said they have saved
    const totalSavings = Math.max(goalsTotal, savingsEstimate);

    return {
      totalSavings,
      activeGoals: userGoals?.activeGoals || 0,
      monthlyIncome,
      upcomingEvents: eventData?.upcomingEvents || 0,
    };
  }

  // Utility methods
  async getFirstUser(): Promise<SafeUser | undefined> {
    const [user] = await db.select().from(users).limit(1);
    return user;
  }

  // Helper method to generate secure tokens
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Group invite methods
  async createGroupInvite(insertInvite: InsertGroupInvite): Promise<{ invite: GroupInvite; inviteUrl: string }> {
    const token = this.generateToken();

    const [invite] = await db
      .insert(groupInvites)
      .values({
        ...insertInvite,
        token,
      })
      .returning();

    const inviteUrl = `/invite/${token}`;
    return { invite, inviteUrl };
  }

  async getGroupInviteByToken(token: string): Promise<GroupInvite | undefined> {
    const [invite] = await db
      .select()
      .from(groupInvites)
      .where(and(
        eq(groupInvites.token, token),
        gte(groupInvites.expiresAt, new Date()),
        // Only return invites that haven't been accepted (single-use)
        sql`${groupInvites.acceptedBy} IS NULL`
      ));
    return invite || undefined;
  }

  async acceptGroupInvite(token: string, userId: string): Promise<GroupMember> {
    // Atomically consume the invite token (prevents race conditions)
    const updatedInvites = await db
      .update(groupInvites)
      .set({
        acceptedBy: userId,
        acceptedAt: new Date(),
      })
      .where(and(
        eq(groupInvites.token, token),
        gte(groupInvites.expiresAt, new Date()),
        sql`${groupInvites.acceptedBy} IS NULL`
      ))
      .returning();

    if (updatedInvites.length === 0) {
      throw new Error("Invalid, expired, or already used invite");
    }

    const invite = updatedInvites[0];

    // Check if user is already a member
    const existingMembership = await db
      .select()
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, invite.groupId),
        eq(groupMembers.userId, userId)
      ));

    if (existingMembership.length > 0) {
      throw new Error("User is already a member of this group");
    }

    // Add user to group
    const member = await this.addGroupMember({
      groupId: invite.groupId,
      userId,
      role: invite.role || "member",
    });

    return member;
  }

  async revokeGroupInvite(token: string): Promise<void> {
    await db.delete(groupInvites).where(eq(groupInvites.token, token));
  }

  // Calendar share methods
  async createCalendarShare(insertShare: InsertCalendarShare): Promise<{ share: CalendarShare; shareUrl: string }> {
    const token = this.generateToken();

    const [share] = await db
      .insert(calendarShares)
      .values({
        ...insertShare,
        token,
      })
      .returning();

    const shareUrl = `/shared/calendar/${token}`;
    return { share, shareUrl };
  }

  async getCalendarShareByToken(token: string): Promise<CalendarShare | undefined> {
    const [share] = await db
      .select()
      .from(calendarShares)
      .where(eq(calendarShares.token, token));

    // Check if share exists and not expired
    if (!share) return undefined;
    if (share.expiresAt && new Date() > share.expiresAt) return undefined;

    return share;
  }

  async getCalendarSharesByUserId(userId: string): Promise<CalendarShare[]> {
    const shares = await db
      .select()
      .from(calendarShares)
      .where(
        or(
          eq(calendarShares.ownerId, userId),
          // Also include shares for groups the user owns or is admin of
          exists(
            db.select().from(groupMembers)
              .where(and(
                eq(groupMembers.groupId, calendarShares.groupId!),
                eq(groupMembers.userId, userId),
                // User must be owner or admin to see group shares
                sql`${groupMembers.role} IN ('owner', 'admin')`
              ))
          )
        )
      );

    return shares;
  }

  async getEventsForShare(token: string): Promise<Event[]> {
    const share = await this.getCalendarShareByToken(token);
    if (!share) {
      throw new Error("Invalid or expired share token");
    }

    if (share.scope === "user" && share.ownerId) {
      return await this.getEventsByUserId(share.ownerId);
    } else if (share.scope === "group" && share.groupId) {
      return await this.getEventsByGroupId(share.groupId);
    }

    return [];
  }

  // Friend request methods
  async createFriendRequest(insertRequest: InsertFriendRequest): Promise<FriendRequest> {
    // Check if request already exists
    const [existing] = await db
      .select()
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.fromUserId, insertRequest.fromUserId),
          eq(friendRequests.toUserId, insertRequest.toUserId),
          eq(friendRequests.status, 'pending')
        )
      );

    if (existing) {
      throw new Error("Friend request already sent");
    }

    // Check if they're already friends
    const areFriends = await this.areFriends(insertRequest.fromUserId, insertRequest.toUserId);
    if (areFriends) {
      throw new Error("Already friends with this user");
    }

    const [request] = await db
      .insert(friendRequests)
      .values(insertRequest)
      .returning();

    return request;
  }

  async getFriendRequest(id: string): Promise<FriendRequest | undefined> {
    const [request] = await db
      .select()
      .from(friendRequests)
      .where(eq(friendRequests.id, id));
    return request || undefined;
  }

  async getFriendRequestsByUserId(userId: string): Promise<Array<FriendRequest & { fromUser: SafeUser; toUser: SafeUser }>> {
    const requests = await db
      .select({
        request: friendRequests,
        fromUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        toUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(friendRequests)
      .innerJoin(users, eq(friendRequests.fromUserId, users.id))
      .innerJoin(users, eq(friendRequests.toUserId, users.id))
      .where(
        or(
          eq(friendRequests.fromUserId, userId),
          eq(friendRequests.toUserId, userId)
        )
      );

    return requests.map(({ request, fromUser, toUser }) => ({
      ...request,
      fromUser,
      toUser,
    }));
  }

  async getPendingFriendRequests(userId: string): Promise<Array<FriendRequest & { fromUser: SafeUser }>> {
    const requests = await db
      .select({
        request: friendRequests,
        fromUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(friendRequests)
      .innerJoin(users, eq(friendRequests.fromUserId, users.id))
      .where(
        and(
          eq(friendRequests.toUserId, userId),
          eq(friendRequests.status, 'pending')
        )
      );

    return requests.map(({ request, fromUser }) => ({
      ...request,
      fromUser,
    }));
  }

  async getSentFriendRequests(userId: string): Promise<Array<FriendRequest & { toUser: SafeUser }>> {
    const requests = await db
      .select({
        request: friendRequests,
        toUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(friendRequests)
      .innerJoin(users, eq(friendRequests.toUserId, users.id))
      .where(
        and(
          eq(friendRequests.fromUserId, userId),
          eq(friendRequests.status, 'pending')
        )
      );

    return requests.map(({ request, toUser }) => ({
      ...request,
      toUser,
    }));
  }

  async updateFriendRequestStatus(id: string, status: 'accepted' | 'declined'): Promise<FriendRequest> {
    const [request] = await db
      .update(friendRequests)
      .set({ status, respondedAt: new Date() })
      .where(eq(friendRequests.id, id))
      .returning();

    // If accepted, create friendship
    if (status === 'accepted') {
      await this.createFriendship({
        userId: request.fromUserId,
        friendId: request.toUserId,
      });
      // Also create reverse friendship for bidirectional lookup
      await this.createFriendship({
        userId: request.toUserId,
        friendId: request.fromUserId,
      });
    }

    return request;
  }

  async deleteFriendRequest(id: string): Promise<void> {
    await db.delete(friendRequests).where(eq(friendRequests.id, id));
  }

  // Friendship methods
  async createFriendship(insertFriendship: InsertFriendship): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values(insertFriendship)
      .returning();

    return friendship;
  }

  async getFriendsByUserId(userId: string): Promise<Array<SafeUser>> {
    const friends = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.friendId, users.id))
      .where(eq(friendships.userId, userId));

    return friends;
  }

  async areFriends(userId: string, friendId: string): Promise<boolean> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.userId, userId),
          eq(friendships.friendId, friendId)
        )
      );

    return !!friendship;
  }

  async removeFriendship(userId: string, friendId: string): Promise<void> {
    // Remove both directions of friendship
    await db
      .delete(friendships)
      .where(
        or(
          and(
            eq(friendships.userId, userId),
            eq(friendships.friendId, friendId)
          ),
          and(
            eq(friendships.userId, friendId),
            eq(friendships.friendId, userId)
          )
        )
      );
  }

  async searchUsers(query: string, excludeUserId: string): Promise<SafeUser[]> {
    const searchPattern = `%${query.toLowerCase()}%`;

    const foundUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(
        and(
          sql`${users.id} != ${excludeUserId}`,
          or(
            sql`LOWER(${users.email}) LIKE ${searchPattern}`,
            sql`LOWER(${users.firstName}) LIKE ${searchPattern}`,
            sql`LOWER(${users.lastName}) LIKE ${searchPattern}`,
            sql`LOWER(CONCAT(${users.firstName}, ' ', ${users.lastName})) LIKE ${searchPattern}`
          )
        )
      )
      .limit(20);

    return foundUsers;
  }

  // Shared Goals methods
  async shareGoal(insertShare: InsertSharedGoal): Promise<SharedGoal> {
    const [share] = await db
      .insert(sharedGoals)
      .values(insertShare)
      .returning();

    return share;
  }

  async getSharedGoals(userId: string): Promise<Array<SharedGoal & { goal: FinancialGoal; owner: SafeUser }>> {
    const shares = await db
      .select({
        id: sharedGoals.id,
        goalId: sharedGoals.goalId,
        ownerId: sharedGoals.ownerId,
        sharedWithUserId: sharedGoals.sharedWithUserId,
        groupId: sharedGoals.groupId,
        permission: sharedGoals.permission,
        status: sharedGoals.status,
        createdAt: sharedGoals.createdAt,
        goal: financialGoals,
        owner: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(sharedGoals)
      .innerJoin(financialGoals, eq(sharedGoals.goalId, financialGoals.id))
      .innerJoin(users, eq(sharedGoals.ownerId, users.id))
      .where(and(
        eq(sharedGoals.sharedWithUserId, userId),
        eq(sharedGoals.status, 'active')
      ));

    return shares;
  }

  async getGoalShares(goalId: string): Promise<Array<SharedGoal & { sharedWith: SafeUser | null; group?: any }>> {
    const shares = await db
      .select({
        id: sharedGoals.id,
        goalId: sharedGoals.goalId,
        ownerId: sharedGoals.ownerId,
        sharedWithUserId: sharedGoals.sharedWithUserId,
        groupId: sharedGoals.groupId,
        permission: sharedGoals.permission,
        status: sharedGoals.status,
        createdAt: sharedGoals.createdAt,
        sharedWith: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(sharedGoals)
      .leftJoin(users, eq(sharedGoals.sharedWithUserId, users.id))
      .where(and(
        eq(sharedGoals.goalId, goalId),
        eq(sharedGoals.status, 'active')
      ));

    return shares;
  }

  async removeGoalShare(goalId: string, sharedWithUserId: string): Promise<void> {
    await db
      .update(sharedGoals)
      .set({ status: 'removed' })
      .where(and(
        eq(sharedGoals.goalId, goalId),
        eq(sharedGoals.sharedWithUserId, sharedWithUserId)
      ));
  }

  async updateGoalSharePermission(goalId: string, sharedWithUserId: string, permission: 'view' | 'contribute'): Promise<SharedGoal> {
    const [share] = await db
      .update(sharedGoals)
      .set({ permission })
      .where(and(
        eq(sharedGoals.goalId, goalId),
        eq(sharedGoals.sharedWithUserId, sharedWithUserId)
      ))
      .returning();

    return share;
  }

  async shareGoalWithGroup(goalId: string, ownerId: string, groupId: string, permission: 'view' | 'contribute'): Promise<{ groupShare: SharedGoal; memberShares: SharedGoal[]; memberCount: number }> {
    // Create group-level share entry
    const [groupShare] = await db
      .insert(sharedGoals)
      .values({
        goalId,
        ownerId,
        groupId,
        sharedWithUserId: null,
        permission,
        status: 'active',
      })
      .returning();

    // Get all group members (excluding owner)
    const members = await db
      .select()
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, groupId),
        sql`${groupMembers.userId} != ${ownerId}`
      ));

    // Create individual shares for each member
    const memberSharesData = members.map(member => ({
      goalId,
      ownerId,
      sharedWithUserId: member.userId,
      groupId: null,
      permission,
      status: 'active' as const,
    }));

    let memberShares: SharedGoal[] = [];
    if (memberSharesData.length > 0) {
      memberShares = await db
        .insert(sharedGoals)
        .values(memberSharesData)
        .onConflictDoNothing()
        .returning();
    }

    return {
      groupShare,
      memberShares,
      memberCount: members.length,
    };
  }

  // Shared Budgets methods
  async createSharedBudget(insertBudget: InsertSharedBudget): Promise<SharedBudget> {
    const [budget] = await db
      .insert(sharedBudgets)
      .values(insertBudget)
      .returning();

    // Add creator as owner member
    await db.insert(sharedBudgetMembers).values({
      budgetId: budget.id,
      userId: insertBudget.createdBy,
      role: 'owner',
    });

    return budget;
  }

  async getSharedBudget(id: string): Promise<SharedBudget | undefined> {
    const [budget] = await db
      .select()
      .from(sharedBudgets)
      .where(eq(sharedBudgets.id, id));

    return budget || undefined;
  }

  async getSharedBudgetsByUserId(userId: string): Promise<Array<SharedBudget & { members: Array<SafeUser> }>> {
    // Get budgets where user is a member
    const budgetsWithMembers = await db
      .select({
        id: sharedBudgets.id,
        name: sharedBudgets.name,
        description: sharedBudgets.description,
        totalBudget: sharedBudgets.totalBudget,
        currentSpent: sharedBudgets.currentSpent,
        period: sharedBudgets.period,
        createdBy: sharedBudgets.createdBy,
        linkedGoalId: sharedBudgets.linkedGoalId,
        status: sharedBudgets.status,
        createdAt: sharedBudgets.createdAt,
        updatedAt: sharedBudgets.updatedAt,
      })
      .from(sharedBudgets)
      .innerJoin(sharedBudgetMembers, eq(sharedBudgets.id, sharedBudgetMembers.budgetId))
      .where(eq(sharedBudgetMembers.userId, userId));

    // For each budget, fetch all members
    const results = await Promise.all(
      budgetsWithMembers.map(async (budget) => {
        const members = await this.getSharedBudgetMembers(budget.id);
        return {
          ...budget,
          members: members.map(m => m.user),
        };
      })
    );

    return results;
  }

  async updateSharedBudget(id: string, updates: Partial<SharedBudget>): Promise<SharedBudget> {
    const [budget] = await db
      .update(sharedBudgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sharedBudgets.id, id))
      .returning();

    return budget;
  }

  async deleteSharedBudget(id: string): Promise<void> {
    await db.delete(sharedBudgets).where(eq(sharedBudgets.id, id));
  }

  async addSharedBudgetMember(insertMember: InsertSharedBudgetMember): Promise<SharedBudgetMember> {
    const [member] = await db
      .insert(sharedBudgetMembers)
      .values(insertMember)
      .returning();

    return member;
  }

  async getSharedBudgetMembers(budgetId: string): Promise<Array<SharedBudgetMember & { user: SafeUser }>> {
    const members = await db
      .select({
        id: sharedBudgetMembers.id,
        budgetId: sharedBudgetMembers.budgetId,
        userId: sharedBudgetMembers.userId,
        role: sharedBudgetMembers.role,
        joinedAt: sharedBudgetMembers.joinedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(sharedBudgetMembers)
      .innerJoin(users, eq(sharedBudgetMembers.userId, users.id))
      .where(eq(sharedBudgetMembers.budgetId, budgetId));

    return members;
  }

  async removeSharedBudgetMember(budgetId: string, userId: string): Promise<void> {
    await db
      .delete(sharedBudgetMembers)
      .where(and(
        eq(sharedBudgetMembers.budgetId, budgetId),
        eq(sharedBudgetMembers.userId, userId)
      ));
  }

  async createSharedBudgetExpense(insertExpense: InsertSharedBudgetExpense): Promise<SharedBudgetExpense> {
    const [expense] = await db
      .insert(sharedBudgetExpenses)
      .values(insertExpense)
      .returning();

    // Update budget's current spent amount
    const budget = await this.getSharedBudget(insertExpense.budgetId);
    if (budget) {
      const currentSpent = parseFloat(budget.currentSpent?.toString() || '0');
      const expenseAmount = parseFloat(expense.amount.toString());
      await this.updateSharedBudget(insertExpense.budgetId, {
        currentSpent: (currentSpent + expenseAmount).toString(),
      });
    }

    return expense;
  }

  async getSharedBudgetExpenses(budgetId: string): Promise<Array<SharedBudgetExpense & { user: SafeUser }>> {
    const expenses = await db
      .select({
        id: sharedBudgetExpenses.id,
        budgetId: sharedBudgetExpenses.budgetId,
        userId: sharedBudgetExpenses.userId,
        amount: sharedBudgetExpenses.amount,
        category: sharedBudgetExpenses.category,
        description: sharedBudgetExpenses.description,
        date: sharedBudgetExpenses.date,
        createdAt: sharedBudgetExpenses.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(sharedBudgetExpenses)
      .innerJoin(users, eq(sharedBudgetExpenses.userId, users.id))
      .where(eq(sharedBudgetExpenses.budgetId, budgetId))
      .orderBy(desc(sharedBudgetExpenses.date));

    return expenses;
  }

  async updateSharedBudgetExpense(id: string, updates: Partial<SharedBudgetExpense>): Promise<SharedBudgetExpense> {
    // Get old expense to adjust budget
    const [oldExpense] = await db
      .select()
      .from(sharedBudgetExpenses)
      .where(eq(sharedBudgetExpenses.id, id));

    const [expense] = await db
      .update(sharedBudgetExpenses)
      .set(updates)
      .where(eq(sharedBudgetExpenses.id, id))
      .returning();

    // Adjust budget if amount changed
    if (updates.amount && oldExpense) {
      const budget = await this.getSharedBudget(oldExpense.budgetId);
      if (budget) {
        const currentSpent = parseFloat(budget.currentSpent?.toString() || '0');
        const oldAmount = parseFloat(oldExpense.amount.toString());
        const newAmount = parseFloat(updates.amount.toString());
        const diff = newAmount - oldAmount;
        await this.updateSharedBudget(oldExpense.budgetId, {
          currentSpent: (currentSpent + diff).toString(),
        });
      }
    }

    return expense;
  }

  async deleteSharedBudgetExpense(id: string): Promise<void> {
    // Get expense to adjust budget
    const [expense] = await db
      .select()
      .from(sharedBudgetExpenses)
      .where(eq(sharedBudgetExpenses.id, id));

    if (expense) {
      const budget = await this.getSharedBudget(expense.budgetId);
      if (budget) {
        const currentSpent = parseFloat(budget.currentSpent?.toString() || '0');
        const expenseAmount = parseFloat(expense.amount.toString());
        await this.updateSharedBudget(expense.budgetId, {
          currentSpent: (currentSpent - expenseAmount).toString(),
        });
      }
    }

    await db.delete(sharedBudgetExpenses).where(eq(sharedBudgetExpenses.id, id));
  }

  // Friend Group Invitations methods
  async createFriendGroupInvitation(insertInvitation: InsertFriendGroupInvitation): Promise<FriendGroupInvitation> {
    const [invitation] = await db
      .insert(friendGroupInvitations)
      .values(insertInvitation)
      .returning();

    return invitation;
  }

  async getFriendGroupInvitations(userId: string): Promise<Array<FriendGroupInvitation & { group: Group; invitedBy: SafeUser }>> {
    const invitations = await db
      .select({
        id: friendGroupInvitations.id,
        groupId: friendGroupInvitations.groupId,
        invitedBy: users.id,
        invitedUserId: friendGroupInvitations.invitedUserId,
        role: friendGroupInvitations.role,
        status: friendGroupInvitations.status,
        message: friendGroupInvitations.message,
        createdAt: friendGroupInvitations.createdAt,
        respondedAt: friendGroupInvitations.respondedAt,
        group: groups,
        invitedByUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(friendGroupInvitations)
      .innerJoin(groups, eq(friendGroupInvitations.groupId, groups.id))
      .innerJoin(users, eq(friendGroupInvitations.invitedBy, users.id))
      .where(eq(friendGroupInvitations.invitedUserId, userId));

    return invitations.map(inv => ({
      id: inv.id,
      groupId: inv.groupId,
      invitedBy: inv.invitedByUser,
      invitedUserId: inv.invitedUserId,
      role: inv.role,
      status: inv.status,
      message: inv.message,
      createdAt: inv.createdAt,
      respondedAt: inv.respondedAt,
      group: inv.group,
    })) as any;
  }

  async updateFriendGroupInvitationStatus(id: string, status: 'accepted' | 'declined'): Promise<FriendGroupInvitation> {
    const [invitation] = await db
      .update(friendGroupInvitations)
      .set({ status, respondedAt: new Date() })
      .where(eq(friendGroupInvitations.id, id))
      .returning();

    // If accepted, add user to group
    if (status === 'accepted') {
      await this.addGroupMember({
        groupId: invitation.groupId,
        userId: invitation.invitedUserId,
        role: invitation.role,
      });
    }

    return invitation;
  }

  async deleteFriendGroupInvitation(id: string): Promise<void> {
    await db.delete(friendGroupInvitations).where(eq(friendGroupInvitations.id, id));
  }

  async bulkInviteFriendsToGroup(groupId: string, invitedBy: string, friendIds: string[], role?: string): Promise<FriendGroupInvitation[]> {
    const invitationRole: 'admin' | 'member' = role === 'admin' ? 'admin' : 'member';

    const invitationsData = friendIds.map(friendId => ({
      groupId,
      invitedBy,
      invitedUserId: friendId,
      role: invitationRole,
      status: 'pending' as const,
    }));

    const invitations = await db
      .insert(friendGroupInvitations)
      .values(invitationsData)
      .onConflictDoNothing()
      .returning();

    return invitations;
  }

  // RSVP methods
  async updateEventRSVP(eventId: string, userId: string, status: 'yes' | 'no' | 'maybe'): Promise<Event> {
    const event = await this.getEvent(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Parse current attendees
    let attendees = Array.isArray(event.attendees) ? event.attendees : [];

    // Find existing RSVP
    const existingIndex = attendees.findIndex((a: any) => a.userId === userId);

    if (existingIndex >= 0) {
      // Update existing RSVP
      attendees[existingIndex] = { userId, status };
    } else {
      // Add new RSVP
      attendees.push({ userId, status });
    }

    // Update event with new attendees
    return await this.updateEvent(eventId, { attendees });
  }

  // Event expense methods
  async getEventExpense(id: string): Promise<EventExpense | undefined> {
    const [expense] = await db.select().from(eventExpenses).where(eq(eventExpenses.id, id));
    return expense || undefined;
  }

  async getEventExpensesByEventId(eventId: string): Promise<EventExpense[]> {
    return await db.select().from(eventExpenses).where(eq(eventExpenses.eventId, eventId)).orderBy(desc(eventExpenses.date));
  }

  async createEventExpense(insertExpense: InsertEventExpense): Promise<EventExpense> {
    const [expense] = await db
      .insert(eventExpenses)
      .values({
        ...insertExpense,
        description: insertExpense.description || null,
        category: insertExpense.category || null,
        receiptUrl: insertExpense.receiptUrl || null,
      })
      .returning();

    // Update the event's actualCost
    const event = await this.getEvent(insertExpense.eventId);
    if (event) {
      const currentCost = parseFloat(event.actualCost?.toString() || "0");
      const newCost = currentCost + parseFloat(expense.amount.toString());
      await this.updateEvent(insertExpense.eventId, { actualCost: newCost.toString() });
    }

    return expense;
  }

  async updateEventExpense(id: string, updates: Partial<EventExpense>): Promise<EventExpense> {
    const oldExpense = await this.getEventExpense(id);
    if (!oldExpense) {
      throw new Error("Expense not found");
    }

    const [expense] = await db
      .update(eventExpenses)
      .set(updates)
      .where(eq(eventExpenses.id, id))
      .returning();

    // If amount changed, update event's actualCost
    if (updates.amount) {
      const event = await this.getEvent(oldExpense.eventId);
      if (event) {
        const currentCost = parseFloat(event.actualCost?.toString() || "0");
        const oldAmount = parseFloat(oldExpense.amount.toString());
        const newAmount = parseFloat(updates.amount.toString());
        const newCost = currentCost - oldAmount + newAmount;
        await this.updateEvent(oldExpense.eventId, { actualCost: newCost.toString() });
      }
    }

    return expense;
  }

  async deleteEventExpense(id: string): Promise<void> {
    const expense = await this.getEventExpense(id);
    if (expense) {
      // Update event's actualCost
      const event = await this.getEvent(expense.eventId);
      if (event) {
        const currentCost = parseFloat(event.actualCost?.toString() || "0");
        const expenseAmount = parseFloat(expense.amount.toString());
        const newCost = Math.max(0, currentCost - expenseAmount);
        await this.updateEvent(expense.eventId, { actualCost: newCost.toString() });
      }
    }

    await db.delete(eventExpenses).where(eq(eventExpenses.id, id));
  }

  // Event expense share methods
  async getEventExpenseShare(id: string): Promise<EventExpenseShare | undefined> {
    const [share] = await db.select().from(eventExpenseShares).where(eq(eventExpenseShares.id, id));
    return share || undefined;
  }

  async getEventExpenseSharesByExpenseId(expenseId: string): Promise<EventExpenseShare[]> {
    return await db.select().from(eventExpenseShares).where(eq(eventExpenseShares.expenseId, expenseId));
  }

  async createEventExpenseShare(insertShare: InsertEventExpenseShare): Promise<EventExpenseShare> {
    const [share] = await db
      .insert(eventExpenseShares)
      .values(insertShare)
      .returning();
    return share;
  }

  async updateEventExpenseShare(id: string, updates: Partial<EventExpenseShare>): Promise<EventExpenseShare> {
    const [share] = await db
      .update(eventExpenseShares)
      .set(updates)
      .where(eq(eventExpenseShares.id, id))
      .returning();
    return share;
  }

  async deleteEventExpenseShare(id: string): Promise<void> {
    await db.delete(eventExpenseShares).where(eq(eventExpenseShares.id, id));
  }

  // Event financial summary methods
  async getEventFinancialSummary(eventId: string): Promise<{
    budget: number | null;
    totalExpenses: number;
    expensesByCategory: Record<string, number>;
    unpaidShares: number;
    expenseShares: Array<{
      userId: string;
      totalOwed: number;
      totalPaid: number;
    }>;
  }> {
    // Get event budget
    const event = await this.getEvent(eventId);
    const budget = event?.budget ? parseFloat(event.budget.toString()) : null;

    // Get all expenses for this event
    const expenses = await this.getEventExpensesByEventId(eventId);
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);

    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + parseFloat(expense.amount.toString());
    });

    // Get all expense shares
    const allShares = await db
      .select()
      .from(eventExpenseShares)
      .innerJoin(eventExpenses, eq(eventExpenseShares.expenseId, eventExpenses.id))
      .where(eq(eventExpenses.eventId, eventId));

    // Calculate unpaid shares total
    const unpaidShares = allShares
      .filter(({ event_expense_shares }) => !event_expense_shares.isPaid)
      .reduce((sum, { event_expense_shares }) => sum + parseFloat(event_expense_shares.shareAmount.toString()), 0);

    // Group shares by user
    const userShares: Record<string, { totalOwed: number; totalPaid: number }> = {};
    allShares.forEach(({ event_expense_shares }) => {
      const userId = event_expense_shares.userId;
      if (!userShares[userId]) {
        userShares[userId] = { totalOwed: 0, totalPaid: 0 };
      }
      const shareAmount = parseFloat(event_expense_shares.shareAmount.toString());
      userShares[userId].totalOwed += shareAmount;
      if (event_expense_shares.isPaid) {
        userShares[userId].totalPaid += shareAmount;
      }
    });

    const expenseShares = Object.entries(userShares).map(([userId, { totalOwed, totalPaid }]) => ({
      userId,
      totalOwed,
      totalPaid,
    }));

    return {
      budget,
      totalExpenses,
      expensesByCategory,
      unpaidShares,
      expenseShares,
    };
  }

  // User settings methods
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async createUserSettings(insertSettings: InsertUserSettings): Promise<UserSettings> {
    const [settings] = await db
      .insert(userSettings)
      .values({
        ...insertSettings,
        currency: insertSettings.currency || "USD",
        workHoursPerWeek: insertSettings.workHoursPerWeek || 40,
        timeValueStrategy: insertSettings.timeValueStrategy || "fixed",
      })
      .returning();
    return settings;
  }

  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    const [settings] = await db
      .update(userSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId))
      .returning();
    return settings;
  }

  // Time tracking methods
  async createTimeLog(insertTimeLog: InsertEventTimeLog): Promise<EventTimeLog> {
    const [timeLog] = await db
      .insert(eventTimeLogs)
      .values({
        ...insertTimeLog,
        notes: insertTimeLog.notes || null,
      })
      .returning();

    // Update event's actual duration if this log is completed
    if (timeLog.endedAt && timeLog.durationMinutes) {
      const event = await this.getEvent(insertTimeLog.eventId);
      if (event) {
        const currentDuration = event.actualDurationMinutes || 0;
        const newDuration = currentDuration + timeLog.durationMinutes;
        await this.updateEvent(insertTimeLog.eventId, {
          actualDurationMinutes: newDuration,
          timeTracked: true
        });
      }
    }

    return timeLog;
  }

  async getEventTimeLogs(eventId: string): Promise<EventTimeLog[]> {
    return await db.select().from(eventTimeLogs).where(eq(eventTimeLogs.eventId, eventId));
  }

  async getUserTimeLogs(userId: string, startDate?: Date, endDate?: Date): Promise<EventTimeLog[]> {
    if (startDate && endDate) {
      return await db.select().from(eventTimeLogs).where(
        and(
          eq(eventTimeLogs.userId, userId),
          gte(eventTimeLogs.startedAt, startDate),
          lte(eventTimeLogs.startedAt, endDate)
        )
      );
    }

    return await db.select().from(eventTimeLogs).where(eq(eventTimeLogs.userId, userId));
  }

  async updateTimeLog(id: string, updates: Partial<EventTimeLog>): Promise<EventTimeLog> {
    const [timeLog] = await db
      .update(eventTimeLogs)
      .set(updates)
      .where(eq(eventTimeLogs.id, id))
      .returning();
    return timeLog;
  }

  async deleteTimeLog(id: string): Promise<void> {
    await db.delete(eventTimeLogs).where(eq(eventTimeLogs.id, id));
  }

  // Time-value insights methods
  async getTimeValueInsights(userId: string, range: '7d' | '30d' | '90d'): Promise<{
    totalTimeHours: number;
    timeValue: number;
    totalCost: number;
    netImpact: number;
    topCategories: Array<{ category: string; timeHours: number; value: number }>;
    upcomingHighImpact: Array<{ eventId: string; title: string; estimatedValue: number }>;
  }> {
    // Get user settings for hourly rate
    const settings = await this.getUserSettings(userId);
    const hourlyRate = settings?.hourlyRate ? parseFloat(settings.hourlyRate.toString()) : 50;

    // Calculate date range
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get time logs for the period
    const timeLogs = await this.getUserTimeLogs(userId, startDate, new Date());
    const totalTimeMinutes = timeLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
    const totalTimeHours = totalTimeMinutes / 60;
    const timeValue = totalTimeHours * hourlyRate;

    // Get user's events and calculate total costs
    const userEvents = await this.getEventsByUserId(userId);
    const recentEvents = userEvents.filter(event =>
      event.createdAt && new Date(event.createdAt) >= startDate
    );
    const totalCost = recentEvents.reduce((sum, event) =>
      sum + parseFloat(event.actualCost?.toString() || "0"), 0
    );

    const netImpact = timeValue - totalCost;

    // Calculate top categories (simplified - using event descriptions as categories)
    const categoryMap: Record<string, { timeHours: number; value: number }> = {};
    for (const log of timeLogs) {
      const event = userEvents.find(e => e.id === log.eventId);
      const category = event?.description || "Other";
      const hours = (log.durationMinutes || 0) / 60;
      const value = hours * hourlyRate;

      if (!categoryMap[category]) {
        categoryMap[category] = { timeHours: 0, value: 0 };
      }
      categoryMap[category].timeHours += hours;
      categoryMap[category].value += value;
    }

    const topCategories = Object.entries(categoryMap)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Get upcoming high-impact events (with high budgets or long durations)
    const upcomingEvents = userEvents.filter(event =>
      new Date(event.startTime) > new Date()
    );
    const upcomingHighImpact = upcomingEvents
      .map(event => {
        const budget = parseFloat(event.budget?.toString() || "0");
        const plannedMinutes = event.plannedDurationMinutes || 60; // default 1 hour
        const estimatedValue = (plannedMinutes / 60) * hourlyRate + budget;
        return {
          eventId: event.id,
          title: event.title,
          estimatedValue
        };
      })
      .sort((a, b) => b.estimatedValue - a.estimatedValue)
      .slice(0, 5);

    return {
      totalTimeHours,
      timeValue,
      totalCost,
      netImpact,
      topCategories,
      upcomingHighImpact,
    };
  }

  async calculateEventTimeValue(eventId: string, userId: string): Promise<{
    plannedTimeValue: number;
    actualTimeValue: number;
    totalImpact: number;
  }> {
    const event = await this.getEvent(eventId);
    const settings = await this.getUserSettings(userId);
    const hourlyRate = settings?.hourlyRate ? parseFloat(settings.hourlyRate.toString()) : 50;

    if (!event) {
      return { plannedTimeValue: 0, actualTimeValue: 0, totalImpact: 0 };
    }

    const plannedMinutes = event.plannedDurationMinutes ||
      ((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60));
    const actualMinutes = event.actualDurationMinutes || 0;

    const plannedTimeValue = (plannedMinutes / 60) * hourlyRate;
    const actualTimeValue = (actualMinutes / 60) * hourlyRate;
    const actualCost = parseFloat(event.actualCost?.toString() || "0");
    const totalImpact = actualTimeValue + actualCost;

    return {
      plannedTimeValue,
      actualTimeValue,
      totalImpact,
    };
  }

  // Notification methods
  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification || undefined;
  }

  async getNotificationsByUserId(userId: string, limit: number = 50, offset: number = 0, includeRead: boolean = true): Promise<Notification[]> {
    if (!includeRead) {
      return await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);
    }

    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return result?.count || 0;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        ...insertNotification,
        actionType: insertNotification.actionType || null,
        actionData: insertNotification.actionData || {},
        data: insertNotification.data || {},
      })
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async archiveNotification(id: string): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ isArchived: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  // Helper to check if a similar notification was already sent recently
  private async hasRecentNotification(userId: string, type: string, hoursAgo: number = 24): Promise<boolean> {
    const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    const existing = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, type),
          gte(notifications.createdAt, cutoff)
        )
      )
      .limit(1);
    return existing.length > 0;
  }

  // Smart notification generation
  async generateSmartNotifications(userId: string): Promise<Notification[]> {
    const newNotifications: Notification[] = [];

    // Check various conditions and generate notifications
    const dailyBriefing = await this.generateDailyBriefing(userId);
    const deadlineNotifications = await this.checkGoalDeadlines(userId);
    const transactionNotifications = await this.checkTransactionReminders(userId);
    const budgetNotifications = await this.checkBudgetWarnings(userId);
    const completionNotifications = await this.checkGoalCompletions(userId);
    const riskAlerts = await this.checkFinancialRisks(userId);

    if (dailyBriefing) newNotifications.push(dailyBriefing);
    newNotifications.push(...deadlineNotifications);
    newNotifications.push(...transactionNotifications);
    newNotifications.push(...budgetNotifications);
    newNotifications.push(...completionNotifications);
    newNotifications.push(...riskAlerts);

    return newNotifications;
  }

  async generateDailyBriefing(userId: string): Promise<Notification | null> {
    // Check if we've already sent a daily briefing today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Query for daily briefings created today (not just last 10)
    const todaysBriefings = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, 'daily_briefing'),
          gte(notifications.createdAt, today)
        )
      )
      .limit(1);

    if (todaysBriefings.length > 0) return null;

    // Get financial data
    const transactions = await this.getTransactionsByUserId(userId, 100);
    const goals = await this.getFinancialGoalsByUserId(userId);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);

    const totalIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const totalExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;

    // Generate intelligent briefing based on financial state
    let title = '';
    let message = '';
    let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';

    if (savingsRate >= 20) {
      title = 'Financial Health: Strong';
      message = `Your savings rate is ${savingsRate.toFixed(0)}%, well above the recommended 20%. You're on track with ${activeGoals} active goals. Net savings this month: $${netSavings.toFixed(2)}.`;
      priority = 'low';
    } else if (savingsRate >= 10) {
      title = 'Financial Health: Good';
      message = `Your savings rate is ${savingsRate.toFixed(0)}%. Consider increasing to 20% for stronger financial security. Net savings this month: $${netSavings.toFixed(2)}.`;
      priority = 'normal';
    } else if (savingsRate >= 0) {
      title = 'Financial Health: Needs Attention';
      message = `Your savings rate is ${savingsRate.toFixed(0)}%, below the recommended 20%. Review your expenses to identify savings opportunities. Net savings this month: $${netSavings.toFixed(2)}.`;
      priority = 'high';
    } else {
      title = 'Financial Alert: Negative Cash Flow';
      message = `You're spending $${Math.abs(netSavings).toFixed(2)} more than you're earning this month. Immediate action needed to prevent debt accumulation.`;
      priority = 'urgent';
    }

    return await this.createNotification({
      userId,
      type: 'daily_briefing',
      title,
      message,
      priority,
      category: 'suggestions',
      data: {
        savingsRate,
        totalIncome,
        totalExpenses,
        netSavings,
        activeGoals,
        completedGoals
      },
      actionType: 'view_transactions',
      actionData: { period: '30d' }
    });
  }

  async checkFinancialRisks(userId: string): Promise<Notification[]> {
    const newNotifications: Notification[] = [];

    // Skip if we already sent a risk alert in the last 24 hours
    if (await this.hasRecentNotification(userId, 'risk_alert', 24)) {
      return newNotifications;
    }

    const transactions = await this.getTransactionsByUserId(userId, 100);
    const goals = await this.getFinancialGoalsByUserId(userId);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);

    // Risk 1: High expense volatility (spending varies drastically)
    const weeklyExpenses: number[] = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
      const weekExpense = transactions
        .filter(t => {
          const tDate = new Date(t.date);
          return t.type === 'expense' && tDate >= weekStart && tDate < weekEnd;
        })
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      weeklyExpenses.push(weekExpense);
    }

    if (weeklyExpenses.length >= 3) {
      const avgWeekly = weeklyExpenses.reduce((a, b) => a + b, 0) / weeklyExpenses.length;
      const maxDeviation = Math.max(...weeklyExpenses.map(w => Math.abs(w - avgWeekly)));
      const volatilityPercent = avgWeekly > 0 ? (maxDeviation / avgWeekly) * 100 : 0;

      if (volatilityPercent > 50 && avgWeekly > 100) {
        newNotifications.push(await this.createNotification({
          userId,
          type: 'risk_alert',
          title: 'Risk Alert: Irregular Spending Pattern',
          message: `Your weekly expenses vary by up to ${volatilityPercent.toFixed(0)}%. Establishing a consistent budget can improve financial stability.`,
          priority: 'normal',
          category: 'budget',
          data: { volatilityPercent, avgWeekly, weeklyExpenses },
          actionType: 'view_transactions',
          actionData: { period: '30d' }
        }));
      }
    }

    // Risk 2: No emergency fund with active expenses
    const totalIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const totalExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const hasEmergencyGoal = goals.some(g =>
      g.status === 'active' &&
      (g.title.toLowerCase().includes('emergency') || g.category?.toLowerCase().includes('emergency'))
    );

    if (!hasEmergencyGoal && totalExpenses > 1000) {
      const recommendedFund = totalExpenses; // 1 month of expenses minimum
      newNotifications.push(await this.createNotification({
        userId,
        type: 'risk_alert',
        title: 'Risk Alert: No Emergency Fund',
        message: `You don't have an emergency fund goal. Financial experts recommend saving at least $${recommendedFund.toFixed(2)} (one month of expenses) for unexpected costs.`,
        priority: 'high',
        category: 'suggestions',
        data: { recommendedFund, monthlyExpenses: totalExpenses },
        actionType: 'create_goal',
        actionData: {
          title: 'Emergency Fund',
          targetAmount: recommendedFund,
          category: 'emergency'
        }
      }));
    }

    return newNotifications;
  }

  async checkGoalDeadlines(userId: string): Promise<Notification[]> {
    const newNotifications: Notification[] = [];
    const goals = await this.getFinancialGoalsByUserId(userId);
    const now = new Date();

    for (const goal of goals) {
      if (goal.status !== 'active') continue;

      const targetDate = new Date(goal.targetDate);
      const daysUntilDeadline = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const currentAmount = parseFloat(goal.currentAmount || "0");
      const targetAmount = parseFloat(goal.targetAmount.toString());
      const progressPercent = (currentAmount / targetAmount) * 100;

      // Check if goal is close to deadline but far from target
      if (daysUntilDeadline <= 30 && daysUntilDeadline > 0 && progressPercent < 50) {
        const remainingAmount = targetAmount - currentAmount;
        const suggestedDaily = remainingAmount / daysUntilDeadline;

        const notification = await this.createNotification({
          userId,
          type: 'goal_deadline',
          title: `Goal "${goal.title}" needs attention`,
          message: `Only ${daysUntilDeadline} days left and you're ${progressPercent.toFixed(0)}% complete. Consider adding $${suggestedDaily.toFixed(2)} daily to reach your goal.`,
          priority: 'high',
          category: 'goals',
          data: { goalId: goal.id, daysUntilDeadline, progressPercent, suggestedDaily },
          actionType: 'add_transaction',
          actionData: { goalId: goal.id, amount: suggestedDaily, type: 'transfer' }
        });

        newNotifications.push(notification);
      }
    }

    return newNotifications;
  }

  async checkTransactionReminders(userId: string): Promise<Notification[]> {
    const newNotifications: Notification[] = [];
    const recentTransactions = await this.getTransactionsByUserId(userId, 10);
    const now = new Date();

    // Check if no transactions in the last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentTransactionInLast7Days = recentTransactions.some(t =>
      new Date(t.date) >= sevenDaysAgo
    );

    if (!recentTransactionInLast7Days) {
      // Check if we already sent a transaction reminder in the last 24 hours
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const existingReminders = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.type, 'transaction_reminder'),
            gte(notifications.createdAt, oneDayAgo)
          )
        )
        .limit(1);

      // Only create notification if none exists in last 24 hours
      if (existingReminders.length === 0) {
        const notification = await this.createNotification({
          userId,
          type: 'transaction_reminder',
          title: `Don't forget to track your expenses`,
          message: `You haven't added any transactions in the last 7 days. Keep track of your spending to stay on top of your financial goals.`,
          priority: 'normal',
          category: 'transactions',
          data: { daysSinceLastTransaction: 7 },
          actionType: 'add_transaction',
          actionData: { type: 'expense' }
        });

        newNotifications.push(notification);
      }
    }

    return newNotifications;
  }

  async checkBudgetWarnings(userId: string): Promise<Notification[]> {
    const newNotifications: Notification[] = [];

    // Skip if we already sent a budget warning in the last 24 hours
    if (await this.hasRecentNotification(userId, 'budget_warning', 24)) {
      return newNotifications;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get income and expenses for the last 30 days
    const transactions = await this.getTransactionsByUserId(userId, 100);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);

    const totalIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const totalExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    // Check if expenses exceed income
    if (totalExpenses > totalIncome && totalIncome > 0) {
      const overspend = totalExpenses - totalIncome;
      const overspendPercent = ((overspend / totalIncome) * 100).toFixed(0);

      const notification = await this.createNotification({
        userId,
        type: 'budget_warning',
        title: `Budget Alert: Spending Exceeds Income`,
        message: `Your expenses ($${totalExpenses.toFixed(2)}) exceeded your income ($${totalIncome.toFixed(2)}) by $${overspend.toFixed(2)} (${overspendPercent}%) this month.`,
        priority: 'urgent',
        category: 'budget',
        data: { totalIncome, totalExpenses, overspend, overspendPercent },
        actionType: 'view_transactions',
        actionData: { period: '30d' }
      });

      newNotifications.push(notification);
    }

    return newNotifications;
  }

  async checkGoalCompletions(userId: string): Promise<Notification[]> {
    const newNotifications: Notification[] = [];
    const goals = await this.getFinancialGoalsByUserId(userId);

    for (const goal of goals) {
      if (goal.status !== 'active') continue;

      const currentAmount = parseFloat(goal.currentAmount || "0");
      const targetAmount = parseFloat(goal.targetAmount.toString());
      const progressPercent = (currentAmount / targetAmount) * 100;

      // Check if goal is almost complete (90% or more)
      if (progressPercent >= 90 && progressPercent < 100) {
        const remainingAmount = targetAmount - currentAmount;

        const notification = await this.createNotification({
          userId,
          type: 'goal_almost_complete',
          title: `Almost there: "${goal.title}" is ${progressPercent.toFixed(0)}% complete`,
          message: `You're so close. Just $${remainingAmount.toFixed(2)} more to reach your ${goal.title} goal.`,
          priority: 'normal',
          category: 'achievements',
          data: { goalId: goal.id, progressPercent, remainingAmount },
          actionType: 'add_transaction',
          actionData: { goalId: goal.id, amount: remainingAmount, type: 'transfer' }
        });

        newNotifications.push(notification);
      }
      // Check if goal is complete
      else if (progressPercent >= 100) {
        const notification = await this.createNotification({
          userId,
          type: 'goal_complete',
          title: `Goal completed: "${goal.title}"`,
          message: `You've reached your ${goal.title} goal of $${targetAmount.toFixed(2)}. Time to set a new financial goal.`,
          priority: 'high',
          category: 'achievements',
          data: { goalId: goal.id, completedAmount: targetAmount },
          actionType: 'create_goal',
          actionData: { suggestedAmount: targetAmount * 1.5 }
        });

        newNotifications.push(notification);

        // Mark goal as completed
        await this.updateFinancialGoal(goal.id, { status: 'completed' });
      }
    }

    return newNotifications;
  }

  // User preferences methods
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return preferences || undefined;
  }

  async createUserPreferences(insertPreferences: InsertUserPreferences): Promise<UserPreferences> {
    const [preferences] = await db
      .insert(userPreferences)
      .values(insertPreferences as typeof userPreferences.$inferInsert)
      .returning();
    return preferences;
  }

  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const [preferences] = await db
      .update(userPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return preferences;
  }

  // Financial preferences methods
  async getFinancialPreferences(userId: string): Promise<FinancialPreferences | undefined> {
    const [preferences] = await db.select().from(financialPreferences).where(eq(financialPreferences.userId, userId));
    return preferences || undefined;
  }

  async createFinancialPreferences(insertPreferences: InsertFinancialPreferences): Promise<FinancialPreferences> {
    const [preferences] = await db
      .insert(financialPreferences)
      .values({
        ...insertPreferences,
        defaultBudgetPeriod: insertPreferences.defaultBudgetPeriod || "monthly",
        budgetWarningThreshold: insertPreferences.budgetWarningThreshold || 80,
        autoSavingsFrequency: insertPreferences.autoSavingsFrequency || "monthly",
        defaultGoalPriority: insertPreferences.defaultGoalPriority || "medium",
        autoSavingsAmount: insertPreferences.autoSavingsAmount || "0.00",
      })
      .returning();
    return preferences;
  }

  async updateFinancialPreferences(userId: string, updates: Partial<FinancialPreferences>): Promise<FinancialPreferences> {
    const [preferences] = await db
      .update(financialPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(financialPreferences.userId, userId))
      .returning();
    return preferences;
  }

  // Privacy settings methods
  async getPrivacySettings(userId: string): Promise<PrivacySettings | undefined> {
    const [settings] = await db.select().from(privacySettings).where(eq(privacySettings.userId, userId));
    return settings || undefined;
  }

  async createPrivacySettings(insertSettings: InsertPrivacySettings): Promise<PrivacySettings> {
    const [settings] = await db
      .insert(privacySettings)
      .values({
        ...insertSettings,
        dataRetentionPeriod: insertSettings.dataRetentionPeriod || 365,
        profileVisibility: insertSettings.profileVisibility || "private",
      })
      .returning();
    return settings;
  }

  async updatePrivacySettings(userId: string, updates: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const [settings] = await db
      .update(privacySettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(privacySettings.userId, userId))
      .returning();
    return settings;
  }

  // Data export methods
  async exportUserData(userId: string, format: 'json' | 'csv'): Promise<string> {
    // Get all user data
    const user = await this.getUser(userId);
    const userSettings = await this.getUserSettings(userId);
    const preferences = await this.getUserPreferences(userId);
    const financialPrefs = await this.getFinancialPreferences(userId);
    const privacySettings = await this.getPrivacySettings(userId);
    const goals = await this.getFinancialGoalsByUserId(userId);
    const transactions = await this.getTransactionsByUserId(userId, 1000);
    const events = await this.getEventsByUserId(userId);
    const groups = await this.getGroupsByUserId(userId);
    const timeLogs = await this.getUserTimeLogs(userId);

    const exportData = {
      user,
      userSettings,
      preferences,
      financialPreferences: financialPrefs,
      privacySettings,
      goals,
      transactions,
      events,
      groups,
      timeLogs,
      exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else {
      // For CSV, create a simplified flat format
      const csvData = [
        ['Data Type', 'Count', 'Details'],
        ['Goals', goals.length, `Total: ${goals.length} goals`],
        ['Transactions', transactions.length, `Total: ${transactions.length} transactions`],
        ['Events', events.length, `Total: ${events.length} events`],
        ['Groups', groups.length, `Total: ${groups.length} groups`],
        ['Time Logs', timeLogs.length, `Total: ${timeLogs.length} time logs`],
      ];

      return csvData.map(row => row.join(',')).join('\n');
    }
  }

  async deleteUserData(userId: string): Promise<void> {
    // This is a critical operation - in real app would require additional confirmations
    // Delete in reverse dependency order to avoid foreign key constraints
    await db.delete(chatMessages).where(exists(
      db.select().from(chatConversations)
        .where(and(eq(chatConversations.userId, userId), eq(chatMessages.conversationId, chatConversations.id)))
    ));
    await db.delete(chatConversations).where(eq(chatConversations.userId, userId));
    await db.delete(eventTimeLogs).where(eq(eventTimeLogs.userId, userId));
    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(transactions).where(eq(transactions.userId, userId));
    await db.delete(financialGoals).where(eq(financialGoals.userId, userId));
    await db.delete(events).where(eq(events.createdBy, userId));
    await db.delete(groupMembers).where(eq(groupMembers.userId, userId));
    await db.delete(privacySettings).where(eq(privacySettings.userId, userId));
    await db.delete(financialPreferences).where(eq(financialPreferences.userId, userId));
    await db.delete(userPreferences).where(eq(userPreferences.userId, userId));
    await db.delete(userSettings).where(eq(userSettings.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  }

  // Chat methods
  async getChatConversations(userId: string): Promise<ChatConversation[]> {
    return db.select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))
      .orderBy(desc(chatConversations.lastMessageAt));
  }

  async getChatConversation(conversationId: string): Promise<ChatConversation | undefined> {
    const [conversation] = await db.select()
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId));
    return conversation || undefined;
  }

  async getChatConversationWithMessages(conversationId: string): Promise<(ChatConversation & { messages: ChatMessage[] }) | undefined> {
    const [conversation] = await db.select()
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId));

    if (!conversation) return undefined;

    const messages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);

    return { ...conversation, messages };
  }

  async createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    const [newConversation] = await db.insert(chatConversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async updateChatConversation(id: string, updates: Partial<ChatConversation>): Promise<ChatConversation> {
    const [updatedConversation] = await db.update(chatConversations)
      .set(updates)
      .where(eq(chatConversations.id, id))
      .returning();
    return updatedConversation;
  }

  async deleteChatConversation(id: string): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.conversationId, id));
    await db.delete(chatConversations).where(eq(chatConversations.id, id));
  }

  async getChatMessages(conversationId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    return db.select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages)
      .values(message)
      .returning();

    // Update conversation lastMessageAt
    await db.update(chatConversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(chatConversations.id, message.conversationId));

    return newMessage;
  }

  async getChatMessagesByUserId(userId: string, limit = 100): Promise<ChatMessage[]> {
    return db.select({
      id: chatMessages.id,
      conversationId: chatMessages.conversationId,
      role: chatMessages.role,
      content: chatMessages.content,
      userContext: chatMessages.userContext,
      tokenCount: chatMessages.tokenCount,
      cost: chatMessages.cost,
      createdAt: chatMessages.createdAt,
    })
      .from(chatMessages)
      .innerJoin(chatConversations, eq(chatMessages.conversationId, chatConversations.id))
      .where(eq(chatConversations.userId, userId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  // Message Feedback methods
  async getMessageFeedback(messageId: string, userId: string): Promise<MessageFeedback | undefined> {
    const [feedback] = await db.select()
      .from(messageFeedback)
      .where(and(
        eq(messageFeedback.messageId, messageId),
        eq(messageFeedback.userId, userId)
      ))
      .limit(1);
    return feedback;
  }

  async createMessageFeedback(feedback: InsertMessageFeedback): Promise<MessageFeedback> {
    const [newFeedback] = await db.insert(messageFeedback)
      .values({
        ...feedback,
        updatedAt: new Date()
      })
      .returning();
    return newFeedback;
  }

  async updateMessageFeedback(messageId: string, userId: string, updates: Partial<MessageFeedback>): Promise<MessageFeedback> {
    const [updated] = await db.update(messageFeedback)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(messageFeedback.messageId, messageId),
        eq(messageFeedback.userId, userId)
      ))
      .returning();
    return updated;
  }

  async getMessageFeedbackStats(userId: string): Promise<{ helpful: number; notHelpful: number; total: number }> {
    const userFeedback = await db.select()
      .from(messageFeedback)
      .where(eq(messageFeedback.userId, userId));

    const helpful = userFeedback.filter(f => f.rating === 'helpful').length;
    const notHelpful = userFeedback.filter(f => f.rating === 'not_helpful').length;

    return {
      helpful,
      notHelpful,
      total: userFeedback.length
    };
  }

  // Subscription Plan methods
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.sortOrder);
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db.insert(subscriptionPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const [updatedPlan] = await db.update(subscriptionPlans)
      .set(updates)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updatedPlan;
  }

  // Subscription methods
  async getUserSubscription(userId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | undefined> {
    const [result] = await db.select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      planId: subscriptions.planId,
      status: subscriptions.status,
      currentPeriodStart: subscriptions.currentPeriodStart,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelledAt: subscriptions.cancelledAt,
      trialEnd: subscriptions.trialEnd,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      stripeCustomerId: subscriptions.stripeCustomerId,
      localCurrency: subscriptions.localCurrency,
      localPrice: subscriptions.localPrice,
      freePremium: subscriptions.freePremium,
      createdAt: subscriptions.createdAt,
      plan: {
        id: subscriptionPlans.id,
        name: subscriptionPlans.name,
        displayName: subscriptionPlans.displayName,
        description: subscriptionPlans.description,
        priceThb: subscriptionPlans.priceThb,
        priceUsd: subscriptionPlans.priceUsd,
        stripePriceId: subscriptionPlans.stripePriceId,
        currency: subscriptionPlans.currency,
        billingInterval: subscriptionPlans.billingInterval,
        scoutLimit: subscriptionPlans.scoutLimit,
        sonnetLimit: subscriptionPlans.sonnetLimit,
        gpt5Limit: subscriptionPlans.gpt5Limit,
        opusLimit: subscriptionPlans.opusLimit,
        aiChatLimit: subscriptionPlans.aiChatLimit,
        aiDeepAnalysisLimit: subscriptionPlans.aiDeepAnalysisLimit,
        aiInsightsFrequency: subscriptionPlans.aiInsightsFrequency,
        isLifetimeLimit: subscriptionPlans.isLifetimeLimit,
        features: subscriptionPlans.features,
        isActive: subscriptionPlans.isActive,
        sortOrder: subscriptionPlans.sortOrder,
        createdAt: subscriptionPlans.createdAt,
      }
    })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      ));

    return result;
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | undefined> {
    const [row] = await db.select()
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

    if (!row) return undefined;

    return {
      ...row.subscriptions,
      plan: row.subscription_plans
    };
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions)
      .values(subscription)
      .returning();
    return newSubscription;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const [updatedSubscription] = await db.update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  async cancelSubscription(id: string): Promise<Subscription> {
    const [cancelledSubscription] = await db.update(subscriptions)
      .set({
        status: 'cancelled',
        cancelledAt: new Date()
      })
      .where(eq(subscriptions.id, id))
      .returning();
    return cancelledSubscription;
  }

  // Usage Tracking methods
  async getUserUsage(userId: string): Promise<UsageTracking | undefined> {
    const subscription = await this.getUserSubscription(userId);

    // For lifetime limit plans (Free), get ALL TIME usage, not just this month
    if (subscription?.plan?.isLifetimeLimit) {
      const [usage] = await db.select()
        .from(usageTracking)
        .where(eq(usageTracking.userId, userId))
        .orderBy(desc(usageTracking.createdAt))
        .limit(1);
      return usage;
    }

    // For monthly limit plans (Pro), get current month usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [usage] = await db.select()
      .from(usageTracking)
      .where(and(
        eq(usageTracking.userId, userId),
        gte(usageTracking.periodStart, startOfMonth),
        lte(usageTracking.periodEnd, endOfMonth)
      ));

    return usage;
  }

  async createUsageRecord(usage: InsertUsageTracking): Promise<UsageTracking> {
    const [newUsage] = await db.insert(usageTracking)
      .values(usage)
      .returning();
    return newUsage;
  }

  async updateUsageRecord(id: string, updates: Partial<UsageTracking>): Promise<UsageTracking> {
    const [updatedUsage] = await db.update(usageTracking)
      .set(updates)
      .where(eq(usageTracking.id, id))
      .returning();
    return updatedUsage;
  }

  async incrementUsage(userId: string, type: 'aiChatsUsed' | 'aiDeepAnalysisUsed' | 'aiInsightsGenerated', amount = 1): Promise<UsageTracking> {
    let usage = await this.getUserUsage(userId);
    const subscription = await this.getUserSubscription(userId);
    const isLifetime = subscription?.plan?.isLifetimeLimit || false;

    if (!usage) {
      // Create new usage record
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // For lifetime plans, use account creation date as start, far future as end
      const periodStart = isLifetime ? now : startOfMonth;
      const periodEnd = isLifetime ? new Date('2099-12-31') : endOfMonth;

      usage = await this.createUsageRecord({
        userId,
        subscriptionId: subscription?.id || null,
        periodStart,
        periodEnd,
        aiChatsUsed: type === 'aiChatsUsed' ? amount : 0,
        aiDeepAnalysisUsed: type === 'aiDeepAnalysisUsed' ? amount : 0,
        aiInsightsGenerated: type === 'aiInsightsGenerated' ? amount : 0,
      });
    } else {
      // Update existing usage record
      const updates: Partial<UsageTracking> = {};
      if (type === 'aiChatsUsed') updates.aiChatsUsed = (usage.aiChatsUsed || 0) + amount;
      if (type === 'aiDeepAnalysisUsed') updates.aiDeepAnalysisUsed = (usage.aiDeepAnalysisUsed || 0) + amount;
      if (type === 'aiInsightsGenerated') updates.aiInsightsGenerated = (usage.aiInsightsGenerated || 0) + amount;

      usage = await this.updateUsageRecord(usage.id, updates);
    }

    return usage;
  }

  // Add-on methods
  async getUserAddOns(userId: string): Promise<SubscriptionAddOn[]> {
    const now = new Date();
    return db.select()
      .from(subscriptionAddOns)
      .where(and(
        eq(subscriptionAddOns.userId, userId),
        eq(subscriptionAddOns.isActive, true),
        gte(subscriptionAddOns.expiresAt, now)
      ));
  }

  async createAddOn(addOn: InsertSubscriptionAddOn): Promise<SubscriptionAddOn> {
    const [newAddOn] = await db.insert(subscriptionAddOns)
      .values(addOn)
      .returning();
    return newAddOn;
  }

  // Subscription helpers
  async initializeDefaultSubscription(userId: string): Promise<Subscription> {
    // Get or create the free plan
    let freePlan = await db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, 'Free'))
      .limit(1);

    if (freePlan.length === 0) {
      // Create default free plan if it doesn't exist
      const [newFreePlan] = await db.insert(subscriptionPlans)
        .values({
          name: 'Free',
          displayName: 'Twealth Free',
          description: 'Get started with 50 AI chats per month',
          priceThb: '0.00',
          priceUsd: '0.00',
          currency: 'USD',
          billingInterval: 'monthly',
          aiChatLimit: 50,
          aiDeepAnalysisLimit: 0,
          aiInsightsFrequency: 'never',
          isLifetimeLimit: false,
          features: ['basic_tracking', 'ai_chat', 'expense_tracking'],
          sortOrder: 0,
        })
        .returning();
      freePlan = [newFreePlan];
    } else if (freePlan[0].aiChatLimit !== 50 || freePlan[0].isLifetimeLimit) {
      // Update existing free plan to new limit and monthly settings
      await db.update(subscriptionPlans)
        .set({
          aiChatLimit: 50,
          isLifetimeLimit: false,
          billingInterval: 'monthly',
          description: 'Get started with 50 AI chats per month',
          features: ['basic_tracking', 'ai_chat', 'expense_tracking']
        })
        .where(eq(subscriptionPlans.id, freePlan[0].id));
      freePlan[0].aiChatLimit = 50;
      freePlan[0].isLifetimeLimit = false;
    }

    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return this.createSubscription({
      userId,
      planId: freePlan[0].id,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: endOfMonth,
      localCurrency: 'THB',
      localPrice: '0.00',
    });
  }

  async checkUsageLimit(userId: string, type: 'aiChatsUsed' | 'aiDeepAnalysisUsed'): Promise<{ allowed: boolean; usage: number; limit: number }> {
    const subscription = await this.getUserSubscription(userId);
    const usage = await this.getUserUsage(userId);

    if (!subscription) {
      return { allowed: false, usage: 0, limit: 0 };
    }

    // Free premium users have unlimited access
    if (subscription.freePremium) {
      return {
        allowed: true,
        usage: usage?.[type] || 0,
        limit: 999999 // Unlimited
      };
    }

    const currentUsage = usage?.[type] || 0;
    const limit = type === 'aiChatsUsed'
      ? subscription.plan.aiChatLimit || 0
      : subscription.plan.aiDeepAnalysisLimit || 0;

    // Check add-ons for extra quota
    const addOns = await this.getUserAddOns(userId);
    const extraQuota = addOns
      .filter(addon =>
        (type === 'aiChatsUsed' && addon.addOnType === 'extra_chats') ||
        (type === 'aiDeepAnalysisUsed' && addon.addOnType === 'extra_deep_analysis')
      )
      .reduce((total, addon) => total + addon.quantity, 0);

    const totalLimit = limit + extraQuota;

    return {
      allowed: currentUsage < totalLimit,
      usage: currentUsage,
      limit: totalLimit
    };
  }

  async resetUsage(userId: string): Promise<void> {
    const usage = await this.getUserUsage(userId);

    if (usage) {
      // Reset all usage counters to 0
      await this.updateUsageRecord(usage.id, {
        aiChatsUsed: 0,
        aiDeepAnalysisUsed: 0,
        aiInsightsGenerated: 0,
      });
    }
  }

  // Webhook idempotency methods
  async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    const result = await db.select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, eventId))
      .limit(1);
    return result.length > 0;
  }

  async markWebhookEventProcessed(eventId: string, eventType: string): Promise<void> {
    await db.insert(webhookEvents)
      .values({ id: eventId, eventType })
      .onConflictDoNothing();
  }

  async cleanupOldWebhookEvents(maxAgeHours: number): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    const result = await db.delete(webhookEvents)
      .where(lte(webhookEvents.processedAt, cutoff))
      .returning();
    return result.length;
  }

  // Tier-aware AI methods
  async getUserSubscriptionWithUsage(userId: string): Promise<{ subscription: Subscription; usage: UsageTracking | null; plan: SubscriptionPlan } | null> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      return null;
    }

    const usage = await this.getUserUsage(userId);

    return {
      subscription,
      usage: usage || null,
      plan: subscription.plan,
    };
  }

  async incrementUsageCounters(userId: string, subscriptionId: string, modelType: 'scout' | 'sonnet' | 'gpt5' | 'opus'): Promise<void> {
    let usage = await this.getUserUsage(userId);
    const subscription = await this.getUserSubscription(userId);
    const isLifetime = subscription?.plan?.isLifetimeLimit || false;

    if (!usage) {
      // Create new usage record with appropriate counters
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const periodStart = isLifetime ? now : startOfMonth;
      const periodEnd = isLifetime ? new Date('2099-12-31') : endOfMonth;

      await this.createUsageRecord({
        userId,
        subscriptionId,
        periodStart,
        periodEnd,
        scoutQueriesUsed: modelType === 'scout' ? 1 : 0,
        sonnetQueriesUsed: modelType === 'sonnet' ? 1 : 0,
        gpt5QueriesUsed: modelType === 'gpt5' ? 1 : 0,
        opusQueriesUsed: modelType === 'opus' ? 1 : 0,
        aiChatsUsed: 0,
        aiDeepAnalysisUsed: 0,
        aiInsightsGenerated: 0,
      });
    } else {
      // Update existing counters
      const updates: Partial<UsageTracking> = {};
      if (modelType === 'scout') {
        updates.scoutQueriesUsed = (usage.scoutQueriesUsed || 0) + 1;
      } else if (modelType === 'sonnet') {
        updates.sonnetQueriesUsed = (usage.sonnetQueriesUsed || 0) + 1;
      } else if (modelType === 'gpt5') {
        updates.gpt5QueriesUsed = (usage.gpt5QueriesUsed || 0) + 1;
      } else if (modelType === 'opus') {
        updates.opusQueriesUsed = (usage.opusQueriesUsed || 0) + 1;
      }

      await this.updateUsageRecord(usage.id, updates);
    }
  }

  async insertAIUsageLog(log: Omit<InsertAiUsageLog, 'id' | 'createdAt'>): Promise<void> {
    await db.insert(aiUsageLogs).values(log);
  }

  // Referral methods
  async getUserReferralCode(userId: string): Promise<ReferralCode | undefined> {
    const [result] = await db.select()
      .from(referralCodes)
      .where(and(eq(referralCodes.userId, userId), eq(referralCodes.isActive, true)))
      .limit(1);
    return result;
  }

  async createReferralCode(referralCode: InsertReferralCode): Promise<ReferralCode> {
    const [result] = await db.insert(referralCodes).values(referralCode).returning();
    return result;
  }

  async getReferralByCode(code: string): Promise<ReferralCode | undefined> {
    const [result] = await db.select()
      .from(referralCodes)
      .where(and(eq(referralCodes.code, code), eq(referralCodes.isActive, true)))
      .limit(1);
    return result;
  }

  async processReferral(referredUserId: string, referralCode: string): Promise<Referral> {
    const referralCodeRecord = await this.getReferralByCode(referralCode);
    if (!referralCodeRecord) {
      throw new Error('Invalid referral code');
    }

    // Check if referral already exists
    const [existingReferral] = await db.select()
      .from(referrals)
      .where(eq(referrals.referredUserId, referredUserId))
      .limit(1);

    if (existingReferral) {
      throw new Error('User has already been referred');
    }

    // Create referral record
    const [referral] = await db.insert(referrals).values({
      referrerUserId: referralCodeRecord.userId,
      referredUserId: referredUserId,
      referralCodeId: referralCodeRecord.id,
      status: 'pending'
    }).returning();

    // Update referral code usage count
    await db.update(referralCodes)
      .set({ currentUses: sql`${referralCodes.currentUses} + 1` })
      .where(eq(referralCodes.id, referralCodeRecord.id));

    return referral;
  }

  async getUserReferrals(userId: string): Promise<Referral[]> {
    return await db.select()
      .from(referrals)
      .where(eq(referrals.referrerUserId, userId))
      .orderBy(desc(referrals.createdAt));
  }

  async getUserBonusCredits(userId: string): Promise<BonusCredit[]> {
    return await db.select()
      .from(bonusCredits)
      .where(eq(bonusCredits.userId, userId))
      .orderBy(desc(bonusCredits.createdAt));
  }

  async addBonusCredits(bonusCredit: InsertBonusCredit): Promise<BonusCredit> {
    const [result] = await db.insert(bonusCredits).values(bonusCredit).returning();
    return result;
  }

  async getAvailableBonusCredits(userId: string): Promise<number> {
    const [result] = await db.select({
      total: sql<number>`sum(${bonusCredits.amount})`
    })
      .from(bonusCredits)
      .where(and(
        eq(bonusCredits.userId, userId),
        eq(bonusCredits.isUsed, false),
        or(
          sql`${bonusCredits.expiresAt} IS NULL`,
          gte(bonusCredits.expiresAt, new Date())
        )
      ));

    return result?.total || 0;
  }

  async useBonusCredits(userId: string, amount: number): Promise<void> {
    const availableCredits = await db.select()
      .from(bonusCredits)
      .where(and(
        eq(bonusCredits.userId, userId),
        eq(bonusCredits.isUsed, false),
        or(
          sql`${bonusCredits.expiresAt} IS NULL`,
          gte(bonusCredits.expiresAt, new Date())
        )
      ))
      .orderBy(bonusCredits.createdAt); // Use oldest credits first

    let remainingAmount = amount;
    const creditsToUpdate: string[] = [];

    for (const credit of availableCredits) {
      if (remainingAmount <= 0) break;

      if (credit.amount <= remainingAmount) {
        creditsToUpdate.push(credit.id);
        remainingAmount -= credit.amount;
      } else {
        // Partial use - split the credit
        await db.update(bonusCredits)
          .set({ amount: credit.amount - remainingAmount })
          .where(eq(bonusCredits.id, credit.id));

        // Create a new record for the used portion
        await db.insert(bonusCredits).values({
          userId: userId,
          amount: remainingAmount,
          source: credit.source,
          referralId: credit.referralId,
          description: `${credit.description} (used portion)`,
          expiresAt: credit.expiresAt,
          isUsed: true,
          usedAt: new Date()
        });

        remainingAmount = 0;
        break;
      }
    }

    // Mark credits as used
    if (creditsToUpdate.length > 0) {
      await db.update(bonusCredits)
        .set({ isUsed: true, usedAt: new Date() })
        .where(sql`${bonusCredits.id} = ANY(${creditsToUpdate})`);
    }

    if (remainingAmount > 0) {
      throw new Error('Insufficient bonus credits available');
    }
  }

  // Crypto methods
  async getCryptoHolding(id: string): Promise<CryptoHolding | undefined> {
    const [holding] = await db.select().from(cryptoHoldings).where(eq(cryptoHoldings.id, id));
    return holding;
  }

  async getUserCryptoHoldings(userId: string): Promise<CryptoHolding[]> {
    return await db.select()
      .from(cryptoHoldings)
      .where(eq(cryptoHoldings.userId, userId))
      .orderBy(desc(cryptoHoldings.createdAt));
  }

  async createCryptoHolding(holding: InsertCryptoHolding): Promise<CryptoHolding> {
    const [result] = await db.insert(cryptoHoldings).values(holding).returning();
    return result;
  }

  async updateCryptoHolding(id: string, updates: Partial<CryptoHolding>): Promise<CryptoHolding> {
    const [result] = await db.update(cryptoHoldings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cryptoHoldings.id, id))
      .returning();
    return result;
  }

  async deleteCryptoHolding(id: string): Promise<void> {
    await db.delete(cryptoHoldings).where(eq(cryptoHoldings.id, id));
  }

  async getCryptoPriceAlert(id: string): Promise<CryptoPriceAlert | undefined> {
    const [alert] = await db.select().from(cryptoPriceAlerts).where(eq(cryptoPriceAlerts.id, id));
    return alert;
  }

  async getUserCryptoPriceAlerts(userId: string): Promise<CryptoPriceAlert[]> {
    return await db.select()
      .from(cryptoPriceAlerts)
      .where(eq(cryptoPriceAlerts.userId, userId))
      .orderBy(desc(cryptoPriceAlerts.createdAt));
  }

  async createCryptoPriceAlert(alert: InsertCryptoPriceAlert): Promise<CryptoPriceAlert> {
    const [result] = await db.insert(cryptoPriceAlerts).values(alert).returning();
    return result;
  }

  async updateCryptoPriceAlert(id: string, updates: Partial<CryptoPriceAlert>): Promise<CryptoPriceAlert> {
    const [result] = await db.update(cryptoPriceAlerts)
      .set(updates)
      .where(eq(cryptoPriceAlerts.id, id))
      .returning();
    return result;
  }

  async deleteCryptoPriceAlert(id: string): Promise<void> {
    await db.delete(cryptoPriceAlerts).where(eq(cryptoPriceAlerts.id, id));
  }

  async getCryptoTransaction(id: string): Promise<CryptoTransaction | undefined> {
    const [transaction] = await db.select().from(cryptoTransactions).where(eq(cryptoTransactions.id, id));
    return transaction;
  }

  async getUserCryptoTransactions(userId: string, limit: number = 50): Promise<CryptoTransaction[]> {
    return await db.select()
      .from(cryptoTransactions)
      .where(eq(cryptoTransactions.userId, userId))
      .orderBy(desc(cryptoTransactions.transactionDate))
      .limit(limit);
  }

  async createCryptoTransaction(transaction: InsertCryptoTransaction): Promise<CryptoTransaction> {
    const [result] = await db.insert(cryptoTransactions).values(transaction).returning();
    return result;
  }

  async getUserCryptoPortfolioValue(userId: string): Promise<{
    totalValue: number;
    holdings: Array<{
      symbol: string;
      name: string;
      amount: string;
      currentPrice: string;
      value: number;
      change24h: number;
    }>;
  }> {
    const holdings = await this.getUserCryptoHoldings(userId);

    const result = {
      totalValue: 0,
      holdings: holdings.map(h => {
        const amount = parseFloat(h.amount);
        const price = parseFloat(h.currentPrice || '0');
        const value = amount * price;

        return {
          symbol: h.symbol,
          name: h.name,
          amount: h.amount,
          currentPrice: h.currentPrice || '0',
          value,
          change24h: 0 // Will be updated by API call
        };
      })
    };

    result.totalValue = result.holdings.reduce((sum, h) => sum + h.value, 0);
    return result;
  }

  // ===== Investment Intelligence Methods =====

  async getInvestmentStrategies(): Promise<InvestmentStrategy[]> {
    return await db.select().from(investmentStrategies).orderBy(investmentStrategies.category);
  }

  async getInvestmentStrategiesByCategory(category: string): Promise<InvestmentStrategy[]> {
    return await db.select()
      .from(investmentStrategies)
      .where(eq(investmentStrategies.category, category))
      .orderBy(investmentStrategies.expectedReturn);
  }

  async getPassiveIncomeOpportunities(): Promise<PassiveIncomeOpportunity[]> {
    return await db.select().from(passiveIncomeOpportunities).orderBy(passiveIncomeOpportunities.category);
  }

  async getPassiveIncomeOpportunitiesByCategory(category: string): Promise<PassiveIncomeOpportunity[]> {
    return await db.select()
      .from(passiveIncomeOpportunities)
      .where(eq(passiveIncomeOpportunities.category, category))
      .orderBy(passiveIncomeOpportunities.monthlyEarningsMax);
  }

  // ===== Financial Profile Methods =====

  async getUserFinancialProfile(userId: string): Promise<UserFinancialProfile | undefined> {
    const [profile] = await db.select().from(userFinancialProfiles)
      .where(eq(userFinancialProfiles.userId, userId));
    return profile;
  }

  async createUserFinancialProfile(profile: InsertUserFinancialProfile): Promise<UserFinancialProfile> {
    const [result] = await db.insert(userFinancialProfiles)
      .values(profile)
      .returning();
    return result;
  }

  async updateUserFinancialProfile(userId: string, updates: Partial<UserFinancialProfile>): Promise<UserFinancialProfile> {
    const [result] = await db.update(userFinancialProfiles)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(userFinancialProfiles.userId, userId))
      .returning();

    if (!result) {
      throw new Error('Financial profile not found');
    }
    return result;
  }

  async getUserExpenseCategories(userId: string): Promise<UserExpenseCategory[]> {
    return await db.select()
      .from(userExpenseCategories)
      .where(eq(userExpenseCategories.userId, userId));
  }

  async updateUserExpenseCategories(userId: string, categories: InsertUserExpenseCategory[]): Promise<UserExpenseCategory[]> {
    return await db.transaction(async (tx) => {
      // Delete existing categories
      await tx.delete(userExpenseCategories)
        .where(eq(userExpenseCategories.userId, userId));

      // Insert new categories with userId
      if (categories.length > 0) {
        const valuesToInsert = categories.map(cat => ({
          ...cat,
          userId
        }));
        await tx.insert(userExpenseCategories).values(valuesToInsert);
      }

      // Return updated list
      return await tx.select()
        .from(userExpenseCategories)
        .where(eq(userExpenseCategories.userId, userId));
    });
  }

  async getUserDebts(userId: string): Promise<UserDebt[]> {
    return await db.select()
      .from(userDebts)
      .where(eq(userDebts.userId, userId));
  }

  async createUserDebt(debt: InsertUserDebt): Promise<UserDebt> {
    const [result] = await db.insert(userDebts)
      .values(debt)
      .returning();
    return result;
  }

  async updateUserDebt(id: string, updates: Partial<UserDebt>): Promise<UserDebt> {
    const [result] = await db.update(userDebts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userDebts.id, id))
      .returning();

    if (!result) {
      throw new Error('Debt not found');
    }
    return result;
  }

  async deleteUserDebt(id: string): Promise<void> {
    const result = await db.delete(userDebts)
      .where(eq(userDebts.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Debt not found');
    }
  }

  async getUserAssets(userId: string): Promise<UserAsset[]> {
    return await db.select()
      .from(userAssets)
      .where(eq(userAssets.userId, userId));
  }

  async createUserAsset(asset: InsertUserAsset): Promise<UserAsset> {
    const [result] = await db.insert(userAssets)
      .values(asset)
      .returning();
    return result;
  }

  async updateUserAsset(id: string, updates: Partial<UserAsset>): Promise<UserAsset> {
    const [result] = await db.update(userAssets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userAssets.id, id))
      .returning();

    if (!result) {
      throw new Error('Asset not found');
    }
    return result;
  }

  async deleteUserAsset(id: string): Promise<void> {
    const result = await db.delete(userAssets)
      .where(eq(userAssets.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Asset not found');
    }
  }

  // Playbook methods
  async getPlaybook(id: string): Promise<Playbook | undefined> {
    const [playbook] = await db.select().from(playbooks).where(eq(playbooks.id, id));
    return playbook;
  }

  async getPlaybooksByUserId(userId: string, limit: number = 10): Promise<Playbook[]> {
    return await db
      .select()
      .from(playbooks)
      .where(eq(playbooks.userId, userId))
      .orderBy(desc(playbooks.weekStartDate))
      .limit(limit);
  }

  async createPlaybook(playbook: InsertPlaybook): Promise<Playbook> {
    const [result] = await db.insert(playbooks).values(playbook).returning();
    return result;
  }

  async updatePlaybook(id: string, updates: Partial<Playbook>): Promise<Playbook> {
    const [result] = await db
      .update(playbooks)
      .set(updates)
      .where(eq(playbooks.id, id))
      .returning();

    if (!result) {
      throw new Error('Playbook not found');
    }
    return result;
  }

  async deletePlaybook(id: string): Promise<void> {
    const result = await db.delete(playbooks)
      .where(eq(playbooks.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Playbook not found');
    }
  }

  async markPlaybookViewed(id: string): Promise<void> {
    await db.update(playbooks)
      .set({ isViewed: true, viewedAt: new Date() })
      .where(eq(playbooks.id, id));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // WORLD-CLASS SCORING SYSTEM - Database implementations
  // ═══════════════════════════════════════════════════════════════════════

  async getMonthlyFinancials(userId: string, fromMonth: Date, toMonth: Date): Promise<MonthlyFinancials[]> {
    return await db
      .select()
      .from(monthlyFinancials)
      .where(
        and(
          eq(monthlyFinancials.userId, userId),
          gte(monthlyFinancials.month, fromMonth),
          lte(monthlyFinancials.month, toMonth)
        )
      )
      .orderBy(desc(monthlyFinancials.month));
  }

  async upsertMonthlyFinancials(data: InsertMonthlyFinancials): Promise<MonthlyFinancials> {
    const [result] = await db
      .insert(monthlyFinancials)
      .values(data)
      .onConflictDoUpdate({
        target: [monthlyFinancials.userId, monthlyFinancials.month],
        set: {
          incomeCents: data.incomeCents,
          expenseCents: data.expenseCents,
          fixedExpenseCents: data.fixedExpenseCents,
          emergencyFundCents: data.emergencyFundCents,
          totalDebtCents: data.totalDebtCents,
          investmentContribCents: data.investmentContribCents,
          insuredAmountCents: data.insuredAmountCents,
          transactionCount: data.transactionCount,
          updatedAt: new Date()
        }
      })
      .returning();
    return result;
  }

  async getLatestScoreSnapshot(userId: string): Promise<ScoreSnapshot | undefined> {
    const [result] = await db
      .select()
      .from(scoreSnapshots)
      .where(eq(scoreSnapshots.userId, userId))
      .orderBy(desc(scoreSnapshots.month))
      .limit(1);
    return result;
  }

  async getScoreSnapshots(userId: string, limit: number = 12): Promise<ScoreSnapshot[]> {
    return await db
      .select()
      .from(scoreSnapshots)
      .where(eq(scoreSnapshots.userId, userId))
      .orderBy(desc(scoreSnapshots.month))
      .limit(limit);
  }

  async upsertScoreSnapshot(data: InsertScoreSnapshot): Promise<ScoreSnapshot> {
    const [result] = await db
      .insert(scoreSnapshots)
      .values(data)
      .onConflictDoUpdate({
        target: [scoreSnapshots.userId, scoreSnapshots.month],
        set: {
          cashflowScore: data.cashflowScore,
          stabilityScore: data.stabilityScore,
          growthScore: data.growthScore,
          behaviorScore: data.behaviorScore,
          twealthIndex: data.twealthIndex,
          band: data.band,
          confidence: data.confidence,
          drivers: data.drivers,
          components: data.components
        }
      })
      .returning();
    return result;
  }
}

// In-memory storage for local development without database
class InMemoryStorage implements Partial<IStorage> {
  private users: Map<string, User> = new Map();
  private subscriptions: Map<string, Subscription & { plan: SubscriptionPlan }> = new Map();
  private usageRecords: Map<string, UsageTracking> = new Map();
  private userPreferences: Map<string, UserPreferences> = new Map();
  private financialPreferences: Map<string, FinancialPreferences> = new Map();
  private privacySettings: Map<string, PrivacySettings> = new Map();
  private userSettings: Map<string, UserSettings> = new Map();
  private userFinancialProfiles: Map<string, UserFinancialProfile> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private financialGoals: Map<string, FinancialGoal> = new Map();
  private budgets: Map<string, Budget> = new Map();
  private chatConversations: Map<string, ChatConversation> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private groups: Map<string, Group> = new Map();
  private events: Map<string, Event> = new Map();

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id);
    const user: User = {
      id: userData.id,
      email: userData.email || existing?.email || null,
      firstName: userData.firstName || existing?.firstName || null,
      lastName: userData.lastName || existing?.lastName || null,
      profileImageUrl: userData.profileImageUrl || existing?.profileImageUrl || null,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  async getUserByUsername(_username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<SafeUser> {
    const id = `user_${Date.now()}`;
    const user: User = {
      id,
      email: insertUser.email || null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<SafeUser> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async getFirstUser(): Promise<User | undefined> {
    return Array.from(this.users.values())[0];
  }

  // Subscription methods
  async getUserSubscription(userId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | undefined> {
    return this.subscriptions.get(userId);
  }

  async initializeDefaultSubscription(userId: string): Promise<Subscription> {
    const freePlan: SubscriptionPlan = {
      id: 'free_plan',
      name: 'Free',
      displayName: 'Free',
      description: 'Basic free plan',
      currency: 'USD',
      isActive: true,
      priceThb: '0',
      priceUsd: '0',
      billingInterval: 'monthly',
      stripePriceId: null,
      features: ['Basic AI Chat', 'Financial Tracking', 'Goal Setting'],
      aiChatLimit: 10,
      aiDeepAnalysisLimit: 2,
      aiInsightsFrequency: 'never',
      scoutLimit: 50,
      sonnetLimit: 20,
      gpt5Limit: 10,
      opusLimit: 5,
      isLifetimeLimit: false,
      sortOrder: 0,
      createdAt: new Date(),
    };

    const subscription: Subscription & { plan: SubscriptionPlan } = {
      id: `sub_${userId}`,
      userId,
      planId: 'free_plan',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      createdAt: new Date(),
      cancelledAt: null,
      trialEnd: null,
      localCurrency: 'USD',
      localPrice: null,
      freePremium: false,
      plan: freePlan,
    };

    this.subscriptions.set(userId, subscription);

    // Initialize usage tracking
    const usage: UsageTracking = {
      id: `usage_${userId}`,
      userId,
      subscriptionId: subscription.id,
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      aiChatsUsed: 0,
      aiDeepAnalysisUsed: 0,
      aiInsightsGenerated: 0,
      scoutQueriesUsed: 0,
      sonnetQueriesUsed: 0,
      gpt5QueriesUsed: 0,
      opusQueriesUsed: 0,
      totalTokensUsed: 0,
      estimatedCostUsd: '0',
      lastResetAt: new Date(),
      createdAt: new Date(),
    };
    this.usageRecords.set(userId, usage);

    return subscription;
  }

  async getUserUsage(userId: string): Promise<UsageTracking | undefined> {
    return this.usageRecords.get(userId);
  }

  // User Preferences methods
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    return this.userPreferences.get(userId);
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = `prefs_${Date.now()}`;
    const prefs: UserPreferences = {
      id,
      userId: preferences.userId,
      theme: preferences.theme || 'system',
      currency: preferences.currency || 'USD',
      language: preferences.language || 'en',
      timeZone: preferences.timeZone || 'UTC',
      dateFormat: preferences.dateFormat || 'MM/dd/yyyy',
      hasCompletedOnboarding: preferences.hasCompletedOnboarding ?? false,
      onboardingStep: preferences.onboardingStep ?? null,
      onboardingData: preferences.onboardingData || null,
      emailNotifications: preferences.emailNotifications ?? true,
      pushNotifications: preferences.pushNotifications ?? true,
      marketingEmails: preferences.marketingEmails ?? false,
      weeklyReports: preferences.weeklyReports ?? true,
      goalReminders: preferences.goalReminders ?? true,
      expenseAlerts: preferences.expenseAlerts ?? true,
      cryptoEnabled: preferences.cryptoEnabled ?? false,
      experienceLevel: preferences.experienceLevel || 'beginner',
      preferredCurrencies: preferences.preferredCurrencies || ['USD'],
      demoMode: preferences.demoMode ?? true,
      countryCode: preferences.countryCode || 'US',
      monthlyIncomeEstimate: preferences.monthlyIncomeEstimate || null,
      monthlyExpensesEstimate: preferences.monthlyExpensesEstimate || null,
      currentSavingsEstimate: preferences.currentSavingsEstimate || null,
      conversationMemory: preferences.conversationMemory || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userPreferences.set(preferences.userId, prefs);
    return prefs;
  }

  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    let prefs = this.userPreferences.get(userId);
    if (!prefs) {
      // Create default preferences if they don't exist
      prefs = await this.createUserPreferences({ userId, theme: 'system' });
    }
    const updated = { ...prefs, ...updates, updatedAt: new Date() };
    this.userPreferences.set(userId, updated);
    return updated;
  }

  // Financial Preferences methods
  async getFinancialPreferences(userId: string): Promise<FinancialPreferences | undefined> {
    return this.financialPreferences.get(userId);
  }

  async createFinancialPreferences(preferences: InsertFinancialPreferences): Promise<FinancialPreferences> {
    const id = `finprefs_${Date.now()}`;
    const prefs: FinancialPreferences = {
      id,
      userId: preferences.userId,
      defaultBudgetPeriod: preferences.defaultBudgetPeriod || 'monthly',
      budgetWarningThreshold: preferences.budgetWarningThreshold ?? 80,
      autoSavingsEnabled: preferences.autoSavingsEnabled ?? false,
      autoSavingsAmount: preferences.autoSavingsAmount || '0',
      autoSavingsFrequency: preferences.autoSavingsFrequency || 'monthly',
      defaultGoalPriority: preferences.defaultGoalPriority || 'medium',
      expenseCategories: preferences.expenseCategories || null,
      incomeCategories: preferences.incomeCategories || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.financialPreferences.set(preferences.userId, prefs);
    return prefs;
  }

  async updateFinancialPreferences(userId: string, updates: Partial<FinancialPreferences>): Promise<FinancialPreferences> {
    let prefs = this.financialPreferences.get(userId);
    if (!prefs) {
      prefs = await this.createFinancialPreferences({
        userId,
        defaultBudgetPeriod: 'monthly',
        autoSavingsAmount: '0',
        autoSavingsFrequency: 'monthly',
        defaultGoalPriority: 'medium',
      });
    }
    const updated = { ...prefs, ...updates, updatedAt: new Date() };
    this.financialPreferences.set(userId, updated);
    return updated;
  }

  // Privacy Settings methods
  async getPrivacySettings(userId: string): Promise<PrivacySettings | undefined> {
    return this.privacySettings.get(userId);
  }

  async createPrivacySettings(settings: InsertPrivacySettings): Promise<PrivacySettings> {
    const id = `privacy_${Date.now()}`;
    const priv: PrivacySettings = {
      id,
      userId: settings.userId,
      profileVisibility: settings.profileVisibility || 'private',
      dataRetentionPeriod: settings.dataRetentionPeriod ?? 365,
      allowAnalytics: settings.allowAnalytics ?? true,
      allowCookies: settings.allowCookies ?? true,
      shareDataWithPartners: settings.shareDataWithPartners ?? false,
      allowDataExport: settings.allowDataExport ?? true,
      twoFactorEnabled: settings.twoFactorEnabled ?? false,
      lastPasswordChange: null,
      lastDataExport: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.privacySettings.set(settings.userId, priv);
    return priv;
  }

  async updatePrivacySettings(userId: string, updates: Partial<PrivacySettings>): Promise<PrivacySettings> {
    let settings = this.privacySettings.get(userId);
    if (!settings) {
      settings = await this.createPrivacySettings({ userId, profileVisibility: 'private' });
    }
    const updated = { ...settings, ...updates, updatedAt: new Date() };
    this.privacySettings.set(userId, updated);
    return updated;
  }

  // User Settings methods
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    return this.userSettings.get(userId);
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const id = `settings_${Date.now()}`;
    const s: UserSettings = {
      id,
      userId: settings.userId,
      hourlyRate: settings.hourlyRate || '50',
      currency: settings.currency || 'USD',
      workHoursPerWeek: settings.workHoursPerWeek ?? 40,
      timeValueStrategy: settings.timeValueStrategy || 'fixed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userSettings.set(settings.userId, s);
    return s;
  }

  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    let settings = this.userSettings.get(userId);
    if (!settings) {
      settings = await this.createUserSettings({ userId, hourlyRate: '50', timeValueStrategy: 'fixed' });
    }
    const updated = { ...settings, ...updates, updatedAt: new Date() };
    this.userSettings.set(userId, updated);
    return updated;
  }

  // Financial Profile methods
  async getUserFinancialProfile(userId: string): Promise<UserFinancialProfile | undefined> {
    return this.userFinancialProfiles.get(userId);
  }

  async createUserFinancialProfile(profile: InsertUserFinancialProfile): Promise<UserFinancialProfile> {
    const id = `profile_${Date.now()}`;
    const p: UserFinancialProfile = {
      id,
      userId: profile.userId,
      monthlyIncome: profile.monthlyIncome,
      monthlyExpenses: profile.monthlyExpenses,
      monthlySavings: profile.monthlySavings,
      totalSavings: profile.totalSavings,
      savingsGoal: profile.savingsGoal,
      emergencyFund: profile.emergencyFund,
      createdAt: new Date(),
      lastUpdated: new Date(),
    };
    this.userFinancialProfiles.set(profile.userId, p);
    return p;
  }

  async updateUserFinancialProfile(userId: string, updates: Partial<UserFinancialProfile>): Promise<UserFinancialProfile> {
    let profile = this.userFinancialProfiles.get(userId);
    if (!profile) throw new Error('Financial profile not found');
    const updated = { ...profile, ...updates, lastUpdated: new Date() };
    this.userFinancialProfiles.set(userId, updated);
    return updated;
  }

  // Transaction methods
  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByUserId(userId: string, limit?: number): Promise<Transaction[]> {
    const txns = Array.from(this.transactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return limit ? txns.slice(0, limit) : txns;
  }

  async getTransactionsByGoalId(goalId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(t => t.goalId === goalId);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const t: Transaction = {
      id,
      userId: transaction.userId || '',
      type: transaction.type,
      category: transaction.category || 'other',
      amount: transaction.amount,
      description: transaction.description || null,
      date: transaction.date,
      goalId: transaction.goalId || null,
      destination: transaction.destination || null,
      isArchived: transaction.isArchived ?? false,
      isFlagged: transaction.isFlagged ?? false,
      createdAt: new Date(),
    };
    this.transactions.set(id, t);
    return t;
  }

  async bulkCreateTransactions(transactions: InsertTransaction[]): Promise<Transaction[]> {
    return Promise.all(transactions.map(t => this.createTransaction(t)));
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const t = this.transactions.get(id);
    if (!t) throw new Error('Transaction not found');
    const updated = { ...t, ...updates };
    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: string): Promise<void> {
    this.transactions.delete(id);
  }

  async getFinancialSummary(userId: string, _months?: number) {
    const txns = await this.getTransactionsByUserId(userId);
    const income = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expenses = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return {
      totalIncome: income,
      totalExpenses: expenses,
      averageMonthlyIncome: income,
      averageMonthlyExpenses: expenses,
      netCashFlow: income - expenses,
      transactionCount: txns.length,
      categoryBreakdown: {},
    };
  }

  // Financial Goal methods
  async getFinancialGoal(id: string): Promise<FinancialGoal | undefined> {
    return this.financialGoals.get(id);
  }

  async getFinancialGoalsByUserId(userId: string): Promise<FinancialGoal[]> {
    return Array.from(this.financialGoals.values()).filter(g => g.userId === userId);
  }

  async createFinancialGoal(goal: InsertFinancialGoal): Promise<FinancialGoal> {
    const id = `goal_${Date.now()}`;
    const g: FinancialGoal = {
      id,
      userId: goal.userId,
      title: goal.title,
      description: goal.description || null,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount || '0',
      targetDate: goal.targetDate,
      category: goal.category || null,
      priority: goal.priority || 'medium',
      status: goal.status || 'active',
      createdAt: new Date(),
    };
    this.financialGoals.set(id, g);
    return g;
  }

  async updateFinancialGoal(id: string, updates: Partial<FinancialGoal>): Promise<FinancialGoal> {
    const g = this.financialGoals.get(id);
    if (!g) throw new Error('Goal not found');
    const updated = { ...g, ...updates };
    this.financialGoals.set(id, updated);
    return updated;
  }

  async deleteFinancialGoal(id: string): Promise<void> {
    this.financialGoals.delete(id);
  }

  // Budget methods
  async getBudget(id: string): Promise<Budget | undefined> {
    return this.budgets.get(id);
  }

  async getBudgetsByUserId(userId: string): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(b => b.userId === userId);
  }

  async getBudgetByUserAndCategory(userId: string, category: string): Promise<Budget | undefined> {
    return Array.from(this.budgets.values()).find(b => b.userId === userId && b.category === category);
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const id = `budget_${Date.now()}`;
    const b: Budget = {
      id,
      userId: budget.userId || '',
      category: budget.category,
      monthlyLimit: budget.monthlyLimit,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.budgets.set(id, b);
    return b;
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    const b = this.budgets.get(id);
    if (!b) throw new Error('Budget not found');
    const updated = { ...b, ...updates, updatedAt: new Date() };
    this.budgets.set(id, updated);
    return updated;
  }

  async deleteBudget(id: string): Promise<void> {
    this.budgets.delete(id);
  }

  // Chat methods
  async getChatConversations(userId: string): Promise<ChatConversation[]> {
    return Array.from(this.chatConversations.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.lastMessageAt || b.createdAt || 0).getTime() - new Date(a.lastMessageAt || a.createdAt || 0).getTime());
  }

  async getChatConversation(id: string): Promise<ChatConversation | undefined> {
    return this.chatConversations.get(id);
  }

  async getChatConversationWithMessages(id: string): Promise<(ChatConversation & { messages: ChatMessage[] }) | undefined> {
    const conversation = this.chatConversations.get(id);
    if (!conversation) return undefined;
    const messages = Array.from(this.chatMessages.values())
      .filter(m => m.conversationId === id)
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    return { ...conversation, messages };
  }

  async createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    const id = `conv_${Date.now()}`;
    const c: ChatConversation = {
      id,
      userId: conversation.userId,
      title: conversation.title || null,
      isActive: conversation.isActive ?? true,
      lastMessageAt: new Date(),
      createdAt: new Date(),
    };
    this.chatConversations.set(id, c);
    return c;
  }

  async updateChatConversation(id: string, updates: Partial<ChatConversation>): Promise<ChatConversation> {
    const c = this.chatConversations.get(id);
    if (!c) throw new Error('Conversation not found');
    const updated = { ...c, ...updates };
    this.chatConversations.set(id, updated);
    return updated;
  }

  async deleteChatConversation(id: string): Promise<void> {
    this.chatConversations.delete(id);
    // Also delete associated messages
    for (const [msgId, msg] of this.chatMessages) {
      if (msg.conversationId === id) {
        this.chatMessages.delete(msgId);
      }
    }
  }

  async getChatMessages(conversationId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const m: ChatMessage = {
      id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      userContext: message.userContext || null,
      tokenCount: message.tokenCount || null,
      cost: message.cost || null,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, m);
    // Update conversation lastMessageAt
    const conv = this.chatConversations.get(message.conversationId);
    if (conv) {
      conv.lastMessageAt = new Date();
      this.chatConversations.set(message.conversationId, conv);
    }
    return m;
  }

  async getChatMessagesByUserId(userId: string): Promise<ChatMessage[]> {
    const userConvs = await this.getChatConversations(userId);
    const convIds = new Set(userConvs.map(c => c.id));
    return Array.from(this.chatMessages.values()).filter(m => convIds.has(m.conversationId));
  }

  // Notification methods
  async getNotificationsByUserId(userId: string, limit?: number, _offset?: number, includeRead?: boolean): Promise<Notification[]> {
    let notifs = Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    if (!includeRead) {
      notifs = notifs.filter(n => !n.isRead);
    }
    return limit ? notifs.slice(0, limit) : notifs;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return Array.from(this.notifications.values()).filter(n => n.userId === userId && !n.isRead).length;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = `notif_${Date.now()}`;
    const n: Notification = {
      id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: false,
      actionUrl: notification.actionUrl || null,
      metadata: notification.metadata || null,
      expiresAt: notification.expiresAt || null,
      createdAt: new Date(),
    };
    this.notifications.set(id, n);
    return n;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const n = this.notifications.get(id);
    if (!n) throw new Error('Notification not found');
    n.isRead = true;
    n.readAt = new Date();
    this.notifications.set(id, n);
    return n;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    for (const [id, n] of this.notifications) {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        n.readAt = new Date();
        this.notifications.set(id, n);
      }
    }
  }

  async generateSmartNotifications(_userId: string): Promise<Notification[]> {
    return [];
  }

  // User Stats
  async getUserStats(userId: string) {
    const goals = await this.getFinancialGoalsByUserId(userId);
    const txns = await this.getTransactionsByUserId(userId);
    const savings = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0) -
      txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return {
      totalSavings: savings,
      activeGoals: goals.filter(g => g.status === 'active').length,
      monthlyIncome: 0,
      upcomingEvents: 0,
    };
  }

  // Subscription plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return [{
      id: 'free_plan',
      name: 'Free',
      displayName: 'Free',
      description: 'Basic free plan',
      currency: 'USD',
      isActive: true,
      priceThb: '0',
      priceUsd: '0',
      monthlyPrice: '0',
      yearlyPrice: '0',
      features: ['Basic AI Chat', 'Financial Tracking', 'Goal Setting'],
      aiChatLimit: 10,
      aiDeepAnalysisLimit: 2,
      scoutQueriesLimit: 50,
      sonnetQueriesLimit: 20,
      gpt5QueriesLimit: 10,
      opusQueriesLimit: 5,
      isLifetimeLimit: false,
      sortOrder: 0,
      createdAt: new Date(),
    }];
  }

  async getSubscriptionPlan(_id: string): Promise<SubscriptionPlan | undefined> {
    return (await this.getSubscriptionPlans())[0];
  }

  // Stub methods for features we don't need for local dev
  async getGroup(_id: string) { return undefined; }
  async getGroupsByUserId(_userId: string) { return []; }
  async createGroup(group: any) {
    const id = `group_${Date.now()}`;
    const g = { id, ...group, createdAt: new Date() };
    this.groups.set(id, g);
    return g;
  }
  async updateGroup(id: string, updates: any) {
    const g = this.groups.get(id);
    if (!g) throw new Error('Group not found');
    const updated = { ...g, ...updates };
    this.groups.set(id, updated);
    return updated;
  }
  async deleteGroup(id: string) { this.groups.delete(id); }
  async getGroupMembers(_groupId: string) { return []; }
  async getGroupMembersWithUserInfo(_groupId: string) { return []; }
  async addGroupMember(member: any) { return { id: `member_${Date.now()}`, ...member }; }
  async removeGroupMember(_groupId: string, _userId: string) { }
  async updateGroupMemberRole(_groupId: string, _userId: string, role: string) { return { id: '', groupId: '', userId: '', role, joinedAt: new Date() }; }

  async getEvent(_id: string) { return undefined; }
  async getEventsByUserId(_userId: string) { return []; }
  async getEventsByGroupId(_groupId: string) { return []; }
  async getUserAccessibleEventsWithGroups(_userId: string) { return []; }
  async getUpcomingEvents(_userId: string) { return []; }
  async getUpcomingEventsWithAttendees(_userId: string) { return []; }
  async createEvent(event: any) {
    const id = `event_${Date.now()}`;
    const e = { id, ...event, createdAt: new Date() };
    this.events.set(id, e);
    return e;
  }
  async updateEvent(id: string, updates: any) {
    const e = this.events.get(id);
    if (!e) throw new Error('Event not found');
    const updated = { ...e, ...updates };
    this.events.set(id, updated);
    return updated;
  }
  async deleteEvent(id: string) { this.events.delete(id); }

  async getGoalContributions(_goalId: string) { return []; }
  async createGoalContribution(contribution: any) { return { id: `contrib_${Date.now()}`, ...contribution }; }
  async getGoalMilestones(_goalId: string) { return []; }
  async getUnseenMilestones(_userId: string) { return []; }
  async createGoalMilestone(milestone: any) { return { id: `milestone_${Date.now()}`, ...milestone }; }
  async markMilestonesSeen(_userId: string) { }
  async checkAndCreateMilestones(_userId: string, _goalId: string, _currentAmount: number, _targetAmount: number) { return []; }
  async getUserStreak(_userId: string) { return null; }
  async checkInStreak(_userId: string) { return { streakIncreased: false, newStreak: 0, newAchievements: [] }; }
  async getUserAchievements(_userId: string) { return []; }
  async exportUserData(_userId: string, format: 'json' | 'csv') { return format === 'json' ? '{}' : ''; }
  async deleteUserData(_userId: string) { }
}

// Export appropriate storage based on database availability
export const storage: IStorage = db ? new DatabaseStorage() : new InMemoryStorage() as unknown as IStorage;
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
  type GoalContribution,
  type InsertGoalContribution,
  type GroupInvite,
  type InsertGroupInvite,
  type CalendarShare,
  type InsertCalendarShare,
  type FriendRequest,
  type InsertFriendRequest,
  type Friendship,
  type InsertFriendship,
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
  users,
  groups,
  groupMembers,
  events,
  financialGoals,
  transactions,
  goalContributions,
  groupInvites,
  calendarShares,
  friendRequests,
  friendships,
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
  subscriptionPlans,
  subscriptions,
  usageTracking,
  subscriptionAddOns,
  referralCodes,
  referrals,
  bonusCredits,
  cryptoHoldings,
  cryptoPriceAlerts,
  cryptoTransactions
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
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  // Goal contribution methods
  getGoalContributions(goalId: string): Promise<GoalContribution[]>;
  createGoalContribution(contribution: InsertGoalContribution): Promise<GoalContribution>;

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

  // Subscription Plan methods
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>;

  // Subscription methods
  getUserSubscription(userId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  // User methods (IMPORTANT - these are mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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
      .values({
        ...insertTransaction,
        description: insertTransaction.description || null,
        goalId: insertTransaction.goalId || null,
      })
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

    return {
      totalSavings: parseFloat(userGoals?.totalSavings?.toString() || "0"),
      activeGoals: userGoals?.activeGoals || 0,
      monthlyIncome: parseFloat(incomeData?.monthlyIncome?.toString() || "0"),
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

  // Smart notification generation
  async generateSmartNotifications(userId: string): Promise<Notification[]> {
    const newNotifications: Notification[] = [];
    
    // Check various conditions and generate notifications
    const deadlineNotifications = await this.checkGoalDeadlines(userId);
    const transactionNotifications = await this.checkTransactionReminders(userId);
    const budgetNotifications = await this.checkBudgetWarnings(userId);
    const completionNotifications = await this.checkGoalCompletions(userId);

    newNotifications.push(...deadlineNotifications);
    newNotifications.push(...transactionNotifications);
    newNotifications.push(...budgetNotifications);
    newNotifications.push(...completionNotifications);

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
          title: `Goal "${goal.title}" needs attention! 📅`,
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
      const notification = await this.createNotification({
        userId,
        type: 'transaction_reminder',
        title: `Don't forget to track your expenses! 💰`,
        message: `You haven't added any transactions in the last 7 days. Keep track of your spending to stay on top of your financial goals.`,
        priority: 'normal',
        category: 'transactions',
        data: { daysSinceLastTransaction: 7 },
        actionType: 'add_transaction',
        actionData: { type: 'expense' }
      });

      newNotifications.push(notification);
    }

    return newNotifications;
  }

  async checkBudgetWarnings(userId: string): Promise<Notification[]> {
    const newNotifications: Notification[] = [];
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
        title: `Budget Alert: Spending Exceeds Income! ⚠️`,
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
          title: `Almost there! Goal "${goal.title}" is ${progressPercent.toFixed(0)}% complete! 🎯`,
          message: `You're so close! Just $${remainingAmount.toFixed(2)} more to reach your ${goal.title} goal. Keep it up!`,
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
          title: `🎉 Congratulations! You completed "${goal.title}"!`,
          message: `Amazing work! You've reached your ${goal.title} goal of $${targetAmount.toFixed(2)}. Time to set a new financial goal!`,
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
      .values({
        ...insertPreferences,
        theme: insertPreferences.theme || "system",
        language: insertPreferences.language || "en",
        timeZone: insertPreferences.timeZone || "UTC",
        dateFormat: insertPreferences.dateFormat || "MM/dd/yyyy",
        currency: insertPreferences.currency || "USD",
      })
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
      createdAt: subscriptions.createdAt,
      plan: {
        id: subscriptionPlans.id,
        name: subscriptionPlans.name,
        displayName: subscriptionPlans.displayName,
        description: subscriptionPlans.description,
        priceThb: subscriptionPlans.priceThb,
        priceUsd: subscriptionPlans.priceUsd,
        currency: subscriptionPlans.currency,
        billingInterval: subscriptionPlans.billingInterval,
        aiChatLimit: subscriptionPlans.aiChatLimit,
        aiDeepAnalysisLimit: subscriptionPlans.aiDeepAnalysisLimit,
        aiInsightsFrequency: subscriptionPlans.aiInsightsFrequency,
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
    
    if (!usage) {
      // Create new usage record for this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const subscription = await this.getUserSubscription(userId);
      
      usage = await this.createUsageRecord({
        userId,
        subscriptionId: subscription?.id || null,
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
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
          description: 'Basic financial tracking with limited AI features',
          priceThb: '0.00',
          priceUsd: '0.00',
          currency: 'THB',
          billingInterval: 'monthly',
          aiChatLimit: 5,
          aiDeepAnalysisLimit: 0,
          aiInsightsFrequency: 'weekly',
          features: ['basic_tracking', 'manual_transactions', 'simple_goals'],
          sortOrder: 0,
        })
        .returning();
      freePlan = [newFreePlan];
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
}

export const storage = new DatabaseStorage();
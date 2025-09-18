import { 
  type User, 
  type InsertUser, 
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
  type EventExpense,
  type InsertEventExpense,
  type EventExpenseShare,
  type InsertEventExpenseShare,
  users,
  groups,
  groupMembers,
  events,
  financialGoals,
  transactions,
  goalContributions,
  groupInvites,
  calendarShares,
  eventExpenses,
  eventExpenseShares
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, sql, or, exists } from "drizzle-orm";
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

export interface IStorage {
  // User methods
  getUser(id: string): Promise<SafeUser | undefined>;
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
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  removeGroupMember(groupId: string, userId: string): Promise<void>;
  updateGroupMemberRole(groupId: string, userId: string, role: string): Promise<GroupMember>;

  // Event methods
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByUserId(userId: string): Promise<Event[]>;
  getEventsByGroupId(groupId: string): Promise<Event[]>;
  getUserAccessibleEventsWithGroups(userId: string): Promise<EventWithGroup[]>;
  getUpcomingEvents(userId: string, limit?: number): Promise<Event[]>;
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
  createDemoUserIfNeeded(): Promise<SafeUser>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<SafeUser | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;
    // Return user without password
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<SafeUser> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
        firstName: insertUser.firstName || null,
        lastName: insertUser.lastName || null,
        avatar: insertUser.avatar || null,
      })
      .returning();
    
    // Return user without password
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<SafeUser> {
    // If password is being updated, hash it
    const updateData = { ...updates };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    
    // Return user without password
    const { password, ...safeUser } = user;
    return safeUser;
  }

  // Group methods
  async getGroup(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group || undefined;
  }

  async getGroupsByUserId(userId: string): Promise<Group[]> {
    const userGroups = await db
      .select({ group: groups })
      .from(groups)
      .leftJoin(groupMembers, eq(groups.id, groupMembers.groupId))
      .where(eq(groupMembers.userId, userId));
    
    return userGroups.map(ug => ug.group);
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

  async getUserAccessibleEventsWithGroups(userId: string): Promise<EventWithGroup[]> {
    // Get personal events (events created by the user with no group)
    const personalEvents = await db
      .select({
        event: events,
        groupName: sql<string | null>`NULL`,
        groupColor: sql<string | null>`NULL`,
      })
      .from(events)
      .where(and(eq(events.createdBy, userId), sql`group_id IS NULL`));

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
      .where(eq(groupMembers.userId, userId));

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
    if (transaction.goalId && transaction.type === "transfer") {
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
    if (!user) return undefined;
    // Return user without password
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async createDemoUserIfNeeded(): Promise<SafeUser> {
    let user = await this.getFirstUser();
    if (!user) {
      user = await this.createUser({
        username: "demo_user",
        email: "demo@example.com",
        password: "demo_password"
      });
    }
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

    const shareUrl = `/public/calendar/${token}`;
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
          eq(calendarShares.userId, userId),
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

    if (share.scope === "user" && share.userId) {
      return await this.getEventsByUserId(share.userId);
    } else if (share.scope === "group" && share.groupId) {
      return await this.getEventsByGroupId(share.groupId);
    }

    return [];
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
}

export const storage = new DatabaseStorage();
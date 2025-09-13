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
  users,
  groups,
  groupMembers,
  events,
  financialGoals,
  transactions,
  goalContributions
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

// Safe user type without password
export type SafeUser = Omit<User, 'password'>;

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
}

export const storage = new DatabaseStorage();
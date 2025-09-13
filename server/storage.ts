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
  type InsertGoalContribution
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private groups: Map<string, Group> = new Map();
  private groupMembers: Map<string, GroupMember> = new Map();
  private events: Map<string, Event> = new Map();
  private financialGoals: Map<string, FinancialGoal> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private goalContributions: Map<string, GoalContribution> = new Map();

  constructor() {
    // Initialize with empty maps
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      avatar: insertUser.avatar || null,
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Group methods
  async getGroup(id: string): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async getGroupsByUserId(userId: string): Promise<Group[]> {
    const userGroups: Group[] = [];
    const memberships = Array.from(this.groupMembers.values()).filter(m => m.userId === userId);
    
    for (const membership of memberships) {
      const group = this.groups.get(membership.groupId);
      if (group) userGroups.push(group);
    }
    
    return userGroups;
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = randomUUID();
    const group: Group = { 
      ...insertGroup,
      description: insertGroup.description || null,
      color: insertGroup.color || "#3B82F6",
      status: insertGroup.status || "active",
      id,
      createdAt: new Date()
    };
    this.groups.set(id, group);

    // Add creator as owner
    await this.addGroupMember({
      groupId: id,
      userId: insertGroup.ownerId,
      role: "owner"
    });

    return group;
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<Group> {
    const group = this.groups.get(id);
    if (!group) throw new Error("Group not found");
    const updatedGroup = { ...group, ...updates };
    this.groups.set(id, updatedGroup);
    return updatedGroup;
  }

  async deleteGroup(id: string): Promise<void> {
    this.groups.delete(id);
    // Also remove all group members
    Array.from(this.groupMembers.values())
      .filter(m => m.groupId === id)
      .forEach(m => this.groupMembers.delete(m.id));
  }

  // Group member methods
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values()).filter(m => m.groupId === groupId);
  }

  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const id = randomUUID();
    const member: GroupMember = { 
      ...insertMember,
      role: insertMember.role || "member",
      id,
      joinedAt: new Date()
    };
    this.groupMembers.set(id, member);
    return member;
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    const member = Array.from(this.groupMembers.values())
      .find(m => m.groupId === groupId && m.userId === userId);
    if (member) {
      this.groupMembers.delete(member.id);
    }
  }

  async updateGroupMemberRole(groupId: string, userId: string, role: string): Promise<GroupMember> {
    const member = Array.from(this.groupMembers.values())
      .find(m => m.groupId === groupId && m.userId === userId);
    if (!member) throw new Error("Group member not found");
    const updatedMember = { ...member, role };
    this.groupMembers.set(member.id, updatedMember);
    return updatedMember;
  }

  // Event methods
  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventsByUserId(userId: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(e => 
      e.createdBy === userId || (e.attendees as string[]).includes(userId)
    );
  }

  async getEventsByGroupId(groupId: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(e => e.groupId === groupId);
  }

  async getUpcomingEvents(userId: string, limit: number = 10): Promise<Event[]> {
    const now = new Date();
    return Array.from(this.events.values())
      .filter(e => 
        e.startTime > now && 
        (e.createdBy === userId || (e.attendees as string[]).includes(userId))
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, limit);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = { 
      ...insertEvent,
      description: insertEvent.description || null,
      location: insertEvent.location || null,
      groupId: insertEvent.groupId || null,
      status: insertEvent.status || "scheduled",
      attendees: insertEvent.attendees || [],
      id,
      createdAt: new Date()
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const event = this.events.get(id);
    if (!event) throw new Error("Event not found");
    const updatedEvent = { ...event, ...updates };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    this.events.delete(id);
  }

  // Financial goal methods
  async getFinancialGoal(id: string): Promise<FinancialGoal | undefined> {
    return this.financialGoals.get(id);
  }

  async getFinancialGoalsByUserId(userId: string): Promise<FinancialGoal[]> {
    return Array.from(this.financialGoals.values()).filter(g => g.userId === userId);
  }

  async createFinancialGoal(insertGoal: InsertFinancialGoal): Promise<FinancialGoal> {
    const id = randomUUID();
    const goal: FinancialGoal = { 
      ...insertGoal,
      description: insertGoal.description || null,
      currentAmount: insertGoal.currentAmount || "0",
      category: insertGoal.category || null,
      priority: insertGoal.priority || "medium",
      status: insertGoal.status || "active",
      id,
      createdAt: new Date()
    };
    this.financialGoals.set(id, goal);
    return goal;
  }

  async updateFinancialGoal(id: string, updates: Partial<FinancialGoal>): Promise<FinancialGoal> {
    const goal = this.financialGoals.get(id);
    if (!goal) throw new Error("Financial goal not found");
    const updatedGoal = { ...goal, ...updates };
    this.financialGoals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteFinancialGoal(id: string): Promise<void> {
    this.financialGoals.delete(id);
  }

  // Transaction methods
  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByUserId(userId: string, limit: number = 50): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  async getTransactionsByGoalId(goalId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(t => t.goalId === goalId);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = { 
      ...insertTransaction,
      description: insertTransaction.description || null,
      goalId: insertTransaction.goalId || null,
      id,
      createdAt: new Date()
    };
    this.transactions.set(id, transaction);

    // If this transaction is for a goal, update the goal's current amount
    if (transaction.goalId && transaction.type === "transfer") {
      const goal = this.financialGoals.get(transaction.goalId);
      if (goal) {
        const newAmount = parseFloat(goal.currentAmount) + parseFloat(transaction.amount.toString());
        if (transaction.goalId) {
          await this.updateFinancialGoal(transaction.goalId, { 
            currentAmount: newAmount.toString() 
          });
        }

        // Create goal contribution record
        if (transaction.goalId) {
          await this.createGoalContribution({
            goalId: transaction.goalId,
            transactionId: id,
            amount: transaction.amount
          });
        }
      }
    }

    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.transactions.get(id);
    if (!transaction) throw new Error("Transaction not found");
    const updatedTransaction = { ...transaction, ...updates };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    this.transactions.delete(id);
  }

  // Goal contribution methods
  async getGoalContributions(goalId: string): Promise<GoalContribution[]> {
    return Array.from(this.goalContributions.values()).filter(c => c.goalId === goalId);
  }

  async createGoalContribution(insertContribution: InsertGoalContribution): Promise<GoalContribution> {
    const id = randomUUID();
    const contribution: GoalContribution = { 
      ...insertContribution, 
      id,
      createdAt: new Date()
    };
    this.goalContributions.set(id, contribution);
    return contribution;
  }

  // Dashboard methods
  async getUserStats(userId: string): Promise<{
    totalSavings: number;
    activeGoals: number;
    monthlyIncome: number;
    upcomingEvents: number;
  }> {
    const goals = await this.getFinancialGoalsByUserId(userId);
    const totalSavings = goals.reduce((sum, goal) => sum + parseFloat(goal.currentAmount), 0);
    const activeGoals = goals.filter(g => g.status === "active").length;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const transactions = await this.getTransactionsByUserId(userId);
    const monthlyIncome = transactions
      .filter(t => t.type === "income" && t.date >= startOfMonth)
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const upcomingEvents = (await this.getUpcomingEvents(userId, 30)).length;

    return {
      totalSavings,
      activeGoals,
      monthlyIncome,
      upcomingEvents
    };
  }
}

export const storage = new MemStorage();

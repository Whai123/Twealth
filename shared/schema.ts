import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  color: text("color").default("#3B82F6"),
  status: text("status").default("active"), // active, planning, archived
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").default("member"), // owner, admin, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  groupId: varchar("group_id").references(() => groups.id, { onDelete: "cascade" }),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  attendees: jsonb("attendees").default([]), // array of {userId: string, status: 'yes'|'no'|'maybe'}
  status: text("status").default("scheduled"), // scheduled, completed, cancelled
  // Financial fields
  budget: decimal("budget", { precision: 10, scale: 2 }), // planned budget for this event
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }).default("0"), // total spent on this event
  linkedGoalId: varchar("linked_goal_id").references(() => financialGoals.id, { onDelete: "set null" }), // link to financial goal
  costSharingType: text("cost_sharing_type", { enum: ["none", "equal", "custom"] }).default("none"),
  // Time tracking fields
  plannedDurationMinutes: integer("planned_duration_minutes"), // expected duration in minutes
  actualDurationMinutes: integer("actual_duration_minutes"), // actual time spent from time logs
  timeTracked: boolean("time_tracked").default(false), // whether user has tracked time for this event
  createdAt: timestamp("created_at").defaultNow(),
});

export const financialGoals = pgTable("financial_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 10, scale: 2 }).default("0"),
  targetDate: timestamp("target_date").notNull(),
  category: text("category"), // emergency, house, vacation, etc.
  priority: text("priority").default("medium"), // low, medium, high
  status: text("status").default("active"), // active, completed, paused
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // income, expense, transfer
  category: text("category").notNull(),
  description: text("description"),
  goalId: varchar("goal_id").references(() => financialGoals.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goalContributions = pgTable("goal_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goalId: varchar("goal_id").notNull().references(() => financialGoals.id, { onDelete: "cascade" }),
  transactionId: varchar("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupInvites = pgTable("group_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  role: text("role").default("member"), // owner, admin, member
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedBy: varchar("accepted_by").references(() => users.id, { onDelete: "set null" }),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const calendarShares = pgTable("calendar_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique(), // unique share token
  scope: text("scope", { enum: ["user", "group"] }).notNull(), // user calendar or group calendar
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  groupId: varchar("group_id").references(() => groups.id, { onDelete: "cascade" }), // null for user scope
  expiresAt: timestamp("expires_at"),
  isRevoked: boolean("is_revoked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).default("50.00"), // default $50/hour
  currency: text("currency").default("USD"),
  workHoursPerWeek: integer("work_hours_per_week").default(40),
  timeValueStrategy: text("time_value_strategy", { enum: ["fixed", "derived"] }).default("fixed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventTimeLogs = pgTable("event_time_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  durationMinutes: integer("duration_minutes"),
  source: text("source", { enum: ["timer", "manual"] }).default("timer"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventExpenses = pgTable("event_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paidBy: varchar("paid_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category"), // food, transport, accommodation, entertainment, etc.
  receiptUrl: text("receipt_url"), // for receipt uploads
  date: timestamp("date").notNull(),
  isShared: boolean("is_shared").default(false), // whether to split among attendees
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventExpenseShares = pgTable("event_expense_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  expenseId: varchar("expense_id").notNull().references(() => eventExpenses.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  shareAmount: decimal("share_amount", { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean("is_paid").default(false),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    // Unique constraint to prevent duplicate shares per user per expense
    expenseUserUnique: unique("event_expense_shares_expense_user_unique").on(table.expenseId, table.userId),
  };
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
}).extend({
  startTime: z.preprocess((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date()),
  endTime: z.preprocess((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date()),
});

export const insertFinancialGoalSchema = createInsertSchema(financialGoals).omit({
  id: true,
  createdAt: true,
}).extend({
  targetDate: z.preprocess((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date()),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.preprocess((val) => {
    if (typeof val === 'number') return val.toFixed(2);
    if (typeof val === 'string') return val;
    return val;
  }, z.string()),
  date: z.preprocess((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date()),
});

export const insertGoalContributionSchema = createInsertSchema(goalContributions).omit({
  id: true,
  createdAt: true,
});

export const insertGroupInviteSchema = createInsertSchema(groupInvites).omit({
  id: true,
  token: true,
  acceptedBy: true,
  acceptedAt: true,
  createdAt: true,
}).extend({
  role: z.enum(["owner", "admin", "member"]).default("member"),
});

export const insertCalendarShareSchema = createInsertSchema(calendarShares).omit({
  id: true,
  token: true,
  createdAt: true,
}).extend({
  scope: z.enum(["user", "group"]),
}).refine((data) => {
  if (data.scope === "user") return !!data.ownerId && !data.groupId;
  if (data.scope === "group") return !!data.ownerId && !!data.groupId;
  return false;
}, {
  message: "scope='user' requires ownerId only, scope='group' requires both ownerId and groupId",
});

export const insertEventExpenseSchema = createInsertSchema(eventExpenses).omit({
  id: true,
  createdAt: true,
}).extend({
  // Allow both string and number for amount, then convert to string
  amount: z.union([z.string(), z.number()]).transform(val => val.toString()),
});

export const insertEventExpenseShareSchema = createInsertSchema(eventExpenseShares).omit({
  id: true,
  createdAt: true,
  paidAt: true,
}).extend({
  // Allow both string and number for shareAmount, then convert to string
  shareAmount: z.union([z.string(), z.number()]).transform(val => val.toString()),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  hourlyRate: z.union([z.string(), z.number()]).transform(val => val.toString()),
  timeValueStrategy: z.enum(["fixed", "derived"]).default("fixed"),
});

export const insertEventTimeLogSchema = createInsertSchema(eventTimeLogs).omit({
  id: true,
  createdAt: true,
}).extend({
  source: z.enum(["timer", "manual"]).default("timer"),
});

// Event attendee schema for type consistency
export const eventAttendeeSchema = z.object({
  userId: z.string(),
  status: z.enum(["yes", "no", "maybe"]),
});

export type EventAttendee = z.infer<typeof eventAttendeeSchema>;

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type FinancialGoal = typeof financialGoals.$inferSelect;
export type InsertFinancialGoal = z.infer<typeof insertFinancialGoalSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type GoalContribution = typeof goalContributions.$inferSelect;
export type InsertGoalContribution = z.infer<typeof insertGoalContributionSchema>;

export type GroupInvite = typeof groupInvites.$inferSelect;
export type InsertGroupInvite = z.infer<typeof insertGroupInviteSchema>;

export type CalendarShare = typeof calendarShares.$inferSelect;
export type InsertCalendarShare = z.infer<typeof insertCalendarShareSchema>;

export type EventExpense = typeof eventExpenses.$inferSelect;
export type InsertEventExpense = z.infer<typeof insertEventExpenseSchema>;

export type EventExpenseShare = typeof eventExpenseShares.$inferSelect;
export type InsertEventExpenseShare = z.infer<typeof insertEventExpenseShareSchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export type EventTimeLog = typeof eventTimeLogs.$inferSelect;
export type InsertEventTimeLog = z.infer<typeof insertEventTimeLogSchema>;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  groups: many(groups),
  groupMemberships: many(groupMembers),
  events: many(events),
  financialGoals: many(financialGoals),
  transactions: many(transactions),
  createdInvites: many(groupInvites, { relationName: "createdBy" }),
  acceptedInvites: many(groupInvites, { relationName: "acceptedBy" }),
  calendarShares: many(calendarShares),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(users, {
    fields: [groups.ownerId],
    references: [users.id],
  }),
  members: many(groupMembers),
  events: many(events),
  invites: many(groupInvites),
  calendarShares: many(calendarShares),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [events.groupId],
    references: [groups.id],
  }),
  linkedGoal: one(financialGoals, {
    fields: [events.linkedGoalId],
    references: [financialGoals.id],
  }),
  expenses: many(eventExpenses),
}));


export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  goal: one(financialGoals, {
    fields: [transactions.goalId],
    references: [financialGoals.id],
  }),
}));

export const goalContributionsRelations = relations(goalContributions, ({ one }) => ({
  goal: one(financialGoals, {
    fields: [goalContributions.goalId],
    references: [financialGoals.id],
  }),
  transaction: one(transactions, {
    fields: [goalContributions.transactionId],
    references: [transactions.id],
  }),
}));

export const groupInvitesRelations = relations(groupInvites, ({ one }) => ({
  group: one(groups, {
    fields: [groupInvites.groupId],
    references: [groups.id],
  }),
  creator: one(users, {
    fields: [groupInvites.createdBy],
    references: [users.id],
    relationName: "createdBy",
  }),
  acceptedByUser: one(users, {
    fields: [groupInvites.acceptedBy],
    references: [users.id],
    relationName: "acceptedBy",
  }),
}));

export const eventExpensesRelations = relations(eventExpenses, ({ one, many }) => ({
  event: one(events, {
    fields: [eventExpenses.eventId],
    references: [events.id],
  }),
  paidByUser: one(users, {
    fields: [eventExpenses.paidBy],
    references: [users.id],
  }),
  shares: many(eventExpenseShares),
}));

export const eventExpenseSharesRelations = relations(eventExpenseShares, ({ one }) => ({
  expense: one(eventExpenses, {
    fields: [eventExpenseShares.expenseId],
    references: [eventExpenses.id],
  }),
  user: one(users, {
    fields: [eventExpenseShares.userId],
    references: [users.id],
  }),
}));

export const calendarSharesRelations = relations(calendarShares, ({ one }) => ({
  owner: one(users, {
    fields: [calendarShares.ownerId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [calendarShares.groupId],
    references: [groups.id],
  }),
}));

export const financialGoalsRelations = relations(financialGoals, ({ one, many }) => ({
  user: one(users, {
    fields: [financialGoals.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  contributions: many(goalContributions),
  linkedEvents: many(events, { relationName: "linkedGoal" }),
}));

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

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  theme: text("theme", { enum: ["light", "dark", "system"] }).default("system"),
  language: text("language").default("en"),
  timeZone: text("time_zone").default("UTC"),
  dateFormat: text("date_format").default("MM/dd/yyyy"),
  currency: text("currency").default("USD"),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  marketingEmails: boolean("marketing_emails").default(false),
  weeklyReports: boolean("weekly_reports").default(true),
  goalReminders: boolean("goal_reminders").default(true),
  expenseAlerts: boolean("expense_alerts").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const financialPreferences = pgTable("financial_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  defaultBudgetPeriod: text("default_budget_period", { enum: ["weekly", "monthly", "yearly"] }).default("monthly"),
  budgetWarningThreshold: integer("budget_warning_threshold").default(80), // percentage
  autoSavingsEnabled: boolean("auto_savings_enabled").default(false),
  autoSavingsAmount: decimal("auto_savings_amount", { precision: 10, scale: 2 }).default("0.00"),
  autoSavingsFrequency: text("auto_savings_frequency", { enum: ["weekly", "monthly"] }).default("monthly"),
  defaultGoalPriority: text("default_goal_priority", { enum: ["low", "medium", "high"] }).default("medium"),
  expenseCategories: jsonb("expense_categories").default([
    "Food & Dining",
    "Transportation", 
    "Shopping",
    "Entertainment",
    "Utilities",
    "Healthcare",
    "Education",
    "Travel",
    "Other"
  ]),
  incomeCategories: jsonb("income_categories").default([
    "Salary",
    "Freelance", 
    "Investment",
    "Business",
    "Gift",
    "Other"
  ]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const privacySettings = pgTable("privacy_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  dataRetentionPeriod: integer("data_retention_period").default(365), // days
  allowAnalytics: boolean("allow_analytics").default(true),
  allowCookies: boolean("allow_cookies").default(true),
  shareDataWithPartners: boolean("share_data_with_partners").default(false),
  profileVisibility: text("profile_visibility", { enum: ["public", "private", "friends"] }).default("private"),
  allowDataExport: boolean("allow_data_export").default(true),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  lastPasswordChange: timestamp("last_password_change"),
  lastDataExport: timestamp("last_data_export"),
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

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  theme: z.enum(["light", "dark", "system"]).default("system"),
});

export const insertFinancialPreferencesSchema = createInsertSchema(financialPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  defaultBudgetPeriod: z.enum(["weekly", "monthly", "yearly"]).default("monthly"),
  autoSavingsFrequency: z.enum(["weekly", "monthly"]).default("monthly"),
  defaultGoalPriority: z.enum(["low", "medium", "high"]).default("medium"),
  autoSavingsAmount: z.union([z.string(), z.number()]).transform(val => val.toString()),
});

export const insertPrivacySettingsSchema = createInsertSchema(privacySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastPasswordChange: true,
  lastDataExport: true,
}).extend({
  profileVisibility: z.enum(["public", "private", "friends"]).default("private"),
});

export const insertEventTimeLogSchema = createInsertSchema(eventTimeLogs).omit({
  id: true,
  createdAt: true,
}).extend({
  source: z.enum(["timer", "manual"]).default("timer"),
});

// Move this down after notifications table is defined

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

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type FinancialPreferences = typeof financialPreferences.$inferSelect;
export type InsertFinancialPreferences = z.infer<typeof insertFinancialPreferencesSchema>;

export type PrivacySettings = typeof privacySettings.$inferSelect;
export type InsertPrivacySettings = z.infer<typeof insertPrivacySettingsSchema>;

export type EventTimeLog = typeof eventTimeLogs.$inferSelect;
export type InsertEventTimeLog = z.infer<typeof insertEventTimeLogSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

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
  notifications: many(notifications),
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

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // goal_deadline, transaction_reminder, goal_complete, budget_warning, suggestion
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  category: text("category").notNull(), // goals, transactions, budget, achievements, suggestions
  isRead: boolean("is_read").default(false),
  isArchived: boolean("is_archived").default(false),
  data: jsonb("data").default({}), // Additional context data (goalId, transactionId, etc.)
  actionType: text("action_type"), // add_transaction, create_goal, view_goal, etc.
  actionData: jsonb("action_data").default({}), // Data for action buttons
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

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

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
}).extend({
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  category: z.enum(["goals", "transactions", "budget", "achievements", "suggestions"]),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// AI Chat Tables
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").default("New Conversation"),
  isActive: boolean("is_active").default(true),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  userContext: jsonb("user_context"), // Financial data at time of message
  tokenCount: integer("token_count").default(0),
  cost: decimal("cost", { precision: 10, scale: 4 }).default("0.0000"), // Track API costs
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [chatConversations.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
}));

// Subscription Management Tables
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Free", "Standard", "Pro"
  displayName: text("display_name").notNull(), // "Twealth Standard", "Twealth Pro"
  description: text("description"),
  priceThb: decimal("price_thb", { precision: 10, scale: 2 }).notNull(), // Price in THB
  priceUsd: decimal("price_usd", { precision: 10, scale: 2 }).notNull(), // Price in USD
  currency: text("currency").default("THB"),
  billingInterval: text("billing_interval").notNull(), // "monthly", "yearly"
  // AI Usage Limits
  aiChatLimit: integer("ai_chat_limit").default(0), // Messages per month
  aiDeepAnalysisLimit: integer("ai_deep_analysis_limit").default(0), // Complex queries per month
  aiInsightsFrequency: text("ai_insights_frequency").default("never"), // "never", "weekly", "daily"
  // Feature Access
  features: jsonb("features").default([]), // Array of feature names
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0), // For display ordering
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  status: text("status").notNull(), // "active", "cancelled", "past_due", "incomplete"
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelledAt: timestamp("cancelled_at"),
  trialEnd: timestamp("trial_end"),
  // Payment tracking
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  // Regional pricing
  localCurrency: text("local_currency").default("THB"),
  localPrice: decimal("local_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usageTracking = pgTable("usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  // Tracking period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  // AI Usage counters
  aiChatsUsed: integer("ai_chats_used").default(0),
  aiDeepAnalysisUsed: integer("ai_deep_analysis_used").default(0),
  aiInsightsGenerated: integer("ai_insights_generated").default(0),
  // Cost tracking
  totalTokensUsed: integer("total_tokens_used").default(0),
  estimatedCostUsd: decimal("estimated_cost_usd", { precision: 10, scale: 4 }).default("0"),
  // Last updated
  lastResetAt: timestamp("last_reset_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Unique constraint to ensure one usage record per user per period
  uniqueUserPeriod: unique().on(table.userId, table.periodStart),
}));

export const subscriptionAddOns = pgTable("subscription_add_ons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: varchar("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  addOnType: text("add_on_type").notNull(), // "extra_chats", "extra_deep_analysis"
  quantity: integer("quantity").notNull(), // How many units purchased
  priceThb: decimal("price_thb", { precision: 10, scale: 2 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription schema exports
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ id: true, createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true });
export const insertUsageTrackingSchema = createInsertSchema(usageTracking).omit({ id: true, createdAt: true });
export const insertSubscriptionAddOnSchema = createInsertSchema(subscriptionAddOns).omit({ id: true, createdAt: true });

// Subscription types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type UsageTracking = typeof usageTracking.$inferSelect;
export type SubscriptionAddOn = typeof subscriptionAddOns.$inferSelect;

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertUsageTracking = z.infer<typeof insertUsageTrackingSchema>;
export type InsertSubscriptionAddOn = z.infer<typeof insertSubscriptionAddOnSchema>;

// Subscription relations
export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  usageRecords: many(usageTracking),
  addOns: many(subscriptionAddOns),
}));

export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  user: one(users, {
    fields: [usageTracking.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [usageTracking.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const subscriptionAddOnsRelations = relations(subscriptionAddOns, ({ one }) => ({
  user: one(users, {
    fields: [subscriptionAddOns.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [subscriptionAddOns.subscriptionId],
    references: [subscriptions.id],
  }),
}));

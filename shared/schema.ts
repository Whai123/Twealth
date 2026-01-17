import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Updated for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  color: text("color").default("#3B82F6"),
  status: text("status").default("active"), // active, planning, archived
  category: text("category").default("other"), // house, car, savings, other
  budget: decimal("budget", { precision: 12, scale: 2 }), // target amount for the group goal
  currentAmount: decimal("current_amount", { precision: 12, scale: 2 }).default("0"), // contributed so far
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
}, (table) => [
  index("idx_events_created_by").on(table.createdBy),
  index("idx_events_start_time").on(table.startTime),
  index("idx_events_group_id").on(table.groupId),
]);

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
}, (table) => [
  index("idx_goals_user_id").on(table.userId),
  index("idx_goals_status").on(table.status),
]);

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // income, expense, transfer
  category: text("category").notNull(),
  description: text("description"),
  goalId: varchar("goal_id").references(() => financialGoals.id, { onDelete: "cascade" }),
  destination: text("destination"), // For transfer/savings: emergency_fund, general_savings, investment_account, etc.
  date: timestamp("date").notNull(),
  isArchived: boolean("is_archived").default(false),
  isFlagged: boolean("is_flagged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_transactions_user_id").on(table.userId),
  index("idx_transactions_date").on(table.date),
  index("idx_transactions_type").on(table.type),
]);

export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  monthlyLimit: decimal("monthly_limit", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_budgets_user_id").on(table.userId),
  unique("unique_user_category").on(table.userId, table.category),
]);

export const goalContributions = pgTable("goal_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goalId: varchar("goal_id").notNull().references(() => financialGoals.id, { onDelete: "cascade" }),
  transactionId: varchar("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goalMilestones = pgTable("goal_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goalId: varchar("goal_id").notNull().references(() => financialGoals.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  milestone: integer("milestone").notNull(), // 25, 50, 75, 100 (percentage)
  amountAtMilestone: decimal("amount_at_milestone", { precision: 10, scale: 2 }).notNull(),
  celebratedAt: timestamp("celebrated_at").defaultNow(),
  isSeen: boolean("is_seen").default(false),
}, (table) => [
  index("idx_milestones_goal_id").on(table.goalId),
  index("idx_milestones_user_id").on(table.userId),
  unique("unique_goal_milestone").on(table.goalId, table.milestone),
]);

export const userStreaks = pgTable("user_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  totalCheckIns: integer("total_check_ins").default(0),
  lastCheckIn: timestamp("last_check_in"),
  weeklyProgress: jsonb("weekly_progress").default([false, false, false, false, false, false, false]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_streaks_user_id").on(table.userId),
]);

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: varchar("achievement_id").notNull(),
  progress: integer("progress").default(0),
  target: integer("target").notNull(),
  earnedAt: timestamp("earned_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_achievements_user_id").on(table.userId),
  unique("unique_user_achievement").on(table.userId, table.achievementId),
]);

export const investmentStrategies = pgTable("investment_strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "S&P 500 Index Funds", "High-Yield Savings", etc.
  category: text("category").notNull(), // stocks, bonds, real_estate, crypto, savings, passive_income
  subcategory: text("subcategory"), // index_funds, reits, dividend_stocks, etc.
  riskLevel: text("risk_level").notNull(), // very_low, low, moderate, high, very_high
  expectedReturn: decimal("expected_return", { precision: 5, scale: 2 }).notNull(), // Annual percentage (e.g., 10.00 for 10%)
  historicalReturn: decimal("historical_return", { precision: 5, scale: 2 }), // Long-term historical average
  minInvestment: decimal("min_investment", { precision: 10, scale: 2 }), // Minimum amount to start
  timeHorizon: text("time_horizon").notNull(), // short (< 3 years), medium (3-10 years), long (10+ years)
  liquidity: text("liquidity").notNull(), // high, medium, low (how quickly you can access money)
  description: text("description").notNull(), // Detailed explanation
  pros: text("pros").array(), // Array of advantages
  cons: text("cons").array(), // Array of disadvantages
  bestFor: text("best_for").array(), // Who this is best for
  volatility: text("volatility"), // low, medium, high, very_high
  taxTreatment: text("tax_treatment"), // tax_deferred, tax_free, taxable, etc.
  platformSuggestions: text("platform_suggestions").array(), // ["Vanguard", "Fidelity", etc.]
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_strategies_category").on(table.category),
  index("idx_strategies_risk_level").on(table.riskLevel),
]);

export const passiveIncomeOpportunities = pgTable("passive_income_opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Digital Products", "YouTube Content", "Airbnb", etc.
  category: text("category").notNull(), // digital_products, content_creation, real_estate, investments
  startupCost: text("startup_cost").notNull(), // very_low, low, medium, high
  monthlyEarningsMin: decimal("monthly_earnings_min", { precision: 10, scale: 2 }), // Minimum realistic monthly earnings
  monthlyEarningsMax: decimal("monthly_earnings_max", { precision: 10, scale: 2 }), // Maximum realistic monthly earnings
  effortLevel: text("effort_level").notNull(), // low, medium, high, very_high (upfront work required)
  timeToProfit: text("time_to_profit").notNull(), // immediate, 1_3_months, 3_6_months, 6_12_months, 12_plus_months
  scalability: text("scalability").notNull(), // low, medium, high (can earnings grow significantly?)
  description: text("description").notNull(),
  requiredSkills: text("required_skills").array(), // ["Writing", "Marketing", "Design", etc.]
  platforms: text("platforms").array(), // ["Etsy", "Gumroad", "YouTube", etc.]
  pros: text("pros").array(),
  cons: text("cons").array(),
  bestFor: text("best_for").array(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_passive_income_category").on(table.category),
]);

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

export const friendRequests = pgTable("friend_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserId: varchar("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["pending", "accepted", "declined"] }).default("pending"),
  message: text("message"), // optional message with request
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  friendId: varchar("friend_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueFriendship: unique().on(table.userId, table.friendId),
  };
});

// Shared Goals - Friends can view and optionally contribute to each other's goals
export const sharedGoals = pgTable("shared_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goalId: varchar("goal_id").notNull().references(() => financialGoals.id, { onDelete: "cascade" }),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sharedWithUserId: varchar("shared_with_user_id").references(() => users.id, { onDelete: "cascade" }), // null for group shares
  groupId: varchar("group_id").references(() => groups.id, { onDelete: "cascade" }), // for sharing with entire group
  permission: text("permission", { enum: ["view", "contribute"] }).default("view"), // view-only or can contribute
  status: text("status", { enum: ["active", "removed"] }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueShare: unique().on(table.goalId, table.sharedWithUserId),
  };
});

// Shared Budgets - Friends can track expenses together
export const sharedBudgets = pgTable("shared_budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  totalBudget: decimal("total_budget", { precision: 10, scale: 2 }).notNull(),
  currentSpent: decimal("current_spent", { precision: 10, scale: 2 }).default("0"),
  period: text("period", { enum: ["weekly", "monthly", "yearly"] }).default("monthly"),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  linkedGoalId: varchar("linked_goal_id").references(() => financialGoals.id, { onDelete: "set null" }), // link budget to a goal
  status: text("status", { enum: ["active", "completed", "archived"] }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shared Budget Members - Who has access to a shared budget
export const sharedBudgetMembers = pgTable("shared_budget_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  budgetId: varchar("budget_id").notNull().references(() => sharedBudgets.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["owner", "contributor"] }).default("contributor"),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => {
  return {
    uniqueMember: unique().on(table.budgetId, table.userId),
  };
});

// Shared Budget Expenses - Track expenses in shared budgets
export const sharedBudgetExpenses = pgTable("shared_budget_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  budgetId: varchar("budget_id").notNull().references(() => sharedBudgets.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Friend Group Invitations - Invite friends to join groups directly
export const friendGroupInvitations = pgTable("friend_group_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  invitedBy: varchar("invited_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  invitedUserId: varchar("invited_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["admin", "member"] }).default("member"),
  status: text("status", { enum: ["pending", "accepted", "declined"] }).default("pending"),
  message: text("message"), // optional invitation message
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
}, (table) => {
  return {
    uniqueInvitation: unique().on(table.groupId, table.invitedUserId),
  };
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
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  onboardingStep: integer("onboarding_step"), // 1: Profile, 2: Goals, 3: AI Preferences, null: not started or completed
  onboardingData: jsonb("onboarding_data").$type<{
    fullName?: string;
    incomeRange?: string; // 'under_30k', '30k-60k', '60k-100k', '100k-200k', 'over_200k'
    riskTolerance?: string; // 'conservative', 'moderate', 'aggressive'
    savingsTarget?: number;
    savingsTimeline?: string; // '3months', '6months', '1year', '3years', '5years+'
    financialPriorities?: string[]; // 'emergency_fund', 'retirement', 'debt_payoff', 'investment', 'major_purchase'
    notificationFrequency?: string; // 'daily', 'weekly', 'monthly', 'never'
    adviceStyle?: string; // 'detailed', 'concise', 'conversational'
    preferredLanguage?: string; // 'en', 'es', 'ar', etc.
  }>(),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  marketingEmails: boolean("marketing_emails").default(false),
  weeklyReports: boolean("weekly_reports").default(true),
  goalReminders: boolean("goal_reminders").default(true),
  expenseAlerts: boolean("expense_alerts").default(true),
  // Crypto & Multi-currency features
  cryptoEnabled: boolean("crypto_enabled").default(false),
  experienceLevel: text("experience_level", { enum: ["beginner", "intermediate", "advanced"] }).default("beginner"),
  preferredCurrencies: text("preferred_currencies").array().default(sql`ARRAY['USD']::text[]`), // e.g., ['USD', 'BTC', 'EUR', 'CNY']
  // Demo Mode - Show sample data for new users
  demoMode: boolean("demo_mode").default(true), // New users start in demo mode
  // Country-aware financial intelligence
  countryCode: text("country_code").default("US"), // ISO 3166-1 alpha-2 code (e.g., US, GB, JP, DE)
  // Financial estimates provided by user via AI chat
  monthlyIncomeEstimate: decimal("monthly_income_estimate", { precision: 10, scale: 2 }),
  monthlyExpensesEstimate: decimal("monthly_expenses_estimate", { precision: 10, scale: 2 }),
  currentSavingsEstimate: decimal("current_savings_estimate", { precision: 10, scale: 2 }),
  // AI Conversation Memory - Stores key insights learned from user conversations
  conversationMemory: jsonb("conversation_memory").$type<{
    financialPriorities?: string[]; // e.g., ["saving for house", "planning retirement"]
    investmentPreferences?: string[]; // e.g., ["prefers conservative", "interested in tech stocks"]
    lifeEvents?: { event: string; timeframe?: string }[]; // e.g., [{ event: "getting married", timeframe: "2026" }]
    spendingHabits?: string[]; // e.g., ["eats out frequently", "shops online weekly"]
    riskTolerance?: string; // e.g., "conservative", "moderate", "aggressive"
    lastUpdated?: string; // ISO timestamp of last memory update
  }>(),
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

// User Financial Profile - Core financial data for Personal CFO AI
export const userFinancialProfiles = pgTable("user_financial_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  monthlyIncome: decimal("monthly_income", { precision: 10, scale: 2 }).notNull(),
  monthlyExpenses: decimal("monthly_expenses", { precision: 10, scale: 2 }).notNull(),
  monthlySavings: decimal("monthly_savings", { precision: 10, scale: 2 }).notNull(),
  totalSavings: decimal("total_savings", { precision: 10, scale: 2 }).notNull(),
  savingsGoal: decimal("savings_goal", { precision: 10, scale: 2 }).notNull(),
  emergencyFund: decimal("emergency_fund", { precision: 10, scale: 2 }).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_financial_profiles_user_id").on(table.userId),
]);

// User Expense Categories - Monthly expense breakdown by category
export const userExpenseCategories = pgTable("user_expense_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // Food & Dining, Transportation, Shopping, etc.
  monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_expense_categories_user_id").on(table.userId),
  unique("unique_user_expense_category").on(table.userId, table.category),
]);

// User Debts - Individual debts with interest rates and payments
export const userDebts = pgTable("user_debts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Credit Card", "Student Loan", "Car Loan", etc.
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull(), // Current amount owed
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }), // Original total debt amount (nullable for existing rows)
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(), // APR as percentage (e.g., 4.5 for 4.5%)
  minimumPayment: decimal("minimum_payment", { precision: 10, scale: 2 }).notNull(),
  monthlyPayment: decimal("monthly_payment", { precision: 10, scale: 2 }).notNull(), // actual payment user makes
  dueDate: integer("due_date"), // day of month (1-31)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_debts_user_id").on(table.userId),
]);

// User Assets - Individual assets with type and value
export const userAssets = pgTable("user_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Primary Home", "Investment Portfolio", "Savings Account", etc.
  type: text("type").notNull(), // real_estate, investment, savings, vehicle, other
  value: decimal("value", { precision: 12, scale: 2 }).notNull(), // Current value
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }), // Original purchase price (nullable for existing rows)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_assets_user_id").on(table.userId),
]);

// ═══════════════════════════════════════════════════════════════════════════
// WORLD-CLASS FINANCIAL SCORING SYSTEM (4 PILLARS)
// ═══════════════════════════════════════════════════════════════════════════

// Monthly Financial Aggregates - Materialized "financial state" per month
export const monthlyFinancials = pgTable("monthly_financials", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  month: timestamp("month").notNull(), // Normalized to first day of month

  // Income & Expenses
  incomeCents: integer("income_cents").notNull().default(0),
  expenseCents: integer("expense_cents").notNull().default(0), // Stored as positive magnitude
  fixedExpenseCents: integer("fixed_expense_cents").notNull().default(0), // Rent, subscriptions, etc.

  // Wealth Building
  emergencyFundCents: integer("emergency_fund_cents").notNull().default(0),
  totalDebtCents: integer("total_debt_cents").notNull().default(0),
  investmentContribCents: integer("investment_contrib_cents").notNull().default(0),

  // Risk Protection
  insuredAmountCents: integer("insured_amount_cents").notNull().default(0),

  // Metadata
  transactionCount: integer("transaction_count").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_monthly_user_month").on(table.userId, table.month),
  unique("unique_monthly_user_month").on(table.userId, table.month),
]);

// Score Snapshots - 4-Pillar scoring history with explainability
export const scoreSnapshots = pgTable("score_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  month: timestamp("month").notNull(), // Normalized to first day of month

  // THE 4 PILLARS (0-100 each)
  cashflowScore: integer("cashflow_score").notNull(), // Cashflow Resilience
  stabilityScore: integer("stability_score").notNull(), // Stability & Risk
  growthScore: integer("growth_score").notNull(), // Wealth Growth Quality
  behaviorScore: integer("behavior_score").notNull(), // Behavioral Alpha

  // COMPOSITE INDEX (weighted average)
  twealthIndex: integer("twealth_index").notNull(), // Overall 0-100

  // UX ELEMENTS
  band: text("band").notNull(), // "Critical" | "Needs Work" | "Good" | "Great"
  confidence: decimal("confidence", { precision: 4, scale: 3 }).notNull(), // 0.000 to 1.000

  // EXPLAINABILITY
  drivers: jsonb("drivers").notNull().$type<{
    cashflow: { drivers: string[]; action: string };
    stability: { drivers: string[]; action: string };
    growth: { drivers: string[]; action: string };
    behavior: { drivers: string[]; action: string };
    overall: { drivers: string[]; action: string };
  }>(),

  // DEBUG/TUNING
  components: jsonb("components").notNull().$type<{
    // Cashflow components
    netRatio: number;
    fixedRatio: number;
    incomeVol: number;
    A: number; B: number; C: number;
    // Stability components
    liquidityCoverage: number;
    leverage: number;
    protectionRatio: number;
    L: number; D: number; P: number;
    // Growth components
    savingRate: number;
    investRate: number;
    incomeGrowth: number;
    consistency: number;
    S: number; I: number; G: number; Co: number;
    // Behavior components
    loggingConsistency: number;
    budgetAdherence: number;
    Ba: number; Bc: number;
  }>(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_scores_user_month").on(table.userId, table.month),
  unique("unique_scores_user_month").on(table.userId, table.month),
]);

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE AUTH - Refresh Tokens for JWT-based authentication
// ═══════════════════════════════════════════════════════════════════════════

export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(), // SHA-256 hash
  expiresAt: timestamp("expires_at").notNull(),
  deviceInfo: text("device_info"), // Optional: store device/platform info
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_refresh_tokens_user").on(table.userId),
  index("idx_refresh_tokens_hash").on(table.tokenHash),
  index("idx_refresh_tokens_expires").on(table.expiresAt),
]);

// Insert schemas for Replit Auth
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Upsert user schema for OAuth - accepts provider-formatted IDs like google_123, facebook_456, apple_789
export const upsertUserSchema = createInsertSchema(users).extend({
  id: z.string().min(1).max(128), // Accept provider-formatted IDs or UUIDs with length limit
});
export type UpsertUser = z.infer<typeof upsertUserSchema>;

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
  userId: z.string().optional(), // Optional - will be set from session on backend
  category: z.string().optional(), // Optional - backend will auto-categorize if not provided
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

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  userId: z.string().optional(), // Will be set from session
  monthlyLimit: z.preprocess((val) => {
    if (typeof val === 'number') return val.toFixed(2);
    if (typeof val === 'string') return val;
    return val;
  }, z.string()),
});

export const insertGoalContributionSchema = createInsertSchema(goalContributions).omit({
  id: true,
  createdAt: true,
});

export const insertGoalMilestoneSchema = createInsertSchema(goalMilestones).omit({
  id: true,
  celebratedAt: true,
  isSeen: true,
});

export const insertUserStreakSchema = createInsertSchema(userStreaks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  createdAt: true,
  earnedAt: true,
});

export const insertInvestmentStrategySchema = createInsertSchema(investmentStrategies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPassiveIncomeOpportunitySchema = createInsertSchema(passiveIncomeOpportunities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertFriendRequestSchema = createInsertSchema(friendRequests).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
}).extend({
  status: z.enum(["pending", "accepted", "declined"]).default("pending"),
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
});

export const insertSharedGoalSchema = createInsertSchema(sharedGoals).omit({
  id: true,
  createdAt: true,
}).extend({
  permission: z.enum(["view", "contribute"]).default("view"),
  status: z.enum(["active", "removed"]).default("active"),
});

export const insertSharedBudgetSchema = createInsertSchema(sharedBudgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  totalBudget: z.union([z.string(), z.number()]).transform(val => val.toString()),
  currentSpent: z.union([z.string(), z.number()]).transform(val => val.toString()).default("0"),
  period: z.enum(["weekly", "monthly", "yearly"]).default("monthly"),
  status: z.enum(["active", "completed", "archived"]).default("active"),
});

export const insertSharedBudgetMemberSchema = createInsertSchema(sharedBudgetMembers).omit({
  id: true,
  joinedAt: true,
}).extend({
  role: z.enum(["owner", "contributor"]).default("contributor"),
});

export const insertSharedBudgetExpenseSchema = createInsertSchema(sharedBudgetExpenses).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform(val => val.toString()),
  date: z.preprocess((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date()),
});

export const insertFriendGroupInvitationSchema = createInsertSchema(friendGroupInvitations).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
}).extend({
  role: z.enum(["admin", "member"]).default("member"),
  status: z.enum(["pending", "accepted", "declined"]).default("pending"),
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
  conversationMemory: z.object({
    financialPriorities: z.array(z.string()).optional(),
    investmentPreferences: z.array(z.string()).optional(),
    lifeEvents: z.array(z.object({
      event: z.string(),
      timeframe: z.string().optional()
    })).optional(),
    spendingHabits: z.array(z.string()).optional(),
    riskTolerance: z.string().optional(),
    lastUpdated: z.string().optional()
  }).optional(),
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

// Financial Profile Insert Schemas
export const insertUserFinancialProfileSchema = createInsertSchema(userFinancialProfiles).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
}).extend({
  monthlyIncome: z.union([z.string(), z.number()]).transform(val => val.toString()),
  monthlyExpenses: z.union([z.string(), z.number()]).transform(val => val.toString()),
  monthlySavings: z.union([z.string(), z.number()]).transform(val => val.toString()),
  totalSavings: z.union([z.string(), z.number()]).transform(val => val.toString()),
  savingsGoal: z.union([z.string(), z.number()]).transform(val => val.toString()),
  emergencyFund: z.union([z.string(), z.number()]).transform(val => val.toString()),
});

export const insertUserExpenseCategorySchema = createInsertSchema(userExpenseCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  monthlyAmount: z.union([z.string(), z.number()]).transform(val => val.toString()),
});

export const insertUserDebtSchema = createInsertSchema(userDebts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  balance: z.union([z.string(), z.number()]).transform(val => val.toString()),
  interestRate: z.union([z.string(), z.number()]).transform(val => val.toString()),
  minimumPayment: z.union([z.string(), z.number()]).transform(val => val.toString()),
  monthlyPayment: z.union([z.string(), z.number()]).transform(val => val.toString()),
});

export const insertUserAssetSchema = createInsertSchema(userAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  value: z.union([z.string(), z.number()]).transform(val => val.toString()),
  type: z.enum(["real_estate", "investment", "savings", "vehicle", "other"]),
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

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type GoalContribution = typeof goalContributions.$inferSelect;
export type InsertGoalContribution = z.infer<typeof insertGoalContributionSchema>;

export type GoalMilestone = typeof goalMilestones.$inferSelect;
export type InsertGoalMilestone = z.infer<typeof insertGoalMilestoneSchema>;

export type UserStreak = typeof userStreaks.$inferSelect;
export type InsertUserStreak = z.infer<typeof insertUserStreakSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type InvestmentStrategy = typeof investmentStrategies.$inferSelect;
export type InsertInvestmentStrategy = z.infer<typeof insertInvestmentStrategySchema>;

export type PassiveIncomeOpportunity = typeof passiveIncomeOpportunities.$inferSelect;
export type InsertPassiveIncomeOpportunity = z.infer<typeof insertPassiveIncomeOpportunitySchema>;

export type GroupInvite = typeof groupInvites.$inferSelect;
export type InsertGroupInvite = z.infer<typeof insertGroupInviteSchema>;

export type CalendarShare = typeof calendarShares.$inferSelect;
export type InsertCalendarShare = z.infer<typeof insertCalendarShareSchema>;

export type FriendRequest = typeof friendRequests.$inferSelect;
export type InsertFriendRequest = z.infer<typeof insertFriendRequestSchema>;

export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;

export type SharedGoal = typeof sharedGoals.$inferSelect;
export type InsertSharedGoal = z.infer<typeof insertSharedGoalSchema>;

export type SharedBudget = typeof sharedBudgets.$inferSelect;
export type InsertSharedBudget = z.infer<typeof insertSharedBudgetSchema>;

export type SharedBudgetMember = typeof sharedBudgetMembers.$inferSelect;
export type InsertSharedBudgetMember = z.infer<typeof insertSharedBudgetMemberSchema>;

export type SharedBudgetExpense = typeof sharedBudgetExpenses.$inferSelect;
export type InsertSharedBudgetExpense = z.infer<typeof insertSharedBudgetExpenseSchema>;

export type FriendGroupInvitation = typeof friendGroupInvitations.$inferSelect;
export type InsertFriendGroupInvitation = z.infer<typeof insertFriendGroupInvitationSchema>;

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

export type UserFinancialProfile = typeof userFinancialProfiles.$inferSelect;
export type InsertUserFinancialProfile = z.infer<typeof insertUserFinancialProfileSchema>;

export type UserExpenseCategory = typeof userExpenseCategories.$inferSelect;
export type InsertUserExpenseCategory = z.infer<typeof insertUserExpenseCategorySchema>;

export type UserDebt = typeof userDebts.$inferSelect;
export type InsertUserDebt = z.infer<typeof insertUserDebtSchema>;

export type UserAsset = typeof userAssets.$inferSelect;
export type InsertUserAsset = z.infer<typeof insertUserAssetSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  groups: many(groups),
  groupMemberships: many(groupMembers),
  events: many(events),
  financialGoals: many(financialGoals),
  transactions: many(transactions),
  createdInvites: many(groupInvites, { relationName: "createdBy" }),
  acceptedInvites: many(groupInvites, { relationName: "acceptedBy" }),
  calendarShares: many(calendarShares),
  notifications: many(notifications),
  sentFriendRequests: many(friendRequests, { relationName: "fromUser" }),
  receivedFriendRequests: many(friendRequests, { relationName: "toUser" }),
  friendships: many(friendships, { relationName: "userFriends" }),
  friendOf: many(friendships, { relationName: "friendOf" }),
  financialProfile: one(userFinancialProfiles),
  expenseCategories: many(userExpenseCategories),
  debts: many(userDebts),
  assets: many(userAssets),
}));

export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
  fromUser: one(users, {
    fields: [friendRequests.fromUserId],
    references: [users.id],
    relationName: "fromUser",
  }),
  toUser: one(users, {
    fields: [friendRequests.toUserId],
    references: [users.id],
    relationName: "toUser",
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(users, {
    fields: [friendships.userId],
    references: [users.id],
    relationName: "userFriends",
  }),
  friend: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
    relationName: "friendOf",
  }),
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

export const goalMilestonesRelations = relations(goalMilestones, ({ one }) => ({
  goal: one(financialGoals, {
    fields: [goalMilestones.goalId],
    references: [financialGoals.id],
  }),
  user: one(users, {
    fields: [goalMilestones.userId],
    references: [users.id],
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

export const userFinancialProfilesRelations = relations(userFinancialProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userFinancialProfiles.userId],
    references: [users.id],
  }),
}));

export const userExpenseCategoriesRelations = relations(userExpenseCategories, ({ one }) => ({
  user: one(users, {
    fields: [userExpenseCategories.userId],
    references: [users.id],
  }),
}));

export const userDebtsRelations = relations(userDebts, ({ one }) => ({
  user: one(users, {
    fields: [userDebts.userId],
    references: [users.id],
  }),
}));

export const userAssetsRelations = relations(userAssets, ({ one }) => ({
  user: one(users, {
    fields: [userAssets.userId],
    references: [users.id],
  }),
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

// AI Message Feedback/Rating Table
export const messageFeedback = pgTable("message_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => chatMessages.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: text("rating", { enum: ["helpful", "not_helpful"] }).notNull(),
  feedbackText: text("feedback_text"), // Optional detailed feedback
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("unique_user_message_feedback").on(table.userId, table.messageId)
]);

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertMessageFeedbackSchema = createInsertSchema(messageFeedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type MessageFeedback = typeof messageFeedback.$inferSelect;
export type InsertMessageFeedback = z.infer<typeof insertMessageFeedbackSchema>;

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [chatConversations.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
  feedback: many(messageFeedback),
}));

export const messageFeedbackRelations = relations(messageFeedback, ({ one }) => ({
  message: one(chatMessages, {
    fields: [messageFeedback.messageId],
    references: [chatMessages.id],
  }),
  user: one(users, {
    fields: [messageFeedback.userId],
    references: [users.id],
  }),
}));

// Subscription Management Tables
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Free", "Pro", "Enterprise"
  displayName: text("display_name").notNull(), // "Twealth Free", "Twealth Pro"
  description: text("description"),
  priceThb: decimal("price_thb", { precision: 10, scale: 2 }).notNull(), // Price in THB
  priceUsd: decimal("price_usd", { precision: 10, scale: 2 }).notNull(), // Price in USD
  currency: text("currency").default("USD"),
  stripePriceId: text("stripe_price_id"), // Stripe Price ID (e.g., price_xxx from Stripe dashboard)
  billingInterval: text("billing_interval").notNull(), // "monthly", "yearly", "lifetime"
  // AI Usage Limits - Hybrid AI System (Scout/Sonnet/GPT-5/Opus)
  scoutLimit: integer("scout_limit").default(0), // Scout queries per period (null = unlimited for paid tiers)
  sonnetLimit: integer("sonnet_limit").default(0), // Sonnet (reasoning) queries per period
  gpt5Limit: integer("gpt5_limit").default(0), // GPT-5 (advanced math) queries per period
  opusLimit: integer("opus_limit").default(0), // Opus (enterprise CFO) queries per period
  // Legacy AI Limits (for backward compatibility)
  aiChatLimit: integer("ai_chat_limit").default(0), // Messages per period (monthly or lifetime)
  aiDeepAnalysisLimit: integer("ai_deep_analysis_limit").default(0), // Complex queries per period
  aiInsightsFrequency: text("ai_insights_frequency").default("never"), // "never", "weekly", "daily"
  isLifetimeLimit: boolean("is_lifetime_limit").default(false), // true = no reset (Free), false = monthly reset (Pro)
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
  // Free premium access for special users
  freePremium: boolean("free_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usageTracking = pgTable("usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  // Tracking period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  // Hybrid AI Usage counters (Scout/Sonnet/GPT-5/Opus)
  scoutQueriesUsed: integer("scout_queries_used").default(0),
  sonnetQueriesUsed: integer("sonnet_queries_used").default(0),
  gpt5QueriesUsed: integer("gpt5_queries_used").default(0),
  opusQueriesUsed: integer("opus_queries_used").default(0),
  // Legacy AI Usage counters (for backward compatibility)
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

// Referral system tables
export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(), // Unique referral code (e.g., "ALEX123")
  maxUses: integer("max_uses").default(100), // Maximum number of times it can be used
  currentUses: integer("current_uses").default(0), // Current number of uses
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration date
});

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerUserId: varchar("referrer_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referredUserId: varchar("referred_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referralCodeId: varchar("referral_code_id").notNull().references(() => referralCodes.id, { onDelete: "cascade" }),
  status: text("status").default("pending"), // pending, completed, cancelled
  bonusCreditsPaid: boolean("bonus_credits_paid").default(false),
  completedAt: timestamp("completed_at"), // When referred user completed required action (e.g., upgraded)
  createdAt: timestamp("created_at").defaultNow(),
});

export const bonusCredits = pgTable("bonus_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // Number of bonus AI credits
  source: text("source").notNull(), // "referral_made", "referral_signup", "promotion", etc.
  referralId: varchar("referral_id").references(() => referrals.id, { onDelete: "set null" }),
  description: text("description"), // Human-readable description
  expiresAt: timestamp("expires_at"), // Optional expiration date for credits
  isUsed: boolean("is_used").default(false),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stripe Webhook Event Idempotency - Persisted to survive server restarts
export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey(), // Stripe event ID (evt_xxx)
  eventType: text("event_type").notNull(), // checkout.session.completed, etc.
  processedAt: timestamp("processed_at").defaultNow(),
}, (table) => [
  index("idx_webhook_events_processed_at").on(table.processedAt),
]);

// Crypto tracking tables
export const cryptoHoldings = pgTable("crypto_holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  coinId: varchar("coin_id", { length: 50 }).notNull(), // CoinGecko ID: bitcoin, ethereum
  symbol: varchar("symbol", { length: 20 }).notNull(), // BTC, ETH, etc.
  name: text("name").notNull(), // Bitcoin, Ethereum
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(), // Support small fractions
  averageBuyPrice: decimal("average_buy_price", { precision: 20, scale: 2 }), // USD price when bought
  currentPrice: decimal("current_price", { precision: 20, scale: 2 }), // Current USD price (cached)
  source: text("source").default("manual"), // manual, coinbase, binance, wallet
  walletAddress: text("wallet_address"), // For blockchain wallet tracking
  notes: text("notes"),
  lastPriceUpdate: timestamp("last_price_update"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cryptoPriceAlerts = pgTable("crypto_price_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  symbol: varchar("symbol", { length: 20 }).notNull(), // BTC, ETH
  targetPrice: decimal("target_price", { precision: 20, scale: 2 }).notNull(),
  condition: text("condition", { enum: ["above", "below"] }).notNull(),
  isActive: boolean("is_active").default(true),
  triggered: boolean("triggered").default(false),
  triggeredAt: timestamp("triggered_at"),
  notificationSent: boolean("notification_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cryptoTransactions = pgTable("crypto_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  holdingId: varchar("holding_id").references(() => cryptoHoldings.id, { onDelete: "set null" }),
  type: text("type", { enum: ["buy", "sell", "transfer_in", "transfer_out"] }).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 20, scale: 2 }).notNull(), // USD price at transaction
  totalValue: decimal("total_value", { precision: 20, scale: 2 }).notNull(), // Total USD value
  fee: decimal("fee", { precision: 20, scale: 2 }).default("0"),
  notes: text("notes"),
  transactionDate: timestamp("transaction_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Usage Logs - Detailed tracking of individual AI queries
export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  // Query details
  query: text("query").notNull(), // User's question
  response: text("response"), // AI's response (optional, can be large)
  // Model & routing
  modelUsed: text("model_used").notNull(), // "scout", "sonnet", "opus"
  modelName: text("model_name").notNull(), // Full model name (e.g., "meta-llama/llama-4-scout-17b-16e-instruct")
  escalated: boolean("escalated").default(false), // Was it escalated from Scout to Reasoning?
  escalationReason: text("escalation_reason"), // Why was it escalated?
  orchestratorUsed: text("orchestrator_used"), // debt, retirement, tax, portfolio, etc.
  // Token usage
  tokensIn: integer("tokens_in").notNull(),
  tokensOut: integer("tokens_out").notNull(),
  totalTokens: integer("total_tokens").notNull(),
  // Cost tracking
  costUsd: decimal("cost_usd", { precision: 10, scale: 6 }).notNull(), // Cost in USD
  // Performance
  responseTimeMs: integer("response_time_ms"), // How long the query took
  // Subscription tier at time of query
  tierAtQuery: text("tier_at_query"), // "free", "pro", "enterprise"
  // Metadata
  ipAddress: text("ip_address"), // For abuse detection
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ai_logs_user_id").on(table.userId),
  index("idx_ai_logs_model_used").on(table.modelUsed),
  index("idx_ai_logs_created_at").on(table.createdAt),
]);

// AI Financial Playbooks - Weekly automated insights
export const playbooks = pgTable("playbooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  // Time period
  weekStartDate: timestamp("week_start_date").notNull(), // Monday of the week
  weekEndDate: timestamp("week_end_date").notNull(), // Sunday of the week
  // Financial Pulse (Hero Card)
  financialHealthScore: integer("financial_health_score").notNull(), // 0-100
  scoreDelta: integer("score_delta").notNull(), // Change from last week
  confidenceBand: text("confidence_band"), // "improving", "stable", "declining"
  // Insight Highlights (JSON array)
  insights: jsonb("insights").notNull(), // [{text: string, tag: string, severity: "high"|"medium"|"low"}]
  insightsCount: integer("insights_count").notNull(), // 2/5/7 based on tier
  // Action Queue (JSON array)
  actions: jsonb("actions").notNull(), // [{title: string, description: string, effort: "low"|"medium"|"high", impact: "low"|"medium"|"high", deepLink: string}]
  actionsCount: integer("actions_count").default(3), // Top 3 prioritized
  // Measurable Impact
  roiSavings: decimal("roi_savings", { precision: 10, scale: 2 }).default("0"), // Money saved this week from AI advice
  cumulativeRoi: decimal("cumulative_roi", { precision: 10, scale: 2 }).default("0"), // Total savings to date
  forecastLift: text("forecast_lift"), // e.g., "+5% net worth by year-end"
  // Generation metadata
  tier: text("tier").notNull(), // "free", "pro", "enterprise"
  generatedBy: text("generated_by").notNull(), // "gpt5", "opus"
  generationTimeMs: integer("generation_time_ms"),
  tokensUsed: integer("tokens_used"),
  // Engagement tracking
  isViewed: boolean("is_viewed").default(false),
  viewedAt: timestamp("viewed_at"),
  actionsCompleted: integer("actions_completed").default(0), // How many actions user marked done
  completedActionIndices: jsonb("completed_action_indices").default([]), // Array of indices of completed actions to prevent duplicates
  shareCount: integer("share_count").default(0), // Times user shared playbook
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_playbooks_user_id").on(table.userId),
  index("idx_playbooks_week_start").on(table.weekStartDate),
  index("idx_playbooks_created_at").on(table.createdAt),
]);

// Subscription schema exports
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ id: true, createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true });
export const insertUsageTrackingSchema = createInsertSchema(usageTracking).omit({ id: true, createdAt: true });
export const insertSubscriptionAddOnSchema = createInsertSchema(subscriptionAddOns).omit({ id: true, createdAt: true });

// Referral schema exports
export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({ id: true, createdAt: true });
export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true });
export const insertBonusCreditSchema = createInsertSchema(bonusCredits).omit({ id: true, createdAt: true });

// Crypto schema exports
export const insertCryptoHoldingSchema = createInsertSchema(cryptoHoldings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCryptoPriceAlertSchema = createInsertSchema(cryptoPriceAlerts).omit({ id: true, createdAt: true });
export const insertCryptoTransactionSchema = createInsertSchema(cryptoTransactions).omit({ id: true, createdAt: true });

// AI Usage Logs schema exports
export const insertAiUsageLogSchema = createInsertSchema(aiUsageLogs).omit({ id: true, createdAt: true });

// Playbooks schema exports
export const insertPlaybookSchema = createInsertSchema(playbooks).omit({ id: true, createdAt: true, viewedAt: true });

// Subscription types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type UsageTracking = typeof usageTracking.$inferSelect;
export type SubscriptionAddOn = typeof subscriptionAddOns.$inferSelect;

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertUsageTracking = z.infer<typeof insertUsageTrackingSchema>;
export type InsertSubscriptionAddOn = z.infer<typeof insertSubscriptionAddOnSchema>;

// Referral types
export type ReferralCode = typeof referralCodes.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type BonusCredit = typeof bonusCredits.$inferSelect;

export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type InsertBonusCredit = z.infer<typeof insertBonusCreditSchema>;

// Crypto types
export type CryptoHolding = typeof cryptoHoldings.$inferSelect;
export type CryptoPriceAlert = typeof cryptoPriceAlerts.$inferSelect;
export type CryptoTransaction = typeof cryptoTransactions.$inferSelect;

export type InsertCryptoHolding = z.infer<typeof insertCryptoHoldingSchema>;
export type InsertCryptoPriceAlert = z.infer<typeof insertCryptoPriceAlertSchema>;
export type InsertCryptoTransaction = z.infer<typeof insertCryptoTransactionSchema>;

// AI Usage Logs types
export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type InsertAiUsageLog = z.infer<typeof insertAiUsageLogSchema>;

// Playbooks types
export type Playbook = typeof playbooks.$inferSelect;
export type InsertPlaybook = z.infer<typeof insertPlaybookSchema>;

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

// Referral relations
export const referralCodesRelations = relations(referralCodes, ({ one, many }) => ({
  user: one(users, {
    fields: [referralCodes.userId],
    references: [users.id],
  }),
  referrals: many(referrals),
}));

export const referralsRelations = relations(referrals, ({ one, many }) => ({
  referrer: one(users, {
    fields: [referrals.referrerUserId],
    references: [users.id],
  }),
  referred: one(users, {
    fields: [referrals.referredUserId],
    references: [users.id],
  }),
  referralCode: one(referralCodes, {
    fields: [referrals.referralCodeId],
    references: [referralCodes.id],
  }),
  bonusCredits: many(bonusCredits),
}));

export const bonusCreditsRelations = relations(bonusCredits, ({ one }) => ({
  user: one(users, {
    fields: [bonusCredits.userId],
    references: [users.id],
  }),
  referral: one(referrals, {
    fields: [bonusCredits.referralId],
    references: [referrals.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// WORLD-CLASS SCORING SYSTEM TYPES
// ═══════════════════════════════════════════════════════════════════════════

export const insertMonthlyFinancialsSchema = createInsertSchema(monthlyFinancials);
export const insertScoreSnapshotSchema = createInsertSchema(scoreSnapshots).omit({
  id: true,
  createdAt: true,
});

export type MonthlyFinancials = typeof monthlyFinancials.$inferSelect;
export type InsertMonthlyFinancials = z.infer<typeof insertMonthlyFinancialsSchema>;
export type ScoreSnapshot = typeof scoreSnapshots.$inferSelect;
export type InsertScoreSnapshot = z.infer<typeof insertScoreSnapshotSchema>;

// Score bands
export type ScoreBand = 'Critical' | 'Needs Work' | 'Good' | 'Great';

// Drivers structure for explainability
export type ScoreDrivers = {
  cashflow: { drivers: string[]; action: string };
  stability: { drivers: string[]; action: string };
  growth: { drivers: string[]; action: string };
  behavior: { drivers: string[]; action: string };
  overall: { drivers: string[]; action: string };
};

// ═══════════════════════════════════════════════════════════════════════════
// AI LEARNING SYSTEM - Memory, Patterns, and Personalization
// ═══════════════════════════════════════════════════════════════════════════

// AI User Memories - Long-term facts learned from conversations
export const aiUserMemories = pgTable("ai_user_memories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  factType: text("fact_type").notNull(), // 'preference', 'life_event', 'financial_goal', 'context', 'personal'
  factKey: text("fact_key").notNull(),   // e.g., 'job_title', 'wife_name', 'investment_style', 'risk_tolerance'
  factValue: text("fact_value").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.80"), // 0.00 to 1.00
  source: text("source").default("conversation"), // 'conversation', 'action', 'inferred', 'explicit'
  lastMentionedAt: timestamp("last_mentioned_at").defaultNow(),
  mentionCount: integer("mention_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ai_memories_user_id").on(table.userId),
  unique("unique_ai_memory_user_key").on(table.userId, table.factKey),
]);

// AI Spending Patterns - Detected patterns in user spending behavior
export const aiSpendingPatterns = pgTable("ai_spending_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  patternType: text("pattern_type").notNull(), // 'recurring', 'seasonal', 'impulse', 'trend', 'anomaly'
  category: text("category").notNull(),        // 'food', 'transport', 'entertainment', 'shopping', etc.
  patternData: jsonb("pattern_data").notNull().$type<{
    average: number;                           // Average amount for this pattern
    trend: 'increasing' | 'decreasing' | 'stable'; // Overall trend
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    lastAmount?: number;                       // Most recent amount
    percentChange?: number;                    // % change from previous period
    prediction?: number;                       // Predicted next amount
    seasonalPeak?: string;                     // e.g., "December" for holiday spending
    impulseThreshold?: number;                 // Amount that triggers impulse flag
  }>(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.70"),
  detectedAt: timestamp("detected_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_patterns_user_id").on(table.userId),
  unique("unique_ai_pattern_user_type_category").on(table.userId, table.patternType, table.category),
]);

// AI Communication Preferences - Learn how user prefers to communicate
export const aiCommunicationPrefs = pgTable("ai_communication_prefs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  adviceLength: text("advice_length").default("balanced"), // 'brief', 'balanced', 'detailed'
  communicationStyle: text("communication_style").default("friendly"), // 'professional', 'friendly', 'casual'
  usesEmoji: boolean("uses_emoji").default(true),
  prefersActionFirst: boolean("prefers_action_first").default(true), // Execute actions before explaining
  technicalLevel: text("technical_level").default("intermediate"), // 'beginner', 'intermediate', 'expert'
  topicsOfInterest: text("topics_of_interest").array().default(sql`ARRAY[]::text[]`), // ['investing', 'budgeting', 'crypto']
  preferredExamples: text("preferred_examples").default("relatable"), // 'relatable', 'technical', 'none'
  responseSpeed: text("response_speed").default("balanced"), // 'quick', 'balanced', 'thorough'
  // Learning signals
  positiveSignals: integer("positive_signals").default(0), // Count of positive feedback
  negativeSignals: integer("negative_signals").default(0), // Count of negative feedback
  lastFeedbackAt: timestamp("last_feedback_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_comm_prefs_user_id").on(table.userId),
]);

// Insert schemas for AI learning tables
export const insertAiUserMemorySchema = createInsertSchema(aiUserMemories).omit({
  id: true,
  createdAt: true,
  lastMentionedAt: true,
});

export const insertAiSpendingPatternSchema = createInsertSchema(aiSpendingPatterns).omit({
  id: true,
  detectedAt: true,
  updatedAt: true,
});

export const insertAiCommunicationPrefsSchema = createInsertSchema(aiCommunicationPrefs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for AI learning
export type AiUserMemory = typeof aiUserMemories.$inferSelect;
export type InsertAiUserMemory = z.infer<typeof insertAiUserMemorySchema>;
export type AiSpendingPattern = typeof aiSpendingPatterns.$inferSelect;
export type InsertAiSpendingPattern = z.infer<typeof insertAiSpendingPatternSchema>;
export type AiCommunicationPrefs = typeof aiCommunicationPrefs.$inferSelect;
export type InsertAiCommunicationPrefs = z.infer<typeof insertAiCommunicationPrefsSchema>;

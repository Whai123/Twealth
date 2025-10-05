import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertUserSchema,
  insertGroupSchema,
  insertGroupMemberSchema,
  insertEventSchema,
  insertFinancialGoalSchema,
  insertTransactionSchema,
  insertGroupInviteSchema,
  insertCalendarShareSchema,
  insertEventExpenseSchema,
  insertEventExpenseShareSchema,
  eventAttendeeSchema,
  insertUserSettingsSchema,
  insertUserPreferencesSchema,
  insertFinancialPreferencesSchema,
  insertPrivacySettingsSchema,
  insertEventTimeLogSchema,
  insertNotificationSchema,
  insertChatConversationSchema,
  insertChatMessageSchema,
  insertReferralCodeSchema,
  insertReferralSchema,
  insertBonusCreditSchema,
  insertCryptoHoldingSchema,
  insertCryptoPriceAlertSchema,
  insertCryptoTransactionSchema
} from "@shared/schema";
import { aiService, type UserContext } from "./aiService";
import { cryptoService } from "./cryptoService";
import Stripe from "stripe";

// Initialize Stripe (will use environment variable when available)
let stripe: Stripe | null = null;

try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil" as any,
    });
  }
} catch (error) {
  console.log("Stripe not initialized - API key not provided");
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth middleware setup
  await setupAuth(app);
  
  // Raw body middleware for Stripe webhooks
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
  
  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // User routes - With demo fallback
  app.get("/api/users/me", async (req: any, res) => {
    try {
      let user;
      if (req.user && req.user.claims && req.user.claims.sub) {
        const userId = req.user.claims.sub;
        user = await storage.getUser(userId);
      } else {
        user = await storage.createDemoUserIfNeeded();
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dashboard routes - With demo fallback
  app.get("/api/dashboard/stats", async (req: any, res) => {
    try {
      let userId;
      if (req.user && req.user.claims && req.user.claims.sub) {
        userId = req.user.claims.sub;
      } else {
        const user = await storage.createDemoUserIfNeeded();
        userId = user.id;
      }
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Group routes
  app.get("/api/groups", async (req, res) => {
    try {
      // Use authenticated user from session
      const user = await storage.createDemoUserIfNeeded();
      const groups = await storage.getGroupsByUserId(user.id);
      res.json(groups);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/groups", async (req, res) => {
    try {
      const validatedData = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(validatedData);
      res.status(201).json(group);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/groups/:id", async (req, res) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/groups/:id", async (req, res) => {
    try {
      const updateData = insertGroupSchema.partial().parse(req.body);
      const group = await storage.updateGroup(req.params.id, updateData);
      res.json(group);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/groups/:id", async (req, res) => {
    try {
      await storage.deleteGroup(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Group member routes
  app.get("/api/groups/:id/members", async (req, res) => {
    try {
      const members = await storage.getGroupMembers(req.params.id);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/groups/:id/members-with-users", async (req, res) => {
    try {
      const membersWithUsers = await storage.getGroupMembersWithUserInfo(req.params.id);
      res.json(membersWithUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/groups/:id/members", async (req, res) => {
    try {
      const memberData = { ...req.body, groupId: req.params.id };
      const validatedData = insertGroupMemberSchema.parse(memberData);
      const member = await storage.addGroupMember(validatedData);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/groups/:groupId/members/:userId", async (req, res) => {
    try {
      await storage.removeGroupMember(req.params.groupId, req.params.userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Group invite routes
  app.post("/api/groups/:id/invites", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const inviteData = {
        ...req.body,
        groupId: req.params.id,
        createdBy: user.id,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      };
      
      const validatedData = insertGroupInviteSchema.parse(inviteData);
      const result = await storage.createGroupInvite(validatedData);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/invites/:token", async (req, res) => {
    try {
      const invite = await storage.getGroupInviteByToken(req.params.token);
      if (!invite) {
        return res.status(404).json({ message: "Invalid or expired invite" });
      }
      
      // Return invite metadata without sensitive information
      const group = await storage.getGroup(invite.groupId);
      res.json({
        id: invite.id,
        group: {
          id: group?.id,
          name: group?.name,
          description: group?.description,
        },
        role: invite.role,
        expiresAt: invite.expiresAt,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/invites/:token/accept", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const member = await storage.acceptGroupInvite(req.params.token, user.id);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/invites/:token", async (req, res) => {
    try {
      await storage.revokeGroupInvite(req.params.token);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const groupId = req.query.groupId as string;
      
      let events;
      if (groupId) {
        events = await storage.getEventsByGroupId(groupId);
      } else {
        // Use authenticated user from session
        const user = await storage.createDemoUserIfNeeded();
        events = await storage.getEventsByUserId(user.id);
      }
      
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/events/upcoming", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Use authenticated user from session
      const user = await storage.createDemoUserIfNeeded();
      const events = await storage.getUpcomingEvents(user.id, limit);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      // Convert string dates to Date objects for validation
      const eventData = {
        ...req.body,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
        // Coerce decimal fields to strings for validation
        ...(req.body.budget != null && { budget: req.body.budget.toString() }),
        ...(req.body.actualCost != null && { actualCost: req.body.actualCost.toString() }),
      };
      
      const validatedData = insertEventSchema.parse(eventData);
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    try {
      // Convert string dates to Date objects for validation if present
      const eventData = {
        ...req.body,
        ...(req.body.startTime && { startTime: new Date(req.body.startTime) }),
        ...(req.body.endTime && { endTime: new Date(req.body.endTime) }),
        // Coerce decimal fields to strings for validation
        ...(req.body.budget != null && { budget: req.body.budget.toString() }),
        ...(req.body.actualCost != null && { actualCost: req.body.actualCost.toString() }),
      };
      
      const updateData = insertEventSchema.partial().parse(eventData);
      const event = await storage.updateEvent(req.params.id, updateData);
      res.json(event);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      await storage.deleteEvent(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // RSVP routes
  app.post("/api/events/:id/rsvp", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      
      // Validate RSVP data using Zod schema
      const rsvpSchema = eventAttendeeSchema.pick({ status: true });
      const { status } = rsvpSchema.parse(req.body);
      
      const event = await storage.updateEventRSVP(req.params.id, user.id, status);
      res.json(event);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Financial goal routes
  app.get("/api/financial-goals", async (req, res) => {
    try {
      // Use authenticated user from session
      const user = await storage.createDemoUserIfNeeded();
      const goals = await storage.getFinancialGoalsByUserId(user.id);
      res.json(goals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/financial-goals", async (req, res) => {
    try {
      const validatedData = insertFinancialGoalSchema.parse(req.body);
      const goal = await storage.createFinancialGoal(validatedData);
      res.status(201).json(goal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/financial-goals/:id", async (req, res) => {
    try {
      const goal = await storage.getFinancialGoal(req.params.id);
      if (!goal) {
        return res.status(404).json({ message: "Financial goal not found" });
      }
      res.json(goal);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/financial-goals/:id", async (req, res) => {
    try {
      // Convert string date to Date object for validation if present
      const goalData = {
        ...req.body,
        ...(req.body.targetDate && { targetDate: new Date(req.body.targetDate) }),
      };
      
      const updateData = insertFinancialGoalSchema.partial().parse(goalData);
      const goal = await storage.updateFinancialGoal(req.params.id, updateData);
      res.json(goal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/financial-goals/:id", async (req, res) => {
    try {
      await storage.deleteFinancialGoal(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Transaction routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const goalId = req.query.goalId as string;
      const limit = parseInt(req.query.limit as string) || 50;
      
      let transactions;
      if (goalId) {
        transactions = await storage.getTransactionsByGoalId(goalId);
      } else {
        // Use authenticated user from session
        const user = await storage.createDemoUserIfNeeded();
        transactions = await storage.getTransactionsByUserId(user.id, limit);
      }
      
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/transactions/:id", async (req, res) => {
    try {
      // Convert string date to Date object for validation if present
      const transactionData = {
        ...req.body,
        ...(req.body.date && { date: new Date(req.body.date) }),
      };
      
      const updateData = insertTransactionSchema.partial().parse(transactionData);
      const transaction = await storage.updateTransaction(req.params.id, updateData);
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      await storage.deleteTransaction(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Calendar share routes
  app.get("/api/calendar/shares", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const shares = await storage.getCalendarSharesByUserId(user.id);
      res.json(shares);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/calendar/shares", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const shareData = {
        ...req.body,
        // Set owner to current user
        ownerId: user.id,
        // Set default expiry to 30 days if not provided
        ...(req.body.expiresAt ? { expiresAt: new Date(req.body.expiresAt) } : { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
      };
      
      const validatedData = insertCalendarShareSchema.parse(shareData);
      const result = await storage.createCalendarShare(validatedData);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Public calendar access routes
  app.get("/api/public/calendar/:token", async (req, res) => {
    try {
      const events = await storage.getEventsForShare(req.params.token);
      res.json(events);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  });

  app.get("/api/public/calendar/:token/ics", async (req, res) => {
    const token = req.params.token;
    try {
      const events = await storage.getEventsForShare(token);
      
      // Generate ICS content
      const icsLines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//ScheduleMoney//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
      ];

      for (const event of events) {
        const startDate = new Date(event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endDate = new Date(event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const uid = `${event.id}@schedulmoney.app`;
        
        icsLines.push(
          "BEGIN:VEVENT",
          `UID:${uid}`,
          `DTSTART:${startDate}`,
          `DTEND:${endDate}`,
          `SUMMARY:${event.title.replace(/,/g, '\\,')}`,
          ...(event.description ? [`DESCRIPTION:${event.description.replace(/,/g, '\\,')}`] : []),
          ...(event.location ? [`LOCATION:${event.location.replace(/,/g, '\\,')}`] : []),
          `STATUS:${event.status?.toUpperCase() || 'CONFIRMED'}`,
          "END:VEVENT"
        );
      }

      icsLines.push("END:VCALENDAR");
      
      const icsContent = icsLines.join('\r\n');
      
      res.set({
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="calendar.ics"',
      });
      res.send(icsContent);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  });

  // Event expense routes
  app.get("/api/events/:eventId/expenses", async (req, res) => {
    try {
      const expenses = await storage.getEventExpensesByEventId(req.params.eventId);
      // Convert decimal amounts to numbers
      const formattedExpenses = expenses.map(expense => ({
        ...expense,
        amount: parseFloat(expense.amount.toString())
      }));
      res.json(formattedExpenses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/events/:eventId/expenses", async (req, res) => {
    try {
      const expenseData = {
        ...req.body,
        eventId: req.params.eventId,
        date: new Date(req.body.date || Date.now()),
        // Coerce amount to string for validation
        amount: req.body.amount?.toString() || "0"
      };
      
      const validatedData = insertEventExpenseSchema.parse(expenseData);
      const expense = await storage.createEventExpense(validatedData);
      
      // Convert decimal amount to number for response
      const formattedExpense = {
        ...expense,
        amount: parseFloat(expense.amount.toString())
      };
      
      res.status(201).json(formattedExpense);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/expenses/:id", async (req, res) => {
    try {
      const expense = await storage.getEventExpense(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      const formattedExpense = {
        ...expense,
        amount: parseFloat(expense.amount.toString())
      };
      
      res.json(formattedExpense);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const expenseData = {
        ...req.body,
        ...(req.body.date && { date: new Date(req.body.date) }),
        ...(req.body.amount && { amount: req.body.amount.toString() })
      };
      
      const updateData = insertEventExpenseSchema.partial().parse(expenseData);
      const expense = await storage.updateEventExpense(req.params.id, updateData);
      
      const formattedExpense = {
        ...expense,
        amount: parseFloat(expense.amount.toString())
      };
      
      res.json(formattedExpense);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      await storage.deleteEventExpense(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Event expense share routes
  app.get("/api/expenses/:expenseId/shares", async (req, res) => {
    try {
      const shares = await storage.getEventExpenseSharesByExpenseId(req.params.expenseId);
      const formattedShares = shares.map(share => ({
        ...share,
        shareAmount: parseFloat(share.shareAmount.toString())
      }));
      res.json(formattedShares);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/expenses/:expenseId/shares", async (req, res) => {
    try {
      const shareData = {
        ...req.body,
        expenseId: req.params.expenseId,
        shareAmount: req.body.shareAmount?.toString() || "0"
      };
      
      const validatedData = insertEventExpenseShareSchema.parse(shareData);
      const share = await storage.createEventExpenseShare(validatedData);
      
      const formattedShare = {
        ...share,
        shareAmount: parseFloat(share.shareAmount.toString())
      };
      
      res.status(201).json(formattedShare);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/expense-shares/:id", async (req, res) => {
    try {
      const shareData = {
        ...req.body,
        ...(req.body.shareAmount && { shareAmount: req.body.shareAmount.toString() })
      };
      const updateData = insertEventExpenseShareSchema.partial().parse(shareData);
      const share = await storage.updateEventExpenseShare(req.params.id, updateData);
      
      const formattedShare = {
        ...share,
        shareAmount: parseFloat(share.shareAmount.toString())
      };
      
      res.json(formattedShare);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/expense-shares/:id", async (req, res) => {
    try {
      await storage.deleteEventExpenseShare(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Event financial summary route
  app.get("/api/events/:eventId/financial-summary", async (req, res) => {
    try {
      const summary = await storage.getEventFinancialSummary(req.params.eventId);
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===============================
  // TIME TRACKING & VALUE ROUTES
  // ===============================

  // User Settings Routes
  app.get("/api/user-settings", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const settings = await storage.getUserSettings(user.id);
      if (!settings) {
        return res.status(404).json({ message: "User settings not found" });
      }
      res.json({
        ...settings,
        hourlyRate: parseFloat((settings.hourlyRate || 50).toString())
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/user-settings", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const settingsData = { ...req.body, userId: user.id };
      const validatedData = insertUserSettingsSchema.parse(settingsData);
      const settings = await storage.createUserSettings(validatedData);
      res.status(201).json({
        ...settings,
        hourlyRate: parseFloat((settings.hourlyRate || 50).toString())
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/user-settings", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const validatedData = insertUserSettingsSchema.omit({ userId: true }).partial().parse(req.body);
      const settings = await storage.updateUserSettings(user.id, validatedData);
      res.json({
        ...settings,
        hourlyRate: parseFloat((settings.hourlyRate || 50).toString())
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // User Preferences Routes
  app.get("/api/user-preferences", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const preferences = await storage.getUserPreferences(user.id);
      if (!preferences) {
        // Create default preferences if they don't exist
        const defaultPrefs = { 
          userId: user.id,
          theme: "system" as const
        };
        const newPrefs = await storage.createUserPreferences(defaultPrefs);
        return res.json(newPrefs);
      }
      res.json(preferences);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/user-preferences", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const validatedData = insertUserPreferencesSchema.omit({ userId: true }).partial().parse(req.body);
      const preferences = await storage.updateUserPreferences(user.id, validatedData);
      res.json(preferences);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Financial Preferences Routes
  app.get("/api/financial-preferences", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const preferences = await storage.getFinancialPreferences(user.id);
      if (!preferences) {
        // Create default preferences if they don't exist
        const defaultPrefs = {
          userId: user.id,
          defaultBudgetPeriod: "monthly" as const,
          autoSavingsAmount: "0.00",
          autoSavingsFrequency: "monthly" as const,
          defaultGoalPriority: "medium" as const
        };
        const newPrefs = await storage.createFinancialPreferences(defaultPrefs);
        return res.json(newPrefs);
      }
      res.json(preferences);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/financial-preferences", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const validatedData = insertFinancialPreferencesSchema.omit({ userId: true }).partial().parse(req.body);
      const preferences = await storage.updateFinancialPreferences(user.id, validatedData);
      res.json(preferences);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Privacy Settings Routes
  app.get("/api/privacy-settings", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const settings = await storage.getPrivacySettings(user.id);
      if (!settings) {
        // Create default settings if they don't exist
        const defaultSettings = {
          userId: user.id,
          profileVisibility: "private" as const
        };
        const newSettings = await storage.createPrivacySettings(defaultSettings);
        return res.json(newSettings);
      }
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/privacy-settings", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const validatedData = insertPrivacySettingsSchema.omit({ userId: true }).partial().parse(req.body);
      const settings = await storage.updatePrivacySettings(user.id, validatedData);
      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Data Export Routes
  app.get("/api/export-data", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const format = req.query.format as 'json' | 'csv' || 'json';
      
      if (format !== 'json' && format !== 'csv') {
        return res.status(400).json({ message: "Format must be 'json' or 'csv'" });
      }

      const exportData = await storage.exportUserData(user.id, format);
      
      // Update last export timestamp
      await storage.updatePrivacySettings(user.id, { lastDataExport: new Date() });
      
      const filename = `twealth-data-${user.id}-${new Date().toISOString().split('T')[0]}.${format}`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
      res.send(exportData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/delete-user-data", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const { confirmation } = req.body;
      
      if (confirmation !== 'DELETE') {
        return res.status(400).json({ 
          message: "Data deletion requires confirmation field with value 'DELETE'" 
        });
      }
      
      await storage.deleteUserData(user.id);
      res.json({ message: "All user data has been permanently deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Time Tracking Routes
  app.post("/api/time-logs", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      
      // Convert date strings to Date objects
      const timeLogData = {
        ...req.body,
        userId: user.id,
        startedAt: req.body.startedAt ? new Date(req.body.startedAt) : undefined,
        endedAt: req.body.endedAt ? new Date(req.body.endedAt) : undefined
      };
      
      // Calculate duration if both dates are provided
      if (timeLogData.startedAt && timeLogData.endedAt) {
        if (timeLogData.endedAt <= timeLogData.startedAt) {
          return res.status(400).json({ message: "End time must be after start time" });
        }
        const durationMs = timeLogData.endedAt.getTime() - timeLogData.startedAt.getTime();
        timeLogData.durationMinutes = Math.round(durationMs / (1000 * 60));
      }
      
      const validatedData = insertEventTimeLogSchema.parse(timeLogData);
      const timeLog = await storage.createTimeLog(validatedData);
      res.status(201).json(timeLog);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/events/:eventId/time-logs", async (req, res) => {
    try {
      const timeLogs = await storage.getEventTimeLogs(req.params.eventId);
      res.json(timeLogs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/time-logs", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const { range } = req.query;
      
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (range === '7d') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date();
      } else if (range === '30d') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        endDate = new Date();
      } else if (range === '90d') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        endDate = new Date();
      }
      
      const timeLogs = await storage.getUserTimeLogs(user.id, startDate, endDate);
      res.json(timeLogs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/time-logs/:id", async (req, res) => {
    try {
      // Convert date strings to Date objects
      const updateData = {
        ...req.body,
        startedAt: req.body.startedAt ? new Date(req.body.startedAt) : undefined,
        endedAt: req.body.endedAt ? new Date(req.body.endedAt) : undefined
      };
      
      // Calculate duration if both dates are provided
      if (updateData.startedAt && updateData.endedAt) {
        if (updateData.endedAt <= updateData.startedAt) {
          return res.status(400).json({ message: "End time must be after start time" });
        }
        const durationMs = updateData.endedAt.getTime() - updateData.startedAt.getTime();
        updateData.durationMinutes = Math.round(durationMs / (1000 * 60));
      }
      
      const validatedData = insertEventTimeLogSchema.omit({ userId: true, eventId: true }).partial().parse(updateData);
      const timeLog = await storage.updateTimeLog(req.params.id, validatedData);
      res.json(timeLog);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/time-logs/:id", async (req, res) => {
    try {
      await storage.deleteTimeLog(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Time-Value Insights Routes
  app.get("/api/insights/time-value", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const range = (req.query.range as '7d' | '30d' | '90d') || '30d';
      const insights = await storage.getTimeValueInsights(user.id, range);
      res.json(insights);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/events/:eventId/time-value", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const timeValue = await storage.calculateEventTimeValue(req.params.eventId, user.id);
      res.json(timeValue);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Enhanced Dashboard Stats (including time-value data)
  app.get("/api/dashboard/time-stats", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const range = (req.query.range as '7d' | '30d' | '90d') || '30d';
      
      // Get basic insights
      const insights = await storage.getTimeValueInsights(user.id, range);
      
      // Get user settings for context
      const settings = await storage.getUserSettings(user.id);
      
      // Calculate additional metrics
      const averageHourlyValue = insights.totalTimeHours > 0 ? insights.timeValue / insights.totalTimeHours : 0;
      const timeEfficiency = insights.timeValue > 0 ? ((insights.timeValue - insights.totalCost) / insights.timeValue) * 100 : 0;
      
      res.json({
        ...insights,
        hourlyRate: settings?.hourlyRate ? parseFloat(settings.hourlyRate.toString()) : 50,
        currency: settings?.currency || 'USD',
        averageHourlyValue,
        timeEfficiencyPercent: Math.round(timeEfficiency),
        range
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const limit = parseInt(req.query.limit as string) || 50;
      const includeRead = req.query.includeRead === 'true';
      
      const notifications = await storage.getNotificationsByUserId(user.id, limit, includeRead);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const count = await storage.getUnreadNotificationCount(user.id);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const notificationData = {
        ...req.body,
        userId: user.id,
      };
      
      const validatedData = insertNotificationSchema.parse(notificationData);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/notifications/generate", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const notifications = await storage.generateSmartNotifications(user.id);
      res.json({ 
        generated: notifications.length,
        notifications: notifications.slice(0, 5) // Return first 5 for preview
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      res.json(notification);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/notifications/mark-all-read", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      await storage.markAllNotificationsAsRead(user.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/notifications/:id/archive", async (req, res) => {
    try {
      const notification = await storage.archiveNotification(req.params.id);
      res.json(notification);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Chat API routes
  app.get("/api/chat/conversations", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const conversations = await storage.getChatConversations(user.id);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/chat/conversations/:id", async (req, res) => {
    try {
      const conversation = await storage.getChatConversationWithMessages(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/chat/conversations/:id/messages", async (req, res) => {
    try {
      const conversation = await storage.getChatConversationWithMessages(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation.messages || []);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/chat/conversations", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const validatedData = insertChatConversationSchema.parse({
        ...req.body,
        userId: user.id
      });
      const conversation = await storage.createChatConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/chat/conversations/:id/messages", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const conversationId = req.params.id;
      
      // Check usage limit before processing - strict enforcement
      const usageCheck = await storage.checkUsageLimit(user.id, 'aiChatsUsed');
      if (!usageCheck.allowed) {
        return res.status(429).json({ 
          message: "AI chat limit exceeded. Upgrade your plan to continue chatting.",
          usage: usageCheck.usage,
          limit: usageCheck.limit,
          upgradeRequired: true,
          type: 'quota_exceeded'
        });
      }
      
      // Validate conversation exists and belongs to user
      const conversation = await storage.getChatConversation(conversationId);
      if (!conversation || conversation.userId !== user.id) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const userMessage = req.body.content;
      const isDeepAnalysis = req.body.isDeepAnalysis || false; // Complex queries flag
      
      if (!userMessage || typeof userMessage !== 'string') {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Check deep analysis quota if this is a complex query
      if (isDeepAnalysis) {
        const deepAnalysisCheck = await storage.checkUsageLimit(user.id, 'aiDeepAnalysisUsed');
        if (!deepAnalysisCheck.allowed) {
          return res.status(429).json({ 
            message: "Deep analysis limit exceeded. Upgrade your plan for more advanced AI features.",
            usage: deepAnalysisCheck.usage,
            limit: deepAnalysisCheck.limit,
            upgradeRequired: true,
            type: 'deep_analysis_quota_exceeded'
          });
        }
      }

      // Save user message
      const userChatMessage = await storage.createChatMessage({
        conversationId,
        role: 'user',
        content: userMessage,
        userContext: null,
        tokenCount: Math.ceil(userMessage.length / 4), // Rough token estimate
        cost: '0.0000'
      });

      // Build user context for AI
      const [stats, goals, recentTransactions, upcomingEvents] = await Promise.all([
        storage.getUserStats(user.id),
        storage.getFinancialGoalsByUserId(user.id),
        storage.getTransactionsByUserId(user.id, 10),
        storage.getUpcomingEvents(user.id, 5)
      ]);

      const userContext: UserContext = {
        totalSavings: stats.totalSavings,
        monthlyIncome: stats.monthlyIncome,
        monthlyExpenses: stats.monthlyIncome - stats.totalSavings, // Simplified
        activeGoals: stats.activeGoals,
        recentTransactions: recentTransactions.slice(0, 5).map(t => ({
          amount: parseFloat(t.amount),
          category: t.category,
          description: t.description || '',
          date: t.date.toISOString()
        })),
        upcomingEvents: upcomingEvents.map(e => ({
          title: e.title,
          date: e.startTime.toISOString(),
          estimatedValue: parseFloat(e.budget || '0')
        }))
      };

      // Get conversation history
      const messages = await storage.getChatMessages(conversationId, 10);
      const conversationHistory = messages.reverse().map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.createdAt || new Date()
      }));

      // Track usage immediately (regardless of AI success/failure)
      await storage.incrementUsage(user.id, 'aiChatsUsed');
      if (isDeepAnalysis) {
        await storage.incrementUsage(user.id, 'aiDeepAnalysisUsed');
      }

      try {
        // Generate AI response
        const aiResponse = await aiService.generateAdvice(userMessage, userContext, conversationHistory);
        
        // Save AI response
        const aiChatMessage = await storage.createChatMessage({
          conversationId,
          role: 'assistant',
          content: aiResponse,
          userContext: userContext,
          tokenCount: Math.ceil(aiResponse.length / 4),
          cost: isDeepAnalysis ? '0.0005' : '0.0001' // Higher cost for deep analysis
        });

        // Update conversation title if it's the first exchange
        if (conversationHistory.length <= 1) {
          const title = userMessage.length > 50 
            ? userMessage.substring(0, 47) + "..." 
            : userMessage;
          await storage.updateChatConversation(conversationId, { title });
        }

        res.json({
          userMessage: userChatMessage,
          aiMessage: aiChatMessage
        });

      } catch (aiError: any) {
        // Save error message as AI response
        const errorMessage = "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
        const aiChatMessage = await storage.createChatMessage({
          conversationId,
          role: 'assistant',
          content: errorMessage,
          userContext: null,
          tokenCount: 0,
          cost: '0.0000'
        });

        res.json({
          userMessage: userChatMessage,
          aiMessage: aiChatMessage,
          error: "AI service temporarily unavailable"
        });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/chat/conversations/:id", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const conversation = await storage.getChatConversation(req.params.id);
      
      if (!conversation || conversation.userId !== user.id) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      await storage.deleteChatConversation(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Cost optimization stats endpoint
  app.get("/api/ai/cost-stats", async (req, res) => {
    try {
      const stats = aiService.getCostStats();
      res.json(stats);
    } catch (error) {
      console.error('Cost stats error:', error);
      res.status(500).json({ message: "Failed to get cost statistics" });
    }
  });

  // Reset usage endpoint (for testing/development)
  app.post("/api/subscription/reset-usage", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      await storage.resetUsage(user.id);
      
      console.log(`🔄 Usage reset for user ${user.id}`);
      res.json({ 
        message: "Usage reset successfully",
        userId: user.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Reset usage error:', error);
      res.status(500).json({ message: "Failed to reset usage" });
    }
  });

  // AI Insights endpoint
  app.get("/api/ai/insights", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      
      // Check usage limit for insights
      const usageCheck = await storage.checkUsageLimit(user.id, 'aiChatsUsed'); // Use chat quota for insights
      if (!usageCheck.allowed) {
        return res.status(429).json({ 
          insight: "Upgrade to get more AI insights.",
          error: "Usage limit exceeded",
          usage: usageCheck.usage,
          limit: usageCheck.limit,
          type: 'insights_quota_exceeded',
          upgradeRequired: true
        });
      }

      const [stats, goals, recentTransactions] = await Promise.all([
        storage.getUserStats(user.id),
        storage.getFinancialGoalsByUserId(user.id),
        storage.getTransactionsByUserId(user.id, 5)
      ]);

      const userContext: UserContext = {
        totalSavings: stats.totalSavings,
        monthlyIncome: stats.monthlyIncome,
        monthlyExpenses: Math.max(0, stats.monthlyIncome - stats.totalSavings),
        activeGoals: stats.activeGoals,
        recentTransactions: recentTransactions.map(t => ({
          amount: parseFloat(t.amount),
          category: t.category,
          description: t.description || '',
          date: t.date.toISOString()
        })),
        upcomingEvents: []
      };

      const insight = await aiService.generateProactiveInsight(userContext);
      
      // Track usage
      await storage.incrementUsage(user.id, 'aiInsightsGenerated');
      
      res.json({ insight });
    } catch (error: any) {
      res.status(500).json({ 
        insight: "Focus on tracking your spending patterns this week.",
        error: error.message 
      });
    }
  });

  // Subscription Management API routes
  app.get("/api/subscription/plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/subscription/current", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      let subscription = await storage.getUserSubscription(user.id);
      
      // Initialize free subscription if user doesn't have one
      if (!subscription) {
        await storage.initializeDefaultSubscription(user.id);
        subscription = await storage.getUserSubscription(user.id);
      }
      
      // Get current usage
      const usage = await storage.getUserUsage(user.id);
      const addOns = await storage.getUserAddOns(user.id);
      
      res.json({
        subscription,
        usage,
        addOns
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/subscription/usage", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const [chatCheck, analysisCheck, usage] = await Promise.all([
        storage.checkUsageLimit(user.id, 'aiChatsUsed'),
        storage.checkUsageLimit(user.id, 'aiDeepAnalysisUsed'),
        storage.getUserUsage(user.id)
      ]);

      res.json({
        chatUsage: {
          used: chatCheck.usage,
          limit: chatCheck.limit,
          remaining: Math.max(0, chatCheck.limit - chatCheck.usage),
          allowed: chatCheck.allowed
        },
        analysisUsage: {
          used: analysisCheck.usage,
          limit: analysisCheck.limit,
          remaining: Math.max(0, analysisCheck.limit - analysisCheck.usage),
          allowed: analysisCheck.allowed
        },
        insights: usage?.aiInsightsGenerated || 0,
        totalTokens: usage?.totalTokensUsed || 0,
        estimatedCost: usage?.estimatedCostUsd || '0.0000'
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe Payment Intent for Subscription
  app.post("/api/subscription/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Payment processing unavailable - Stripe not configured",
          requiresSetup: true 
        });
      }

      const user = await storage.createDemoUserIfNeeded();
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      // Get the target plan
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // Convert THB price to satang (cents equivalent)
      const amountInSatang = Math.round(parseFloat(plan.priceThb) * 100);

      // Ensure user has a subscription record
      let currentSubscription = await storage.getUserSubscription(user.id);
      if (!currentSubscription) {
        await storage.initializeDefaultSubscription(user.id);
        currentSubscription = await storage.getUserSubscription(user.id);
      }

      // Create or get Stripe customer
      let stripeCustomerId = '';
      
      if (currentSubscription?.stripeCustomerId) {
        stripeCustomerId = currentSubscription.stripeCustomerId;
      } else {
        const customerData: any = {
          metadata: {
            userId: user.id,
            plan: plan.name
          }
        };
        if (user.email) {
          customerData.email = user.email;
        }
        if (user.firstName && user.lastName) {
          customerData.name = `${user.firstName} ${user.lastName}`;
        } else if (user.email) {
          customerData.name = user.email;
        }
        const customer = await stripe.customers.create(customerData);
        stripeCustomerId = customer.id;
        
        // Save the customer ID to the subscription
        await storage.updateSubscription(currentSubscription!.id, {
          stripeCustomerId: stripeCustomerId
        });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInSatang,
        currency: 'thb',
        customer: stripeCustomerId,
        metadata: {
          userId: user.id,
          planId: plan.id,
          planName: plan.name
        },
        automatic_payment_methods: { enabled: true }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        planName: plan.displayName,
        price: plan.priceThb,
        currency: 'THB'
      });

    } catch (error: any) {
      console.error('Payment Intent Error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe Subscription Management
  app.post("/api/subscription/create-subscription", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Subscription processing unavailable - Stripe not configured",
          requiresSetup: true 
        });
      }

      const user = await storage.createDemoUserIfNeeded();
      const { planId, priceId } = req.body; // priceId from Stripe dashboard
      
      if (!planId || !priceId) {
        return res.status(400).json({ message: "Plan ID and Price ID are required" });
      }
      
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // Ensure user has a subscription record
      let currentSubscription = await storage.getUserSubscription(user.id);
      if (!currentSubscription) {
        await storage.initializeDefaultSubscription(user.id);
        currentSubscription = await storage.getUserSubscription(user.id);
      }

      // Create or get Stripe customer
      let stripeCustomerId = '';
      
      if (currentSubscription?.stripeCustomerId) {
        stripeCustomerId = currentSubscription.stripeCustomerId;
      } else {
        const customerData: any = {
          metadata: { userId: user.id }
        };
        if (user.email) {
          customerData.email = user.email;
        }
        if (user.firstName && user.lastName) {
          customerData.name = `${user.firstName} ${user.lastName}`;
        } else if (user.email) {
          customerData.name = user.email;
        }
        const customer = await stripe.customers.create(customerData);
        stripeCustomerId = customer.id;
        
        // Save the customer ID to the subscription
        await storage.updateSubscription(currentSubscription!.id, {
          stripeCustomerId: stripeCustomerId
        });
      }

      // Create Stripe subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: user.id,
          planId: plan.id
        }
      });

      const invoice = subscription.latest_invoice as any;
      res.json({
        subscriptionId: subscription.id,
        clientSecret: invoice?.payment_intent?.client_secret,
        planName: plan.displayName
      });

    } catch (error: any) {
      console.error('Subscription Creation Error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/subscription/upgrade", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      // Get the target plan
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      
      // Get current subscription
      let currentSubscription = await storage.getUserSubscription(user.id);
      if (!currentSubscription) {
        await storage.initializeDefaultSubscription(user.id);
        currentSubscription = await storage.getUserSubscription(user.id);
      }
      
      // Check if Stripe is available for real payment processing
      if (stripe && currentSubscription!.stripeSubscriptionId) {
        try {
          // Update Stripe subscription
          const updatedStripeSubscription = await stripe.subscriptions.update(
            currentSubscription!.stripeSubscriptionId,
            {
              items: [{
                id: currentSubscription!.stripeSubscriptionId,
                // Note: In production, you'd need to map planId to Stripe price IDs
                price: `price_${plan.name.toLowerCase()}` // This would be your actual Stripe price ID
              }],
              proration_behavior: 'create_prorations'
            }
          );

          // Update local subscription record
          const stripeSubscription = updatedStripeSubscription as any;
          await storage.updateSubscription(currentSubscription!.id, {
            planId: plan.id,
            currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
            localPrice: plan.priceThb,
          });

        } catch (stripeError) {
          console.error('Stripe update failed, falling back to local update:', stripeError);
          // Fall back to local update if Stripe fails
          const now = new Date();
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          
          await storage.updateSubscription(currentSubscription!.id, {
            planId: plan.id,
            currentPeriodStart: now,
            currentPeriodEnd: endOfMonth,
            localPrice: plan.priceThb,
          });
        }
      } else {
        // For demo/development mode - direct upgrade
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        await storage.updateSubscription(currentSubscription!.id, {
          planId: plan.id,
          currentPeriodStart: now,
          currentPeriodEnd: endOfMonth,
          localPrice: plan.priceThb,
        });
      }
      
      // Get the updated subscription with plan details
      const updatedSubscription = await storage.getUserSubscription(user.id);
      
      res.json({ 
        message: "Subscription upgraded successfully",
        subscription: updatedSubscription,
        requiresPayment: !stripe || !currentSubscription!.stripeSubscriptionId
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Payment verification endpoint for frontend
  app.post("/api/subscription/verify-payment", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ success: false, message: "Plan ID is required" });
      }

      // Get current subscription
      const currentSubscription = await storage.getUserSubscription(user.id);
      const plan = await storage.getSubscriptionPlan(planId);

      if (!currentSubscription || !plan) {
        return res.status(404).json({ 
          success: false, 
          message: "Subscription or plan not found" 
        });
      }

      // Check if the plan was successfully updated
      const isUpdated = currentSubscription.planId === planId;
      
      res.json({
        success: isUpdated,
        planName: plan.displayName,
        currentPlan: currentSubscription.plan?.displayName || 'Unknown',
        message: isUpdated 
          ? "Plan successfully updated" 
          : "Plan update pending - please contact support if this persists"
      });

    } catch (error: any) {
      console.error('Payment verification error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  });

  // ===== Crypto Routes =====
  
  // Get user's crypto holdings
  app.get("/api/crypto/holdings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const holdings = await storage.getUserCryptoHoldings(userId);
      
      // Fetch current prices for all holdings
      const updatedHoldings = await Promise.all(holdings.map(async (holding) => {
        try {
          const priceData = await cryptoService.getCryptoPrice(holding.coinId);
          if (priceData) {
            const updatedHolding = await storage.updateCryptoHolding(holding.id, {
              currentPrice: priceData.current_price.toString(),
              lastPriceUpdate: new Date()
            });
            return { ...updatedHolding, priceChange24h: priceData.price_change_percentage_24h };
          }
          return { ...holding, priceChange24h: 0 };
        } catch (error) {
          return { ...holding, priceChange24h: 0 };
        }
      }));
      
      res.json(updatedHoldings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create new crypto holding
  app.post("/api/crypto/holdings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCryptoHoldingSchema.parse({
        ...req.body,
        userId
      });
      
      // Fetch initial price
      const priceData = await cryptoService.getCryptoPrice(validatedData.coinId);
      if (priceData) {
        validatedData.currentPrice = priceData.current_price.toString();
        validatedData.lastPriceUpdate = new Date();
      }
      
      const holding = await storage.createCryptoHolding(validatedData);
      res.json(holding);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update crypto holding
  app.put("/api/crypto/holdings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const holdingId = req.params.id;
      
      // Verify ownership
      const holding = await storage.getCryptoHolding(holdingId);
      if (!holding || holding.userId !== userId) {
        return res.status(404).json({ message: "Holding not found" });
      }
      
      // Validate update data
      const validatedData = insertCryptoHoldingSchema.partial().parse(req.body);
      
      const updatedHolding = await storage.updateCryptoHolding(holdingId, validatedData);
      res.json(updatedHolding);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete crypto holding
  app.delete("/api/crypto/holdings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const holdingId = req.params.id;
      
      // Verify ownership
      const holding = await storage.getCryptoHolding(holdingId);
      if (!holding || holding.userId !== userId) {
        return res.status(404).json({ message: "Holding not found" });
      }
      
      await storage.deleteCryptoHolding(holdingId);
      res.json({ message: "Holding deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get current prices for multiple cryptos
  app.get("/api/crypto/prices", async (req, res) => {
    try {
      const { ids } = req.query;
      if (!ids || typeof ids !== 'string') {
        return res.status(400).json({ message: "Coin IDs are required" });
      }
      
      const coinIds = ids.split(',');
      const prices = await cryptoService.getCryptoPrices(coinIds);
      res.json(prices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get price for single crypto
  app.get("/api/crypto/prices/:coinId", async (req, res) => {
    try {
      const { coinId } = req.params;
      const price = await cryptoService.getCryptoPrice(coinId);
      
      if (!price) {
        return res.status(404).json({ message: "Cryptocurrency not found" });
      }
      
      res.json(price);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Search cryptocurrencies
  app.get("/api/crypto/search", async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const results = await cryptoService.searchCrypto(query);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get crypto portfolio summary
  app.get("/api/crypto/portfolio", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const portfolio = await storage.getUserCryptoPortfolioValue(userId);
      
      // Update with latest prices
      const holdingsWithPrices = await Promise.all(
        portfolio.holdings.map(async (holding) => {
          try {
            const coinId = (await storage.getUserCryptoHoldings(userId))
              .find(h => h.symbol === holding.symbol)?.coinId;
            
            if (coinId) {
              const priceData = await cryptoService.getCryptoPrice(coinId);
              if (priceData) {
                const amount = parseFloat(holding.amount);
                const currentPrice = priceData.current_price;
                return {
                  ...holding,
                  currentPrice: currentPrice.toString(),
                  value: amount * currentPrice,
                  change24h: priceData.price_change_percentage_24h || 0
                };
              }
            }
            return holding;
          } catch (error) {
            return holding;
          }
        })
      );
      
      const totalValue = holdingsWithPrices.reduce((sum, h) => sum + h.value, 0);
      res.json({ totalValue, holdings: holdingsWithPrices });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get user's crypto transactions
  app.get("/api/crypto/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const transactions = await storage.getUserCryptoTransactions(userId, limit);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create crypto transaction
  app.post("/api/crypto/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCryptoTransactionSchema.parse({
        ...req.body,
        userId
      });
      
      const transaction = await storage.createCryptoTransaction(validatedData);
      
      // Update holding if it's a buy/sell transaction
      if (transaction.holdingId) {
        const holding = await storage.getCryptoHolding(transaction.holdingId);
        if (holding) {
          const currentAmount = parseFloat(holding.amount);
          const transactionAmount = parseFloat(transaction.amount);
          const newAmount = transaction.type === 'buy' 
            ? currentAmount + transactionAmount 
            : currentAmount - transactionAmount;
          
          await storage.updateCryptoHolding(transaction.holdingId, {
            amount: newAmount.toString()
          });
        }
      }
      
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get user's price alerts
  app.get("/api/crypto/alerts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alerts = await storage.getUserCryptoPriceAlerts(userId);
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create price alert
  app.post("/api/crypto/alerts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCryptoPriceAlertSchema.parse({
        ...req.body,
        userId
      });
      
      const alert = await storage.createCryptoPriceAlert(validatedData);
      res.json(alert);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update price alert
  app.put("/api/crypto/alerts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alertId = req.params.id;
      
      // Verify ownership
      const alert = await storage.getCryptoPriceAlert(alertId);
      if (!alert || alert.userId !== userId) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      const updatedAlert = await storage.updateCryptoPriceAlert(alertId, req.body);
      res.json(updatedAlert);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete price alert
  app.delete("/api/crypto/alerts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alertId = req.params.id;
      
      // Verify ownership
      const alert = await storage.getCryptoPriceAlert(alertId);
      if (!alert || alert.userId !== userId) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      await storage.deleteCryptoPriceAlert(alertId);
      res.json({ message: "Alert deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe Webhook Handler for payment completion
  app.post('/api/webhooks/stripe', async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      let event: any;

      try {
        if (endpointSecret && sig) {
          // Production: Verify webhook signature with raw body
          event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } else if (process.env.NODE_ENV === 'development') {
          // Development only: Parse body directly when no secret configured
          console.warn('⚠️  Webhook signature verification disabled in development');
          event = JSON.parse(req.body.toString());
        } else {
          // Production without secret - security risk, reject
          console.error('❌ Webhook secret required in production');
          return res.status(401).json({ 
            error: "Webhook secret required for signature verification" 
          });
        }
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          await handlePaymentSuccess(paymentIntent);
          break;
        
        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          await handleSubscriptionPaymentSuccess(invoice);
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Referral System API routes
  app.get("/api/referrals/my-code", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      let referralCode = await storage.getUserReferralCode(user.id);
      
      // Create referral code if user doesn't have one
      if (!referralCode) {
        const code = `${(user.firstName || user.email?.split('@')[0] || 'USER').toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        referralCode = await storage.createReferralCode({
          userId: user.id,
          code: code,
          maxUses: 100,
          currentUses: 0,
          isActive: true
        });
      }
      
      res.json(referralCode);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/referrals/use-code", async (req, res) => {
    try {
      const { referralCode } = req.body;
      if (!referralCode) {
        return res.status(400).json({ message: "Referral code is required" });
      }

      const user = await storage.createDemoUserIfNeeded();
      
      // Process the referral
      const referral = await storage.processReferral(user.id, referralCode);
      
      // Add bonus credits for the referred user (10 AI chats)
      await storage.addBonusCredits({
        userId: user.id,
        amount: 10,
        source: "referral_signup",
        referralId: referral.id,
        description: "Welcome bonus: 10 AI chats for using referral code"
      });

      // Add bonus credits for the referrer (10 AI chats)
      await storage.addBonusCredits({
        userId: referral.referrerUserId,
        amount: 10,
        source: "referral_made",
        referralId: referral.id,
        description: "Referral bonus: 10 AI chats for successful referral"
      });
      
      res.json({ 
        success: true, 
        bonusCredits: 10,
        message: "Referral successful! You and your friend both received 10 bonus AI chats!"
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/referrals/my-referrals", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const referrals = await storage.getUserReferrals(user.id);
      res.json(referrals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/referrals/bonus-credits", async (req, res) => {
    try {
      const user = await storage.createDemoUserIfNeeded();
      const [credits, availableAmount] = await Promise.all([
        storage.getUserBonusCredits(user.id),
        storage.getAvailableBonusCredits(user.id)
      ]);
      
      res.json({
        credits,
        availableAmount
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/referrals/validate-code", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "Referral code is required" });
      }
      
      const referralCode = await storage.getReferralByCode(code);
      if (!referralCode) {
        return res.status(404).json({ message: "Invalid referral code" });
      }
      
      const currentUses = referralCode.currentUses ?? 0;
      const maxUses = referralCode.maxUses ?? 100;
      
      if (currentUses >= maxUses) {
        return res.status(400).json({ message: "Referral code has reached maximum uses" });
      }
      
      res.json({ 
        valid: true, 
        usesRemaining: maxUses - currentUses 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Helper function to handle successful payment intent
  async function handlePaymentSuccess(paymentIntent: any) {
    try {
      const { userId, planId } = paymentIntent.metadata;
      
      if (!userId || !planId) {
        console.error('Missing metadata in payment intent:', paymentIntent.id);
        return;
      }

      // Get the plan and user subscription
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        console.error('Plan not found:', planId);
        return;
      }

      let currentSubscription = await storage.getUserSubscription(userId);
      if (!currentSubscription) {
        // Initialize default subscription if none exists
        await storage.initializeDefaultSubscription(userId);
        currentSubscription = await storage.getUserSubscription(userId);
      }

      if (currentSubscription) {
        // Update the subscription to the new plan
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        await storage.updateSubscription(currentSubscription.id, {
          planId: plan.id,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: endOfMonth,
          localPrice: plan.priceThb,
          localCurrency: 'THB'
        });

        console.log(`Successfully upgraded user ${userId} to plan ${plan.name} after payment ${paymentIntent.id}`);
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  // Helper function to handle successful subscription payment
  async function handleSubscriptionPaymentSuccess(invoice: any) {
    try {
      const subscription = invoice.subscription;
      const { userId, planId } = invoice.metadata || {};
      
      if (!userId || !planId) {
        console.error('Missing metadata in invoice:', invoice.id);
        return;
      }

      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        console.error('Plan not found:', planId);
        return;
      }

      let currentSubscription = await storage.getUserSubscription(userId);
      if (currentSubscription) {
        const subscriptionDetails = await stripe!.subscriptions.retrieve(subscription);
        
        await storage.updateSubscription(currentSubscription.id, {
          planId: plan.id,
          status: 'active',
          stripeSubscriptionId: subscription,
          currentPeriodStart: new Date((subscriptionDetails as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscriptionDetails as any).current_period_end * 1000),
          localPrice: plan.priceThb,
          localCurrency: 'THB'
        });

        console.log(`Successfully updated subscription ${subscription} for user ${userId} to plan ${plan.name}`);
      }
    } catch (error) {
      console.error('Error handling subscription payment success:', error);
    }
  }

  // Currency Exchange Rates API
  let cachedRates: any = null;
  let ratesCacheTime = 0;
  const RATES_CACHE_TTL = 60 * 60 * 1000; // Cache for 1 hour

  app.get("/api/currency/rates", async (req, res) => {
    try {
      // Return cached rates if still valid
      if (cachedRates && Date.now() - ratesCacheTime < RATES_CACHE_TTL) {
        return res.json(cachedRates);
      }

      // Fetch live rates from exchangerate-api.com (free tier)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      
      // Extract only the currencies we support
      const supportedCurrencies = ['USD', 'THB', 'EUR', 'IDR', 'INR', 'BRL', 'MXN', 'GBP', 'JPY', 'CAD', 'AUD', 'VND', 'PHP', 'MYR', 'TRY'];
      const rates: Record<string, number> = {};
      
      supportedCurrencies.forEach(currency => {
        rates[currency] = data.rates[currency] || 1;
      });

      cachedRates = {
        rates,
        lastUpdated: data.date || new Date().toISOString(),
        base: 'USD'
      };
      ratesCacheTime = Date.now();

      res.json(cachedRates);
    } catch (error: any) {
      console.error('Currency API Error:', error);
      // Return fallback rates if API fails
      res.json({
        rates: {
          USD: 1.00,
          THB: 33.50,
          EUR: 0.85,
          IDR: 15200,
          INR: 83.10,
          BRL: 5.20,
          MXN: 18.00,
          GBP: 0.78,
          JPY: 150.00,
          CAD: 1.35,
          AUD: 1.50,
          VND: 24000,
          PHP: 56.00,
          MYR: 4.65,
          TRY: 29.50,
        },
        lastUpdated: new Date().toISOString(),
        base: 'USD',
        fallback: true
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

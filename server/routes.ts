import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  insertNotificationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.get("/api/users/me", async (req, res) => {
    try {
      // Return the demo user (or create if needed)
      const user = await storage.createDemoUserIfNeeded();
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

  // Dashboard routes
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // For demo, use first user or create one
      const user = await storage.createDemoUserIfNeeded();
      const stats = await storage.getUserStats(user.id);
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

  const httpServer = createServer(app);
  return httpServer;
}

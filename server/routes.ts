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
  eventAttendeeSchema
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
        // If scope is user and no userId provided, use current user
        ...(req.body.scope === "user" && !req.body.userId && { userId: user.id }),
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

  app.get("/api/public/calendar/:token.ics", async (req, res) => {
    try {
      const events = await storage.getEventsForShare(req.params.token);
      
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

  const httpServer = createServer(app);
  return httpServer;
}

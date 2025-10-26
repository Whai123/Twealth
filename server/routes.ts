import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { subscriptionPlans } from "@shared/schema";
import { setupAuth, isAuthenticated, getUserIdFromRequest } from "./replitAuth";
import { 
  insertUserSchema,
  insertGroupSchema,
  insertGroupMemberSchema,
  insertEventSchema,
  insertFinancialGoalSchema,
  insertTransactionSchema,
  insertGroupInviteSchema,
  insertCalendarShareSchema,
  insertFriendRequestSchema,
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
  insertMessageFeedbackSchema,
  insertReferralCodeSchema,
  insertReferralSchema,
  insertBonusCreditSchema,
  insertCryptoHoldingSchema,
  insertCryptoPriceAlertSchema,
  insertCryptoTransactionSchema,
  insertSharedBudgetSchema,
  insertSharedBudgetExpenseSchema,
  sharedBudgetExpenses,
  friendGroupInvitations
} from "@shared/schema";
import { aiService, type UserContext } from "./aiService";
import { extractAndUpdateMemory, getMemoryContext } from './conversationMemoryService';
import { cryptoService } from "./cryptoService";
import { taxService } from "./taxService";
import { autoCategorizeTransaction, getCategorySuggestions, getAvailableCategories } from "./categorizationService";
import { spendingPatternService } from "./spendingPatternService";
import { calculateFinancialHealth } from './financialHealthService';
import { checkGoalProgress, getGoalMilestones } from './goalMilestoneService';
import { generateProactiveInsights } from './proactiveInsightsService';
import Stripe from "stripe";

// Utility function to parse amount strings (handles "$300", "300", "300.50", etc.)
function parseAmount(value: string | number): string {
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  
  // Remove dollar signs, commas, and whitespace
  const cleaned = value.replace(/[\$,\s]/g, '');
  
  // Parse to number and back to fixed decimal string
  const num = parseFloat(cleaned);
  
  if (isNaN(num)) {
    throw new Error(`Invalid amount: ${value}`);
  }
  
  return num.toFixed(2);
}

// Initialize Stripe (will use environment variable when available)
let stripe: Stripe | null = null;

try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia" as any,
    });
    console.log('✅ Stripe initialized successfully');
  } else {
    console.log("⚠️  Stripe not initialized - API key not provided");
  }
} catch (error) {
  console.error("❌ Stripe initialization failed:", error);
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
  
  // User routes - Requires authentication
  app.get("/api/users/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      let user = await storage.getUser(userId);
      
      // Defensive: if user doesn't exist but we have valid claims, create them
      // This handles testing scenarios and edge cases where OIDC callback didn't create user
      if (!user && req.user && req.user.claims) {
        console.log('[/api/users/me] User not found, creating from claims:', userId);
        const claims = req.user.claims;
        user = await storage.upsertUser({
          id: claims.sub,
          email: claims.email,
          firstName: claims.first_name,
          lastName: claims.last_name,
          profileImageUrl: claims.profile_image_url,
        });
        
        // Initialize subscription for new user
        const subscription = await storage.getUserSubscription(user.id);
        if (!subscription) {
          await storage.initializeDefaultSubscription(user.id);
        }
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      console.error('[/api/users/me] Error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/search", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const query = req.query.q as string;
      
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }
      
      const users = await storage.searchUsers(query, userId);
      res.json(users);
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

  // Dashboard routes - Requires authentication
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Group routes
  app.get("/api/groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const groups = await storage.getGroupsByUserId(userId);
      res.json(groups);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const validatedData = insertGroupSchema.parse({ ...req.body, ownerId: userId });
      const group = await storage.createGroup(validatedData);
      res.status(201).json(group);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/groups/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      // Check if user is a member of this group
      const members = await storage.getGroupMembers(req.params.id);
      const isMember = members.some((m: any) => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(group);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/groups/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      // Check if user is owner or admin
      const members = await storage.getGroupMembers(req.params.id);
      const userMember = members.find((m: any) => m.userId === userId);
      if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
        return res.status(403).json({ message: "Only group owners and admins can update the group" });
      }
      
      const updateData = insertGroupSchema.partial().parse(req.body);
      const updatedGroup = await storage.updateGroup(req.params.id, updateData);
      res.json(updatedGroup);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/groups/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      // Only owner can delete the group
      if (group.ownerId !== userId) {
        return res.status(403).json({ message: "Only the group owner can delete the group" });
      }
      
      await storage.deleteGroup(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Group member routes
  app.get("/api/groups/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const members = await storage.getGroupMembers(req.params.id);
      
      // Check if user is a member of this group
      const isMember = members.some((m: any) => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/groups/:id/members-with-users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const members = await storage.getGroupMembers(req.params.id);
      
      // Check if user is a member of this group
      const isMember = members.some((m: any) => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const membersWithUsers = await storage.getGroupMembersWithUserInfo(req.params.id);
      res.json(membersWithUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/groups/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const members = await storage.getGroupMembers(req.params.id);
      
      // Check if user is owner or admin
      const userMember = members.find((m: any) => m.userId === userId);
      if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
        return res.status(403).json({ message: "Only group owners and admins can add members" });
      }
      
      const memberData = { ...req.body, groupId: req.params.id };
      const validatedData = insertGroupMemberSchema.parse(memberData);
      const member = await storage.addGroupMember(validatedData);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/groups/:groupId/members/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = getUserIdFromRequest(req);
      const members = await storage.getGroupMembers(req.params.groupId);
      
      // Check if user is owner/admin OR removing themselves
      const userMember = members.find((m: any) => m.userId === requestingUserId);
      const isOwnerOrAdmin = userMember && (userMember.role === 'owner' || userMember.role === 'admin');
      const isRemovingSelf = requestingUserId === req.params.userId;
      
      if (!isOwnerOrAdmin && !isRemovingSelf) {
        return res.status(403).json({ message: "Only group owners/admins can remove members, or you can remove yourself" });
      }
      
      await storage.removeGroupMember(req.params.groupId, req.params.userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Group invite routes
  app.post("/api/groups/:id/invites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const inviteData = {
        ...req.body,
        groupId: req.params.id,
        createdBy: userId,
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

  app.post("/api/invites/:token/accept", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const member = await storage.acceptGroupInvite(req.params.token, userId);
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
  app.get("/api/events", isAuthenticated, async (req: any, res) => {
    try {
      const groupId = req.query.groupId as string;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      
      let events;
      if (groupId) {
        events = await storage.getEventsByGroupId(groupId);
      } else {
        // Use authenticated user from session
        const userId = getUserIdFromRequest(req);
        events = await storage.getUserAccessibleEventsWithGroups(userId, limit, offset);
      }
      
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/events/upcoming", isAuthenticated, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Use authenticated user from session
      const userId = getUserIdFromRequest(req);
      const events = await storage.getUpcomingEventsWithAttendees(userId, limit);
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
  app.post("/api/events/:id/rsvp", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      
      // Validate RSVP data using Zod schema
      const rsvpSchema = eventAttendeeSchema.pick({ status: true });
      const { status } = rsvpSchema.parse(req.body);
      
      const event = await storage.updateEventRSVP(req.params.id, userId, status);
      res.json(event);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Financial goal routes
  app.get("/api/financial-goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const goals = await storage.getFinancialGoalsByUserId(userId);
      res.json(goals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/financial-goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const validatedData = insertFinancialGoalSchema.parse({ ...req.body, userId });
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

  // Shared Goals routes
  app.post("/api/goals/:goalId/share", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { sharedWithUserId, permission } = req.body;
      
      // Verify goal ownership
      const goal = await storage.getFinancialGoal(req.params.goalId);
      if (!goal || goal.userId !== userId) {
        return res.status(403).json({ message: "You can only share your own goals" });
      }
      
      // Check if they are friends
      const areFriends = await storage.areFriends(userId, sharedWithUserId);
      if (!areFriends) {
        return res.status(400).json({ message: "You can only share goals with friends" });
      }
      
      const share = await storage.shareGoal({
        goalId: req.params.goalId,
        ownerId: userId,
        sharedWithUserId,
        permission: permission || 'view',
        status: 'active'
      });
      
      res.status(201).json(share);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/goals/shared", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const sharedGoals = await storage.getSharedGoals(userId);
      res.json(sharedGoals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/goals/:goalId/shares", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      
      // Verify goal ownership
      const goal = await storage.getFinancialGoal(req.params.goalId);
      if (!goal || goal.userId !== userId) {
        return res.status(403).json({ message: "You can only view shares for your own goals" });
      }
      
      const shares = await storage.getGoalShares(req.params.goalId);
      res.json(shares);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/goals/:goalId/share/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const ownerId = getUserIdFromRequest(req);
      
      // Verify goal ownership
      const goal = await storage.getFinancialGoal(req.params.goalId);
      if (!goal || goal.userId !== ownerId) {
        return res.status(403).json({ message: "You can only unshare your own goals" });
      }
      
      await storage.removeGoalShare(req.params.goalId, req.params.userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/goals/:goalId/share/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const ownerId = getUserIdFromRequest(req);
      const { permission } = req.body;
      
      // Verify goal ownership
      const goal = await storage.getFinancialGoal(req.params.goalId);
      if (!goal || goal.userId !== ownerId) {
        return res.status(403).json({ message: "You can only update shares for your own goals" });
      }
      
      const share = await storage.updateGoalSharePermission(req.params.goalId, req.params.userId, permission);
      res.json(share);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/goals/:goalId/share-with-group", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { groupId, permission } = req.body;
      
      console.log('[SHARE-WITH-GROUP] Starting share request:', { goalId: req.params.goalId, userId, groupId, permission });
      
      // Verify goal ownership
      const goal = await storage.getFinancialGoal(req.params.goalId);
      console.log('[SHARE-WITH-GROUP] Goal found:', { goalUserId: goal?.userId, requestUserId: userId, matches: goal?.userId === userId });
      if (!goal || goal.userId !== userId) {
        console.log('[SHARE-WITH-GROUP] FAILED: Ownership check failed');
        return res.status(403).json({ message: "You can only share your own goals" });
      }
      
      // Verify user is member of the group
      const members = await storage.getGroupMembers(groupId);
      console.log('[SHARE-WITH-GROUP] Group members:', { count: members.length, userIds: members.map((m: any) => m.userId), lookingFor: userId });
      const isMember = members.some((m: any) => m.userId === userId);
      console.log('[SHARE-WITH-GROUP] Membership check:', { isMember });
      if (!isMember) {
        console.log('[SHARE-WITH-GROUP] FAILED: User is not a member of the group');
        return res.status(403).json({ message: "You must be a member of the group to share goals with it" });
      }
      
      // Share goal with group
      const result = await storage.shareGoalWithGroup(
        req.params.goalId,
        userId,
        groupId,
        permission || 'view'
      );
      
      // Create notifications for all group members
      const notificationPromises = members
        .filter((m: any) => m.userId !== userId)
        .map((m: any) => storage.createNotification({
          userId: m.userId,
          type: 'goal_shared',
          category: 'goals',
          priority: 'normal',
          title: 'Goal Shared With You',
          message: `${goal.title} has been shared with your group`,
          data: { goalId: req.params.goalId, groupId, permission },
          isRead: false,
        }));
      
      await Promise.all(notificationPromises);
      
      res.status(201).json({
        success: true,
        groupShare: result.groupShare,
        memberCount: result.memberCount,
        message: `Goal shared with ${result.memberCount} group members`,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Shared Budgets routes
  app.post("/api/shared-budgets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const validatedData = insertSharedBudgetSchema.parse({
        ...req.body,
        createdBy: userId,
        status: 'active'
      });
      
      const budget = await storage.createSharedBudget(validatedData);
      res.status(201).json(budget);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/shared-budgets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const budgets = await storage.getSharedBudgetsByUserId(userId);
      res.json(budgets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/shared-budgets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const budget = await storage.getSharedBudget(req.params.id);
      
      if (!budget) {
        return res.status(404).json({ message: "Shared budget not found" });
      }
      
      // Check if user is a member
      const members = await storage.getSharedBudgetMembers(req.params.id);
      const isMember = members.some(m => m.userId === userId);
      
      if (!isMember) {
        return res.status(403).json({ message: "You don't have access to this budget" });
      }
      
      res.json(budget);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/shared-budgets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const budget = await storage.getSharedBudget(req.params.id);
      
      if (!budget) {
        return res.status(404).json({ message: "Shared budget not found" });
      }
      
      // Only owner can update budget
      if (budget.createdBy !== userId) {
        return res.status(403).json({ message: "Only the owner can update this budget" });
      }
      
      const updateData = insertSharedBudgetSchema.partial().parse(req.body);
      const updatedBudget = await storage.updateSharedBudget(req.params.id, updateData);
      res.json(updatedBudget);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/shared-budgets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const budget = await storage.getSharedBudget(req.params.id);
      
      if (!budget) {
        return res.status(404).json({ message: "Shared budget not found" });
      }
      
      // Only owner can delete budget
      if (budget.createdBy !== userId) {
        return res.status(403).json({ message: "Only the owner can delete this budget" });
      }
      
      await storage.deleteSharedBudget(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/shared-budgets/:budgetId/link-goal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { goalId } = req.body;
      
      // Verify budget exists and user owns it
      const budget = await storage.getSharedBudget(req.params.budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Shared budget not found" });
      }
      
      if (budget.createdBy !== userId) {
        return res.status(403).json({ message: "Only the budget owner can link a goal" });
      }
      
      // Verify goal exists and user has access (owner or shared with them)
      const goal = await storage.getFinancialGoal(goalId);
      if (!goal) {
        return res.status(404).json({ message: "Financial goal not found" });
      }
      
      const hasAccess = goal.userId === userId;
      if (!hasAccess) {
        // Check if goal is shared with user
        const sharedGoals = await storage.getSharedGoals(userId);
        const hasSharedAccess = sharedGoals.some(sg => sg.goalId === goalId);
        if (!hasSharedAccess) {
          return res.status(403).json({ message: "You don't have access to this goal" });
        }
      }
      
      // Update budget with linked goal
      const updatedBudget = await storage.updateSharedBudget(req.params.budgetId, {
        linkedGoalId: goalId,
      });
      
      // Return updated budget with goal info
      res.json({
        ...updatedBudget,
        linkedGoal: goal,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Shared Budget Members routes
  app.post("/api/shared-budgets/:budgetId/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { userId: newMemberId, role } = req.body;
      
      const budget = await storage.getSharedBudget(req.params.budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Shared budget not found" });
      }
      
      // Only owner can add members
      if (budget.createdBy !== userId) {
        return res.status(403).json({ message: "Only the owner can add members" });
      }
      
      // Check if they are friends
      const areFriends = await storage.areFriends(userId, newMemberId);
      if (!areFriends) {
        return res.status(400).json({ message: "You can only add friends to shared budgets" });
      }
      
      const member = await storage.addSharedBudgetMember({
        budgetId: req.params.budgetId,
        userId: newMemberId,
        role: role || 'member'
      });
      
      res.status(201).json(member);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/shared-budgets/:budgetId/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      
      // Check if user is a member
      const members = await storage.getSharedBudgetMembers(req.params.budgetId);
      const isMember = members.some(m => m.userId === userId);
      
      if (!isMember) {
        return res.status(403).json({ message: "You don't have access to this budget" });
      }
      
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/shared-budgets/:budgetId/members/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = getUserIdFromRequest(req);
      const budget = await storage.getSharedBudget(req.params.budgetId);
      
      if (!budget) {
        return res.status(404).json({ message: "Shared budget not found" });
      }
      
      // Owner can remove anyone, or user can remove themselves
      const isOwner = budget.createdBy === currentUserId;
      const isSelf = currentUserId === req.params.userId;
      
      if (!isOwner && !isSelf) {
        return res.status(403).json({ message: "You can only remove yourself or be the owner" });
      }
      
      await storage.removeSharedBudgetMember(req.params.budgetId, req.params.userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Shared Budget Expenses routes
  app.post("/api/shared-budgets/:budgetId/expenses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      
      // Check if user is a member
      const members = await storage.getSharedBudgetMembers(req.params.budgetId);
      const isMember = members.some(m => m.userId === userId);
      
      if (!isMember) {
        return res.status(403).json({ message: "You must be a member to add expenses" });
      }
      
      const validatedData = insertSharedBudgetExpenseSchema.parse({
        ...req.body,
        budgetId: req.params.budgetId,
        userId,
        date: new Date(req.body.date || Date.now())
      });
      
      const expense = await storage.createSharedBudgetExpense(validatedData);
      
      // Check if budget has a linked goal and update it
      const budget = await storage.getSharedBudget(req.params.budgetId);
      if (budget?.linkedGoalId) {
        const goal = await storage.getFinancialGoal(budget.linkedGoalId);
        if (goal) {
          const currentAmount = parseFloat(goal.currentAmount?.toString() || '0');
          const expenseAmount = parseFloat(expense.amount.toString());
          const newAmount = currentAmount + expenseAmount;
          
          await storage.updateFinancialGoal(budget.linkedGoalId, {
            currentAmount: newAmount.toFixed(2),
          });
        }
      }
      
      res.status(201).json(expense);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/shared-budgets/:budgetId/expenses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      
      // Check if user is a member
      const members = await storage.getSharedBudgetMembers(req.params.budgetId);
      const isMember = members.some(m => m.userId === userId);
      
      if (!isMember) {
        return res.status(403).json({ message: "You don't have access to this budget" });
      }
      
      const expenses = await storage.getSharedBudgetExpenses(req.params.budgetId);
      res.json(expenses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/shared-budgets/:budgetId/expenses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const [expense] = await db
        .select()
        .from(sharedBudgetExpenses)
        .where(eq(sharedBudgetExpenses.id, req.params.id));
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      // Only the creator can update
      if (expense.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own expenses" });
      }
      
      const updateData = insertSharedBudgetExpenseSchema.partial().parse(req.body);
      const updatedExpense = await storage.updateSharedBudgetExpense(req.params.id, updateData);
      res.json(updatedExpense);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/shared-budgets/:budgetId/expenses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const budget = await storage.getSharedBudget(req.params.budgetId);
      
      if (!budget) {
        return res.status(404).json({ message: "Shared budget not found" });
      }
      
      const [expense] = await db
        .select()
        .from(sharedBudgetExpenses)
        .where(eq(sharedBudgetExpenses.id, req.params.id));
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      // Owner or expense creator can delete
      const isOwner = budget.createdBy === userId;
      const isCreator = expense.userId === userId;
      
      if (!isOwner && !isCreator) {
        return res.status(403).json({ message: "You can only delete your own expenses or be the owner" });
      }
      
      await storage.deleteSharedBudgetExpense(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Friend Group Invitations routes
  app.post("/api/groups/:groupId/invite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { invitedUserId, role, message } = req.body;
      
      // Verify user is admin of the group
      const members = await storage.getGroupMembers(req.params.groupId);
      const member = members.find(m => m.userId === userId);
      if (!member || member.role !== 'admin') {
        return res.status(403).json({ message: "Only group admins can invite friends" });
      }
      
      // Check if they are friends
      const areFriends = await storage.areFriends(userId, invitedUserId);
      if (!areFriends) {
        return res.status(400).json({ message: "You can only invite friends to groups" });
      }
      
      // Check if already a member
      const existingMember = members.find(m => m.userId === invitedUserId);
      if (existingMember) {
        return res.status(400).json({ message: "User is already a member of this group" });
      }
      
      const invitation = await storage.createFriendGroupInvitation({
        groupId: req.params.groupId,
        invitedBy: userId,
        invitedUserId,
        role: role || 'member',
        status: 'pending',
        message: message || null
      });
      
      res.status(201).json(invitation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/groups/:groupId/bulk-invite-friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { friendIds, role } = req.body;
      
      if (!Array.isArray(friendIds) || friendIds.length === 0) {
        return res.status(400).json({ message: "friendIds must be a non-empty array" });
      }
      
      // Verify user is group owner or admin
      const members = await storage.getGroupMembers(req.params.groupId);
      const member = members.find(m => m.userId === userId);
      if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        return res.status(403).json({ message: "Only group owners and admins can invite friends" });
      }
      
      // Get group for notifications
      const group = await storage.getGroup(req.params.groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      // Verify all are friends and not already members
      const validFriendIds: string[] = [];
      const errors: string[] = [];
      
      for (const friendId of friendIds) {
        const areFriends = await storage.areFriends(userId, friendId);
        if (!areFriends) {
          errors.push(`User ${friendId} is not your friend`);
          continue;
        }
        
        const existingMember = members.find(m => m.userId === friendId);
        if (existingMember) {
          errors.push(`User ${friendId} is already a member`);
          continue;
        }
        
        validFriendIds.push(friendId);
      }
      
      if (validFriendIds.length === 0) {
        return res.status(400).json({ 
          message: "No valid friends to invite",
          errors 
        });
      }
      
      // Bulk create invitations
      const invitations = await storage.bulkInviteFriendsToGroup(
        req.params.groupId,
        userId,
        validFriendIds,
        role
      );
      
      // Create notifications for each invited friend
      const notificationPromises = invitations.map(inv => 
        storage.createNotification({
          userId: inv.invitedUserId,
          type: 'group_invitation',
          category: 'suggestions',
          priority: 'normal',
          title: 'Group Invitation',
          message: `You've been invited to join ${group.name}`,
          data: { groupId: req.params.groupId, invitationId: inv.id },
          isRead: false,
        })
      );
      
      await Promise.all(notificationPromises);
      
      res.status(201).json({
        success: true,
        invitations,
        count: invitations.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/group-invitations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const invitations = await storage.getFriendGroupInvitations(userId);
      res.json(invitations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/group-invitations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { status } = req.body;
      
      // Get invitation to verify it belongs to user
      const [invitation] = await db
        .select()
        .from(friendGroupInvitations)
        .where(eq(friendGroupInvitations.id, req.params.id));
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      if (invitation.invitedUserId !== userId) {
        return res.status(403).json({ message: "This invitation is not for you" });
      }
      
      const updatedInvitation = await storage.updateFriendGroupInvitationStatus(req.params.id, status);
      res.json(updatedInvitation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/group-invitations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      
      // Get invitation to verify user can delete it
      const [invitation] = await db
        .select()
        .from(friendGroupInvitations)
        .where(eq(friendGroupInvitations.id, req.params.id));
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Can delete if you sent it or received it
      if (invitation.invitedBy !== userId && invitation.invitedUserId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this invitation" });
      }
      
      await storage.deleteFriendGroupInvitation(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Transaction routes
  app.get("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const goalId = req.query.goalId as string;
      const limit = parseInt(req.query.limit as string) || 50;
      
      let transactions;
      if (goalId) {
        transactions = await storage.getTransactionsByGoalId(goalId);
      } else {
        const userId = getUserIdFromRequest(req);
        transactions = await storage.getTransactionsByUserId(userId, limit);
      }
      
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      // Get userId from authenticated session
      const userId = getUserIdFromRequest(req);
      
      // Parse and validate request body
      let validatedData = insertTransactionSchema.parse(req.body);
      
      // Set userId from session
      validatedData = { ...validatedData, userId };
      
      // Auto-categorize if category is not provided or is "Other"
      if (!validatedData.category || validatedData.category === 'Other' || validatedData.category === 'other') {
        const description = validatedData.description || '';
        const amount = parseFloat(validatedData.amount.toString());
        const type = validatedData.type as 'income' | 'expense' | 'transfer';
        const autoCategory = autoCategorizeTransaction(description, amount, type);
        
        if (autoCategory !== 'Other') {
          validatedData = { ...validatedData, category: autoCategory };
          console.log(`[AUTO-CATEGORIZE] "${description}" → ${autoCategory}`);
        } else {
          // Set to "other" if no category could be detected
          validatedData = { ...validatedData, category: 'other' };
        }
      }
      
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error: any) {
      console.error('[POST /api/transactions] Error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Transaction categorization routes - MUST be before /:id routes
  app.get("/api/transactions/categories", async (req, res) => {
    try {
      const type = req.query.type as 'income' | 'expense' | 'transfer' | undefined;
      const categories = type ? getAvailableCategories(type) : getAvailableCategories('expense');
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/transactions/categorize-suggestions", async (req, res) => {
    try {
      const { description, type } = req.body;
      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }
      const suggestions = getCategorySuggestions(description, type || 'expense');
      res.json(suggestions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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

  app.post("/api/transactions/bulk-categorize", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { transactionIds } = req.body;
      
      if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
        return res.status(400).json({ message: "transactionIds array is required" });
      }
      
      // Get all transactions and auto-categorize them
      const updated = [];
      for (const txId of transactionIds) {
        const transaction = await storage.getTransaction(txId);
        if (!transaction || transaction.userId !== userId) {
          continue; // Skip transactions that don't exist or don't belong to user
        }
        
        // Auto-categorize
        const description = transaction.description || '';
        const amount = parseFloat(transaction.amount.toString());
        const type = transaction.type as 'income' | 'expense' | 'transfer';
        const autoCategory = autoCategorizeTransaction(description, amount, type);
        
        if (autoCategory !== 'Other' && autoCategory !== transaction.category) {
          const updatedTx = await storage.updateTransaction(txId, { category: autoCategory });
          updated.push(updatedTx);
          console.log(`[BULK-CATEGORIZE] "${description}" → ${autoCategory}`);
        }
      }
      
      res.json({ 
        success: true, 
        updated: updated.length,
        total: transactionIds.length,
        transactions: updated 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Calendar share routes
  app.get("/api/calendar/shares", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const shares = await storage.getCalendarSharesByUserId(userId);
      res.json(shares);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/calendar/shares", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const shareData = {
        ...req.body,
        // Set owner to current user
        ownerId: userId,
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

  // Friend request routes
  app.post("/api/friend-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const requestData = {
        fromUserId: userId,
        toUserId: req.body.toUserId,
        message: req.body.message,
      };
      
      const validatedData = insertFriendRequestSchema.parse(requestData);
      const request = await storage.createFriendRequest(validatedData);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/friend-requests/pending", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const requests = await storage.getPendingFriendRequests(userId);
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/friend-requests/sent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const requests = await storage.getSentFriendRequests(userId);
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/friend-requests/:id/respond", isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      
      if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'accepted' or 'declined'" });
      }
      
      const request = await storage.updateFriendRequestStatus(req.params.id, status);
      res.json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/friend-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteFriendRequest(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Friendship routes
  app.get("/api/friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const friends = await storage.getFriendsByUserId(userId);
      res.json(friends);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/friends/:friendId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      await storage.removeFriendship(userId, req.params.friendId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
  app.get("/api/user-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const settings = await storage.getUserSettings(userId);
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

  app.post("/api/user-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const settingsData = { ...req.body, userId: userId };
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

  app.put("/api/user-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const validatedData = insertUserSettingsSchema.omit({ userId: true }).partial().parse(req.body);
      const settings = await storage.updateUserSettings(userId, validatedData);
      res.json({
        ...settings,
        hourlyRate: parseFloat((settings.hourlyRate || 50).toString())
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // User Preferences Routes
  app.get("/api/user-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      
      // Defensive: ensure user exists before creating preferences (handles testing scenarios)
      let user = await storage.getUser(userId);
      if (!user && req.user && req.user.claims) {
        console.log('[/api/user-preferences] User not found, creating from claims:', userId);
        const claims = req.user.claims;
        user = await storage.upsertUser({
          id: claims.sub,
          email: claims.email,
          firstName: claims.first_name,
          lastName: claims.last_name,
          profileImageUrl: claims.profile_image_url,
        });
        
        // Initialize subscription for new user
        const subscription = await storage.getUserSubscription(user.id);
        if (!subscription) {
          await storage.initializeDefaultSubscription(user.id);
        }
      }
      
      // If we still don't have a user, return 404
      if (!user) {
        console.error('[/api/user-preferences] No user found and could not create from claims');
        return res.status(404).json({ message: "User not found" });
      }
      
      const preferences = await storage.getUserPreferences(user.id);
      if (!preferences) {
        // Create default preferences if they don't exist - use user.id to ensure FK constraint
        const defaultPrefs = { 
          userId: user.id,
          theme: "system" as const
        };
        const newPrefs = await storage.createUserPreferences(defaultPrefs);
        return res.json(newPrefs);
      }
      res.json(preferences);
    } catch (error: any) {
      console.error('[/api/user-preferences] Error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/user-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const validatedData = insertUserPreferencesSchema.omit({ userId: true }).partial().parse(req.body);
      const preferences = await storage.updateUserPreferences(userId, validatedData);
      res.json(preferences);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Financial Preferences Routes
  app.get("/api/financial-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const preferences = await storage.getFinancialPreferences(userId);
      if (!preferences) {
        // Create default preferences if they don't exist
        const defaultPrefs = {
          userId: userId,
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

  app.put("/api/financial-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const validatedData = insertFinancialPreferencesSchema.omit({ userId: true }).partial().parse(req.body);
      const preferences = await storage.updateFinancialPreferences(userId, validatedData);
      res.json(preferences);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Tax Calculation Routes
  app.post("/api/calculate-tax", isAuthenticated, async (req: any, res) => {
    try {
      const { income, period, countryCode } = req.body;
      
      if (!income || income <= 0) {
        return res.status(400).json({ message: "Income must be a positive number" });
      }
      
      const country = countryCode || 'US';
      
      if (!taxService.isCountrySupported(country)) {
        return res.status(400).json({ 
          message: `Country code ${country} is not supported`,
          supportedCountries: taxService.getSupportedCountries().map(c => ({
            code: c.countryCode,
            name: c.countryName
          }))
        });
      }
      
      const result = period === 'annual' 
        ? taxService.calculateAnnualTax(income, country)
        : taxService.calculateMonthlyTax(income, country);
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/supported-tax-countries", async (req, res) => {
    try {
      const countries = taxService.getSupportedCountries();
      res.json(countries.map(c => ({
        code: c.countryCode,
        name: c.countryName,
        currency: c.currency
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Spending Pattern Analysis Routes
  app.get("/api/spending-patterns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const transactions = await storage.getTransactionsByUserId(userId, 100); // Last 100 transactions
      
      const insights = spendingPatternService.analyzeSpendingPatterns(transactions as any);
      res.json(insights);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Privacy Settings Routes
  app.get("/api/privacy-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const settings = await storage.getPrivacySettings(userId);
      if (!settings) {
        // Create default settings if they don't exist
        const defaultSettings = {
          userId: userId,
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

  app.put("/api/privacy-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const validatedData = insertPrivacySettingsSchema.omit({ userId: true }).partial().parse(req.body);
      const settings = await storage.updatePrivacySettings(userId, validatedData);
      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Data Export Routes
  app.get("/api/export-data", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const format = req.query.format as 'json' | 'csv' || 'json';
      
      if (format !== 'json' && format !== 'csv') {
        return res.status(400).json({ message: "Format must be 'json' or 'csv'" });
      }

      const exportData = await storage.exportUserData(userId, format);
      
      // Update last export timestamp
      await storage.updatePrivacySettings(userId, { lastDataExport: new Date() });
      
      const filename = `twealth-data-${userId}-${new Date().toISOString().split('T')[0]}.${format}`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
      res.send(exportData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/delete-user-data", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { confirmation } = req.body;
      
      if (confirmation !== 'DELETE') {
        return res.status(400).json({ 
          message: "Data deletion requires confirmation field with value 'DELETE'" 
        });
      }
      
      await storage.deleteUserData(userId);
      res.json({ message: "All user data has been permanently deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Time Tracking Routes
  app.post("/api/time-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      
      // Convert date strings to Date objects
      const timeLogData = {
        ...req.body,
        userId: userId,
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

  app.get("/api/time-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
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
      
      const timeLogs = await storage.getUserTimeLogs(userId, startDate, endDate);
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
  app.get("/api/insights/time-value", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const range = (req.query.range as '7d' | '30d' | '90d') || '30d';
      const insights = await storage.getTimeValueInsights(userId, range);
      res.json(insights);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/events/:eventId/time-value", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const timeValue = await storage.calculateEventTimeValue(req.params.eventId, userId);
      res.json(timeValue);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Enhanced Dashboard Stats (including time-value data)
  app.get("/api/dashboard/time-stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const range = (req.query.range as '7d' | '30d' | '90d') || '30d';
      
      // Get basic insights
      const insights = await storage.getTimeValueInsights(userId, range);
      
      // Get user settings for context
      const settings = await storage.getUserSettings(userId);
      
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
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const includeRead = req.query.includeRead === 'true';
      
      const notifications = await storage.getNotificationsByUserId(userId, limit, offset, includeRead);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const notificationData = {
        ...req.body,
        userId: userId,
      };
      
      const validatedData = insertNotificationSchema.parse(notificationData);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/notifications/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const notifications = await storage.generateSmartNotifications(userId);
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

  app.put("/api/notifications/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      await storage.markAllNotificationsAsRead(userId);
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
  app.get("/api/chat/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const conversations = await storage.getChatConversations(userId);
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

  app.post("/api/chat/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const validatedData = insertChatConversationSchema.parse({
        ...req.body,
        userId: userId
      });
      const conversation = await storage.createChatConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/chat/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const conversationId = req.params.id;
      
      // Verify ownership
      const conversation = await storage.getChatConversation(conversationId);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Update title
      const { title } = req.body;
      if (title && typeof title === 'string') {
        await storage.updateChatConversation(conversationId, { title });
        const updated = await storage.getChatConversation(conversationId);
        res.json(updated);
      } else {
        res.status(400).json({ message: "Invalid title" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/chat/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const conversationId = req.params.id;
      
      // Verify ownership
      const conversation = await storage.getChatConversation(conversationId);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      await storage.deleteChatConversation(conversationId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/chat/conversations/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const conversationId = req.params.id;
      
      // Ensure user has a subscription before checking limits
      let subscription = await storage.getUserSubscription(userId);
      if (!subscription) {
        await storage.initializeDefaultSubscription(userId);
      }
      
      // Check usage limit before processing - strict enforcement
      const usageCheck = await storage.checkUsageLimit(userId, 'aiChatsUsed');
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
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const userMessage = req.body.content;
      const isDeepAnalysis = req.body.isDeepAnalysis || false; // Complex queries flag
      
      if (!userMessage || typeof userMessage !== 'string') {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Check deep analysis quota if this is a complex query
      if (isDeepAnalysis) {
        const deepAnalysisCheck = await storage.checkUsageLimit(userId, 'aiDeepAnalysisUsed');
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

      // Proactively parse and save financial data from user message
      // This ensures we capture data even if AI fails later
      const messageLower = userMessage.toLowerCase();
      const estimates: any = {};
      
      // Extract income-related numbers
      const incomeMatch = messageLower.match(/(?:earn|make|income|salary).*?(\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
      if (incomeMatch) {
        const amount = parseFloat(incomeMatch[1].replace(/[$,]/g, ''));
        if (amount > 0 && amount < 1000000) { // Sanity check
          estimates.monthlyIncomeEstimate = amount.toString();
        }
      }
      
      // Extract expense-related numbers
      const expenseMatch = messageLower.match(/(?:spend|expense|cost).*?(\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
      if (expenseMatch) {
        const amount = parseFloat(expenseMatch[1].replace(/[$,]/g, ''));
        if (amount > 0 && amount < 1000000) {
          estimates.monthlyExpensesEstimate = amount.toString();
        }
      }
      
      // Extract savings-related numbers  
      const savingsMatch = messageLower.match(/(?:have|saved|savings|save).*?(\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
      if (savingsMatch) {
        const amount = parseFloat(savingsMatch[1].replace(/[$,]/g, ''));
        if (amount > 0 && amount < 10000000) { // Higher limit for total savings
          estimates.currentSavingsEstimate = amount.toString();
        }
      }
      
      // Save estimates if we found any
      if (Object.keys(estimates).length > 0) {
        await storage.updateUserPreferences(userId, estimates);
        console.log('📊 Proactively saved financial estimates:', estimates);
      }

      // Build user context for AI
      const [stats, goals, recentTransactions, upcomingEvents, userPreferences] = await Promise.all([
        storage.getUserStats(userId),
        storage.getFinancialGoalsByUserId(userId),
        storage.getTransactionsByUserId(userId, 10),
        storage.getUpcomingEvents(userId, 5),
        storage.getUserPreferences(userId)
      ]);

      // Calculate monthly expenses from transactions or use estimate
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentExpenses = recentTransactions
        .filter(t => t.type === 'expense' && t.date >= thirtyDaysAgo)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const monthlyExpenses = recentExpenses > 0 
        ? recentExpenses 
        : parseFloat(userPreferences?.monthlyExpensesEstimate?.toString() || "0");

      const userContext: UserContext = {
        totalSavings: stats.totalSavings,
        monthlyIncome: stats.monthlyIncome,
        monthlyExpenses,
        activeGoals: stats.activeGoals,
        language: userPreferences?.language || 'en', // User's preferred language for AI responses
        cryptoEnabled: userPreferences?.cryptoEnabled || false, // Whether user has enabled crypto features
        experienceLevel: (userPreferences?.experienceLevel as 'beginner' | 'intermediate' | 'advanced') || 'beginner', // User's financial experience level
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
      await storage.incrementUsage(userId, 'aiChatsUsed');
      if (isDeepAnalysis) {
        await storage.incrementUsage(userId, 'aiDeepAnalysisUsed');
      }

      // 🚨 CODE-LEVEL IMPOSSIBILITY CHECK (Pre-AI Validation)
      // Detect if user is discussing a purchase/goal and calculate feasibility BEFORE AI sees it
      let impossibleGoalFlag: string | null = null;
      
      const msgLower = userMessage.toLowerCase();
      const purchaseKeywords = ['buy', 'purchase', 'get', 'want', 'need', 'lambo', 'lamborghini', 'ferrari', 'house', 'car', 'yacht', 'ซื้อ', 'อยาก', 'comprar', 'quiero', '买', '想'];
      const timeKeywords = ['year', 'years', 'month', 'months', 'ปี', 'เดือน', 'años', 'meses', '年', '月'];
      
      const hasPurchaseIntent = purchaseKeywords.some(kw => msgLower.includes(kw));
      const hasTimeframe = timeKeywords.some(kw => msgLower.includes(kw));
      
      console.log(`🔍 Impossibility Check: message="${userMessage}", hasPurchaseIntent=${hasPurchaseIntent}, hasTimeframe=${hasTimeframe}`);
      
      if (hasPurchaseIntent && hasTimeframe) {
        console.log(`✅ Both conditions met, proceeding with feasibility check...`);
        // Extract potential price (look for common luxury items or dollar amounts)
        const pricePatterns = [
          /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, // $573,966 or $1,000,000
          /(\d{1,3}(?:,\d{3})+)/g, // 573966 or 1000000
        ];
        
        // Extract timeframe in years
        const yearMatch = msgLower.match(/(\d+)\s*(?:year|years|ปี|años|年)/);
        const monthMatch = msgLower.match(/(\d+)\s*(?:month|months|เดือน|meses|月)/);
        
        let yearsExtracted = 0;
        if (yearMatch) yearsExtracted = parseInt(yearMatch[1]);
        else if (monthMatch) yearsExtracted = parseInt(monthMatch[1]) / 12;
        
        // Known luxury items with prices
        const luxuryItems: Record<string, number> = {
          'lambo': 573966, 'lamborghini': 573966,
          'ferrari': 400000, 'mclaren': 350000,
          'rolls royce': 450000, 'bentley': 300000,
          'private jet': 5000000, 'jet': 5000000,
          'yacht': 2000000, 'superyacht': 10000000,
          'mansion': 2000000, 'villa': 1500000
        };
        
        let goalAmount = 0;
        
        // Check for luxury items first
        for (const [item, price] of Object.entries(luxuryItems)) {
          if (msgLower.includes(item)) {
            goalAmount = price;
            break;
          }
        }
        
        // If no luxury item, try to extract price from message
        if (goalAmount === 0) {
          for (const pattern of pricePatterns) {
            const matches = Array.from(userMessage.matchAll(pattern));
            if (matches.length > 0) {
              const amount = parseFloat(matches[0][1].replace(/,/g, ''));
              if (amount > 10000) { // Reasonable goal amount
                goalAmount = amount;
                break;
              }
            }
          }
        }
        
        // If we found both goal amount and timeframe, check feasibility
        console.log(`📊 Extracted: goalAmount=$${goalAmount.toLocaleString()}, yearsExtracted=${yearsExtracted}`);
        
        if (goalAmount > 0 && yearsExtracted > 0 && yearsExtracted <= 30) {
          console.log(`💰 Running feasibility check: income=$${userContext.monthlyIncome}, expenses=$${userContext.monthlyExpenses}`);
          
          const { checkGoalFeasibility } = await import('./financialCalculations');
          const feasibility = checkGoalFeasibility(
            goalAmount,
            yearsExtracted,
            userContext.monthlyIncome,
            userContext.monthlyExpenses,
            userContext.totalSavings
          );
          
          console.log(`📈 Feasibility result: isFeasible=${feasibility.isFeasible}, monthlyNeeded=$${feasibility.monthlyNeeded.toLocaleString()}, capacity=$${feasibility.monthlyCapacity.toLocaleString()}`);
          
          if (!feasibility.isFeasible) {
            console.log(`🚨 IMPOSSIBLE GOAL DETECTED: $${goalAmount.toLocaleString()} in ${yearsExtracted}y - ${feasibility.reason}`);
            
            impossibleGoalFlag = `
⚠️⚠️⚠️ CRITICAL: IMPOSSIBLE GOAL DETECTED ⚠️⚠️⚠️

BACKEND PRE-VALIDATION RESULTS:
• Goal: $${goalAmount.toLocaleString()} in ${yearsExtracted} years
• Required: $${Math.round(feasibility.monthlyNeeded).toLocaleString()}/month
• User Capacity: $${Math.round(feasibility.monthlyCapacity).toLocaleString()}/month
• Shortfall: $${Math.round(feasibility.shortfall).toLocaleString()}/month (${feasibility.multiplier.toFixed(1)}x OVER CAPACITY!)
• Realistic Timeline: ${feasibility.realisticYears} years with compound interest

🛑 MANDATORY RESPONSE PROTOCOL:
1. DO NOT show the impossible monthly amount ($${Math.round(feasibility.monthlyNeeded).toLocaleString()}/month) as a suggestion
2. IMMEDIATELY use empathetic coaching framework
3. Show 3 investment plans with realistic ${feasibility.realisticYears}-year timeline
4. Suggest stepping stones (cheaper alternatives to reach sooner)
5. Respond in user's detected language

This is CODE-LEVEL validation - you MUST follow this directive!`;
          }
        }
      }

      try {
        // Get memory context from previous conversations
        const memoryContext = await getMemoryContext(storage, userId);
        
        // Enhance userContext with impossibility flag if detected
        const enhancedContext = impossibleGoalFlag 
          ? { ...userContext, impossibleGoalWarning: impossibleGoalFlag }
          : userContext;
        
        // Generate AI response with potential tool calls
        const aiResult = await aiService.generateAdvice(userMessage, enhancedContext, conversationHistory, memoryContext);
        
        // Handle tool calls if AI wants to take actions
        const actionsPerformed: any[] = [];
        if (aiResult.toolCalls && aiResult.toolCalls.length > 0) {
          for (const toolCall of aiResult.toolCalls) {
            try {
              if (toolCall.name === 'create_financial_goal') {
                // CRITICAL: Validate user confirmation before creating goal
                if (toolCall.arguments.userConfirmed !== true) {
                  console.log('⚠️  Blocked create_financial_goal: userConfirmed not true');
                  actionsPerformed.push({
                    type: 'action_blocked',
                    data: { reason: 'User confirmation required', action: 'create_financial_goal' }
                  });
                  continue;
                }
                const goal = await storage.createFinancialGoal({
                  userId: userId,
                  title: toolCall.arguments.name,
                  targetAmount: parseAmount(toolCall.arguments.targetAmount),
                  currentAmount: '0',
                  targetDate: new Date(toolCall.arguments.targetDate),
                  description: toolCall.arguments.description || null,
                  category: 'savings'
                });
                actionsPerformed.push({
                  type: 'goal_created',
                  data: goal
                });
              } else if (toolCall.name === 'create_calendar_event') {
                // CRITICAL: Validate user confirmation before creating event
                if (toolCall.arguments.userConfirmed !== true) {
                  console.log('⚠️  Blocked create_calendar_event: userConfirmed not true');
                  actionsPerformed.push({
                    type: 'action_blocked',
                    data: { reason: 'User confirmation required', action: 'create_calendar_event' }
                  });
                  continue;
                }
                const event = await storage.createEvent({
                  createdBy: userId,
                  title: toolCall.arguments.title,
                  description: toolCall.arguments.description || null,
                  startTime: new Date(toolCall.arguments.date),
                  endTime: new Date(toolCall.arguments.date)
                });
                actionsPerformed.push({
                  type: 'event_created',
                  data: event
                });
              } else if (toolCall.name === 'add_transaction') {
                const transaction = await storage.createTransaction({
                  userId: userId,
                  type: toolCall.arguments.type,
                  amount: parseAmount(toolCall.arguments.amount),
                  category: toolCall.arguments.category,
                  description: toolCall.arguments.description || null,
                  date: toolCall.arguments.date ? new Date(toolCall.arguments.date) : new Date()
                });
                actionsPerformed.push({
                  type: 'transaction_added',
                  data: transaction
                });
              } else if (toolCall.name === 'create_group') {
                // CRITICAL: Validate user confirmation before creating group
                if (toolCall.arguments.userConfirmed !== true) {
                  console.log('⚠️  Blocked create_group: userConfirmed not true');
                  actionsPerformed.push({
                    type: 'action_blocked',
                    data: { reason: 'User confirmation required', action: 'create_group' }
                  });
                  continue;
                }
                const group = await storage.createGroup({
                  name: toolCall.arguments.name,
                  description: toolCall.arguments.description || null,
                  ownerId: userId
                });
                actionsPerformed.push({
                  type: 'group_created',
                  data: group
                });
              } else if (toolCall.name === 'add_crypto_holding') {
                // Map common crypto symbols to their full names
                const cryptoNames: Record<string, string> = {
                  'BTC': 'Bitcoin',
                  'ETH': 'Ethereum',
                  'BNB': 'Binance Coin',
                  'USDT': 'Tether',
                  'SOL': 'Solana',
                  'ADA': 'Cardano',
                  'DOT': 'Polkadot'
                };
                const symbol = toolCall.arguments.symbol.toUpperCase();
                const coinId = toolCall.arguments.symbol.toLowerCase();
                const name = cryptoNames[symbol] || symbol;
                
                const holding = await storage.createCryptoHolding({
                  userId: userId,
                  coinId: coinId,
                  symbol: symbol,
                  name: name,
                  amount: parseAmount(toolCall.arguments.amount),
                  averageBuyPrice: parseAmount(toolCall.arguments.purchasePrice)
                });
                actionsPerformed.push({
                  type: 'crypto_added',
                  data: holding
                });
              } else if (toolCall.name === 'analyze_portfolio_allocation') {
                // Calculate portfolio allocation based on age and risk tolerance
                const { age, riskTolerance, investmentAmount } = toolCall.arguments;
                const stockAllocation = Math.max(10, Math.min(90, 110 - age));
                const bondAllocation = 100 - stockAllocation;
                
                // Adjust for risk tolerance
                let adjustedStocks = stockAllocation;
                if (riskTolerance === 'aggressive') adjustedStocks = Math.min(90, stockAllocation + 15);
                if (riskTolerance === 'conservative') adjustedStocks = Math.max(10, stockAllocation - 15);
                const adjustedBonds = Math.max(5, 100 - adjustedStocks - 5); // 5% alternatives
                
                const stockAmount = (investmentAmount * adjustedStocks / 100);
                const bondAmount = (investmentAmount * adjustedBonds / 100);
                const altAmount = investmentAmount - stockAmount - bondAmount;
                
                actionsPerformed.push({
                  type: 'portfolio_analyzed',
                  data: {
                    age,
                    riskTolerance,
                    investmentAmount,
                    allocation: {
                      stocks: { percentage: adjustedStocks, amount: stockAmount },
                      bonds: { percentage: adjustedBonds, amount: bondAmount },
                      alternatives: { percentage: Math.round((altAmount / investmentAmount) * 100), amount: altAmount }
                    }
                  }
                });
              } else if (toolCall.name === 'calculate_debt_payoff') {
                // Compare avalanche vs snowball debt payoff strategies
                const { debts, extraPayment } = toolCall.arguments;
                
                // Simple debt payoff calculator
                const calculatePayoff = (debtOrder: any[]) => {
                  let totalMonths = 0;
                  let totalInterest = 0;
                  let remainingDebts = debtOrder.map(d => ({ ...d }));
                  
                  while (remainingDebts.length > 0) {
                    totalMonths++;
                    // Pay minimum on all debts
                    remainingDebts.forEach(d => {
                      const monthlyInterest = (d.balance * d.interestRate / 100) / 12;
                      totalInterest += monthlyInterest;
                      d.balance += monthlyInterest - d.minPayment;
                    });
                    
                    // Apply extra payment to first debt
                    if (remainingDebts.length > 0) {
                      remainingDebts[0].balance -= extraPayment;
                    }
                    
                    // Remove paid off debts
                    remainingDebts = remainingDebts.filter(d => d.balance > 0);
                    
                    if (totalMonths > 600) break; // Safety limit
                  }
                  
                  return { months: totalMonths, interest: Math.round(totalInterest) };
                };
                
                // Avalanche: Sort by interest rate (highest first)
                const avalancheOrder = [...debts].sort((a, b) => b.interestRate - a.interestRate);
                const avalancheResult = calculatePayoff(avalancheOrder);
                
                // Snowball: Sort by balance (lowest first)
                const snowballOrder = [...debts].sort((a, b) => a.balance - b.balance);
                const snowballResult = calculatePayoff(snowballOrder);
                
                actionsPerformed.push({
                  type: 'debt_analyzed',
                  data: {
                    avalanche: {
                      order: avalancheOrder.map(d => d.name),
                      monthsToPay: avalancheResult.months,
                      totalInterest: avalancheResult.interest
                    },
                    snowball: {
                      order: snowballOrder.map(d => d.name),
                      monthsToPay: snowballResult.months,
                      totalInterest: snowballResult.interest
                    },
                    savings: snowballResult.interest - avalancheResult.interest
                  }
                });
              } else if (toolCall.name === 'project_future_value') {
                // Calculate future value with compound growth and inflation adjustment
                const { principal, monthlyContribution, annualReturn, years, inflationRate } = toolCall.arguments;
                const months = years * 12;
                const monthlyRate = annualReturn / 100 / 12;
                
                // Future value formula: FV = PV(1+r)^n + PMT * [((1+r)^n - 1) / r]
                const principalGrowth = principal * Math.pow(1 + monthlyRate, months);
                const contributionGrowth = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
                const futureValue = principalGrowth + contributionGrowth;
                
                // Inflation-adjusted value
                const inflation = (inflationRate || 3) / 100;
                const realValue = futureValue / Math.pow(1 + inflation, years);
                
                const totalInvested = principal + (monthlyContribution * months);
                const totalGrowth = futureValue - totalInvested;
                
                actionsPerformed.push({
                  type: 'future_value_calculated',
                  data: {
                    futureValue: Math.round(futureValue),
                    realValue: Math.round(realValue),
                    totalInvested: Math.round(totalInvested),
                    totalGrowth: Math.round(totalGrowth),
                    returnPercentage: Math.round((totalGrowth / totalInvested) * 100)
                  }
                });
              } else if (toolCall.name === 'calculate_retirement_needs') {
                // Calculate retirement needs using 4% rule
                const { currentAge, retirementAge, annualExpenses, currentSavings } = toolCall.arguments;
                const yearsToRetirement = retirementAge - currentAge;
                const targetAmount = annualExpenses * 25; // 4% rule
                const needed = targetAmount - currentSavings;
                
                // Calculate required monthly savings (assuming 8% annual return)
                const monthlyRate = 0.08 / 12;
                const months = yearsToRetirement * 12;
                const futureValueOfCurrent = currentSavings * Math.pow(1 + monthlyRate, months);
                const stillNeeded = targetAmount - futureValueOfCurrent;
                
                // PMT formula: PMT = FV * r / ((1+r)^n - 1)
                const requiredMonthly = stillNeeded > 0 
                  ? stillNeeded * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1)
                  : 0;
                
                actionsPerformed.push({
                  type: 'retirement_calculated',
                  data: {
                    targetAmount: Math.round(targetAmount),
                    currentSavings: currentSavings,
                    yearsToRetirement,
                    requiredMonthly: Math.round(requiredMonthly),
                    onTrack: requiredMonthly <= (annualExpenses / 12) * 0.15 // 15% of monthly expenses
                  }
                });
              } else if (toolCall.name === 'save_financial_estimates') {
                // Smart validation and parsing of financial estimates
                const estimates: any = {};
                const warnings: string[] = [];
                const errors: string[] = [];
                
                // Enhanced validation helper with smart parsing
                const validateAmount = (value: any, name: string, field: 'income' | 'expenses' | 'savings') => {
                  // Parse the value - handle various formats
                  let num: number;
                  if (typeof value === 'string') {
                    // Remove all formatting characters except decimal point
                    const cleaned = value.replace(/[$,]/g, '').trim();
                    num = parseFloat(cleaned);
                  } else {
                    num = value;
                  }
                  
                  if (isNaN(num) || num < 0) {
                    errors.push(`${name} must be a valid positive number`);
                    return 0;
                  }
                  
                  // Field-specific validation thresholds
                  const thresholds = {
                    income: { 
                      warning: 50000, // $50k/month = $600k/year - already very high
                      error: 150000   // $150k/month = $1.8M/year - likely an error
                    },
                    expenses: {
                      warning: 50000,
                      error: 150000
                    },
                    savings: {
                      warning: 1000000,  // $1M net worth - reasonable
                      error: 100000000   // $100M - likely typo
                    }
                  };
                  
                  const threshold = thresholds[field];
                  
                  // Critical error check - values that are almost certainly wrong
                  if (num > threshold.error) {
                    errors.push(
                      `${name} of $${num.toLocaleString()} is unrealistically high. ` +
                      `Did you mean $${(num / 1000).toLocaleString()} (1/1000th) or enter it in a different unit? ` +
                      `Please provide the correct amount.`
                    );
                    return num; // Return for error display, but won't save
                  }
                  
                  // Warning check - high but possibly correct
                  if (num > threshold.warning) {
                    warnings.push(
                      `${name} of $${num.toLocaleString()} ${field === 'income' ? `($${(num * 12).toLocaleString()}/year)` : ''} is very high. ` +
                      `Is this correct?`
                    );
                  }
                  
                  return num;
                };
                
                // Validate each field
                let income = 0;
                let expenses = 0;
                let savings = 0;
                
                if (toolCall.arguments.monthlyIncome !== undefined) {
                  income = validateAmount(toolCall.arguments.monthlyIncome, 'Monthly income', 'income');
                  if (errors.length === 0) {
                    estimates.monthlyIncomeEstimate = income.toString();
                  }
                }
                
                if (toolCall.arguments.monthlyExpenses !== undefined) {
                  expenses = validateAmount(toolCall.arguments.monthlyExpenses, 'Monthly expenses', 'expenses');
                  if (errors.length === 0) {
                    estimates.monthlyExpensesEstimate = expenses.toString();
                  }
                }
                
                if (toolCall.arguments.currentSavings !== undefined) {
                  savings = validateAmount(toolCall.arguments.currentSavings, 'Current savings', 'savings');
                  if (errors.length === 0) {
                    estimates.currentSavingsEstimate = savings.toString();
                  }
                }
                
                // Logical consistency checks (only if no critical errors)
                if (errors.length === 0) {
                  // Expenses vs Income check
                  if (income > 0 && expenses > 0 && expenses > income * 1.5) {
                    warnings.push(
                      `Your expenses ($${expenses.toLocaleString()}) are ${Math.round((expenses/income - 1) * 100)}% higher than income - ` +
                      `this creates significant debt. Is this temporary or ongoing?`
                    );
                  }
                  
                  // Savings vs Income consistency
                  if (income > 10000 && savings < 1000) {
                    warnings.push(
                      `With monthly income of $${income.toLocaleString()}, I'd expect higher savings. ` +
                      `Is your net worth really $${savings.toLocaleString()}?`
                    );
                  }
                  
                  // Negative savings rate check
                  if (income > 0 && expenses > income) {
                    const deficit = expenses - income;
                    warnings.push(
                      `You're running a deficit of $${deficit.toLocaleString()}/month. ` +
                      `This means you're going into debt or depleting savings - needs immediate action!`
                    );
                  }
                }
                
                // If there are CRITICAL ERRORS, don't save - ask user to correct
                if (errors.length > 0) {
                  console.log('❌ Financial data ERRORS (not saved):', errors);
                  actionsPerformed.push({
                    type: 'financial_estimates_validation_failed',
                    errors: errors,
                    suggestions: [
                      'Check if you entered the amount in the wrong currency/unit',
                      'Verify you didn\'t include extra zeros',
                      'Confirm whether this is monthly, yearly, or lifetime amount'
                    ]
                  });
                }
                // If there are warnings but no errors, save with warnings
                else if (warnings.length > 0) {
                  console.log('⚠️  Financial data warnings (saved with flags):', warnings);
                  actionsPerformed.push({
                    type: 'financial_estimates_saved_with_warnings',
                    data: estimates,
                    warnings: warnings
                  });
                  await storage.updateUserPreferences(userId, estimates);
                  console.log('💾 Saved financial estimates with warnings:', estimates);
                }
                // Clean save - no issues
                else {
                  actionsPerformed.push({
                    type: 'financial_estimates_saved',
                    data: estimates
                  });
                  await storage.updateUserPreferences(userId, estimates);
                  console.log('💾 Saved financial estimates:', estimates);
                }
              }
            } catch (toolError) {
              console.error(`Tool execution error (${toolCall.name}):`, toolError);
              actionsPerformed.push({
                type: 'error',
                tool: toolCall.name,
                error: 'Failed to execute action'
              });
            }
          }
        }
        
        // Generate response content - use AI response or create confirmation if empty
        let responseContent = aiResult.response;
        
        // Sanitize response: remove any leaked function call syntax or technical details
        if (responseContent) {
          // Remove <function=...>...</function> syntax
          responseContent = responseContent.replace(/<function=[^>]+>.*?<\/function>/gi, '').trim();
          
          // Remove "Tool Calls" sections and similar technical disclosures
          responseContent = responseContent.replace(/##?\s*Tool Calls?.*$/gi, '').trim();
          responseContent = responseContent.replace(/I've made the following tool calls?:.*$/gi, '').trim();
          responseContent = responseContent.replace(/\*\*Tool Calls?\*\*:?.*$/gi, '').trim();
          
          // Remove numbered tool call lists (1. create_financial_goal, 2. generate_investment...)
          responseContent = responseContent.replace(/\d+\.\s*\w+_\w+:?\s*.*$/gm, (match) => {
            if (match.match(/\w+_\w+/)) return '';
            return match;
          }).trim();
          
          // Remove standalone function call patterns  
          responseContent = responseContent.replace(/\{[^}]*"?\w+"?\s*:\s*[^}]+\}/g, (match) => {
            // Only remove if it looks like a function call (has common function params)
            if (match.includes('targetAmount') || match.includes('userConfirmed') || 
                match.includes('category') && match.includes('description')) {
              return '';
            }
            return match;
          }).trim();
          
          // Clean up any double newlines or trailing whitespace
          responseContent = responseContent.replace(/\n{3,}/g, '\n\n').trim();
        }
        
        // If AI used tools but didn't provide a text response, generate detailed explanation
        if ((!responseContent || responseContent.trim() === '') && actionsPerformed.length > 0) {
          const confirmations = actionsPerformed.map(action => {
            if (action.type === 'goal_created') {
              const goal = action.data;
              return `✅ Goal created: Save $${parseFloat(goal.targetAmount).toLocaleString()} for "${goal.title}" by ${new Date(goal.targetDate).toLocaleDateString()}! I've added this to your financial goals.`;
            } else if (action.type === 'event_created') {
              const event = action.data;
              return `📅 Reminder set: "${event.title}" on ${new Date(event.startTime).toLocaleDateString()}! You'll be notified when it's time.`;
            } else if (action.type === 'transaction_added') {
              const txn = action.data;
              return `💸 Tracked: ${txn.type === 'income' ? 'Received' : 'Spent'} $${parseFloat(txn.amount).toLocaleString()} on ${txn.category}. Your balance has been updated!`;
            } else if (action.type === 'group_created') {
              const group = action.data;
              return `👥 Created "${group.name}" group! You can now collaborate with others on shared financial planning.`;
            } else if (action.type === 'crypto_added') {
              const crypto = action.data;
              return `₿ Tracked: ${crypto.amount} ${crypto.symbol} at $${parseFloat(crypto.averageBuyPrice).toLocaleString()}/coin. Total investment: $${(parseFloat(crypto.amount) * parseFloat(crypto.averageBuyPrice)).toLocaleString()}`;
            } else if (action.type === 'portfolio_analyzed') {
              const data = action.data;
              const stocks = data.allocation.stocks;
              const bonds = data.allocation.bonds;
              const alts = data.allocation.alternatives;
              return `📊 **Expert Portfolio Allocation Analysis**\n\n` +
                `For age ${data.age}, ${data.riskTolerance} risk, investing $${data.investmentAmount.toLocaleString()}:\n\n` +
                `🔵 **${stocks.percentage}% Stocks** → $${Math.round(stocks.amount).toLocaleString()}\n` +
                `   • VTI (Vanguard Total Market) or VOO (S&P 500)\n` +
                `   • Target: Long-term capital growth\n` +
                `   • Expected return: 8-10% annually\n\n` +
                `🟢 **${bonds.percentage}% Bonds** → $${Math.round(bonds.amount).toLocaleString()}\n` +
                `   • BND (Total Bond) or AGG (Aggregate Bond)\n` +
                `   • Target: Stability and income\n` +
                `   • Expected return: 3-5% annually\n\n` +
                `🟡 **${alts.percentage}% Alternatives** → $${Math.round(alts.amount).toLocaleString()}\n` +
                `   • VNQ (Real Estate) or GLD (Gold)\n` +
                `   • Target: Diversification hedge\n\n` +
                `💡 **Why this works**: Classic ${110 - data.age}% stocks rule (110 - age = ${stocks.percentage}%) adjusted for ${data.riskTolerance} risk. Rebalance quarterly when drift >5%!`;
            } else if (action.type === 'debt_analyzed') {
              const data = action.data;
              return `💳 **Debt Payoff Strategy Analysis**\n\n` +
                `**AVALANCHE Method** (Save Most Money):\n` +
                `• Total Interest: $${data.avalanche.totalInterest.toLocaleString()}\n` +
                `• Payoff Time: ${data.avalanche.monthsToPay} months\n` +
                `• Strategy: Pay highest interest rate first\n\n` +
                `**SNOWBALL Method** (Quick Wins):\n` +
                `• Total Interest: $${data.snowball.totalInterest.toLocaleString()}\n` +
                `• Payoff Time: ${data.snowball.monthsToPay} months\n` +
                `• Strategy: Pay smallest balance first for motivation\n\n` +
                `💡 **Recommendation**: Avalanche saves $${Math.abs(data.snowball.totalInterest - data.avalanche.totalInterest).toLocaleString()} more. Choose Snowball only if you need psychological wins!`;
            } else if (action.type === 'future_value_calculated') {
              const data = action.data;
              return `📈 **Compound Growth Projection**\n\n` +
                `• **Future Value**: $${data.futureValue.toLocaleString()} (nominal)\n` +
                `• **Real Value**: $${data.realValue.toLocaleString()} (inflation-adjusted)\n` +
                `• **Total Invested**: $${data.totalInvested.toLocaleString()}\n` +
                `• **Growth**: $${data.totalGrowth.toLocaleString()} (${data.returnPercentage}% return)\n\n` +
                `💡 **The power of compounding**: Start early! Every year you delay costs you thousands in lost growth.`;
            } else if (action.type === 'retirement_calculated') {
              const data = action.data;
              const status = data.onTrack ? '✅ On track!' : '⚠️ Need to save more';
              return `🏖️ **Retirement Planning Analysis**\n\n` +
                `• **Target Amount Needed**: $${data.targetAmount.toLocaleString()} (4% rule)\n` +
                `• **Current Savings**: $${data.currentSavings.toLocaleString()}\n` +
                `• **Years to Retirement**: ${data.yearsToRetirement}\n` +
                `• **Required Monthly Savings**: $${data.requiredMonthly.toLocaleString()}\n` +
                `• **Status**: ${status}\n\n` +
                `💡 **Pro tips**: Max 401(k) match (free money!), consider Roth IRA for tax-free growth, delay Social Security to 70 for 32% boost!`;
            } else if (action.type === 'financial_estimates_validation_failed') {
              const errors = action.errors || [];
              const suggestions = action.suggestions || [];
              return `⚠️ **Data Validation Error**\n\n` +
                `The financial amount you provided seems unrealistic. Here's why:\n\n` +
                errors.map((err: string) => `❌ ${err}`).join('\n') + `\n\n` +
                `**Please double-check and provide the correct amount:**\n` +
                suggestions.map((sug: string) => `• ${sug}`).join('\n') + `\n\n` +
                `Once you provide the correct amount, I'll save it and give you personalized advice!`;
            } else if (action.type === 'financial_estimates_saved_with_warnings') {
              const warnings = action.warnings || [];
              return `⚠️ **Financial Data Saved (with warnings)**\n\n` +
                `I've saved your financial information, but I wanted to flag a few things:\n\n` +
                warnings.map((warn: string) => `⚠️ ${warn}`).join('\n\n') + `\n\n` +
                `If any of these need correction, just let me know!`;
            } else if (action.type === 'financial_estimates_saved') {
              return `✅ **Financial Data Saved**\n\nI've securely saved your financial information and will use it to provide personalized advice!`;
            }
            return '';
          }).filter(Boolean).join('\n\n');
          
          responseContent = confirmations || 'Analysis completed! Let me know if you need clarification on any aspect.';
        }
        
        // Save AI response
        const aiChatMessage = await storage.createChatMessage({
          conversationId,
          role: 'assistant',
          content: responseContent,
          userContext: userContext,
          tokenCount: Math.ceil(responseContent.length / 4),
          cost: isDeepAnalysis ? '0.0005' : '0.0001' // Higher cost for deep analysis
        });

        // Extract and update conversation memory
        await extractAndUpdateMemory(storage, userId, userMessage, responseContent);

        // Update conversation title if it's the first exchange
        if (conversationHistory.length <= 1) {
          const title = userMessage.length > 50 
            ? userMessage.substring(0, 47) + "..." 
            : userMessage;
          await storage.updateChatConversation(conversationId, { title });
        }

        res.json({
          userMessage: userChatMessage,
          aiMessage: aiChatMessage,
          actionsPerformed: actionsPerformed.length > 0 ? actionsPerformed : undefined
        });

      } catch (aiError: any) {
        // Provide more specific error messages based on error type
        console.error('AI Chat Error:', aiError.message);
        let errorMessage = "I apologize for the confusion. Let me help you with that!";
        
        // Check if user is trying to create something
        const lowerMsg = userMessage.toLowerCase();
        const isCreationIntent = lowerMsg.includes('add') || lowerMsg.includes('create') || 
                                lowerMsg.includes('เพิ่ม') || lowerMsg.includes('goal') ||
                                lowerMsg.includes('add to') || lowerMsg.includes('track');
        
        if (isCreationIntent) {
          // Check if there's context from previous conversation
          if (conversationHistory.length > 2) {
            errorMessage = "I'd be happy to create that goal for you! Based on our conversation, I can set it up. Let me process that for you - could you tell me the specific details you'd like tracked? For example: goal name, target amount, and timeline.";
          } else {
            errorMessage = "I'd love to help you create that! Could you provide the details? For example: What's the goal name, target amount, and when do you want to achieve it?";
          }
        } else if (aiError.message?.includes('decommissioned')) {
          errorMessage = "Our AI is being upgraded! Please try again in a moment.";
        } else if (aiError.message?.includes('rate limit') || aiError.message?.includes('429')) {
          errorMessage = "I'm handling lots of conversations right now! Please wait a moment and try again.";
        } else if (aiError.message?.includes('timeout')) {
          errorMessage = "Taking longer than expected - please try asking again!";
        } else if (aiError.message?.includes('model')) {
          errorMessage = "Experiencing technical difficulties. Please try again shortly!";
        }
        
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

  app.delete("/api/chat/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const conversation = await storage.getChatConversation(req.params.id);
      
      if (!conversation || conversation.userId !== userId) {
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
  app.post("/api/subscription/reset-usage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      await storage.resetUsage(userId);
      
      console.log(`🔄 Usage reset for user ${userId}`);
      res.json({ 
        message: "Usage reset successfully",
        userId: userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Reset usage error:', error);
      res.status(500).json({ message: "Failed to reset usage" });
    }
  });

  // Message Feedback Routes
  app.post("/api/messages/:messageId/feedback", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { messageId } = req.params;
      const { rating, feedbackText } = req.body;

      if (!rating || !['helpful', 'not_helpful'].includes(rating)) {
        return res.status(400).json({ message: "Invalid rating. Must be 'helpful' or 'not_helpful'" });
      }

      // Check if feedback already exists
      const existingFeedback = await storage.getMessageFeedback(messageId, userId);
      
      let feedback;
      if (existingFeedback) {
        // Update existing feedback
        feedback = await storage.updateMessageFeedback(messageId, userId, {
          rating,
          feedbackText: feedbackText || existingFeedback.feedbackText
        });
      } else {
        // Create new feedback
        const validatedData = insertMessageFeedbackSchema.parse({
          messageId,
          userId,
          rating,
          feedbackText: feedbackText || null
        });
        feedback = await storage.createMessageFeedback(validatedData);
      }

      res.json(feedback);
    } catch (error: any) {
      console.error('Error submitting message feedback:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/messages/:messageId/feedback", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { messageId } = req.params;
      
      const feedback = await storage.getMessageFeedback(messageId, userId);
      
      if (!feedback) {
        return res.status(404).json({ message: "No feedback found for this message" });
      }
      
      res.json(feedback);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/messages/feedback/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const stats = await storage.getMessageFeedbackStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Financial Health Score endpoint
  app.get("/api/financial-health", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const healthScore = await calculateFinancialHealth(storage, userId);
      res.json(healthScore);
    } catch (error: any) {
      console.error('Financial health calculation error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Goal Progress & Milestones endpoints
  app.get("/api/goals/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const result = await checkGoalProgress(storage, userId);
      res.json(result);
    } catch (error: any) {
      console.error('Goal progress check error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/goals/:goalId/milestones", isAuthenticated, async (req: any, res) => {
    try {
      const { goalId } = req.params;
      const milestones = await getGoalMilestones(storage, goalId);
      res.json(milestones);
    } catch (error: any) {
      console.error('Goal milestones error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Proactive Insights endpoint
  app.get("/api/insights/proactive", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const insights = await generateProactiveInsights(storage, userId);
      res.json(insights);
    } catch (error: any) {
      console.error('Proactive insights error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // AI Insights endpoint
  app.get("/api/ai/insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      
      // Check usage limit for insights
      const usageCheck = await storage.checkUsageLimit(userId, 'aiChatsUsed'); // Use chat quota for insights
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
        storage.getUserStats(userId),
        storage.getFinancialGoalsByUserId(userId),
        storage.getTransactionsByUserId(userId, 5)
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
      await storage.incrementUsage(userId, 'aiInsightsGenerated');
      
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
      let plans = await storage.getSubscriptionPlans();
      const planMap = new Map(plans.map(p => [p.name, p]));
      
      // Update or create Pro plan
      if (planMap.has('Pro')) {
        const proPlan = planMap.get('Pro')!;
        if (proPlan.aiChatLimit !== 500 || proPlan.priceUsd !== '25.00') {
          await db.update(subscriptionPlans)
            .set({
              aiChatLimit: 500,
              aiDeepAnalysisLimit: 500,
              priceUsd: '25.00',
              priceThb: '875.00',
              isLifetimeLimit: false,
              billingInterval: 'monthly',
              description: 'CFO-level AI advisor - 500 chats/month + all features',
              features: ['full_tracking', 'ai_chat_unlimited', 'advanced_goals', 'group_planning', 'crypto_tracking', 'advanced_analytics', 'priority_insights', 'all_features']
            })
            .where(eq(subscriptionPlans.id, proPlan.id));
        }
      } else {
        await storage.createSubscriptionPlan({
          name: 'Pro',
          displayName: 'Twealth Pro',
          description: 'CFO-level AI advisor - 500 chats/month + all features',
          priceThb: '875.00',
          priceUsd: '25.00',
          currency: 'USD',
          billingInterval: 'monthly',
          aiChatLimit: 500,
          aiDeepAnalysisLimit: 500,
          aiInsightsFrequency: 'daily',
          isLifetimeLimit: false,
          features: ['full_tracking', 'ai_chat_unlimited', 'advanced_goals', 'group_planning', 'crypto_tracking', 'advanced_analytics', 'priority_insights', 'all_features'],
          sortOrder: 1,
        });
      }
      
      // Deactivate old plans (Standard, Unlimited, Premium)
      const oldPlanNames = ['Standard', 'Unlimited', 'Premium'];
      for (const oldName of oldPlanNames) {
        if (planMap.has(oldName)) {
          await db.update(subscriptionPlans)
            .set({ isActive: false })
            .where(eq(subscriptionPlans.name, oldName));
        }
      }
      
      // Refresh and filter active plans
      plans = await storage.getSubscriptionPlans();
      const activePlans = plans.filter(p => p.isActive);
      res.json(activePlans);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/subscription/current", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      let subscription = await storage.getUserSubscription(userId);
      
      // Initialize free subscription if user doesn't have one
      if (!subscription) {
        await storage.initializeDefaultSubscription(userId);
        subscription = await storage.getUserSubscription(userId);
      }
      
      // Get current usage
      const usage = await storage.getUserUsage(userId);
      const addOns = await storage.getUserAddOns(userId);
      
      res.json({
        subscription,
        usage,
        addOns
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/subscription/usage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const [chatCheck, analysisCheck, usage] = await Promise.all([
        storage.checkUsageLimit(userId, 'aiChatsUsed'),
        storage.checkUsageLimit(userId, 'aiDeepAnalysisUsed'),
        storage.getUserUsage(userId)
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
  app.post("/api/subscription/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Payment processing unavailable - Stripe not configured",
          requiresSetup: true 
        });
      }

      const userId = getUserIdFromRequest(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
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
      let currentSubscription = await storage.getUserSubscription(userId);
      if (!currentSubscription) {
        await storage.initializeDefaultSubscription(userId);
        currentSubscription = await storage.getUserSubscription(userId);
      }

      // Create or get Stripe customer
      let stripeCustomerId = '';
      
      if (currentSubscription?.stripeCustomerId) {
        stripeCustomerId = currentSubscription.stripeCustomerId;
      } else {
        const customerData: any = {
          metadata: {
            userId: userId,
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
          userId: userId,
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
  app.post("/api/subscription/create-subscription", isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Subscription processing unavailable - Stripe not configured",
          requiresSetup: true 
        });
      }

      const userId = getUserIdFromRequest(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { planId, priceId } = req.body; // priceId from Stripe dashboard
      
      if (!planId || !priceId) {
        return res.status(400).json({ message: "Plan ID and Price ID are required" });
      }
      
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // Ensure user has a subscription record
      let currentSubscription = await storage.getUserSubscription(userId);
      if (!currentSubscription) {
        await storage.initializeDefaultSubscription(userId);
        currentSubscription = await storage.getUserSubscription(userId);
      }

      // Create or get Stripe customer
      let stripeCustomerId = '';
      
      if (currentSubscription?.stripeCustomerId) {
        stripeCustomerId = currentSubscription.stripeCustomerId;
      } else {
        const customerData: any = {
          metadata: { userId: userId }
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
          userId: userId,
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

  app.post("/api/subscription/upgrade", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
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
      let currentSubscription = await storage.getUserSubscription(userId);
      if (!currentSubscription) {
        await storage.initializeDefaultSubscription(userId);
        currentSubscription = await storage.getUserSubscription(userId);
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
      const updatedSubscription = await storage.getUserSubscription(userId);
      
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
  app.post("/api/subscription/verify-payment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ success: false, message: "Plan ID is required" });
      }

      // Get current subscription
      const currentSubscription = await storage.getUserSubscription(userId);
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

  // ===== Investment Intelligence Routes =====
  
  // Get all investment strategies
  app.get("/api/investments/strategies", isAuthenticated, async (req: any, res) => {
    try {
      const strategies = await storage.getInvestmentStrategies();
      res.json(strategies);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get investment strategies by category
  app.get("/api/investments/strategies/:category", isAuthenticated, async (req: any, res) => {
    try {
      const { category } = req.params;
      const strategies = await storage.getInvestmentStrategiesByCategory(category);
      res.json(strategies);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all passive income opportunities
  app.get("/api/investments/passive-income", isAuthenticated, async (req: any, res) => {
    try {
      const opportunities = await storage.getPassiveIncomeOpportunities();
      res.json(opportunities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get passive income opportunities by category
  app.get("/api/investments/passive-income/:category", isAuthenticated, async (req: any, res) => {
    try {
      const { category } = req.params;
      const opportunities = await storage.getPassiveIncomeOpportunitiesByCategory(category);
      res.json(opportunities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Initialize investment data (seed database) - Admin only for now
  app.post("/api/investments/seed", isAuthenticated, async (req: any, res) => {
    try {
      // Import seed function dynamically
      const { seedInvestments } = await import("./seed-investments");
      await seedInvestments();
      res.json({ success: true, message: "Investment data seeded successfully" });
    } catch (error: any) {
      console.error("Seeding error:", error);
      res.status(500).json({ message: error.message });
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
  app.get("/api/referrals/my-code", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let referralCode = await storage.getUserReferralCode(userId);
      
      // Create referral code if user doesn't have one
      if (!referralCode) {
        const code = `${(user.firstName || user.email?.split('@')[0] || 'USER').toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        referralCode = await storage.createReferralCode({
          userId: userId,
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

  app.post("/api/referrals/use-code", isAuthenticated, async (req: any, res) => {
    try {
      const { referralCode } = req.body;
      if (!referralCode) {
        return res.status(400).json({ message: "Referral code is required" });
      }

      const userId = getUserIdFromRequest(req);
      
      // Process the referral
      const referral = await storage.processReferral(userId, referralCode);
      
      // Add bonus credits for the referred user (10 AI chats)
      await storage.addBonusCredits({
        userId: userId,
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

  app.get("/api/referrals/my-referrals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const referrals = await storage.getUserReferrals(userId);
      res.json(referrals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/referrals/bonus-credits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const [credits, availableAmount] = await Promise.all([
        storage.getUserBonusCredits(userId),
        storage.getAvailableBonusCredits(userId)
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

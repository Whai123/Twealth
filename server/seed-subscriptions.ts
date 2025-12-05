import { db } from "./db";
import { subscriptionPlans, subscriptions } from "../shared/schema";
import { eq, sql, inArray } from "drizzle-orm";

export async function seedSubscriptionPlans() {
  console.log("Seeding subscription plans...");

  // Step 1: Clean up duplicate plans (e.g., "Free" and "free" are duplicates)
  // For each canonical name, keep only one plan and migrate subscriptions
  const validPlanNames = ['free', 'pro', 'enterprise'];
  const allPlans = await db.query.subscriptionPlans.findMany();
  
  for (const canonicalName of validPlanNames) {
    // Find all plans that match this name (case-insensitive)
    const matchingPlans = allPlans.filter(p => p.name.toLowerCase() === canonicalName);
    
    if (matchingPlans.length > 1) {
      console.log(`  Found ${matchingPlans.length} duplicate "${canonicalName}" plans, consolidating...`);
      
      // Pick the canonical plan with deterministic priority:
      // 1. Prefer exact lowercase name match
      // 2. Prefer plan with Stripe price ID (production-configured)
      // 3. Prefer plan with earliest ID (stable tiebreaker)
      let canonicalPlan = matchingPlans.find(p => p.name === canonicalName);
      if (!canonicalPlan) {
        canonicalPlan = matchingPlans.find(p => p.stripePriceId !== null);
      }
      if (!canonicalPlan) {
        canonicalPlan = matchingPlans.sort((a, b) => a.id.localeCompare(b.id))[0];
      }
      
      // Get duplicate plan IDs (all except canonical)
      const duplicatePlans = matchingPlans.filter(p => p.id !== canonicalPlan.id);
      const duplicateIds = duplicatePlans.map(p => p.id);
      
      if (duplicateIds.length > 0) {
        // Migrate any subscriptions from duplicates to the canonical plan
        const migratedCount = await db
          .update(subscriptions)
          .set({ planId: canonicalPlan.id })
          .where(inArray(subscriptions.planId, duplicateIds));
        
        // Delete the duplicate plans
        await db
          .delete(subscriptionPlans)
          .where(inArray(subscriptionPlans.id, duplicateIds));
        
        console.log(`    Migrated subscriptions and deleted ${duplicateIds.length} duplicate(s): ${duplicatePlans.map(p => `"${p.name}"`).join(', ')}`);
      }
    }
  }
  
  // Step 2: Remove any plans that don't match valid names at all
  const remainingPlans = await db.query.subscriptionPlans.findMany();
  for (const plan of remainingPlans) {
    if (!validPlanNames.includes(plan.name.toLowerCase())) {
      // Check if any subscriptions reference this plan
      const subscriptionsWithPlan = await db.query.subscriptions.findFirst({
        where: (subs, { eq }) => eq(subs.planId, plan.id),
      });
      
      if (!subscriptionsWithPlan) {
        // Safe to delete orphaned plan
        await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, plan.id));
        console.log(`  Removed orphaned plan: ${plan.name} (${plan.id})`);
      }
    }
  }

  // Get Stripe price IDs from environment variables
  const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || null;
  const STRIPE_ENTERPRISE_PRICE_ID = process.env.STRIPE_ENTERPRISE_PRICE_ID || null;

  if (!STRIPE_PRO_PRICE_ID || !STRIPE_ENTERPRISE_PRICE_ID) {
    console.warn("Stripe price IDs not configured. Set STRIPE_PRO_PRICE_ID and STRIPE_ENTERPRISE_PRICE_ID environment variables.");
    console.warn("Paid subscriptions will not work until these are configured.");
  } else {
    console.log("✓ Stripe price IDs configured from environment variables");
  }

  const plans = [
    {
      name: "free",
      displayName: "Twealth Free",
      description: "Perfect for getting started with AI-powered financial advice",
      priceThb: "0.00",
      priceUsd: "0.00",
      currency: "USD",
      stripePriceId: null, // Free plan doesn't need Stripe price ID
      billingInterval: "monthly",
      scoutLimit: 50,
      sonnetLimit: 0,
      gpt5Limit: 0,
      opusLimit: 0,
      aiChatLimit: 50,
      aiDeepAnalysisLimit: 0,
      aiInsightsFrequency: "never",
      isLifetimeLimit: false,
      sortOrder: 0,
      features: [
        "50 Scout queries/month Fast",
        "Basic financial tracking",
        "Budget management",
        "Goal tracking",
        "Transaction categorization"
      ],
      isActive: true,
    },
    {
      name: "pro",
      displayName: "Twealth Pro",
      description: "Advanced AI insights with Sonnet reasoning for serious financial planning",
      priceThb: "349.00",
      priceUsd: "9.99",
      currency: "USD",
      stripePriceId: STRIPE_PRO_PRICE_ID, // Set via STRIPE_PRO_PRICE_ID environment variable
      billingInterval: "monthly",
      scoutLimit: 999999,
      sonnetLimit: 25,
      gpt5Limit: 5,
      opusLimit: 0,
      aiChatLimit: 999999,
      aiDeepAnalysisLimit: 30,
      aiInsightsFrequency: "daily",
      isLifetimeLimit: false,
      sortOrder: 1,
      features: [
        "Unlimited Scout queries Fast",
        "25 Sonnet queries/month Smart",
        "5 GPT-5 queries/month Math",
        "Daily proactive insights",
        "Advanced analytics",
        "Priority support",
        "Crypto tracking",
        "Investment recommendations"
      ],
      isActive: true,
    },
    {
      name: "enterprise",
      displayName: "Twealth Enterprise",
      description: "CFO-level AI intelligence with Opus for comprehensive financial management",
      priceThb: "1749.00",
      priceUsd: "49.99",
      currency: "USD",
      stripePriceId: STRIPE_ENTERPRISE_PRICE_ID, // Set via STRIPE_ENTERPRISE_PRICE_ID environment variable
      billingInterval: "monthly",
      scoutLimit: 999999,
      sonnetLimit: 60,
      gpt5Limit: 10,
      opusLimit: 20,
      aiChatLimit: 999999,
      aiDeepAnalysisLimit: 90,
      aiInsightsFrequency: "daily",
      isLifetimeLimit: false,
      sortOrder: 2,
      features: [
        "Unlimited Scout queries Fast",
        "60 Sonnet queries/month Smart",
        "10 GPT-5 queries/month Math",
        "20 Opus queries/month CFO",
        "Real-time insights and alerts",
        "Advanced predictive analytics",
        "Premium support",
        "Multi-currency support",
        "De-dollarization insights",
        "White-glove onboarding"
      ],
      isActive: true,
    },
  ];

  // Upsert plans - only update pricing and quotas, insert if missing
  // Use case-insensitive matching to handle production databases with capitalized names
  for (const plan of plans) {
    // Find existing plan with case-insensitive match (handles "Pro" vs "pro")
    const existing = await db.query.subscriptionPlans.findFirst({
      where: (plans, { }) => sql`LOWER(${plans.name}) = ${plan.name.toLowerCase()}`,
    });

    if (existing) {
      // Update pricing, quotas, AND normalize name to lowercase
      const pricingUpdates: Record<string, any> = {
        name: plan.name, // Normalize to lowercase (e.g., "Pro" -> "pro")
        displayName: plan.displayName,
        description: plan.description,
        priceUsd: plan.priceUsd,
        priceThb: plan.priceThb,
        scoutLimit: plan.scoutLimit,
        sonnetLimit: plan.sonnetLimit,
        gpt5Limit: plan.gpt5Limit,
        opusLimit: plan.opusLimit,
        aiChatLimit: plan.aiChatLimit,
        aiDeepAnalysisLimit: plan.aiDeepAnalysisLimit,
        features: plan.features,
        sortOrder: plan.sortOrder,
      };
      
      // Only update stripePriceId if env var is set - don't null out production values
      if (plan.stripePriceId !== null) {
        pricingUpdates.stripePriceId = plan.stripePriceId;
      }
      
      await db
        .update(subscriptionPlans)
        .set(pricingUpdates)
        .where(eq(subscriptionPlans.id, existing.id));
      
      const wasRenamed = existing.name !== plan.name;
      console.log(`  Updated pricing for: ${plan.name} ($${plan.priceUsd})${plan.stripePriceId ? ' [Stripe ID updated]' : ''}${wasRenamed ? ` [renamed from "${existing.name}"]` : ''}`);
    } else {
      // Insert new plan with all fields
      await db.insert(subscriptionPlans).values(plan);
      console.log(`  Inserted plan: ${plan.name}`);
    }
  }

  console.log("Subscription plans synced successfully");
}

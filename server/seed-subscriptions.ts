import { db } from "./db";
import { subscriptionPlans, subscriptions } from "../shared/schema";
import { eq, sql, inArray } from "drizzle-orm";

function normalizeName(name: string): string {
  return name
    .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, '') // Remove non-breaking spaces and zero-width chars
    .trim()
    .toLowerCase();
}

export async function seedSubscriptionPlans() {
  console.log("Seeding subscription plans...");

  // Skip seeding if database is not available
  if (!db) {
    console.log("Database not available, skipping subscription plan seeding");
    return;
  }

  const validPlanNames = ['free', 'pro', 'enterprise'];

  // Step 1: Clean up duplicate plans with transaction for atomicity
  try {
    const allPlans = await db.query.subscriptionPlans.findMany();

    for (const canonicalName of validPlanNames) {
      const matchingPlans = allPlans.filter(p => normalizeName(p.name) === canonicalName);

      if (matchingPlans.length > 1) {
        console.log(`  Found ${matchingPlans.length} duplicate "${canonicalName}" plans, consolidating...`);

        let canonicalPlan = matchingPlans.find(p => p.name === canonicalName);
        if (!canonicalPlan) {
          canonicalPlan = matchingPlans.find(p => p.stripePriceId !== null);
        }
        if (!canonicalPlan) {
          canonicalPlan = matchingPlans.sort((a, b) => a.id.localeCompare(b.id))[0];
        }

        const duplicatePlans = matchingPlans.filter(p => p.id !== canonicalPlan.id);
        const duplicateIds = duplicatePlans.map(p => p.id);

        if (duplicateIds.length > 0) {
          await db.transaction(async (tx) => {
            await tx
              .update(subscriptions)
              .set({ planId: canonicalPlan.id })
              .where(inArray(subscriptions.planId, duplicateIds));

            await tx
              .delete(subscriptionPlans)
              .where(inArray(subscriptionPlans.id, duplicateIds));
          });

          console.log(`    Migrated subscriptions and deleted ${duplicateIds.length} duplicate(s): ${duplicatePlans.map(p => `"${p.name}"`).join(', ')}`);
        }
      }
    }

    // Step 2: Remove orphaned plans
    const remainingPlans = await db.query.subscriptionPlans.findMany();
    for (const plan of remainingPlans) {
      if (!validPlanNames.includes(normalizeName(plan.name))) {
        const subscriptionsWithPlan = await db.query.subscriptions.findFirst({
          where: (subs, { eq }) => eq(subs.planId, plan.id),
        });

        if (!subscriptionsWithPlan) {
          await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, plan.id));
          console.log(`  Removed orphaned plan: ${plan.name} (${plan.id})`);
        }
      }
    }
  } catch (error) {
    console.error("Error during plan cleanup (non-fatal):", error);
  }

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
      stripePriceId: null,
      billingInterval: "monthly",
      scoutLimit: 50,       // Gemini Flash 2.0 (FREE tier)
      sonnetLimit: 0,
      gpt5Limit: 0,
      opusLimit: 0,
      aiChatLimit: 50,
      aiDeepAnalysisLimit: 0,
      aiInsightsFrequency: "never",
      isLifetimeLimit: false,
      sortOrder: 0,
      features: [
        "50 Gemini queries/month ⚡ Fast",
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
      description: "Advanced AI insights with Claude Sonnet for serious financial planning",
      priceThb: "349.00",
      priceUsd: "9.99",
      currency: "USD",
      stripePriceId: STRIPE_PRO_PRICE_ID,
      billingInterval: "monthly",
      scoutLimit: 999999,   // Unlimited Gemini Flash
      sonnetLimit: 25,      // Claude Sonnet 4.5
      gpt5Limit: 0,         // Deprecated
      opusLimit: 0,
      aiChatLimit: 999999,
      aiDeepAnalysisLimit: 30,
      aiInsightsFrequency: "daily",
      isLifetimeLimit: false,
      sortOrder: 1,
      features: [
        "Unlimited Gemini queries ⚡ Fast",
        "25 Claude Sonnet queries/month 🧠 Smart",
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
      description: "CFO-level AI intelligence with Claude for comprehensive financial management",
      priceThb: "1749.00",
      priceUsd: "49.99",
      currency: "USD",
      stripePriceId: STRIPE_ENTERPRISE_PRICE_ID,
      billingInterval: "monthly",
      scoutLimit: 999999,   // Unlimited Gemini Flash
      sonnetLimit: 100,     // More Claude Sonnet
      gpt5Limit: 0,         // Deprecated
      opusLimit: 0,         // Opus deprecated
      aiChatLimit: 999999,
      aiDeepAnalysisLimit: 90,
      aiInsightsFrequency: "daily",
      isLifetimeLimit: false,
      sortOrder: 2,
      features: [
        "Unlimited Gemini queries ⚡ Fast",
        "100 Claude Sonnet queries/month 🧠 Smart",
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

  for (const plan of plans) {
    // Query fresh each iteration to ensure we see any changes from previous iterations
    const currentPlans = await db.query.subscriptionPlans.findMany();
    // Use in-memory matching with full normalization (handles Unicode invisible chars)
    const existing = currentPlans.find(p => normalizeName(p.name) === plan.name);

    if (existing) {
      const pricingUpdates: Record<string, any> = {
        name: plan.name,
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
      await db.insert(subscriptionPlans).values(plan);
      console.log(`  Inserted plan: ${plan.name}`);
    }
  }

  // Verification step: confirm exactly 3 plans exist
  const finalPlans = await db.query.subscriptionPlans.findMany();
  const planCount = finalPlans.length;
  const planNames = finalPlans.map(p => p.name).join(', ');

  if (planCount === 3) {
    console.log(`✓ Verified: exactly ${planCount} plans exist (${planNames})`);
  } else {
    console.warn(`⚠ Warning: expected 3 plans, found ${planCount} (${planNames})`);
  }

  console.log("Subscription plans synced successfully");
}

import { db } from "./db";
import { subscriptionPlans } from "../shared/schema";
import { eq } from "drizzle-orm";

export async function seedSubscriptionPlans() {
  console.log("Seeding subscription plans...");

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
      sortOrder: 1,
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
      sortOrder: 2,
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
      sortOrder: 3,
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
  for (const plan of plans) {
    const existing = await db.query.subscriptionPlans.findFirst({
      where: (plans, { eq }) => eq(plans.name, plan.name),
    });

    if (existing) {
      // Only update pricing and quota fields - preserve other production customizations
      const pricingUpdates: Record<string, any> = {
        priceUsd: plan.priceUsd,
        priceThb: plan.priceThb,
        scoutLimit: plan.scoutLimit,
        sonnetLimit: plan.sonnetLimit,
        gpt5Limit: plan.gpt5Limit,
        opusLimit: plan.opusLimit,
        aiChatLimit: plan.aiChatLimit,
        aiDeepAnalysisLimit: plan.aiDeepAnalysisLimit,
        sortOrder: plan.sortOrder,
      };
      
      // Only update stripePriceId if env var is set - don't null out production values
      if (plan.stripePriceId !== null) {
        pricingUpdates.stripePriceId = plan.stripePriceId;
      }
      
      await db
        .update(subscriptionPlans)
        .set(pricingUpdates)
        .where(eq(subscriptionPlans.name, plan.name));
      console.log(`  Updated pricing for: ${plan.name} ($${plan.priceUsd})${plan.stripePriceId ? ' [Stripe ID updated]' : ''}`);
    } else {
      // Insert new plan with all fields
      await db.insert(subscriptionPlans).values(plan);
      console.log(`  Inserted plan: ${plan.name}`);
    }
  }

  console.log("Subscription plans synced successfully");
}

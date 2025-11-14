import { db } from "./db";
import { subscriptionPlans } from "../shared/schema";
import { eq } from "drizzle-orm";

export async function seedSubscriptionPlans() {
  console.log("🌱 Seeding subscription plans...");

  const plans = [
    {
      name: "free",
      displayName: "Twealth Free",
      description: "Perfect for getting started with AI-powered financial advice",
      priceThb: "0.00",
      priceUsd: "0.00",
      currency: "USD",
      billingInterval: "monthly",
      scoutLimit: 50,
      sonnetLimit: 0,
      gpt5Limit: 0,
      opusLimit: 0,
      aiChatLimit: 50,
      aiDeepAnalysisLimit: 0,
      aiInsightsFrequency: "never",
      isLifetimeLimit: false,
      features: [
        "50 Scout queries/month ⚡ Fast",
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
      billingInterval: "monthly",
      scoutLimit: 999999,
      sonnetLimit: 25,
      gpt5Limit: 5,
      opusLimit: 0,
      aiChatLimit: 999999,
      aiDeepAnalysisLimit: 30,
      aiInsightsFrequency: "daily",
      isLifetimeLimit: false,
      features: [
        "Unlimited Scout queries ⚡ Fast",
        "25 Sonnet queries/month 🧠 Smart",
        "5 GPT-5 queries/month 🧮 Math",
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
      billingInterval: "monthly",
      scoutLimit: 999999,
      sonnetLimit: 60,
      gpt5Limit: 10,
      opusLimit: 20,
      aiChatLimit: 999999,
      aiDeepAnalysisLimit: 90,
      aiInsightsFrequency: "daily",
      isLifetimeLimit: false,
      features: [
        "Unlimited Scout queries ⚡ Fast",
        "60 Sonnet queries/month 🧠 Smart",
        "10 GPT-5 queries/month 🧮 Math",
        "20 Opus queries/month 👔 CFO",
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

  // Upsert plans (update existing or insert new)
  for (const plan of plans) {
    const existing = await db.query.subscriptionPlans.findFirst({
      where: (plans, { eq }) => eq(plans.name, plan.name),
    });

    if (existing) {
      // Update existing plan with new quotas
      await db
        .update(subscriptionPlans)
        .set(plan)
        .where(eq(subscriptionPlans.name, plan.name));
      console.log(`  ✓ Updated plan: ${plan.name}`);
    } else {
      // Insert new plan
      await db.insert(subscriptionPlans).values(plan);
      console.log(`  ✓ Inserted plan: ${plan.name}`);
    }
  }

  console.log("✅ Subscription plans seeded successfully");
}

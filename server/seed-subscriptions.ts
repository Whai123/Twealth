import { db } from "./db";
import { subscriptionPlans } from "../shared/schema";

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
      opusLimit: 0,
      aiChatLimit: 50,
      aiDeepAnalysisLimit: 0,
      aiInsightsFrequency: "never",
      isLifetimeLimit: false,
      features: [
        "50 AI Scout queries per month",
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
      scoutLimit: 200,
      sonnetLimit: 25,
      opusLimit: 0,
      aiChatLimit: 225,
      aiDeepAnalysisLimit: 25,
      aiInsightsFrequency: "daily",
      isLifetimeLimit: false,
      features: [
        "200 AI Scout queries per month",
        "25 AI Sonnet (advanced reasoning) queries per month",
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
      scoutLimit: 300,
      sonnetLimit: 60,
      opusLimit: 20,
      aiChatLimit: 380,
      aiDeepAnalysisLimit: 80,
      aiInsightsFrequency: "daily",
      isLifetimeLimit: false,
      features: [
        "300 AI Scout queries per month",
        "60 AI Sonnet (advanced reasoning) queries per month",
        "20 AI Opus (CFO-level intelligence) queries per month",
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

  // Insert plans
  for (const plan of plans) {
    await db.insert(subscriptionPlans).values(plan).onConflictDoNothing();
  }

  console.log("✅ Subscription plans seeded successfully");
}

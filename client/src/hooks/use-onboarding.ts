import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface OnboardingStatus {
  needsOnboarding: boolean;
  hasFinancialData: boolean;
  hasGoals: boolean;
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Check if user has financial data
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Check if user has any goals
  const { data: goals } = useQuery({
    queryKey: ["/api/financial-goals"],
  });

  // Check onboarding status from localStorage
  useEffect(() => {
    const completed = localStorage.getItem("onboarding_completed");
    setOnboardingComplete(completed === "true");
  }, []);

  // Determine if onboarding is needed
  useEffect(() => {
    if (onboardingComplete) {
      setShowOnboarding(false);
      return;
    }

    if (!stats || !goals) return;

    const hasFinancialData = 
      (stats as any)?.monthlyIncome > 0 || 
      (stats as any)?.monthlyExpenses > 0 || 
      (stats as any)?.totalSavings > 0;
    
    const hasGoals = Array.isArray(goals) && goals.length > 0;

    // Show onboarding if user has no financial data AND no goals
    if (!hasFinancialData && !hasGoals) {
      setShowOnboarding(true);
    }
  }, [stats, goals, onboardingComplete]);

  const completeOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    setOnboardingComplete(true);
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    setOnboardingComplete(true);
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    completeOnboarding,
    skipOnboarding,
  };
}

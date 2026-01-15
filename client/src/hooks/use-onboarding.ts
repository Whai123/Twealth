import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserPreferences } from "@shared/schema";

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

    // Check user preferences (database-level onboarding status)
    const { data: userPreferences } = useQuery<UserPreferences>({
        queryKey: ["/api/user-preferences"],
    });

    // Check onboarding status from localStorage OR database
    useEffect(() => {
        const localCompleted = localStorage.getItem("onboarding_completed") === "true";
        const dbCompleted = userPreferences?.hasCompletedOnboarding === true;

        // Consider complete if EITHER localStorage or database says so
        setOnboardingComplete(localCompleted || dbCompleted);
    }, [userPreferences]);

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

import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { UserPreferences } from "@shared/schema";

interface OnboardingRedirectProps {
  children: React.ReactNode;
}

export function OnboardingRedirect({ children }: OnboardingRedirectProps) {
  const [location, setLocation] = useLocation();
  
  const { data: userPreferences, isLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/user-preferences"],
  });
  
  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) {
      return;
    }
    
    // If on welcome page and onboarding is complete, redirect to dashboard
    if (location === "/welcome" && userPreferences?.hasCompletedOnboarding) {
      setLocation("/");
      return;
    }
    
    // If not on welcome page and onboarding is not complete, redirect to welcome
    if (location !== "/welcome" && !userPreferences?.hasCompletedOnboarding) {
      setLocation("/welcome");
    }
  }, [userPreferences, isLoading, location, setLocation]);
  
  // Show loading while checking onboarding status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }
  
  // Don't render children if user needs onboarding and we're not on welcome page
  if (!userPreferences?.hasCompletedOnboarding && location !== "/welcome") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Preparing your experience...</span>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
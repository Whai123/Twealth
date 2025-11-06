import { useQuery } from"@tanstack/react-query";
import { useLocation } from"wouter";
import { useEffect } from"react";
import { UserPreferences } from"@shared/schema";
import { SkeletonPage } from"@/components/ui/skeleton";

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
  if (location ==="/welcome" && userPreferences?.hasCompletedOnboarding) {
   setLocation("/");
   return;
  }
  
  // If not on welcome page and onboarding is not complete, redirect to welcome
  if (location !=="/welcome" && !userPreferences?.hasCompletedOnboarding) {
   setLocation("/welcome");
  }
 }, [userPreferences, isLoading, location, setLocation]);
 
 // Show loading while checking onboarding status
 if (isLoading) {
  return <SkeletonPage />;
 }
 
 // Don't render children if user needs onboarding and we're not on welcome page
 if (!userPreferences?.hasCompletedOnboarding && location !=="/welcome") {
  return <SkeletonPage />;
 }
 
 return <>{children}</>;
}
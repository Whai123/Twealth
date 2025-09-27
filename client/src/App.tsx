import { Switch, Route, useLocation } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { UserProvider } from "./lib/userContext";
import { ThemeProvider } from "./components/theme-provider";
// Lazy load pages for better mobile performance
import { lazy, Suspense, startTransition } from 'react';
import { Card } from "./components/ui/card";

const Dashboard = lazy(() => import("./pages/dashboard"));
const Welcome = lazy(() => import("./pages/welcome"));
const Groups = lazy(() => import("./pages/groups"));
const Calendar = lazy(() => import("./pages/calendar"));
const FinancialGoals = lazy(() => import("./pages/financial-goals"));
const MoneyTracking = lazy(() => import("./pages/money-tracking"));
const Planning = lazy(() => import("./pages/planning"));
const Settings = lazy(() => import("./pages/settings"));
const Subscription = lazy(() => import("./pages/subscription"));
const Upgrade = lazy(() => import("./pages/upgrade"));
const AIAssistant = lazy(() => import("./pages/ai-assistant"));
const Referrals = lazy(() => import("./pages/referrals"));
const PublicCalendar = lazy(() => import("./pages/public-calendar"));
const NotFound = lazy(() => import("./pages/not-found"));
const Landing = lazy(() => import("./pages/landing.tsx"));

// Loading component for lazy-loaded routes - simplified for React 18 compatibility
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px] p-4">
    <div className="flex items-center space-x-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  </div>
);

import Sidebar from "./components/sidebar";
import MobileNavigation from "./components/mobile-navigation";
import ErrorBoundary from "./components/error-boundary";
import { OnboardingRedirect } from "./components/onboarding-redirect";
import { OfflineIndicator } from "./components/pwa/offline-indicator";
import { PWAInstallPrompt } from "./components/pwa/install-prompt";

function Router() {
  console.log('=== ROUTER COMPONENT STARTING ===');
  
  const [location] = useLocation();
  console.log('=== LOCATION HOOK OK ===', location);
  
  // Use useQuery directly to avoid circular dependencies
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });
  console.log('=== QUERY HOOK OK ===', { user, isLoading });
  
  const isAuthenticated = !!user;
  console.log('=== ROUTER AUTH STATE ===', { isAuthenticated, isLoading });
  
  // Show loading screen while checking authentication
  if (isLoading) {
    console.log('=== RETURNING LOADER ===');
    return <PageLoader />;
  }
  
  // Public routes that don't need sidebar
  const isPublicRoute = location.startsWith('/shared/');
  
  if (isPublicRoute) {
    return (
      <main className="min-h-screen">
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/shared/calendar/:token" component={PublicCalendar} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
    );
  }
  
  // Show landing page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen">
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/" component={Landing} />
            <Route component={Landing} />
          </Switch>
        </Suspense>
      </main>
    );
  }
  
  // Authenticated routes with responsive navigation
  return (
    <OnboardingRedirect>
      <div className="flex min-h-screen bg-background">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/welcome" component={Welcome} />
              <Route path="/groups" component={Groups} />
              <Route path="/calendar" component={Calendar} />
              <Route path="/financial-goals" component={FinancialGoals} />
              <Route path="/money-tracking" component={MoneyTracking} />
              <Route path="/planning" component={Planning} />
              <Route path="/ai-assistant" component={AIAssistant} />
              <Route path="/referrals" component={Referrals} />
              <Route path="/subscription" component={Subscription} />
              <Route path="/upgrade" component={Upgrade} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </main>
        
        {/* Mobile Navigation - shown only on mobile */}
        <MobileNavigation />
      </div>
    </OnboardingRedirect>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <ThemeProvider defaultTheme="system" storageKey="twealth-theme">
            <TooltipProvider>
              <Router />
              <Toaster />
              <OfflineIndicator />
              <PWAInstallPrompt />
            </TooltipProvider>
          </ThemeProvider>
        </UserProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

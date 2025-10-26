import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { UserProvider } from "./lib/userContext";
import { ThemeProvider } from "./components/theme-provider";
import { useAuth } from "./hooks/useAuth";
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
const Checkout = lazy(() => import("./pages/checkout"));
const Upgrade = lazy(() => import("./pages/upgrade"));
const Pricing = lazy(() => import("./pages/pricing"));
const AIAssistant = lazy(() => import("./pages/ai-assistant"));
const AIInsights = lazy(() => import("./pages/ai-insights"));
const Referrals = lazy(() => import("./pages/referrals"));
const Crypto = lazy(() => import("./pages/crypto"));
const Friends = lazy(() => import("./pages/friends"));
const InvitePage = lazy(() => import("./pages/invite"));
const PublicCalendar = lazy(() => import("./pages/public-calendar"));
const NotFound = lazy(() => import("./pages/not-found"));
const Landing = lazy(() => import("./pages/landing.tsx"));
const InvestmentIntelligence = lazy(() => import("./pages/investment-intelligence"));

// Loading component for lazy-loaded routes - simplified for React 18 compatibility
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px] p-4">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20"></div>
        <div className="absolute top-0 left-0 animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
      <div className="text-center space-y-1">
        <span className="text-sm font-medium text-foreground">Loading...</span>
        <p className="text-xs text-muted-foreground">Please wait</p>
      </div>
    </div>
  </div>
);

import Sidebar from "./components/sidebar";
import MobileNavigation from "./components/mobile-navigation";
import MobileHeader from "./components/mobile-header";
import ErrorBoundary from "./components/error-boundary";
import { OnboardingRedirect } from "./components/onboarding-redirect";
import { OfflineIndicator } from "./components/pwa/offline-indicator";
import { PWAInstallPrompt } from "./components/pwa/install-prompt";
import { RTLProvider } from "./components/rtl-provider";
import { SidebarProvider } from "./components/ui/sidebar";

function Router() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading screen while checking authentication
  if (isLoading) {
    return <PageLoader />;
  }
  
  // Public routes that don't need sidebar
  const isPublicRoute = location.startsWith('/shared/');
  
  if (isPublicRoute) {
    return (
      <main className="min-h-screen">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/shared/calendar/:token" component={PublicCalendar} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </ErrorBoundary>
      </main>
    );
  }
  
  // Show landing page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/" component={Landing} />
              <Route component={Landing} />
            </Switch>
          </Suspense>
        </ErrorBoundary>
      </main>
    );
  }
  
  // Authenticated routes with responsive navigation
  return (
    <OnboardingRedirect>
      <SidebarProvider>
        {/* Skip to main content link for keyboard navigation */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          data-testid="link-skip-to-main"
        >
          Skip to main content
        </a>
        <div className="flex min-h-screen bg-background w-full max-w-full overflow-x-hidden">
          {/* Sidebar - uses Sheet on mobile, fixed sidebar on desktop */}
          {location !== "/welcome" && <Sidebar />}
          
          {/* Main Content Area */}
          <main id="main-content" className={`flex-1 overflow-auto ${location !== "/welcome" ? "pt-16 md:pt-0 pb-20 md:pb-0" : ""}`}>
            {/* Mobile Header - sticky at top on mobile only */}
            {location !== "/welcome" && <MobileHeader />}
            
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Switch>
                  <Route path="/" component={Dashboard} />
                  <Route path="/welcome" component={Welcome} />
                  <Route path="/invite/:token" component={InvitePage} />
                  <Route path="/groups" component={Groups} />
                  <Route path="/calendar" component={Calendar} />
                  <Route path="/financial-goals" component={FinancialGoals} />
                  <Route path="/money-tracking" component={MoneyTracking} />
                  <Route path="/planning" component={Planning} />
                  <Route path="/crypto" component={Crypto} />
                  <Route path="/friends" component={Friends} />
                  <Route path="/ai-assistant" component={AIAssistant} />
                  <Route path="/ai-insights" component={AIInsights} />
                  <Route path="/investments" component={InvestmentIntelligence} />
                  <Route path="/referrals" component={Referrals} />
                  <Route path="/subscription" component={Subscription} />
                  <Route path="/checkout/:planId" component={Checkout} />
                  <Route path="/upgrade" component={Upgrade} />
                  <Route path="/pricing" component={Pricing} />
                  <Route path="/settings" component={Settings} />
                  <Route component={NotFound} />
                </Switch>
              </Suspense>
            </ErrorBoundary>
          </main>
          
          {/* Mobile Navigation - shown only on mobile and not on welcome page */}
          {location !== "/welcome" && <MobileNavigation />}
        </div>
      </SidebarProvider>
    </OnboardingRedirect>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <ThemeProvider defaultTheme="system" storageKey="twealth-theme">
          <RTLProvider>
            <TooltipProvider>
              <Toaster />
              <OfflineIndicator />
              <PWAInstallPrompt />
              <ErrorBoundary>
                <Router />
              </ErrorBoundary>
            </TooltipProvider>
          </RTLProvider>
        </ThemeProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;

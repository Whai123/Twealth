import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/lib/userContext";
// Lazy load pages for better mobile performance
import { lazy, Suspense, startTransition } from 'react';
import { Card } from "@/components/ui/card";

const Dashboard = lazy(() => import("@/pages/dashboard"));
const Groups = lazy(() => import("@/pages/groups"));
const Calendar = lazy(() => import("@/pages/calendar"));
const FinancialGoals = lazy(() => import("@/pages/financial-goals"));
const MoneyTracking = lazy(() => import("@/pages/money-tracking"));
const Planning = lazy(() => import("@/pages/planning"));
const Settings = lazy(() => import("@/pages/settings"));
const Subscription = lazy(() => import("@/pages/subscription"));
const Upgrade = lazy(() => import("@/pages/upgrade"));
const AIAssistant = lazy(() => import("@/pages/ai-assistant"));
const PublicCalendar = lazy(() => import("@/pages/public-calendar"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component for lazy-loaded routes - simplified for React 18 compatibility
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px] p-4">
    <div className="flex items-center space-x-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  </div>
);

import Sidebar from "@/components/sidebar";
import MobileNavigation from "@/components/mobile-navigation";
import ErrorBoundary from "@/components/error-boundary";

function Router() {
  const [location] = useLocation();
  
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
  
  // Regular routes with responsive navigation
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/groups" component={Groups} />
              <Route path="/calendar" component={Calendar} />
              <Route path="/financial-goals" component={FinancialGoals} />
              <Route path="/money-tracking" component={MoneyTracking} />
              <Route path="/planning" component={Planning} />
              <Route path="/ai-assistant" component={AIAssistant} />
              <Route path="/subscription" component={Subscription} />
              <Route path="/upgrade" component={Upgrade} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </ErrorBoundary>
      </main>
      
      {/* Mobile Navigation - shown only on mobile */}
      <MobileNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;

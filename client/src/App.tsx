import { Switch, Route, useLocation } from"wouter";
import { useEffect } from "react";
import { queryClient, checkAndClearStaleCache } from"./lib/queryClient";
import { QueryClientProvider } from"@tanstack/react-query";
import { Toaster } from"./components/ui/toaster";
import { TooltipProvider } from"./components/ui/tooltip";
import { UserProvider } from"./lib/userContext";
import { ThemeProvider } from"./components/theme-provider";
import { useAuth } from"./hooks/useAuth";
import { lazy, Suspense } from 'react';
import { Card } from"./components/ui/card";

// Clear stale cache on app load to prevent React Error #300 from cached objects
checkAndClearStaleCache(queryClient);

// CRITICAL ROUTES - Import directly to prevent chunk loading errors on deploy
// These ship in the main bundle, eliminating cache mismatch issues
import Dashboard from"./pages/dashboard";
import Welcome from"./pages/welcome";
import Groups from"./pages/groups";
import FinancialGoals from"./pages/financial-goals";
import MoneyTracking from"./pages/money-tracking";
import Settings from"./pages/settings";
import AIAssistant from"./pages/ai-assistant";
import Landing from"./pages/landing";
import Login from"./pages/login";

// OPTIONAL ROUTES - Keep lazy for less common paths
const Subscription = lazy(() => import("./pages/subscription"));
const Checkout = lazy(() => import("./pages/checkout"));
const Upgrade = lazy(() => import("./pages/upgrade"));
const Pricing = lazy(() => import("./pages/pricing"));
const Referrals = lazy(() => import("./pages/referrals"));
const Friends = lazy(() => import("./pages/friends"));
const InvitePage = lazy(() => import("./pages/invite"));
const NotFound = lazy(() => import("./pages/not-found"));
const Terms = lazy(() => import("./pages/terms"));
const Privacy = lazy(() => import("./pages/privacy"));
const SharePage = lazy(() => import("./pages/share"));
const AdminPage = lazy(() => import("./pages/admin"));

// HEAVY SHELL COMPONENTS - Lazy load for faster initial paint
const FloatingAIWidget = lazy(() => import("./components/ai/floating-ai-widget"));
const MilestoneCelebration = lazy(() => import("./components/milestone-celebration"));
const CommandPalette = lazy(() => import("./components/command-palette"));
const ProductTour = lazy(() => import("./components/product-tour"));

// Loading component for lazy-loaded routes - simplified for React 18 compatibility
const PageLoader = () => (
 <div className="flex items-center justify-center min-h-[400px] p-4">
  <div className="flex flex-col items-center space-y-4">
   <div className="relative">
    <div className="rounded-full h-12 w-12 border-4 border-primary/30"></div>
   </div>
   <div className="text-center space-y-1">
    <span className="text-sm font-medium text-foreground">Loading...</span>
    <p className="text-xs text-muted-foreground">Please wait</p>
   </div>
  </div>
 </div>
);

// Redirect component for legacy routes
function Redirect({ to }: { to: string }) {
 const [, setLocation] = useLocation();
 useEffect(() => {
  setLocation(to);
 }, [to, setLocation]);
 return null;
}

import Sidebar from"./components/sidebar";
import MobileNavigation from"./components/mobile-navigation";
import MobileHeader from"./components/mobile-header";
import ErrorBoundary from"./components/error-boundary";
import { OnboardingRedirect } from"./components/onboarding-redirect";
import { OfflineIndicator } from"./components/pwa/offline-indicator";
import { PWAInstallPrompt } from"./components/pwa/install-prompt";
import { RTLProvider } from"./components/rtl-provider";
import { SidebarProvider } from"./components/ui/sidebar";

function Router() {
 const [location] = useLocation();
 const { isAuthenticated, isLoading } = useAuth();
 
 // Show loading screen while checking authentication
 if (isLoading) {
  return <PageLoader />;
 }
 
 
 // Show login/landing page for unauthenticated users
 if (!isAuthenticated) {
  return (
   <main className="min-h-screen">
    <ErrorBoundary>
     <Suspense fallback={<PageLoader />}>
      <Switch>
       <Route path="/login" component={Login} />
       <Route path="/pricing" component={Pricing} />
       <Route path="/terms" component={Terms} />
       <Route path="/privacy" component={Privacy} />
       <Route path="/welcome" component={Welcome} />
       <Route path="/share" component={SharePage} />
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
     onClick={(e) => {
      e.preventDefault();
      const main = document.getElementById('main-content');
      if (main) {
       main.setAttribute('tabindex', '-1');
       main.focus();
       main.removeAttribute('tabindex');
      }
     }}
     className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 bg-primary text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-4 py-2"
     data-testid="link-skip-to-main"
    >
     Skip to main content
    </a>
    <div className="flex min-h-screen bg-background w-full max-w-full overflow-x-hidden">
     {/* Sidebar - uses Sheet on mobile, fixed sidebar on desktop */}
     {location !=="/welcome" && <Sidebar />}
     
     {/* Main Content Area */}
     <main id="main-content" className={`flex-1 overflow-auto ${location !=="/welcome" ?"pt-16 md:pt-0 pb-20 md:pb-0" :""}`}>
      {/* Mobile Header - sticky at top on mobile only */}
      {location !=="/welcome" && <MobileHeader />}
      
      <ErrorBoundary>
       <Suspense fallback={<PageLoader />}>
        <Switch>
         <Route path="/" component={Dashboard} />
         <Route path="/welcome" component={Welcome} />
         <Route path="/invite/:token" component={InvitePage} />
         <Route path="/groups" component={Groups} />
         <Route path="/financial-goals" component={FinancialGoals} />
         <Route path="/money-tracking" component={MoneyTracking} />
         <Route path="/friends" component={Friends} />
         <Route path="/ai-assistant" component={AIAssistant} />
         <Route path="/referrals" component={Referrals} />
         <Route path="/subscription" component={Subscription} />
         <Route path="/checkout/:planId" component={Checkout} />
         <Route path="/upgrade" component={Upgrade} />
         <Route path="/pricing" component={Pricing} />
         <Route path="/settings" component={Settings} />
         <Route path="/financial-profile"><Redirect to="/money-tracking" /></Route>
         <Route path="/planning"><Redirect to="/financial-goals" /></Route>
         <Route path="/terms" component={Terms} />
         <Route path="/privacy" component={Privacy} />
         <Route path="/share" component={SharePage} />
         <Route path="/admin" component={AdminPage} />
         <Route component={NotFound} />
        </Switch>
       </Suspense>
      </ErrorBoundary>
     </main>
     
     {/* Mobile Navigation - shown only on mobile and not on welcome page */}
     {location !=="/welcome" && <MobileNavigation />}
     
     {/* Lazy-loaded shell components - wrapped in Suspense for non-blocking navigation */}
     <Suspense fallback={null}>
      {/* Floating AI Widget - accessible from any page except welcome */}
      {location !=="/welcome" && <FloatingAIWidget />}
      
      {/* Milestone Celebration - shows when user reaches goal milestones */}
      <MilestoneCelebration />
      
      {/* Command Palette - Cmd+K for power users */}
      {location !=="/welcome" && <CommandPalette />}
      
      {/* Product Tour - Onboarding for new users */}
      {location !=="/welcome" && <ProductTour />}
     </Suspense>
    </div>
   </SidebarProvider>
  </OnboardingRedirect>
 );
}

function App() {
 useEffect(() => {
  // App successfully loaded
  console.log('[App] Successfully loaded');
 }, []);

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

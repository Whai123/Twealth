import { Link, useLocation } from"wouter";
import { useTranslation } from 'react-i18next';
import { 
 Home, 
 Users, 
 Calendar, 
 Target, 
 TrendingUp, 
 Lightbulb,
 Settings,
 User,
 Crown,
 Brain,
 Gift,
 Moon,
 Sun,
 Bitcoin,
 UserPlus,
 Wallet,
 BarChart3,
 LogOut,
 Loader2,
 LineChart
} from"lucide-react";
import logoUrl from"@assets/5-removebg-preview_1761578659737.png";
import { cn } from"@/lib/utils";
import LanguageSwitcher from"@/components/language-switcher";
import { useTheme } from"@/components/theme-provider";
import { Button } from"@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from"@/components/ui/tooltip";
import CryptoTicker from"@/components/crypto-ticker";
import { useAuth } from"@/hooks/useAuth";
import {
 Sidebar as SidebarWrapper,
 SidebarContent,
 SidebarFooter,
 SidebarHeader,
} from"@/components/ui/sidebar";
import { useMutation } from"@tanstack/react-query";
import { apiRequest, queryClient } from"@/lib/queryClient";
import { useToast } from"@/hooks/use-toast";

interface NavSection {
 title: string;
 items: Array<{
 name: string;
 href: string;
 icon: any;
 description: string;
 }>;
}

const getNavigationSections = (t: (key: string) => string): NavSection[] => [
 {
 title: t('navigation.sections.main'),
 items: [
 { 
 name: t('navigation.dashboard'), 
 href:"/", 
 icon: Home,
 description: t('navigation.descriptions.dashboard')
 },
 { 
 name: t('navigation.aiAssistant'), 
 href:"/ai-assistant", 
 icon: Brain,
 description: t('navigation.descriptions.aiAssistant')
 },
 { 
 name: t('navigation.aiInsights'), 
 href:"/ai-insights", 
 icon: BarChart3,
 description: t('navigation.descriptions.aiInsights')
 },
 { 
 name:"Predictive Insights", 
 href:"/predictive-insights", 
 icon: LineChart,
 description:"AI-powered spending forecasts, goal predictions, and cash flow analysis"
 },
 { 
 name:"Hybrid AI Demo", 
 href:"/hybrid-ai", 
 icon: Brain,
 description:"Explore Scout (fast) vs Reasoning (deep CFO analysis) AI models"
 },
 ]
 },
 {
 title: t('navigation.sections.finance'),
 items: [
 { 
 name: t('navigation.goals'), 
 href:"/financial-goals", 
 icon: Target,
 description: t('navigation.descriptions.goals')
 },
 { 
 name: t('navigation.money'), 
 href:"/money-tracking", 
 icon: Wallet,
 description: t('navigation.descriptions.money')
 },
 { 
 name:"Investments", 
 href:"/investments", 
 icon: TrendingUp,
 description:"AI-powered investment recommendations and passive income opportunities"
 },
 { 
 name: t('navigation.crypto'), 
 href:"/crypto", 
 icon: Bitcoin,
 description: t('navigation.descriptions.crypto')
 },
 ]
 },
 {
 title: t('navigation.sections.social'),
 items: [
 { 
 name: t('navigation.friends'), 
 href:"/friends", 
 icon: UserPlus,
 description: t('navigation.descriptions.friends')
 },
 { 
 name: t('navigation.groups'), 
 href:"/groups", 
 icon: Users,
 description: t('navigation.descriptions.groups')
 },
 { 
 name: t('navigation.calendar'), 
 href:"/calendar", 
 icon: Calendar,
 description: t('navigation.descriptions.calendar')
 },
 ]
 },
 {
 title: t('navigation.sections.more'),
 items: [
 { 
 name: t('navigation.planning'), 
 href:"/planning", 
 icon: Lightbulb,
 description: t('navigation.descriptions.planning')
 },
 { 
 name: t('navigation.referrals'), 
 href:"/referrals", 
 icon: Gift,
 description: t('navigation.descriptions.referrals')
 },
 { 
 name: t('navigation.premium'), 
 href:"/subscription", 
 icon: Crown,
 description: t('navigation.descriptions.premium')
 },
 ]
 }
];

export default function Sidebar() {
 const [location, setLocation] = useLocation();
 const { t } = useTranslation();
 const { theme, setTheme } = useTheme();
 const { user } = useAuth();
 const { toast } = useToast();
 const navigationSections = getNavigationSections(t);

 const logoutMutation = useMutation({
 mutationFn: async () => {
 return await apiRequest('POST', '/api/auth/logout', {});
 },
 onSuccess: () => {
 // Invalidate auth queries
 queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
 queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
 queryClient.clear(); // Clear all cached data on logout
 
 // Show success toast
 toast({
 title:"Signed out securely",
 description:"You have been logged out successfully",
 });
 
 // Redirect to login page
 setTimeout(() => {
 setLocation('/login');
 }, 100);
 },
 onError: (error: any) => {
 toast({
 title:"Logout failed",
 description: error.message ||"Please try again",
 variant:"destructive",
 });
 },
 });

 const handleLogout = () => {
 logoutMutation.mutate();
 };

 const toggleTheme = () => {
 if (theme ==="dark") {
 setTheme("light");
 } else {
 setTheme("dark");
 }
 };

 return (
 <SidebarWrapper className="bg-card border-r border-border shadow-sm">
 <SidebarHeader className="p-6">
 <Link href="/">
 <div className="flex items-center gap-3 cursor-pointer group" data-testid="link-logo">
 <img 
 src={logoUrl} 
 alt="Twealth Logo" 
 className="w-10 h-10"
 />
 <span className="font-bold text-xl text-foreground text-foreground">
 Twealth
 </span>
 </div>
 </Link>
 </SidebarHeader>
 
 <SidebarContent>
 <nav className="px-4 pb-4" aria-label="Main navigation">
 <TooltipProvider delayDuration={300}>
 {navigationSections.map((section, sectionIndex) => (
 <div key={section.title} className={cn(sectionIndex > 0 &&"mt-6")}>
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
 {section.title}
 </h3>
 <ul className="space-y-1" role="list">
 {section.items.map((item) => {
 const isActive = location === item.href;
 return (
 <li key={item.name}>
 <Tooltip>
 <TooltipTrigger asChild>
 <Link href={item.href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:rounded-md">
 <div
 className={cn(
"flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer group",
 isActive
 ?"bg-primary text-primary-foreground shadow-sm"
 :"text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm[1.02]"
 )}
 data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
 role="link"
 aria-label={`Navigate to ${item.name}`}
 aria-current={isActive ?"page" : undefined}
 >
 <item.icon size={20} aria-hidden="true" className={cn(
"transition-transform",
 !isActive &&""
 )} />
 <span className="text-sm font-medium">{item.name}</span>
 </div>
 </Link>
 </TooltipTrigger>
 <TooltipContent side="right" className="max-w-xs">
 <p className="text-xs">{item.description}</p>
 </TooltipContent>
 </Tooltip>
 </li>
 );
 })}
 </ul>
 </div>
 ))}
 </TooltipProvider>
 </nav>
 </SidebarContent>
 
 <SidebarFooter>
 <div className="px-4 mb-4">
 <CryptoTicker />
 </div>
 
 <div className="px-4 mb-4">
 <div className="bg-muted rounded-lg p-4">
 <div className="flex items-center space-x-3 mb-3">
 <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
 <User className="text-primary-foreground" size={20} />
 </div>
 <div>
 <p className="font-semibold text-sm" data-testid="text-username">
 {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
 </p>
 <p className="text-xs text-muted-foreground" data-testid="text-useremail">
 {user?.email || 'Loading...'}
 </p>
 </div>
 </div>
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <LanguageSwitcher />
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 variant="ghost"
 size="sm"
 onClick={toggleTheme}
 className="h-8 w-8 p-0"
 data-testid="button-theme-toggle"
 aria-label={theme ==="dark" ? t('theme.switchToLight') : t('theme.switchToDark')}
 >
 {theme ==="dark" ? (
 <Sun size={16} className="text-muted-foreground hover:text-foreground" aria-hidden="true" />
 ) : (
 <Moon size={16} className="text-muted-foreground hover:text-foreground" aria-hidden="true" />
 )}
 </Button>
 </TooltipTrigger>
 <TooltipContent>
 <p className="text-xs">{theme ==="dark" ? t('theme.switchToLight') : t('theme.switchToDark')}</p>
 </TooltipContent>
 </Tooltip>
 </div>
 <Link href="/settings">
 <button 
 className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center"
 data-testid="button-settings"
 >
 <Settings size={12} className="mr-1" />
 {t('navigation.settings')}
 </button>
 </Link>
 <button 
 onClick={handleLogout}
 disabled={logoutMutation.isPending}
 className="text-xs text-destructive hover:text-destructive/90 transition-colors flex items-center disabled:opacity-50"
 data-testid="button-logout"
 >
 {logoutMutation.isPending ? (
 <Loader2 size={12} className="mr-1" />
 ) : (
 <LogOut size={12} className="mr-1" />
 )}
 {logoutMutation.isPending ?"Signing out..." :"Sign out"}
 </button>
 </div>
 </div>
 </div>
 </SidebarFooter>
 </SidebarWrapper>
 );
}

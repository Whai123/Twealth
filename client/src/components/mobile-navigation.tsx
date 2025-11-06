import { useState, useEffect } from"react";
import { Link, useLocation } from"wouter";
import { useTranslation } from 'react-i18next';
import { 
 Home, 
 Calendar, 
 Target, 
 DollarSign,
 Users,
 Plus,
 Brain,
 Crown,
 Gift,
 Bitcoin,
 BarChart3
} from"lucide-react";
import { cn } from"../lib/utils";
import { Button } from"./ui/button";
import logoUrl from"@assets/5-removebg-preview_1761578659737.png";
import {
 Drawer,
 DrawerContent,
 DrawerDescription,
 DrawerTitle,
} from"./ui/drawer";
import GoalForm from"./forms/goal-form";
import TransactionForm from"./forms/transaction-form";
import EventForm from"./forms/event-form";

const getNavigation = (t: (key: string) => string) => [
 { name: t('navigation.dashboard'), href:"/", icon: Home, label: t('navigation.labels.home') },
 { name: t('navigation.aiAssistant'), href:"/ai-assistant", icon: Brain, label: t('navigation.labels.ai') },
 { name: t('navigation.aiInsights'), href:"/ai-insights", icon: BarChart3, label: t('navigation.labels.insights') },
 { name: t('navigation.calendar'), href:"/calendar", icon: Calendar, label: t('navigation.labels.calendar') },
 { name: t('navigation.premium'), href:"/subscription", icon: Crown, label: t('navigation.labels.premium') },
];

export default function MobileNavigation() {
 const [location] = useLocation();
 const { t } = useTranslation();
 const navigation = getNavigation(t);
 
 const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
 const [activeAction, setActiveAction] = useState<'goal' | 'transaction' | 'event' | null>(null);
 
 // Only render on mobile viewports
 const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
 
 useEffect(() => {
 const checkMobile = () => setIsMobile(window.innerWidth < 768);
 checkMobile();
 window.addEventListener('resize', checkMobile);
 return () => window.removeEventListener('resize', checkMobile);
 }, []);

 const quickActions = [
 {
 id:"add-goal",
 title: t('quickActions.newGoal'),
 description: t('quickActions.newGoalDesc'),
 icon: Target,
 color:"text-primary",
 bgColor:"bg-primary/10",
 action: () => { setActiveAction('goal'); setIsQuickActionsOpen(false); }
 },
 {
 id:"add-transaction",
 title: t('quickActions.addTransaction'),
 description: t('quickActions.addTransactionDesc'),
 icon: DollarSign,
 color:"text-success",
 bgColor:"bg-success/10",
 action: () => { setActiveAction('transaction'); setIsQuickActionsOpen(false); }
 },
 {
 id:"schedule-event",
 title: t('quickActions.scheduleEvent'),
 description: t('quickActions.scheduleEventDesc'),
 icon: Calendar,
 color:"text-warning",
 bgColor:"bg-warning/10",
 action: () => { setActiveAction('event'); setIsQuickActionsOpen(false); }
 }
 ];

 // Don't render at all on desktop
 if (!isMobile) {
 return null;
 }

 return (
 <>
 {/* Floating Action Button - Enhanced Design (hidden on calendar page which has its own FAB) */}
 {location !== '/calendar' && (
 <div className="fixed bottom-20 right-4 z-50 md:hidden">
 <Button
 size="lg"
 onClick={() => setIsQuickActionsOpen(true)}
 className="w-14 h-14 rounded-full shadow-xl bg-primary text-primary-foreground border-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
 style={{ 
 boxShadow: '0 10px 25px -5px hsl(var(--primary) / 0.3), 0 10px 10px -5px hsl(var(--primary) / 0.1)',
 background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.95), hsl(var(--primary) / 0.9))'
 }}
 aria-label={t('quickActions.addNew')}
 data-testid="fab-add"
 >
 <Plus size={24} className="drop-shadow-sm" />
 </Button>
 </div>
 )}

 {/* Quick Actions Drawer */}
 <Drawer open={isQuickActionsOpen} onOpenChange={setIsQuickActionsOpen}>
 <DrawerContent className="max-h-[50vh]">
 <div className="p-4 pb-6">
 <DrawerTitle className="text-xl font-semibold mb-2">{t('quickActions.title')}</DrawerTitle>
 <DrawerDescription className="text-muted-foreground mb-4">
 {t('quickActions.description')}
 </DrawerDescription>
 <div className="grid grid-cols-3 gap-3">
 {quickActions.map((action) => (
 <Button
 key={action.id}
 variant="ghost"
 onClick={action.action}
 className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-accent border"
 data-testid={`button-${action.id}`}
 >
 <div className={`w-12 h-12 rounded-xl ${action.bgColor} ${action.color} flex items-center justify-center`}>
 <action.icon size={24} />
 </div>
 <p className="font-medium text-xs text-center leading-tight">
 {action.title}
 </p>
 </Button>
 ))}
 </div>
 </div>
 </DrawerContent>
 </Drawer>

 {/* Goal Creation Drawer */}
 <Drawer open={activeAction === 'goal'} onOpenChange={(open) => !open && setActiveAction(null)}>
 <DrawerContent className="max-h-[90vh]">
 <div className="p-4 pb-6">
 <DrawerTitle className="text-xl font-semibold mb-2 flex items-center gap-2">
 <Target className="h-5 w-5 text-primary" />
 Create New Goal
 </DrawerTitle>
 <DrawerDescription className="text-muted-foreground mb-4">
 Set a savings target and track your progress
 </DrawerDescription>
 <GoalForm onSuccess={() => setActiveAction(null)} />
 </div>
 </DrawerContent>
 </Drawer>

 {/* Transaction Creation Drawer */}
 <Drawer open={activeAction === 'transaction'} onOpenChange={(open) => !open && setActiveAction(null)}>
 <DrawerContent className="max-h-[90vh]">
 <div className="p-4 pb-6">
 <DrawerTitle className="text-xl font-semibold mb-2 flex items-center gap-2">
 <DollarSign className="h-5 w-5 text-success" />
 {t('moneyTracking.addNew')}
 </DrawerTitle>
 <DrawerDescription className="text-muted-foreground mb-4">
 {t('moneyTracking.addNewDesc')}
 </DrawerDescription>
 <TransactionForm onSuccess={() => setActiveAction(null)} />
 </div>
 </DrawerContent>
 </Drawer>

 {/* Event Creation Drawer */}
 <Drawer open={activeAction === 'event'} onOpenChange={(open) => !open && setActiveAction(null)}>
 <DrawerContent className="max-h-[90vh]">
 <div className="p-4 pb-6">
 <DrawerTitle className="text-xl font-semibold mb-2 flex items-center gap-2">
 <Calendar className="h-5 w-5 text-warning" />
 {t('calendar.scheduleNew')}
 </DrawerTitle>
 <DrawerDescription className="text-muted-foreground mb-4">
 {t('calendar.scheduleNewDesc')}
 </DrawerDescription>
 <EventForm onSuccess={() => setActiveAction(null)} />
 </div>
 </DrawerContent>
 </Drawer>

 {/* Bottom Tab Bar - Modern Design with Gradient Theme */}
 <nav 
 className="fixed bottom-0 left-0 right-0 bg-background/98 backdrop-blur-lg border-t border-border/30 md:hidden z-40 shadow-lg"
 style={{ 
 paddingBottom: 'env(safe-area-inset-bottom, 8px)',
 background: 'linear-gradient(to top, hsl(var(--background)), hsl(var(--background) / 0.98), hsl(var(--background) / 0.95))'
 }}
 >
 <div className="flex items-center justify-around px-1 py-2">
 {navigation.map((item) => {
 const isActive = location === item.href || 
 (item.href !=="/" && location.startsWith(item.href));
 
 return (
 <Link 
 key={item.name} 
 href={item.href}
 aria-current={isActive ?"page" : undefined}
 aria-label={`${item.name} tab`}
 >
 <div
 className={cn(
"relative flex flex-col items-center justify-center min-w-[64px] min-h-[64px] rounded-2xl ease-out group",
 isActive
 ?"text-primary scale-105"
 :"text-muted-foreground hover:text-foreground"
 )}
 style={{ 
 padding: 'clamp(8px, 2vw, 12px)',
 borderRadius: '16px',
 }}
 data-testid={`mobile-nav-${item.name.toLowerCase()}`}
 >
 {/* Active indicator with gradient background */}
 {isActive && (
 <div 
 className="absolute inset-0 bg-primary/10 rounded-2xl shadow-sm"
 style={{ 
 borderRadius: '16px',
 background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05))'
 }}
 />
 )}
 
 {/* Top indicator dot for active state */}
 {isActive && (
 <div 
 className="absolute left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-sm"
 style={{ top: '8px' }}
 />
 )}
 
 {/* Icon and label */}
 <div className="relative z-10 flex flex-col items-center space-y-1">
 <div className={cn(
"p-1.5 rounded-xl",
 isActive 
 ?"bg-primary/10 shadow-sm" 
 :"group-hover:bg-muted/50"
 )}>
 <item.icon 
 size={20} 
 className={cn(
"transition-all",
 isActive &&"drop-shadow-sm"
 )}
 />
 </div>
 <span 
 className={cn(
"text-xs font-medium leading-none",
 isActive 
 ?"text-primary font-semibold" 
 :"text-muted-foreground group-hover:text-foreground"
 )}
 style={{ 
 fontSize: 'clamp(10px, 2.5vw, 12px)',
 letterSpacing: '-0.02em'
 }}
 >
 {item.label}
 </span>
 </div>
 </div>
 </Link>
 );
 })}
 </div>
 </nav>

 {/* Safe area padding for mobile bottom navigation */}
 <div className="h-20 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }} />
 </>
 );
}

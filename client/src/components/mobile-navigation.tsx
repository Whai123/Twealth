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
 BarChart3,
 LineChart,
 Wallet
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
 { name:"Money", href:"/money-tracking", icon: Wallet, label:"Money" },
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
 {/* Floating Action Button - positioned well above bottom nav */}
 {location !== '/calendar' && (
 <div 
 className="fixed left-4 z-50 md:hidden"
 style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
 >
 <Button
 size="lg"
 onClick={() => setIsQuickActionsOpen(true)}
 className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full shadow-lg bg-primary text-primary-foreground border-0"
 aria-label={t('quickActions.addNew')}
 data-testid="fab-add"
 >
 <Plus size={22} />
 </Button>
 </div>
 )}

 {/* Quick Actions Drawer */}
 <Drawer open={isQuickActionsOpen} onOpenChange={setIsQuickActionsOpen}>
 <DrawerContent className="max-h-[85vh] overflow-y-auto">
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
 <DrawerContent className="max-h-[85vh] overflow-y-auto">
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
 <DrawerContent className="max-h-[85vh] overflow-y-auto">
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
 <DrawerContent className="max-h-[85vh] overflow-y-auto">
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

 {/* Bottom Tab Bar - Compact Design */}
 <nav 
 className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border md:hidden z-40"
 style={{ 
 paddingBottom: 'env(safe-area-inset-bottom, 8px)'
 }}
 >
 <div className="flex items-center justify-around px-1 py-1.5">
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
"relative flex flex-col items-center justify-center min-w-[52px] min-h-[48px] rounded-xl ease-out group",
 isActive
 ?"text-primary"
 :"text-muted-foreground hover:text-foreground"
 )}
 data-testid={`mobile-nav-${item.name.toLowerCase()}`}
 >
 {/* Active indicator */}
 {isActive && (
 <div className="absolute inset-0 bg-primary/10 rounded-xl" />
 )}
 
 {/* Icon and label */}
 <div className="relative z-10 flex flex-col items-center gap-0.5">
 <item.icon size={18} className="transition-all" />
 <span 
 className={cn(
"text-[10px] font-medium leading-none",
 isActive 
 ?"text-primary font-semibold" 
 :"text-muted-foreground"
 )}
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

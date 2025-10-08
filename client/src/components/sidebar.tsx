import { Link, useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { 
  Home, 
  Users, 
  Calendar, 
  Target, 
  TrendingUp, 
  Lightbulb,
  CalendarX2,
  Settings,
  User,
  Crown,
  Brain,
  Gift,
  Moon,
  Sun,
  Bitcoin,
  UserPlus,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/language-switcher";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CryptoTicker from "@/components/crypto-ticker";
import { useAuth } from "@/hooks/useAuth";

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
    title: "Main",
    items: [
      { 
        name: t('navigation.dashboard'), 
        href: "/", 
        icon: Home,
        description: "View your financial overview and insights"
      },
      { 
        name: t('navigation.aiAssistant'), 
        href: "/ai-assistant", 
        icon: Brain,
        description: "Chat with AI to manage your finances"
      },
    ]
  },
  {
    title: "Finance",
    items: [
      { 
        name: t('navigation.goals'), 
        href: "/financial-goals", 
        icon: Target,
        description: "Set and track savings goals"
      },
      { 
        name: t('navigation.money'), 
        href: "/money-tracking", 
        icon: TrendingUp,
        description: "Track income and expenses"
      },
      { 
        name: "Crypto", 
        href: "/crypto", 
        icon: Bitcoin,
        description: "Monitor cryptocurrency holdings"
      },
    ]
  },
  {
    title: "Social",
    items: [
      { 
        name: "Friends", 
        href: "/friends", 
        icon: UserPlus,
        description: "Connect with friends for collaboration"
      },
      { 
        name: t('navigation.groups'), 
        href: "/groups", 
        icon: Users,
        description: "Manage shared financial groups"
      },
      { 
        name: t('navigation.calendar'), 
        href: "/calendar", 
        icon: Calendar,
        description: "Schedule events and meetings"
      },
    ]
  },
  {
    title: "More",
    items: [
      { 
        name: "Planning", 
        href: "/planning", 
        icon: Lightbulb,
        description: "Time tracking and productivity"
      },
      { 
        name: t('navigation.referrals'), 
        href: "/referrals", 
        icon: Gift,
        description: "Invite friends and earn rewards"
      },
      { 
        name: "Premium", 
        href: "/subscription", 
        icon: Crown,
        description: "Unlock advanced features"
      },
    ]
  }
];

export default function Sidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const navigationSections = getNavigationSections(t);

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <aside className="w-64 bg-card border-r border-border shadow-sm flex flex-col h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CalendarX2 className="text-primary-foreground" size={16} />
          </div>
          <span className="font-bold text-lg text-foreground">Twealth</span>
        </div>
      </div>
      
      <nav className="px-4 pb-4 flex-1 overflow-y-auto" aria-label="Main navigation">
        <TooltipProvider delayDuration={300}>
          {navigationSections.map((section, sectionIndex) => (
            <div key={section.title} className={cn(sectionIndex > 0 && "mt-6")}>
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
                          <Link href={item.href}>
                            <div
                              className={cn(
                                "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors cursor-pointer",
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                              data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                              role="link"
                              aria-label={`Navigate to ${item.name}`}
                              aria-current={isActive ? "page" : undefined}
                            >
                              <item.icon size={20} aria-hidden="true" />
                              <span className="text-sm">{item.name}</span>
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
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {theme === "dark" ? (
                      <Sun size={16} className="text-muted-foreground hover:text-foreground" aria-hidden="true" />
                    ) : (
                      <Moon size={16} className="text-muted-foreground hover:text-foreground" aria-hidden="true" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</p>
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
          </div>
        </div>
      </div>
    </aside>
  );
}

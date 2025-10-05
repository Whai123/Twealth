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
  Bitcoin
} from "lucide-react";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/language-switcher";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

const getNavigation = (t: (key: string) => string) => [
  { name: t('navigation.dashboard'), href: "/", icon: Home },
  { name: t('navigation.aiAssistant'), href: "/ai-assistant", icon: Brain },
  { name: t('navigation.referrals'), href: "/referrals", icon: Gift },
  { name: t('navigation.groups'), href: "/groups", icon: Users },
  { name: t('navigation.calendar'), href: "/calendar", icon: Calendar },
  { name: t('navigation.goals'), href: "/financial-goals", icon: Target },
  { name: t('navigation.money'), href: "/money-tracking", icon: TrendingUp },
  { name: "Crypto", href: "/crypto", icon: Bitcoin },
  { name: "Planning", href: "/planning", icon: Lightbulb },
  { name: "Premium", href: "/subscription", icon: Crown },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const navigation = getNavigation(t);

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <aside className="w-64 bg-card border-r border-border shadow-sm">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CalendarX2 className="text-primary-foreground" size={16} />
          </div>
          <span className="font-bold text-lg text-foreground">Twealth</span>
        </div>
      </div>
      
      <nav className="px-4 pb-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="px-4 mt-8">
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="text-primary-foreground" size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm">Demo User</p>
              <p className="text-xs text-muted-foreground">demo@example.com</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0"
                data-testid="button-theme-toggle"
              >
                {theme === "dark" ? (
                  <Sun size={16} className="text-muted-foreground hover:text-foreground" />
                ) : (
                  <Moon size={16} className="text-muted-foreground hover:text-foreground" />
                )}
              </Button>
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

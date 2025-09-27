import { Link, useLocation } from "wouter";
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
  Gift
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const getNavigation = (t: (key: string) => string) => [
  { name: t('navigation.dashboard'), href: "/", icon: Home, label: "Home" },
  { name: t('navigation.aiAssistant'), href: "/ai-assistant", icon: Brain, label: "AI" },
  { name: t('navigation.referrals'), href: "/referrals", icon: Gift, label: "Refer" },
  { name: t('navigation.calendar'), href: "/calendar", icon: Calendar, label: "Calendar" },
  { name: "Premium", href: "/subscription", icon: Crown, label: "Premium" },
];

export default function MobileNavigation() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const navigation = getNavigation(t);

  return (
    <>
      {/* Professional Action Button */}
      <div className="fixed bottom-20 right-4 z-50 md:hidden">
        <Button
          size="lg"
          className="w-12 h-12 rounded-full shadow-lg transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white border-0"
          aria-label="Quick actions"
          data-testid="fab-add"
        >
          <Plus size={20} />
        </Button>
      </div>

      {/* Professional Bottom Navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden z-40 shadow-lg"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 8px)'
        }}
      >
        <div className="flex items-center justify-around px-1 py-2">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={`${item.name} tab`}
              >
                <div
                  className={cn(
                    "relative flex flex-col items-center justify-center min-w-[60px] py-2 transition-all duration-200 group",
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                  data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
                  )}
                  
                  {/* Icon and label */}
                  <div className="flex flex-col items-center space-y-1">
                    <item.icon 
                      size={20} 
                      className="transition-colors duration-200"
                    />
                    <span 
                      className={cn(
                        "text-xs font-medium transition-colors duration-200",
                        isActive 
                          ? "text-blue-600 dark:text-blue-400" 
                          : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
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
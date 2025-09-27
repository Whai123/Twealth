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
  Gift
} from "lucide-react";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/language-switcher";

const getNavigation = (t: (key: string) => string) => [
  { name: t('navigation.dashboard'), href: "/", icon: Home },
  { name: t('navigation.aiAssistant'), href: "/ai-assistant", icon: Brain },
  { name: t('navigation.referrals'), href: "/referrals", icon: Gift },
  { name: t('navigation.groups'), href: "/groups", icon: Users },
  { name: t('navigation.calendar'), href: "/calendar", icon: Calendar },
  { name: t('navigation.goals'), href: "/financial-goals", icon: Target },
  { name: t('navigation.money'), href: "/money-tracking", icon: TrendingUp },
  { name: "Planning", href: "/planning", icon: Lightbulb },
  { name: "Premium", href: "/subscription", icon: Crown },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const navigation = getNavigation(t);

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <CalendarX2 className="text-white" size={18} />
          </div>
          <div>
            <span className="font-semibold text-xl text-gray-900 dark:text-white">Twealth</span>
            <div className="text-xs text-gray-500 dark:text-gray-400">Professional Platform</div>
          </div>
        </div>
      </div>
      
      <nav className="px-4 py-6">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer group",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon size={18} className={cn(
                      "transition-colors",
                      isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                    )} />
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="px-4 mt-auto">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="text-white" size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white" data-testid="text-user-name">Professional User</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Verified Account</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Security Status</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-900 dark:text-white font-medium">Secure</span>
              </div>
            </div>
            <LanguageSwitcher />
            <Link href="/settings">
              <button 
                className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors flex items-center gap-2 py-2"
                data-testid="button-settings"
              >
                <Settings size={14} />
                {t('navigation.settings')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}

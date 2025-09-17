import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users, 
  Calendar, 
  Target, 
  TrendingUp, 
  Lightbulb,
  CalendarX2,
  Settings,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Groups", href: "/groups", icon: Users },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Financial Goals", href: "/financial-goals", icon: Target },
  { name: "Money Tracking", href: "/money-tracking", icon: TrendingUp },
  { name: "Planning", href: "/planning", icon: Lightbulb },
];

export default function Sidebar() {
  const [location] = useLocation();

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
          <button 
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center"
            data-testid="button-settings"
          >
            <Settings size={12} className="mr-1" />
            Settings
          </button>
        </div>
      </div>
    </aside>
  );
}

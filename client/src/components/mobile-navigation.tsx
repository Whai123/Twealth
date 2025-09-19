import { Link, useLocation } from "wouter";
import { 
  Home, 
  Calendar, 
  Target, 
  DollarSign,
  Settings,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, label: "Home" },
  { name: "Calendar", href: "/calendar", icon: Calendar, label: "Calendar" },
  { name: "Goals", href: "/financial-goals", icon: Target, label: "Goals" },
  { name: "Money", href: "/money-tracking", icon: DollarSign, label: "Money" },
  { name: "Settings", href: "/settings", icon: Settings, label: "Settings" },
];

export default function MobileNavigation() {
  const [location] = useLocation();

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-50 md:hidden">
        <Button
          size="lg"
          className="w-14 h-14 rounded-full shadow-lg"
          data-testid="fab-add"
        >
          <Plus size={24} />
        </Button>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-40">
        <div className="flex items-center justify-around py-2 px-1">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex flex-col items-center justify-center p-2 min-w-[64px] min-h-[48px] rounded-lg transition-colors",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                >
                  <item.icon size={20} />
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Safe area padding for mobile bottom navigation */}
      <div className="h-16 md:hidden" />
    </>
  );
}
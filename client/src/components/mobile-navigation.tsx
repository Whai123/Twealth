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
      {/* Floating Action Button - Repositioned */}
      <div className="fixed bottom-24 right-6 z-50 md:hidden">
        <Button
          size="lg"
          className="w-12 h-12 rounded-full shadow-lg transition-all duration-200 hover:-translate-y-px hover:shadow-xl bg-primary text-primary-foreground border-0"
          style={{ boxShadow: 'var(--shadow-lg)' }}
          aria-label="Add new item"
          data-testid="fab-add"
        >
          <Plus size={20} />
        </Button>
      </div>

      {/* Bottom Tab Bar - Modern Design */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 md:hidden z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      >
        <div className="flex items-center justify-around px-2 py-1">
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
                    "relative flex flex-col items-center justify-center min-w-[56px] min-h-[56px] rounded-xl transition-all duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  style={{ 
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius)',
                  }}
                  data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                >
                  {/* Active indicator pill */}
                  {isActive && (
                    <div 
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      style={{ borderRadius: 'var(--radius)' }}
                    />
                  )}
                  
                  {/* Top indicator bar for active state */}
                  {isActive && (
                    <div 
                      className="absolute left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full"
                      style={{ top: 'var(--space-1)' }}
                    />
                  )}
                  
                  {/* Icon and label */}
                  <div className="relative z-10 flex flex-col items-center">
                    <item.icon 
                      size={20} 
                      className={cn(
                        "transition-transform duration-200",
                        isActive && "scale-110"
                      )}
                    />
                    <span 
                      className={cn(
                        "text-xs font-medium transition-all duration-200",
                        isActive ? "text-primary mt-0.5" : "mt-1"
                      )}
                      style={{ fontSize: 'var(--text-xs)' }}
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
      <div className="h-16 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }} />
    </>
  );
}
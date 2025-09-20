import { Link, useLocation } from "wouter";
import { 
  Home, 
  Calendar, 
  Target, 
  DollarSign,
  Users,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, label: "Dashboard" },
  { name: "Calendar", href: "/calendar", icon: Calendar, label: "Calendar" },
  { name: "Goals", href: "/financial-goals", icon: Target, label: "Goals" },
  { name: "Groups", href: "/groups", icon: Users, label: "Groups" },
  { name: "Money", href: "/money-tracking", icon: DollarSign, label: "Money" },
];

export default function MobileNavigation() {
  const [location] = useLocation();

  return (
    <>
      {/* Floating Action Button - Enhanced Design */}
      <div className="fixed bottom-20 right-4 z-50 md:hidden">
        <Button
          size="lg"
          className="w-14 h-14 rounded-full shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-95 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground border-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
          style={{ 
            boxShadow: '0 10px 25px -5px hsl(var(--primary) / 0.3), 0 10px 10px -5px hsl(var(--primary) / 0.1)',
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.95), hsl(var(--primary) / 0.9))'
          }}
          aria-label="Add new item"
          data-testid="fab-add"
        >
          <Plus size={24} className="drop-shadow-sm" />
        </Button>
      </div>

      {/* Bottom Tab Bar - Modern Design with Gradient Theme */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/98 to-background/95 backdrop-blur-lg border-t border-border/30 md:hidden z-40 shadow-lg"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
          background: 'linear-gradient(to top, hsl(var(--background)), hsl(var(--background) / 0.98), hsl(var(--background) / 0.95))'
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
                    "relative flex flex-col items-center justify-center min-w-[64px] min-h-[64px] rounded-2xl transition-all duration-300 ease-out group",
                    isActive
                      ? "text-primary scale-105"
                      : "text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95"
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
                      className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 rounded-2xl shadow-sm"
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
                      "p-1.5 rounded-xl transition-all duration-300",
                      isActive 
                        ? "bg-primary/10 shadow-sm" 
                        : "group-hover:bg-muted/50"
                    )}>
                      <item.icon 
                        size={20} 
                        className={cn(
                          "transition-all duration-300",
                          isActive && "drop-shadow-sm"
                        )}
                      />
                    </div>
                    <span 
                      className={cn(
                        "text-xs font-medium transition-all duration-300 leading-none",
                        isActive 
                          ? "text-primary font-semibold" 
                          : "text-muted-foreground group-hover:text-foreground"
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
import { Menu, User } from "lucide-react";
import logoUrl from "@assets/5-removebg-preview_1761578659737.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function MobileHeader() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const getUserInitials = () => {
    if (!user) return "U";
    const firstInitial = user.firstName?.[0] || "";
    const lastInitial = user.lastName?.[0] || "";
    return (firstInitial + lastInitial).toUpperCase() || "U";
  };

  return (
    <header
      className={cn(
        "md:hidden", // Only show on mobile
        "sticky top-0 z-50",
        "bg-background/80 backdrop-blur-lg",
        "border-b border-border/40",
        "shadow-sm"
      )}
      data-testid="mobile-header"
    >
      <div className="flex items-center justify-between px-4 h-16">
        {/* Left: Hamburger Menu */}
        <SidebarTrigger
          className="h-10 w-10"
          data-testid="button-mobile-menu"
        />

        {/* Center: Logo */}
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo">
            <img 
              src={logoUrl} 
              alt="Twealth Logo" 
              className="w-8 h-8"
            />
            <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Twealth</span>
          </div>
        </Link>

        {/* Right: User Avatar Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 w-10 rounded-full p-0"
              data-testid="button-user-menu"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none" data-testid="text-user-name">
                  {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                </p>
                <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-email">
                  {user?.email || 'Loading...'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <span className="cursor-pointer w-full" data-testid="link-settings">
                  {t('navigation.settings')}
                </span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/subscription">
                <span className="cursor-pointer w-full" data-testid="link-subscription">
                  {t('navigation.premium')}
                </span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

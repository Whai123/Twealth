import { Menu, User, LogOut, Loader2 } from"lucide-react";
import logoUrl from"@assets/5-removebg-preview_1761578659737.png";
import { cn } from"@/lib/utils";
import { useAuth } from"@/hooks/useAuth";
import { SidebarTrigger } from"@/components/ui/sidebar";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from"@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from"@/components/ui/avatar";
import { Button } from"@/components/ui/button";
import { Link, useLocation } from"wouter";
import { useTranslation } from"react-i18next";
import { useMutation } from"@tanstack/react-query";
import { apiRequest, queryClient } from"@/lib/queryClient";
import { useToast } from"@/hooks/use-toast";
import { useState } from"react";

export default function MobileHeader() {
 const { user } = useAuth();
 const { t } = useTranslation();
 const [, setLocation] = useLocation();
 const { toast } = useToast();
 const [isMenuOpen, setIsMenuOpen] = useState(false);

 const logoutMutation = useMutation({
  mutationFn: async () => {
   return await apiRequest('POST', '/api/auth/logout', {});
  },
  onSuccess: () => {
   // Invalidate auth queries
   queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
   queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
   queryClient.clear(); // Clear all cached data on logout
   
   // Show success toast
   toast({
    title:"Signed out securely",
    description:"You have been logged out successfully",
   });
   
   // Redirect to login page
   setTimeout(() => {
    setLocation('/login');
   }, 100);
  },
  onError: (error: any) => {
   toast({
    title:"Logout failed",
    description: error.message ||"Please try again",
    variant:"destructive",
   });
  },
 });

 const handleLogout = () => {
  setIsMenuOpen(false); // Close menu immediately
  logoutMutation.mutate();
 };

 const getUserInitials = () => {
  if (!user) return"U";
  const firstInitial = user.firstName?.[0] ||"";
  const lastInitial = user.lastName?.[0] ||"";
  return (firstInitial + lastInitial).toUpperCase() ||"U";
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
      <span className="font-bold text-lg text-foreground">Twealth</span>
     </div>
    </Link>

    {/* Right: User Avatar Menu */}
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
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
      <DropdownMenuSeparator />
      <DropdownMenuItem
       onClick={handleLogout}
       disabled={logoutMutation.isPending}
       className="cursor-pointer text-destructive focus:text-destructive"
       data-testid="button-logout"
      >
       <div className="flex items-center gap-2 w-full">
        {logoutMutation.isPending ? (
         <Loader2 className="h-4 w-4" />
        ) : (
         <LogOut className="h-4 w-4" />
        )}
        <span>
         {logoutMutation.isPending ?"Signing out..." :"Sign out"}
        </span>
       </div>
      </DropdownMenuItem>
     </DropdownMenuContent>
    </DropdownMenu>
   </div>
  </header>
 );
}

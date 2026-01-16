import { memo, useMemo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
    Home,
    Target,
    Settings,
    Crown,
    Brain,
    Moon,
    Sun,
    User,
    Users,
    Wallet,
    LogOut,
    Loader2,
    ChevronRight
} from "lucide-react";
import logoUrl from "@assets/5-removebg-preview_1761578659737.png";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/language-switcher";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
    Sidebar as SidebarWrapper,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from "@/components/ui/sidebar";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const NAV_ITEMS = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "AI Assistant", href: "/ai-assistant", icon: Brain },
    { name: "My Money", href: "/money-tracking", icon: Wallet },
    { name: "Goals", href: "/financial-goals", icon: Target },
    { name: "Groups", href: "/groups", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
];

function SidebarComponent() {
    const [location, setLocation] = useLocation();
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();
    const { toast } = useToast();

    const logoutMutation = useMutation({
        mutationFn: async () => {
            return await apiRequest('POST', '/api/auth/logout', {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
            queryClient.clear();
            toast({ title: "Signed out" });
            setTimeout(() => setLocation('/login'), 100);
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const handleLogout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);
    const toggleTheme = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

    return (
        <SidebarWrapper className="bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-900">
            <SidebarHeader className="p-5">
                <Link href="/">
                    <motion.div
                        className="flex items-center gap-3 cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <img src={logoUrl} alt="Twealth" className="w-9 h-9" />
                        <span className="font-bold text-xl text-zinc-900 dark:text-white">Twealth</span>
                    </motion.div>
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-3">
                <nav className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = location === item.href;
                        return (
                            <Link key={item.name} href={item.href}>
                                <motion.div
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors",
                                        isActive
                                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                    )}
                                    whileHover={{ x: isActive ? 0 : 2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-sm font-medium">{item.name}</span>
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Pro Card */}
                <Link href="/subscription">
                    <motion.div
                        className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white cursor-pointer"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Crown className="w-5 h-5" />
                            <span className="font-semibold">Upgrade to Pro</span>
                        </div>
                        <p className="text-xs text-white/80 mb-3">
                            Unlock deep AI analysis with Claude
                        </p>
                        <div className="flex items-center gap-1 text-xs font-medium">
                            <span>Learn more</span>
                            <ChevronRight className="w-3 h-3" />
                        </div>
                    </motion.div>
                </Link>
            </SidebarContent>

            <SidebarFooter className="p-3">
                {/* User Card */}
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center">
                            <User className="w-5 h-5 text-white dark:text-zinc-900" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">
                                {user?.email || 'Loading...'}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleTheme}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            {theme === "dark" ? (
                                <Sun className="w-4 h-4 text-zinc-500" />
                            ) : (
                                <Moon className="w-4 h-4 text-zinc-500" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            disabled={logoutMutation.isPending}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-500 hover:text-red-500"
                        >
                            {logoutMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <LogOut className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </SidebarFooter>
        </SidebarWrapper>
    );
}

const Sidebar = memo(SidebarComponent);
export default Sidebar;

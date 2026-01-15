import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
    Moon, Sun, Monitor, Bell, Languages, DollarSign, Shield,
    Download, Trash2, LogOut, Loader2, CheckCircle, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getSupportedCurrencies } from "@/lib/currency";

interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    language: string;
    currency: string;
    notifyGoalProgress: boolean;
    allowAnalytics: boolean;
    budgetWarningThreshold: number;
}

function Settings() {
    const { t, i18n } = useTranslation();
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    // Fetch preferences
    const { data: prefs, isLoading } = useQuery<UserPreferences>({
        queryKey: ["/api/user-preferences"],
    });

    // Update preferences mutation
    const updateMutation = useMutation({
        mutationFn: async (updates: Partial<UserPreferences>) => {
            return apiRequest("PUT", "/api/user-preferences", updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/user-preferences"] });
            toast({ title: "Saved", description: "Your preferences have been updated." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
        },
    });

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: () => apiRequest('POST', '/api/auth/logout', {}),
        onSuccess: () => {
            queryClient.clear();
            toast({ title: "Signed out", description: "You have been logged out." });
            setTimeout(() => setLocation('/login'), 100);
        },
    });

    // Export data mutation
    const exportMutation = useMutation({
        mutationFn: async (format: 'json' | 'csv') => {
            return apiRequest("GET", `/api/user-data/export?format=${format}`);
        },
        onSuccess: (data, format) => {
            const blob = new Blob([JSON.stringify(data)], { type: format === 'json' ? 'application/json' : 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `twealth-data.${format}`;
            a.click();
            toast({ title: "Downloaded", description: "Your data has been exported." });
        },
        onError: () => {
            toast({ title: "Export failed", description: "Please try again.", variant: "destructive" });
        },
    });

    // Delete account mutation
    const deleteMutation = useMutation({
        mutationFn: () => apiRequest("DELETE", "/api/user-data"),
        onSuccess: () => {
            queryClient.clear();
            toast({ title: "Account deleted", description: "Your data has been removed." });
            setLocation('/');
        },
    });

    const handleUpdate = (updates: Partial<UserPreferences>) => {
        updateMutation.mutate(updates);
    };

    const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
        handleUpdate({ theme });
        // Apply theme immediately
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle('dark', prefersDark);
        }
    };

    const handleLanguageChange = (lang: string) => {
        handleUpdate({ language: lang });
        i18n.changeLanguage(lang);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const currentPrefs = prefs || {
        theme: 'system',
        language: 'en',
        currency: 'USD',
        notifyGoalProgress: true,
        allowAnalytics: true,
        budgetWarningThreshold: 80,
    };

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] pb-20 md:pb-8">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-[#fafafa]/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.04]">
                <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-[-0.02em]">
                            {t('settings.title', 'Settings')}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5 hidden sm:block">
                            Manage your preferences and account
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => logoutMutation.mutate()}
                        disabled={logoutMutation.isPending}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        {logoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                        <span className="ml-2 hidden sm:inline">Sign out</span>
                    </Button>
                </div>
            </header>

            <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto space-y-6">

                {/* Appearance */}
                <Card className="rounded-[20px] border-black/[0.04] dark:border-white/[0.06] shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Appearance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                                    {currentPrefs.theme === 'dark' ? <Moon className="w-4 h-4" /> :
                                        currentPrefs.theme === 'light' ? <Sun className="w-4 h-4" /> :
                                            <Monitor className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Theme</p>
                                    <p className="text-xs text-muted-foreground">Choose your preferred look</p>
                                </div>
                            </div>
                            <Select value={currentPrefs.theme} onValueChange={handleThemeChange}>
                                <SelectTrigger className="w-28 h-9 rounded-xl text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="h-px bg-black/[0.04] dark:bg-white/[0.06]" />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                                    <Languages className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Language</p>
                                    <p className="text-xs text-muted-foreground">Display language</p>
                                </div>
                            </div>
                            <Select value={currentPrefs.language} onValueChange={handleLanguageChange}>
                                <SelectTrigger className="w-28 h-9 rounded-xl text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="th">ไทย</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="h-px bg-black/[0.04] dark:bg-white/[0.06]" />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Currency</p>
                                    <p className="text-xs text-muted-foreground">For financial display</p>
                                </div>
                            </div>
                            <Select value={currentPrefs.currency} onValueChange={(v) => handleUpdate({ currency: v })}>
                                <SelectTrigger className="w-28 h-9 rounded-xl text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[280px]">
                                    {getSupportedCurrencies().map((c) => (
                                        <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="rounded-[20px] border-black/[0.04] dark:border-white/[0.06] shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                                    <Bell className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Goal Progress</p>
                                    <p className="text-xs text-muted-foreground">Notify when goals are reached</p>
                                </div>
                            </div>
                            <Switch
                                checked={currentPrefs.notifyGoalProgress}
                                onCheckedChange={(v) => handleUpdate({ notifyGoalProgress: v })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Budget */}
                <Card className="rounded-[20px] border-black/[0.04] dark:border-white/[0.06] shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Budget Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm">Warning threshold</p>
                                <span className="text-sm font-medium">{currentPrefs.budgetWarningThreshold}%</span>
                            </div>
                            <Slider
                                value={[currentPrefs.budgetWarningThreshold]}
                                onValueChange={([v]) => handleUpdate({ budgetWarningThreshold: v })}
                                min={50}
                                max={100}
                                step={5}
                                className="w-full"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Get warned when spending reaches this percentage of your budget
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy & Data */}
                <Card className="rounded-[20px] border-black/[0.04] dark:border-white/[0.06] shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Privacy & Data</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Analytics</p>
                                    <p className="text-xs text-muted-foreground">Help improve Twealth</p>
                                </div>
                            </div>
                            <Switch
                                checked={currentPrefs.allowAnalytics}
                                onCheckedChange={(v) => handleUpdate({ allowAnalytics: v })}
                            />
                        </div>

                        <div className="h-px bg-black/[0.04] dark:bg-white/[0.06]" />

                        <button
                            onClick={() => exportMutation.mutate('json')}
                            disabled={exportMutation.isPending}
                            className="w-full flex items-center justify-between p-3 -mx-3 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                                    <Download className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium">Export Data</p>
                                    <p className="text-xs text-muted-foreground">Download your data as JSON</p>
                                </div>
                            </div>
                            {exportMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                        </button>

                        <div className="h-px bg-black/[0.04] dark:bg-white/[0.06]" />

                        {!deleteConfirm ? (
                            <button
                                onClick={() => setDeleteConfirm(true)}
                                className="w-full flex items-center justify-between p-3 -mx-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-red-500">Delete Account</p>
                                        <p className="text-xs text-muted-foreground">Permanently remove your data</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-red-400" />
                            </button>
                        ) : (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl space-y-3">
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                    Are you sure? This cannot be undone.
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDeleteConfirm(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => deleteMutation.mutate()}
                                        disabled={deleteMutation.isPending}
                                        className="flex-1"
                                    >
                                        {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}

export default Settings;

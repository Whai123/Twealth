import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Home,
  Brain,
  Target,
  Wallet,
  Users,
  Settings,
  Crown,
  Plus,
  Search,
  TrendingUp,
  PiggyBank,
  Calculator,
  HelpCircle,
  Moon,
  Sun,
  LogOut,
  User,
  CreditCard,
  Bell,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CommandAction {
  id: string;
  title: string;
  description?: string;
  icon: any;
  action: () => void;
  keywords?: string[];
  shortcut?: string;
}

interface CommandGroup {
  heading: string;
  items: CommandAction[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/auth/logout', {});
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation('/login');
      toast({ title: "Signed out successfully" });
    },
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const navigationItems: CommandAction[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Go to your financial overview",
      icon: Home,
      action: () => setLocation("/"),
      keywords: ["home", "overview", "main"],
      shortcut: "G D",
    },
    {
      id: "ai-assistant",
      title: "AI Assistant",
      description: "Chat with your AI financial advisor",
      icon: Brain,
      action: () => setLocation("/ai-assistant"),
      keywords: ["chat", "advisor", "help", "gpt", "claude"],
      shortcut: "G A",
    },
    {
      id: "goals",
      title: "Financial Goals",
      description: "Track your savings goals",
      icon: Target,
      action: () => setLocation("/financial-goals"),
      keywords: ["savings", "targets", "objectives"],
      shortcut: "G G",
    },
    {
      id: "money",
      title: "Money Tracking",
      description: "View transactions and budgets",
      icon: Wallet,
      action: () => setLocation("/money-tracking"),
      keywords: ["transactions", "spending", "budget", "expenses"],
      shortcut: "G M",
    },
    {
      id: "groups",
      title: "Groups",
      description: "Shared goals and cost splitting",
      icon: Users,
      action: () => setLocation("/groups"),
      keywords: ["shared", "split", "friends", "family"],
      shortcut: "G R",
    },
    {
      id: "subscription",
      title: "Subscription",
      description: "Manage your plan",
      icon: Crown,
      action: () => setLocation("/subscription"),
      keywords: ["upgrade", "pro", "enterprise", "billing"],
      shortcut: "G S",
    },
    {
      id: "settings",
      title: "Settings",
      description: "Preferences and account",
      icon: Settings,
      action: () => setLocation("/settings"),
      keywords: ["preferences", "account", "profile"],
      shortcut: "G ,",
    },
  ];

  const quickActions: CommandAction[] = [
    {
      id: "new-goal",
      title: "Create New Goal",
      description: "Set a new savings target",
      icon: Plus,
      action: () => {
        setLocation("/financial-goals");
        setTimeout(() => {
          const btn = document.querySelector('[data-testid="button-add-goal"]') as HTMLButtonElement;
          btn?.click();
        }, 300);
      },
      keywords: ["add", "new", "create", "goal"],
    },
    {
      id: "new-transaction",
      title: "Add Transaction",
      description: "Record income or expense",
      icon: CreditCard,
      action: () => {
        setLocation("/money-tracking");
        setTimeout(() => {
          const btn = document.querySelector('[data-testid="button-add-transaction"]') as HTMLButtonElement;
          btn?.click();
        }, 300);
      },
      keywords: ["add", "expense", "income", "payment"],
    },
    {
      id: "ask-ai",
      title: "Ask AI a Question",
      description: "Get financial advice instantly",
      icon: Sparkles,
      action: () => {
        setLocation("/ai-assistant");
        setTimeout(() => {
          const input = document.querySelector('[data-testid="input-message"]') as HTMLInputElement;
          input?.focus();
        }, 300);
      },
      keywords: ["question", "help", "advice"],
    },
  ];

  const toolsAndUtilities: CommandAction[] = [
    {
      id: "calculator",
      title: "Financial Calculator",
      description: "Calculate savings, interest, etc.",
      icon: Calculator,
      action: () => {
        setLocation("/ai-assistant");
        setTimeout(() => {
          const input = document.querySelector('[data-testid="input-message"]') as HTMLInputElement;
          if (input) {
            input.value = "Help me calculate ";
            input.focus();
          }
        }, 300);
      },
      keywords: ["math", "compute", "calculate"],
    },
    {
      id: "spending-analysis",
      title: "Analyze My Spending",
      description: "Get insights on your expenses",
      icon: TrendingUp,
      action: () => {
        setLocation("/ai-assistant");
        setTimeout(() => {
          const input = document.querySelector('[data-testid="input-message"]') as HTMLInputElement;
          if (input) {
            input.value = "Analyze my spending patterns and give me advice";
            input.focus();
          }
        }, 300);
      },
      keywords: ["analyze", "insights", "patterns"],
    },
    {
      id: "savings-tips",
      title: "Get Savings Tips",
      description: "AI-powered money saving advice",
      icon: PiggyBank,
      action: () => {
        setLocation("/ai-assistant");
        setTimeout(() => {
          const input = document.querySelector('[data-testid="input-message"]') as HTMLInputElement;
          if (input) {
            input.value = "What are some ways I can save more money?";
            input.focus();
          }
        }, 300);
      },
      keywords: ["tips", "advice", "save"],
    },
  ];

  const preferencesActions: CommandAction[] = [
    {
      id: "toggle-theme",
      title: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      description: "Toggle appearance",
      icon: theme === "dark" ? Sun : Moon,
      action: () => setTheme(theme === "dark" ? "light" : "dark"),
      keywords: ["theme", "dark", "light", "mode", "appearance"],
    },
    {
      id: "notifications",
      title: "Notification Settings",
      description: "Manage alerts and reminders",
      icon: Bell,
      action: () => setLocation("/settings"),
      keywords: ["alerts", "reminders", "notifications"],
    },
    {
      id: "profile",
      title: "Edit Profile",
      description: "Update your information",
      icon: User,
      action: () => setLocation("/financial-profile"),
      keywords: ["profile", "account", "information"],
    },
    {
      id: "logout",
      title: "Sign Out",
      description: "Log out of your account",
      icon: LogOut,
      action: () => logoutMutation.mutate(),
      keywords: ["logout", "sign out", "exit"],
    },
  ];

  const commandGroups: CommandGroup[] = [
    { heading: "Navigation", items: navigationItems },
    { heading: "Quick Actions", items: quickActions },
    { heading: "Tools & AI", items: toolsAndUtilities },
    { heading: "Preferences", items: preferencesActions },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border/50 rounded-lg hover:border-border hover:bg-accent/50 transition-all"
        data-testid="button-command-palette"
      >
        <Search className="w-4 h-4" />
        <span className="hidden lg:inline">Search...</span>
        <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-hidden p-0 shadow-2xl border-border/50 max-w-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              >
                <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                  <div className="flex items-center border-b px-4 py-3">
                    <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />
                    <CommandInput 
                      placeholder="Type a command or search..." 
                      className="flex h-10 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <CommandList className="max-h-[400px] overflow-y-auto p-2">
                    <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                      No results found. Try a different search term.
                    </CommandEmpty>

                    {commandGroups.map((group, groupIndex) => (
                      <div key={group.heading}>
                        <CommandGroup heading={group.heading}>
                          {group.items.map((item, itemIndex) => (
                            <CommandItem
                              key={item.id}
                              value={`${item.title} ${item.keywords?.join(" ") || ""}`}
                              onSelect={() => runCommand(item.action)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                            >
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ 
                                  duration: 0.2, 
                                  delay: groupIndex * 0.05 + itemIndex * 0.02 
                                }}
                                className="flex items-center gap-3 flex-1"
                              >
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/50">
                                  <item.icon className="h-4 w-4 text-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{item.title}</p>
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                {item.shortcut && (
                                  <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground">
                                    {item.shortcut}
                                  </kbd>
                                )}
                              </motion.div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        {groupIndex < commandGroups.length - 1 && (
                          <CommandSeparator className="my-2" />
                        )}
                      </div>
                    ))}
                  </CommandList>

                  <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <kbd className="rounded border px-1.5 py-0.5 bg-muted">↑↓</kbd>
                        Navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="rounded border px-1.5 py-0.5 bg-muted">↵</kbd>
                        Select
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="rounded border px-1.5 py-0.5 bg-muted">esc</kbd>
                        Close
                      </span>
                    </div>
                    <span className="hidden sm:inline">
                      {user?.firstName ? `Signed in as ${user.firstName}` : 'Twealth'}
                    </span>
                  </div>
                </Command>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}

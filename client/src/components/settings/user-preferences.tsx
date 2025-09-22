import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Palette, 
  Moon, 
  Sun, 
  Monitor, 
  Bell, 
  BellOff, 
  Languages, 
  Eye,
  Smartphone,
  Layout,
  Zap,
  Settings as SettingsIcon,
  CheckCircle,
  Loader2
} from "lucide-react";

interface UserPreferencesProps {
  // Add props as needed for user settings
}

type UserPreferences = {
  id: string;
  userId: string;
  theme: "light" | "dark" | "system";
  language: string;
  timeZone: string;
  dateFormat: string;
  currency: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  weeklyReports: boolean;
  goalReminders: boolean;
  expenseAlerts: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function UserPreferences({ }: UserPreferencesProps) {
  const { toast } = useToast();

  // Fetch user preferences
  const { data: preferences, isLoading } = useQuery<UserPreferences>({
    queryKey: ['/api/user-preferences'],
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (updates: Partial<UserPreferences>) =>
      apiRequest('PUT', '/api/user-preferences', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-preferences'] });
      toast({
        title: "Preferences updated",
        description: "Your preferences have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const themes = [
    { value: "light", label: "Light", icon: Sun, description: "Clean, bright interface" },
    { value: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes" },
    { value: "system", label: "System", icon: Monitor, description: "Follows device setting" }
  ];

  const languages = [
    { value: "en", label: "English", flag: "🇺🇸" },
    { value: "es", label: "Español", flag: "🇪🇸" },
    { value: "fr", label: "Français", flag: "🇫🇷" },
    { value: "de", label: "Deutsch", flag: "🇩🇪" },
    { value: "zh", label: "中文", flag: "🇨🇳" }
  ];

  const currencies = [
    { value: "USD", label: "US Dollar", symbol: "$" },
    { value: "EUR", label: "Euro", symbol: "€" },
    { value: "GBP", label: "British Pound", symbol: "£" },
    { value: "JPY", label: "Japanese Yen", symbol: "¥" },
    { value: "CAD", label: "Canadian Dollar", symbol: "C$" },
    { value: "AUD", label: "Australian Dollar", symbol: "A$" }
  ];

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    updatePreferencesMutation.mutate({ theme });
  };

  const handleNotificationToggle = (field: keyof UserPreferences) => {
    if (!preferences) return;
    updatePreferencesMutation.mutate({ 
      [field]: !preferences[field] 
    });
  };

  const handleLanguageChange = (language: string) => {
    updatePreferencesMutation.mutate({ language });
  };

  const handleCurrencyChange = (currency: string) => {
    updatePreferencesMutation.mutate({ currency });
  };

  const handleSaveAll = () => {
    // This will trigger a re-validation of all settings
    queryClient.invalidateQueries({ queryKey: ['/api/user-preferences'] });
    toast({
      title: "All preferences saved",
      description: "Your settings have been synchronized.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin mr-2" size={24} />
        Loading preferences...
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Failed to load preferences</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Theme & Appearance */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <Palette className="mr-2" size={20} />
            Theme & Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-6">
          {/* Theme Selection */}
          <div className="space-y-3">
            <h4 className="font-medium">Theme Mode</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  data-testid={`theme-${theme.value}`}
                  onClick={() => handleThemeChange(theme.value as "light" | "dark" | "system")}
                  disabled={updatePreferencesMutation.isPending}
                  className={`p-4 rounded-lg border transition-all ${
                    preferences.theme === theme.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  } ${updatePreferencesMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <theme.icon className={`${preferences.theme === theme.value ? 'text-primary' : 'text-muted-foreground'}`} size={24} />
                  </div>
                  <h4 className="font-medium">{theme.label}</h4>
                  <p className="text-xs text-muted-foreground">{theme.description}</p>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <Bell className="mr-2" size={20} />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="text-green-600 mr-3" size={20} />
                <div>
                  <p className="font-medium">Goal Progress</p>
                  <p className="text-sm text-muted-foreground">Notify when goals reach milestones</p>
                </div>
              </div>
              <Switch 
                data-testid="switch-goal-reminders"
                checked={preferences.goalReminders}
                onCheckedChange={() => handleNotificationToggle('goalReminders')}
                disabled={updatePreferencesMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <SettingsIcon className="text-blue-600 mr-3" size={20} />
                <div>
                  <p className="font-medium">Expense Alerts</p>
                  <p className="text-sm text-muted-foreground">Alert for large expenses and income</p>
                </div>
              </div>
              <Switch 
                data-testid="switch-expense-alerts"
                checked={preferences.expenseAlerts}
                onCheckedChange={() => handleNotificationToggle('expenseAlerts')}
                disabled={updatePreferencesMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <Smartphone className="text-purple-600 mr-3" size={20} />
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-muted-foreground">Weekly financial insights and tips</p>
                </div>
              </div>
              <Switch 
                data-testid="switch-weekly-reports"
                checked={preferences.weeklyReports}
                onCheckedChange={() => handleNotificationToggle('weeklyReports')}
                disabled={updatePreferencesMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <Bell className="text-orange-600 mr-3" size={20} />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
              </div>
              <Switch 
                data-testid="switch-email-notifications"
                checked={preferences.emailNotifications}
                onCheckedChange={() => handleNotificationToggle('emailNotifications')}
                disabled={updatePreferencesMutation.isPending}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <Languages className="mr-2" size={20} />
            Language & Region
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Language</label>
              <Select 
                value={preferences.language} 
                onValueChange={handleLanguageChange}
                disabled={updatePreferencesMutation.isPending}
              >
                <SelectTrigger data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <div className="flex items-center">
                        <span className="mr-2">{lang.flag}</span>
                        {lang.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Default Currency</label>
              <Select 
                value={preferences.currency} 
                onValueChange={handleCurrencyChange}
                disabled={updatePreferencesMutation.isPending}
              >
                <SelectTrigger data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{curr.label}</span>
                        <span className="text-muted-foreground ml-2">{curr.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Save Preferences</h4>
            <p className="text-sm text-muted-foreground">
              {updatePreferencesMutation.isPending ? 'Saving...' : 'Settings are saved automatically'}
            </p>
          </div>
          <Button 
            data-testid="button-save-preferences"
            onClick={handleSaveAll}
            disabled={updatePreferencesMutation.isPending}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          >
            {updatePreferencesMutation.isPending ? (
              <Loader2 className="mr-2 animate-spin" size={16} />
            ) : (
              <CheckCircle className="mr-2" size={16} />
            )}
            {updatePreferencesMutation.isPending ? 'Saving...' : 'Sync Settings'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
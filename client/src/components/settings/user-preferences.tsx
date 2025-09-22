import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  CheckCircle
} from "lucide-react";

interface UserPreferencesProps {
  // Add props as needed for user settings
}

export default function UserPreferences({ }: UserPreferencesProps) {
  const [themeMode, setThemeMode] = useState("system");
  const [notifications, setNotifications] = useState({
    goals: true,
    transactions: true,
    weekly: true,
    achievements: false
  });
  const [displayOptions, setDisplayOptions] = useState({
    compactView: false,
    animationsEnabled: true,
    autoRefresh: true,
    highContrast: false
  });
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("USD");

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

  const handleNotificationToggle = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleDisplayToggle = (key: string) => {
    setDisplayOptions(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

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
                  onClick={() => setThemeMode(theme.value)}
                  className={`p-4 rounded-lg border transition-all ${
                    themeMode === theme.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <theme.icon className={`${themeMode === theme.value ? 'text-primary' : 'text-muted-foreground'}`} size={24} />
                  </div>
                  <h4 className="font-medium">{theme.label}</h4>
                  <p className="text-xs text-muted-foreground">{theme.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Display Options</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center">
                  <Layout className="text-blue-600 mr-3" size={20} />
                  <div>
                    <p className="font-medium">Compact View</p>
                    <p className="text-sm text-muted-foreground">Show more content in less space</p>
                  </div>
                </div>
                <Switch 
                  checked={displayOptions.compactView}
                  onCheckedChange={() => handleDisplayToggle('compactView')}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center">
                  <Zap className="text-yellow-600 mr-3" size={20} />
                  <div>
                    <p className="font-medium">Animations</p>
                    <p className="text-sm text-muted-foreground">Enable smooth transitions and effects</p>
                  </div>
                </div>
                <Switch 
                  checked={displayOptions.animationsEnabled}
                  onCheckedChange={() => handleDisplayToggle('animationsEnabled')}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center">
                  <Eye className="text-green-600 mr-3" size={20} />
                  <div>
                    <p className="font-medium">High Contrast</p>
                    <p className="text-sm text-muted-foreground">Improve visibility and accessibility</p>
                  </div>
                </div>
                <Switch 
                  checked={displayOptions.highContrast}
                  onCheckedChange={() => handleDisplayToggle('highContrast')}
                />
              </div>
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
                checked={notifications.goals}
                onCheckedChange={() => handleNotificationToggle('goals')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <SettingsIcon className="text-blue-600 mr-3" size={20} />
                <div>
                  <p className="font-medium">Transaction Updates</p>
                  <p className="text-sm text-muted-foreground">Alert for large expenses and income</p>
                </div>
              </div>
              <Switch 
                checked={notifications.transactions}
                onCheckedChange={() => handleNotificationToggle('transactions')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <Smartphone className="text-purple-600 mr-3" size={20} />
                <div>
                  <p className="font-medium">Weekly Summary</p>
                  <p className="text-sm text-muted-foreground">Weekly financial insights and tips</p>
                </div>
              </div>
              <Switch 
                checked={notifications.weekly}
                onCheckedChange={() => handleNotificationToggle('weekly')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 mr-3">🏆</Badge>
                <div>
                  <p className="font-medium">Achievements</p>
                  <p className="text-sm text-muted-foreground">Celebrate financial milestones</p>
                </div>
              </div>
              <Switch 
                checked={notifications.achievements}
                onCheckedChange={() => handleNotificationToggle('achievements')}
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
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
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
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
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
            <p className="text-sm text-muted-foreground">Your settings will be saved automatically</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
            <CheckCircle className="mr-2" size={16} />
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}
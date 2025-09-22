import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock,
  AlertTriangle,
  FileText,
  Database,
  Clock,
  CheckCircle,
  Loader2
} from "lucide-react";

interface DataPrivacyProps {
  // Add props as needed
}

type PrivacySettings = {
  id: string;
  userId: string;
  dataRetentionPeriod: number;
  allowAnalytics: boolean;
  allowCookies: boolean;
  shareDataWithPartners: boolean;
  profileVisibility: "public" | "private" | "friends";
  allowDataExport: boolean;
  twoFactorEnabled: boolean;
  lastPasswordChange: string | null;
  lastDataExport: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function DataPrivacy({ }: DataPrivacyProps) {
  const { toast } = useToast();

  // Fetch privacy settings
  const { data: settings, isLoading } = useQuery<PrivacySettings>({
    queryKey: ['/api/privacy-settings'],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (updates: Partial<PrivacySettings>) =>
      apiRequest('PUT', '/api/privacy-settings', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/privacy-settings'] });
      toast({
        title: "Privacy settings updated",
        description: "Your privacy preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update privacy settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Data export mutation
  const exportDataMutation = useMutation({
    mutationFn: (format: 'json' | 'csv') =>
      apiRequest('GET', `/api/export-data?format=${format}`),
    onSuccess: async (response, format) => {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `twealth-data-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Data exported successfully",
        description: `Your data has been downloaded as ${format.toUpperCase()} file.`,
      });
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Data deletion mutation
  const deleteDataMutation = useMutation({
    mutationFn: () =>
      apiRequest('DELETE', '/api/delete-user-data', { confirmation: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account and all associated data have been permanently deleted.",
        variant: "destructive",
      });
      // In a real app, would redirect to login or home page
    },
    onError: () => {
      toast({
        title: "Deletion failed",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    },
  });

  const retentionPeriods = [
    { value: 30, label: "30 days" },
    { value: 90, label: "90 days" },
    { value: 180, label: "6 months" },
    { value: 365, label: "1 year" },
    { value: 730, label: "2 years" },
  ];

  const visibilityOptions = [
    { value: "private", label: "Private", description: "Only you can see your profile" },
    { value: "friends", label: "Friends", description: "Only friends can see your profile" },
    { value: "public", label: "Public", description: "Anyone can see your profile" },
  ];

  const handlePrivacyToggle = (field: keyof PrivacySettings) => {
    if (!settings) return;
    updateSettingsMutation.mutate({ 
      [field]: !settings[field] 
    });
  };

  const handleRetentionPeriodChange = (period: number) => {
    updateSettingsMutation.mutate({ dataRetentionPeriod: period });
  };

  const handleVisibilityChange = (visibility: "public" | "private" | "friends") => {
    updateSettingsMutation.mutate({ profileVisibility: visibility });
  };

  const handleDataExport = (format: 'json' | 'csv') => {
    exportDataMutation.mutate(format);
  };

  const handleDataDeletion = () => {
    const confirmation = window.confirm(
      "⚠️ DANGER ZONE ⚠️\n\nThis action will PERMANENTLY DELETE your entire account and all associated data including:\n\n• All financial goals and transactions\n• All events and time tracking data\n• All groups and memberships\n• All user preferences and settings\n• All notification history\n\nThis action CANNOT be undone!\n\nType 'DELETE' in the next prompt to confirm permanent account deletion."
    );
    
    if (confirmation) {
      const finalConfirmation = window.prompt(
        "FINAL WARNING: Type exactly 'DELETE' (without quotes) to permanently delete your account:"
      );
      
      if (finalConfirmation === 'DELETE') {
        deleteDataMutation.mutate();
      } else {
        toast({
          title: "Deletion cancelled",
          description: "Account deletion was cancelled. Your data is safe.",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin mr-2" size={24} />
        Loading privacy settings...
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Failed to load privacy settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Controls */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <Shield className="mr-2" size={20} />
            Privacy Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <Eye className="text-blue-600 mr-3" size={20} />
                <div>
                  <p className="font-medium">Allow Analytics</p>
                  <p className="text-sm text-muted-foreground">Help improve the app with usage analytics</p>
                </div>
              </div>
              <Switch 
                data-testid="switch-allow-analytics"
                checked={settings.allowAnalytics}
                onCheckedChange={() => handlePrivacyToggle('allowAnalytics')}
                disabled={updateSettingsMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <Database className="text-green-600 mr-3" size={20} />
                <div>
                  <p className="font-medium">Allow Cookies</p>
                  <p className="text-sm text-muted-foreground">Store preferences and session data</p>
                </div>
              </div>
              <Switch 
                data-testid="switch-allow-cookies"
                checked={settings.allowCookies}
                onCheckedChange={() => handlePrivacyToggle('allowCookies')}
                disabled={updateSettingsMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="text-orange-600 mr-3" size={20} />
                <div>
                  <p className="font-medium">Share Data with Partners</p>
                  <p className="text-sm text-muted-foreground">Share anonymized data for insights</p>
                </div>
              </div>
              <Switch 
                data-testid="switch-share-data"
                checked={settings.shareDataWithPartners}
                onCheckedChange={() => handlePrivacyToggle('shareDataWithPartners')}
                disabled={updateSettingsMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Profile Visibility</h4>
            <Select 
              value={settings.profileVisibility} 
              onValueChange={handleVisibilityChange}
              disabled={updateSettingsMutation.isPending}
            >
              <SelectTrigger data-testid="select-profile-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Data Retention Period</h4>
            <Select 
              value={settings.dataRetentionPeriod.toString()} 
              onValueChange={(value) => handleRetentionPeriodChange(parseInt(value))}
              disabled={updateSettingsMutation.isPending}
            >
              <SelectTrigger data-testid="select-retention-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {retentionPeriods.map((period) => (
                  <SelectItem key={period.value} value={period.value.toString()}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Automatically delete inactive data after this period
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <Download className="mr-2" size={20} />
            Data Export
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Export Format</h4>
              <div className="space-y-2">
                <Button
                  data-testid="button-export-json"
                  onClick={() => handleDataExport('json')}
                  disabled={exportDataMutation.isPending}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <FileText className="mr-2" size={16} />
                  {exportDataMutation.isPending ? 'Exporting...' : 'Download JSON'}
                </Button>
                <Button
                  data-testid="button-export-csv"
                  onClick={() => handleDataExport('csv')}
                  disabled={exportDataMutation.isPending}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <FileText className="mr-2" size={16} />
                  {exportDataMutation.isPending ? 'Exporting...' : 'Download CSV'}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Export Information</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• All financial goals and transactions</p>
                <p>• All events and time tracking data</p>
                <p>• All groups and memberships</p>
                <p>• User preferences and settings</p>
              </div>
              {settings.lastDataExport && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-1" size={14} />
                  Last export: {new Date(settings.lastDataExport).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Status */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <Lock className="mr-2" size={20} />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="text-green-600 mr-3" size={20} />
                  <div>
                    <p className="font-medium">Account Active</p>
                    <p className="text-sm text-green-600">All systems secure</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center">
                  <Lock className="text-blue-600 mr-3" size={20} />
                  <div>
                    <p className="font-medium">Two-Factor Auth</p>
                    <p className="text-sm text-muted-foreground">
                      {settings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                <Switch 
                  data-testid="switch-two-factor"
                  checked={settings.twoFactorEnabled}
                  onCheckedChange={() => handlePrivacyToggle('twoFactorEnabled')}
                  disabled={updateSettingsMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Security Timeline</h4>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account created:</span>
                  <span>{new Date(settings.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Settings updated:</span>
                  <span>{new Date(settings.updatedAt).toLocaleDateString()}</span>
                </div>
                {settings.lastPasswordChange && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Password changed:</span>
                    <span>{new Date(settings.lastPasswordChange).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200 dark:border-red-800">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center text-red-600">
            <Trash2 className="mr-2" size={20} />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start">
              <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="font-medium text-red-800 dark:text-red-200">Delete Account</h4>
                <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button
                  data-testid="button-delete-account"
                  onClick={handleDataDeletion}
                  disabled={deleteDataMutation.isPending}
                  variant="destructive"
                  size="sm"
                >
                  {deleteDataMutation.isPending ? (
                    <Loader2 className="mr-2 animate-spin" size={16} />
                  ) : (
                    <Trash2 className="mr-2" size={16} />
                  )}
                  {deleteDataMutation.isPending ? 'Deleting...' : 'Delete Account'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
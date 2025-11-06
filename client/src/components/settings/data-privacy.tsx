import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { SkeletonCard } from "@/components/ui/skeleton";

interface DataPrivacyProps {}

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

  const { data: settings, isLoading } = useQuery<PrivacySettings>({
    queryKey: ['/api/privacy-settings'],
  });

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

  const deleteDataMutation = useMutation({
    mutationFn: () =>
      apiRequest('DELETE', '/api/delete-user-data', { confirmation: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account and all associated data have been permanently deleted.",
        variant: "destructive",
      });
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
    { value: "private", label: "Private", description: "Only you can see your profile", icon: Lock },
    { value: "friends", label: "Friends", description: "Only friends can see your profile", icon: Eye },
    { value: "public", label: "Public", description: "Anyone can see your profile", icon: EyeOff },
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
      <div className="space-y-4 sm:space-y-6">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center p-8 sm:p-12">
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">Failed to load privacy settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Privacy Controls */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            Privacy Controls
          </CardTitle>
          <CardDescription className="text-sm sm:text-base mt-1">
            Manage your data sharing and privacy preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between min-h-[60px] p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3 mb-3 sm:mb-0">
              <Eye className="text-blue-600 w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm sm:text-base text-slate-900 dark:text-white">Allow Analytics</p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Help improve the app with usage analytics</p>
              </div>
            </div>
            <Switch 
              data-testid="switch-allow-analytics"
              checked={settings.allowAnalytics}
              onCheckedChange={() => handlePrivacyToggle('allowAnalytics')}
              disabled={updateSettingsMutation.isPending}
              className="scale-110"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between min-h-[60px] p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3 mb-3 sm:mb-0">
              <Database className="text-green-600 w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm sm:text-base text-slate-900 dark:text-white">Allow Cookies</p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Store preferences and session data</p>
              </div>
            </div>
            <Switch 
              data-testid="switch-allow-cookies"
              checked={settings.allowCookies}
              onCheckedChange={() => handlePrivacyToggle('allowCookies')}
              disabled={updateSettingsMutation.isPending}
              className="scale-110"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between min-h-[60px] p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3 mb-3 sm:mb-0">
              <AlertTriangle className="text-orange-600 w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm sm:text-base text-slate-900 dark:text-white">Share Data with Partners</p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Share anonymized data for insights</p>
              </div>
            </div>
            <Switch 
              data-testid="switch-share-data"
              checked={settings.shareDataWithPartners}
              onCheckedChange={() => handlePrivacyToggle('shareDataWithPartners')}
              disabled={updateSettingsMutation.isPending}
              className="scale-110"
            />
          </div>

          <div className="space-y-3 sm:space-y-4 pt-4">
            <h4 className="font-medium text-sm sm:text-base text-slate-700 dark:text-slate-300">Profile Visibility</h4>
            <Select 
              value={settings.profileVisibility} 
              onValueChange={handleVisibilityChange}
              disabled={updateSettingsMutation.isPending}
            >
              <SelectTrigger className="h-12 sm:h-14 text-base bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700" data-testid="select-profile-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2 py-1">
                      <option.icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <div>
                        <div className="font-medium text-sm sm:text-base">{option.label}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 sm:space-y-4 pt-4">
            <h4 className="font-medium text-sm sm:text-base text-slate-700 dark:text-slate-300">Data Retention Period</h4>
            <Select 
              value={settings.dataRetentionPeriod.toString()} 
              onValueChange={(value) => handleRetentionPeriodChange(parseInt(value))}
              disabled={updateSettingsMutation.isPending}
            >
              <SelectTrigger className="h-12 sm:h-14 text-base bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700" data-testid="select-retention-period">
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
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Automatically delete inactive data after this period
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Download className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            Data Export
          </CardTitle>
          <CardDescription className="text-sm sm:text-base mt-1">
            Download a copy of your personal data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Button
              data-testid="button-export-json"
              onClick={() => handleDataExport('json')}
              disabled={exportDataMutation.isPending}
              variant="outline"
              className="h-12 sm:h-14 text-base font-medium border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            >
              <FileText className="mr-2 w-5 h-5" />
              {exportDataMutation.isPending ? 'Exporting...' : 'Download JSON'}
            </Button>
            
            <Button
              data-testid="button-export-csv"
              onClick={() => handleDataExport('csv')}
              disabled={exportDataMutation.isPending}
              variant="outline"
              className="h-12 sm:h-14 text-base font-medium border-slate-300 dark:border-slate-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30"
            >
              <Database className="mr-2 w-5 h-5" />
              {exportDataMutation.isPending ? 'Exporting...' : 'Download CSV'}
            </Button>
          </div>
          
          {settings.lastDataExport && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Last export: {new Date(settings.lastDataExport).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-2 border-red-200 dark:border-red-900/50 shadow-sm bg-white dark:bg-gray-900 dark:from-red-950/20 dark:to-orange-950/20">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-red-700 dark:text-red-400">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-sm sm:text-base mt-1">
            Irreversible actions that permanently delete your data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-800 rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-base sm:text-lg text-red-900 dark:text-red-200 mb-2">Delete Account</h4>
                <p className="text-xs sm:text-sm text-red-800 dark:text-red-300 mb-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <p className="text-xs text-red-700 dark:text-red-400">
                  All goals, transactions, events, and preferences will be permanently removed.
                </p>
              </div>
              <Button
                data-testid="button-delete-account"
                onClick={handleDataDeletion}
                disabled={deleteDataMutation.isPending}
                variant="destructive"
                className="w-full sm:w-auto h-12 sm:h-14 text-base font-semibold bg-red-600 hover:bg-red-700 shadow-lg"
              >
                <Trash2 className="mr-2 w-5 h-5" />
                {deleteDataMutation.isPending ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

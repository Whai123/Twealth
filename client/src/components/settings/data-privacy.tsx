import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock,
  Database,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Cloud,
  HardDrive,
  Archive
} from "lucide-react";

export default function DataPrivacy() {
  const [privacySettings, setPrivacySettings] = useState({
    shareAnalytics: false,
    dataBackup: true,
    autoExport: false,
    anonymizeData: true
  });

  const [dataStats] = useState({
    transactions: 1247,
    goals: 9,
    events: 156,
    totalSize: "2.4 MB",
    lastBackup: "2024-09-20"
  });

  const handlePrivacyToggle = (key: string) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleExportData = (format: string) => {
    // In a real app, this would trigger data export
    console.log(`Exporting data in ${format} format`);
  };

  const handleDeleteData = (dataType: string) => {
    // In a real app, this would trigger data deletion with confirmation
    console.log(`Deleting ${dataType} data`);
  };

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
                  <p className="font-medium">Share Analytics</p>
                  <p className="text-sm text-muted-foreground">Help improve the app with anonymous usage data</p>
                </div>
              </div>
              <Switch 
                checked={privacySettings.shareAnalytics}
                onCheckedChange={() => handlePrivacyToggle('shareAnalytics')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <Lock className="text-green-600 mr-3" size={20} />
                <div>
                  <p className="font-medium">Anonymize Data</p>
                  <p className="text-sm text-muted-foreground">Remove personal identifiers from analytics</p>
                </div>
              </div>
              <Switch 
                checked={privacySettings.anonymizeData}
                onCheckedChange={() => handlePrivacyToggle('anonymizeData')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <Cloud className="text-purple-600 mr-3" size={20} />
                <div>
                  <p className="font-medium">Auto Backup</p>
                  <p className="text-sm text-muted-foreground">Automatically backup your data weekly</p>
                </div>
              </div>
              <Switch 
                checked={privacySettings.dataBackup}
                onCheckedChange={() => handlePrivacyToggle('dataBackup')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <Archive className="text-orange-600 mr-3" size={20} />
                <div>
                  <p className="font-medium">Auto Export</p>
                  <p className="text-sm text-muted-foreground">Monthly data exports for your records</p>
                </div>
              </div>
              <Switch 
                checked={privacySettings.autoExport}
                onCheckedChange={() => handlePrivacyToggle('autoExport')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Overview */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <Database className="mr-2" size={20} />
            Your Data Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center">
                  <FileText className="text-blue-600 mr-3" size={20} />
                  <div>
                    <p className="font-medium">Transactions</p>
                    <p className="text-sm text-muted-foreground">{dataStats.transactions} records</p>
                  </div>
                </div>
                <Badge variant="secondary">{dataStats.totalSize}</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="text-green-600 mr-3" size={20} />
                  <div>
                    <p className="font-medium">Events</p>
                    <p className="text-sm text-muted-foreground">{dataStats.events} calendar entries</p>
                  </div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center">
                  <HardDrive className="text-purple-600 mr-3" size={20} />
                  <div>
                    <p className="font-medium">Goals</p>
                    <p className="text-sm text-muted-foreground">{dataStats.goals} financial goals</p>
                  </div>
                </div>
                <Badge variant="secondary">Tracked</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">{dataStats.totalSize}</div>
                <p className="text-sm text-muted-foreground">Total Data Size</p>
              </div>
              
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-lg font-semibold mb-1">{dataStats.lastBackup}</div>
                <p className="text-sm text-muted-foreground">Last Backup</p>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 mt-2">
                  <CheckCircle className="mr-1" size={12} />
                  Recent
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <Download className="mr-2" size={20} />
            Export Your Data
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <p className="text-sm text-muted-foreground">
            Download your data in various formats for backup or migration purposes.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleExportData('csv')}
              className="flex items-center justify-center"
            >
              <FileText className="mr-2" size={16} />
              CSV Export
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handleExportData('json')}
              className="flex items-center justify-center"
            >
              <Database className="mr-2" size={16} />
              JSON Export
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handleExportData('pdf')}
              className="flex items-center justify-center"
            >
              <FileText className="mr-2" size={16} />
              PDF Report
            </Button>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="text-blue-600 mt-0.5 mr-2" size={16} />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200">Export includes:</p>
                <p className="text-blue-700 dark:text-blue-300">
                  All transactions, financial goals, calendar events, and settings
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Deletion */}
      <Card className="p-6 border-destructive/20">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center text-destructive">
            <Trash2 className="mr-2" size={20} />
            Data Deletion
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <div className="p-3 bg-destructive/10 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="text-destructive mt-0.5 mr-2" size={16} />
              <div className="text-sm">
                <p className="font-medium text-destructive">Warning: Data deletion is permanent</p>
                <p className="text-muted-foreground">
                  Once deleted, your data cannot be recovered. Please export your data first.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              variant="outline" 
              onClick={() => handleDeleteData('transactions')}
              className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-2" size={16} />
              Delete All Transactions
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handleDeleteData('goals')}
              className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-2" size={16} />
              Delete All Goals
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handleDeleteData('all')}
              className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-2" size={16} />
              Delete All Data
            </Button>
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
        <CardContent className="px-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Data Encryption</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20">
                <Lock className="mr-1" size={12} />
                Active
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Secure Backup</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20">
                <Shield className="mr-1" size={12} />
                Enabled
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Privacy Compliance</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20">
                <CheckCircle className="mr-1" size={12} />
                GDPR Ready
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
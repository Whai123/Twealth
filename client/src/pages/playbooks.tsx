import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Calendar,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";

interface PlaybookInsight {
  text: string;
  tag: string;
  severity: "high" | "medium" | "low";
}

interface PlaybookAction {
  title: string;
  description: string;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  deepLink: string;
}

interface Playbook {
  id: string;
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  financialHealthScore: number;
  scoreDelta: number;
  confidenceBand: "improving" | "stable" | "declining";
  insights: PlaybookInsight[];
  insightsCount: number;
  actions: PlaybookAction[];
  actionsCount: number;
  roiSavings: string;
  cumulativeRoi: string;
  forecastLift: string | null;
  tier: string;
  generatedBy: string;
  isViewed: boolean;
  actionsCompleted: number;
  completedActionIndices: number[]; // Track which specific actions are completed
  createdAt: string;
}

export default function Playbooks() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);

  // Fetch playbooks
  const { data: playbooks = [], isLoading, refetch } = useQuery<Playbook[]>({
    queryKey: ["/api/playbooks"],
  });

  // Generate playbook mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/playbooks/generate", {});
      return await response.json();
    },
    onSuccess: (newPlaybook) => {
      queryClient.invalidateQueries({ queryKey: ["/api/playbooks"] });
      setSelectedPlaybook(newPlaybook);
      toast({
        title: "Playbook Generated",
        description: "Your weekly financial playbook is ready!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate playbook",
        variant: "destructive",
      });
    },
  });

  // Complete action mutation
  const completeActionMutation = useMutation({
    mutationFn: async ({ playbookId, actionIndex, estimatedSavings }: { playbookId: string; actionIndex: number; estimatedSavings: number }) => {
      const response = await apiRequest("POST", `/api/playbooks/${playbookId}/complete-action`, {
        actionIndex,
        estimatedSavings,
      });
      if (response.status === 409) {
        const data = await response.json();
        throw new Error(data.message || "Action already completed");
      }
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to complete action");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playbooks"] });
      refetch();
      toast({
        title: "Action Completed",
        description: "Great job! Your ROI has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Already Completed",
        description: error.message || "This action was already marked as done.",
        variant: "default",
      });
    },
  });

  // Helper to check if action is completed
  const isActionCompleted = (playbook: Playbook, actionIndex: number): boolean => {
    const indices = Array.isArray(playbook.completedActionIndices) 
      ? playbook.completedActionIndices 
      : [];
    return indices.includes(actionIndex);
  };

  const latestPlaybook = playbooks[0] || selectedPlaybook;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20";
      case "medium": return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20";
      case "low": return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20";
      default: return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/20";
    }
  };

  const getEffortBadge = (effort: string) => {
    const colors = {
      low: "bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400",
      medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400",
      high: "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400",
    };
    return colors[effort as keyof typeof colors] || colors.medium;
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-700 dark:bg-gray-950/20 dark:text-gray-400",
      medium: "bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400",
      high: "bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400",
    };
    return colors[impact as keyof typeof colors] || colors.medium;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
            <div className="h-8 bg-muted/50 rounded w-48 mb-2" />
            <div className="h-4 bg-muted/50 rounded w-64" />
          </div>
        </header>
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
          <Skeleton className="h-48 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!latestPlaybook && !generateMutation.isPending) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              AI Playbooks
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Weekly AI-generated financial insights and recommendations
            </p>
          </div>
        </header>
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Brain className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">No Playbooks Yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Generate your first AI-powered weekly financial playbook to get personalized insights and actionable recommendations.
              </p>
              <Button 
                onClick={() => generateMutation.mutate()} 
                size="lg"
                className="mt-4"
                data-testid="button-generate-playbook"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate My First Playbook
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (generateMutation.isPending) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              AI Playbooks
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Weekly AI-generated financial insights and recommendations
            </p>
          </div>
        </header>
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <h3 className="text-xl font-semibold">Generating Your Playbook</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Our AI is analyzing your financial data and creating personalized insights...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Clean Professional Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                AI Playbooks
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Weekly AI-generated financial insights and recommendations
              </p>
            </div>
            <Button 
              onClick={() => generateMutation.mutate()} 
              disabled={generateMutation.isPending}
              data-testid="button-generate-new-playbook"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generate New</>
              )}
            </Button>
          </div>
        </div>
      </header>
      
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8 space-y-6">

      {/* Hero Card - Financial Health Score */}
      <Card className="border-2 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Financial Health Score</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                Week of {new Date(latestPlaybook.weekStartDate).toLocaleDateString()} - {new Date(latestPlaybook.weekEndDate).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant={latestPlaybook.confidenceBand === "improving" ? "default" : latestPlaybook.confidenceBand === "declining" ? "destructive" : "secondary"} className="text-sm">
              {latestPlaybook.scoreDelta > 0 && <ArrowUp className="w-4 h-4 mr-1" />}
              {latestPlaybook.scoreDelta < 0 && <ArrowDown className="w-4 h-4 mr-1" />}
              {latestPlaybook.scoreDelta === 0 && <Minus className="w-4 h-4 mr-1" />}
              {latestPlaybook.confidenceBand}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Score Display */}
            <div className="md:col-span-1 flex flex-col items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                  <circle 
                    cx="64" 
                    cy="64" 
                    r="56" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="none" 
                    strokeLinecap="round"
                    className={latestPlaybook.financialHealthScore >= 70 ? "text-green-500" : latestPlaybook.financialHealthScore >= 40 ? "text-yellow-500" : "text-red-500"}
                    style={{ 
                      strokeDasharray: `${2 * Math.PI * 56}`,
                      strokeDashoffset: `${2 * Math.PI * 56 * (1 - latestPlaybook.financialHealthScore / 100)}`
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">{latestPlaybook.financialHealthScore}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {latestPlaybook.scoreDelta !== 0 && (
                  <span className={latestPlaybook.scoreDelta > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                    {latestPlaybook.scoreDelta > 0 ? "+" : ""}{latestPlaybook.scoreDelta} from last week
                  </span>
                )}
                {latestPlaybook.scoreDelta === 0 && "No change from last week"}
              </p>
            </div>

            {/* ROI & Stats */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <DollarSign className="w-4 h-4" />
                    This Week's Savings
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(parseFloat(latestPlaybook.roiSavings))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Total ROI
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(parseFloat(latestPlaybook.cumulativeRoi))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Actions Completed
                  </div>
                  <div className="text-2xl font-bold">
                    {latestPlaybook.actionsCompleted || 0} / {latestPlaybook.actionsCount}
                  </div>
                  <Progress value={((latestPlaybook.actionsCompleted || 0) / latestPlaybook.actionsCount) * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Target className="w-4 h-4" />
                    Insights Count
                  </div>
                  <div className="text-2xl font-bold">
                    {latestPlaybook.insightsCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{latestPlaybook.tier} tier</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {latestPlaybook.forecastLift && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                Forecast: {latestPlaybook.forecastLift}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="w-6 h-6" />
          AI Insights
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {latestPlaybook.insights.map((insight, idx) => (
            <Card key={idx} className={getSeverityColor(insight.severity)}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {insight.tag}
                  </Badge>
                  {insight.severity === "high" && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </div>
                <p className="text-sm font-medium">{insight.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Queue */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Target className="w-6 h-6" />
          Priority Actions
        </h2>
        <div className="grid gap-4">
          {latestPlaybook.actions.map((action, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{action.title}</h3>
                      <Badge className={getEffortBadge(action.effort)}>
                        {action.effort} effort
                      </Badge>
                      <Badge className={getImpactBadge(action.impact)}>
                        {action.impact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = action.deepLink}
                      data-testid={`button-action-${idx}`}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Take Action
                    </Button>
                    <Button 
                      variant={isActionCompleted(latestPlaybook, idx) ? "secondary" : "default"} 
                      size="sm"
                      onClick={() => completeActionMutation.mutate({ 
                        playbookId: latestPlaybook.id, 
                        actionIndex: idx,
                        estimatedSavings: action.impact === "high" ? 100 : action.impact === "medium" ? 50 : 25
                      })}
                      disabled={completeActionMutation.isPending || isActionCompleted(latestPlaybook, idx)}
                      data-testid={`button-complete-${idx}`}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {isActionCompleted(latestPlaybook, idx) ? "Completed" : "Mark Done"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Historical Playbooks */}
      {playbooks.length > 1 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Previous Playbooks</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playbooks.slice(1, 4).map((playbook) => (
              <Card key={playbook.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPlaybook(playbook)}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {new Date(playbook.weekStartDate).toLocaleDateString()} - {new Date(playbook.weekEndDate).toLocaleDateString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">{playbook.financialHealthScore}</div>
                      <div className="text-xs text-muted-foreground">Health Score</div>
                    </div>
                    <Badge variant={playbook.confidenceBand === "improving" ? "default" : playbook.confidenceBand === "declining" ? "destructive" : "secondary"}>
                      {playbook.confidenceBand}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

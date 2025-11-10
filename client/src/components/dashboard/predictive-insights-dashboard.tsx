import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Calendar,
  ArrowRight,
  Brain,
  Lightbulb
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface SpendingForecast {
  category: string;
  historicalAverage: number;
  predictedAmount: number;
  confidence: 'high' | 'medium' | 'low';
  trend: 'increasing' | 'stable' | 'decreasing';
  percentChange: number;
}

interface GoalPrediction {
  goalId: string;
  goalTitle: string;
  currentProgress: number;
  predictedCompletionDate: string;
  onTrack: boolean;
  probability: number;
  requiredMonthlyContribution: number;
  recommendedAction: string;
}

interface CashFlowForecast {
  date: string;
  projectedBalance: number;
  projectedIncome: number;
  projectedExpenses: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface Anomaly {
  type: 'spending_spike' | 'income_drop' | 'unusual_pattern' | 'goal_at_risk';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  affectedCategory?: string;
  suggestedAction: string;
  detectedAt: string;
}

interface SavingsOpportunity {
  category: string;
  potentialSavings: number;
  confidence: number;
  timeframe: 'weekly' | 'monthly';
  suggestion: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function PredictiveInsightsDashboard() {
  const { data: spendingForecast = [], isLoading: loadingForecast } = useQuery<SpendingForecast[]>({
    queryKey: ["/api/predictive/spending-forecast?days=30"],
  });

  const { data: goalPredictions = [], isLoading: loadingGoals } = useQuery<GoalPrediction[]>({
    queryKey: ["/api/predictive/goal-predictions"],
  });

  const { data: cashFlowForecast = [], isLoading: loadingCashFlow } = useQuery<CashFlowForecast[]>({
    queryKey: ["/api/predictive/cash-flow-forecast"],
  });

  const { data: anomalies = [], isLoading: loadingAnomalies } = useQuery<Anomaly[]>({
    queryKey: ["/api/predictive/anomalies"],
  });

  const { data: savingsOpportunities = [], isLoading: loadingOpportunities } = useQuery<SavingsOpportunity[]>({
    queryKey: ["/api/predictive/savings-opportunities"],
  });

  const getTrendIcon = (trend: 'increasing' | 'stable' | 'decreasing') => {
    if (trend === 'increasing') return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (trend === 'decreasing') return <TrendingDown className="h-4 w-4 text-green-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    };
    return <Badge variant={variants[confidence]}>{confidence} confidence</Badge>;
  };

  const getSeverityColor = (severity: 'critical' | 'warning' | 'info') => {
    if (severity === 'critical') return 'text-red-600';
    if (severity === 'warning') return 'text-yellow-600';
    return 'text-blue-600';
  };

  if (loadingForecast && loadingGoals && loadingCashFlow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Predictive Insights
          </CardTitle>
          <CardDescription>AI-powered forecasts and predictions loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Brain className="h-6 w-6" />
            Predictive Insights
          </CardTitle>
          <CardDescription>AI-powered forecasts, predictions, and early warnings</CardDescription>
        </CardHeader>
      </Card>

      {/* Anomalies & Alerts */}
      {anomalies.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Early Warnings ({anomalies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.map((anomaly, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-background rounded-lg border"
                  data-testid={`anomaly-${idx}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className={`font-semibold ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.title}
                    </h4>
                    <Badge variant={anomaly.severity === 'critical' ? 'destructive' : 'outline'}>
                      {anomaly.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{anomaly.description}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <span className="font-medium">Action:</span>
                    <span className="text-muted-foreground">{anomaly.suggestedAction}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="spending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="spending">Spending Forecast</TabsTrigger>
          <TabsTrigger value="goals">Goal Predictions</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
        </TabsList>

        {/* Spending Forecast */}
        <TabsContent value="spending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Next 30 Days Spending Forecast</CardTitle>
              <CardDescription>Predicted spending by category</CardDescription>
            </CardHeader>
            <CardContent>
              {spendingForecast.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Not enough data to generate forecast. Add more transactions to see predictions.
                </p>
              ) : (
                <div className="space-y-4">
                  {spendingForecast.slice(0, 5).map((forecast, idx) => (
                    <div key={idx} className="p-4 border rounded-lg" data-testid={`forecast-${idx}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="font-semibold text-lg capitalize">{forecast.category}</div>
                          {getTrendIcon(forecast.trend)}
                        </div>
                        {getConfidenceBadge(forecast.confidence)}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Historical Avg</div>
                          <div className="font-semibold">${forecast.historicalAverage?.toFixed(0) ?? '0'}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Predicted</div>
                          <div className="font-semibold text-primary">${forecast.predictedAmount?.toFixed(0) ?? '0'}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Change</div>
                          <div className={`font-semibold ${(forecast.percentChange ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {(forecast.percentChange ?? 0) > 0 ? '+' : ''}{forecast.percentChange?.toFixed(1) ?? '0.0'}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goal Predictions */}
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Goal Achievement Predictions</CardTitle>
              <CardDescription>AI-predicted goal completion probability</CardDescription>
            </CardHeader>
            <CardContent>
              {goalPredictions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No active goals. Create a goal to see predictions.
                </p>
              ) : (
                <div className="space-y-4">
                  {goalPredictions.map((prediction, idx) => (
                    <div key={idx} className="p-4 border rounded-lg" data-testid={`goal-prediction-${idx}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{prediction.goalTitle}</h4>
                          <div className="text-sm text-muted-foreground mt-1">
                            Predicted completion: {new Date(prediction.predictedCompletionDate).toLocaleDateString()}
                          </div>
                        </div>
                        {prediction.onTrack ? (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            On Track
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            At Risk
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Success Probability</span>
                            <span className="font-semibold">{prediction.probability}%</span>
                          </div>
                          <Progress value={prediction.probability} className="h-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Current Progress</div>
                            <div className="font-semibold">{prediction.currentProgress?.toFixed(0) ?? '0'}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Monthly Required</div>
                            <div className="font-semibold">${prediction.requiredMonthlyContribution?.toFixed(0) ?? '0'}</div>
                          </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-sm">
                          <div className="font-medium mb-1">Recommendation:</div>
                          <div className="text-muted-foreground">{prediction.recommendedAction}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Forecast */}
        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">90-Day Cash Flow Forecast</CardTitle>
              <CardDescription>Projected balance over time</CardDescription>
            </CardHeader>
            <CardContent>
              {cashFlowForecast.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Not enough data to generate cash flow forecast.
                </p>
              ) : (
                <div className="space-y-3">
                  {cashFlowForecast.map((forecast, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-semibold">{new Date(forecast.date).toLocaleDateString()}</div>
                          <div className="text-sm text-muted-foreground">
                            ${(forecast.projectedBalance ?? 0).toLocaleString()} balance
                          </div>
                        </div>
                      </div>
                      <Badge variant={
                        forecast.riskLevel === 'low' ? 'default' : 
                        forecast.riskLevel === 'medium' ? 'secondary' : 
                        'destructive'
                      }>
                        {forecast.riskLevel} risk
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Savings Opportunities */}
        <TabsContent value="savings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Savings Opportunities</CardTitle>
              <CardDescription>AI-identified ways to save money</CardDescription>
            </CardHeader>
            <CardContent>
              {savingsOpportunities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No savings opportunities identified yet. Keep tracking expenses.
                </p>
              ) : (
                <div className="space-y-4">
                  {savingsOpportunities.map((opportunity, idx) => (
                    <div key={idx} className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold capitalize">{opportunity.category}</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            ${opportunity.potentialSavings}
                          </div>
                          <div className="text-xs text-muted-foreground">per {opportunity.timeframe}</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{opportunity.suggestion}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <Badge variant="outline">
                          {opportunity.difficulty} to implement
                        </Badge>
                        <Badge variant="outline">
                          {((opportunity.confidence ?? 0) * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

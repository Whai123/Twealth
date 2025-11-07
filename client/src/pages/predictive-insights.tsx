import PredictiveInsightsDashboard from "@/components/dashboard/predictive-insights-dashboard";

export default function PredictiveInsightsPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Predictive Insights</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered forecasts and financial predictions
        </p>
      </div>
      <PredictiveInsightsDashboard />
    </div>
  );
}

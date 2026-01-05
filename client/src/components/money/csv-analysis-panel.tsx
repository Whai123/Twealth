import { useState } from "react";
import { safeString } from "@/lib/safe-render";
import { Upload, FileText, TrendingUp, Save, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { parseCSV, type Transaction } from "@/lib/finance/parseTransactions";
import { categorizeAll, type Category } from "@/lib/finance/categorize";
import { forecastCashflow } from "@/lib/finance/forecast";
import { generateInsights, type Insight } from "@/lib/finance/insights";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AnalysisState = 'idle' | 'loading' | 'success' | 'error';

export default function CSVAnalysisPanel() {
  const [csvText, setCsvText] = useState("");
  const [state, setState] = useState<AnalysisState>('idle');
  const [error, setError] = useState<string>("");
  const [categorizedTransactions, setCategorizedTransactions] = useState<(Transaction & { category: Category })[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<{ category: string; total: number; percentage: number }[]>([]);
  const [forecast, setForecast] = useState<{ day: number; amount: number }[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (transactions: (Transaction & { category: Category })[]) => {
      const txData = transactions.map(tx => ({
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        category: tx.category,
      }));
      return apiRequest("POST", "/api/transactions/bulk-import", { transactions: txData });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/financial-profile"] });
      setSaved(true);
      toast({
        title: "Transactions Imported!",
        description: data.message || `Successfully saved ${categorizedTransactions.length} transactions`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to save transactions",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = () => {
    if (!csvText.trim()) {
      setError("Please enter CSV data");
      setState('error');
      return;
    }

    setState('loading');
    setError("");
    setSaved(false);

    try {
      // Parse CSV
      const parsed = parseCSV(csvText);
      if (parsed.length === 0) {
        throw new Error("No transactions found in CSV");
      }

      // Categorize
      const categorized = categorizeAll(parsed);
      setCategorizedTransactions(categorized);

      // Calculate category totals
      const totals: Record<string, number> = {};
      let totalExpense = 0;
      
      categorized.forEach(tx => {
        totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
        if (tx.amount < 0) totalExpense += Math.abs(tx.amount);
      });

      const totalsArray = Object.entries(totals).map(([category, total]) => ({
        category,
        total,
        percentage: totalExpense > 0 ? (Math.abs(total) / totalExpense) * 100 : 0,
      })).sort((a, b) => {
        // Sort by absolute expense value descending (largest expenses first)
        const absA = Math.abs(a.total);
        const absB = Math.abs(b.total);
        return absB - absA;
      });

      setCategoryTotals(totalsArray);

      // Generate 30-day forecast
      const forecastData = forecastCashflow(categorized, 30);
      const forecastArray = forecastData.map((amount, index) => ({
        day: index + 1,
        amount: Math.round(amount),
      }));
      setForecast(forecastArray);

      // Generate insights
      const generatedInsights = generateInsights(categorized);
      setInsights(generatedInsights.slice(0, 3));

      setState('success');
      
      // Reset file input to allow re-uploading the same file
      setFileInputKey(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze CSV");
      setState('error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card data-testid="csv-upload-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CSV Transaction Upload
          </CardTitle>
          <CardDescription>
            Upload or paste CSV data in format: date,description,amount,currency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Upload CSV File</label>
            <input
              key={fileInputKey}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              data-testid="csv-file-input"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Or Paste CSV Data</label>
            <Textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="2024-01-15,Coffee Shop,-4.50,USD&#10;2024-01-16,Salary,3000.00,USD&#10;2024-01-17,Grocery Store,-45.20,USD"
              rows={6}
              data-testid="csv-textarea"
            />
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={state === 'loading'}
            className="w-full"
            data-testid="analyze-button"
          >
            <Upload className="h-4 w-4 mr-2" />
            {state === 'loading' ? 'Analyzing...' : 'Analyze Transactions'}
          </Button>

          {state === 'error' && error && (
            <Alert variant="destructive" data-testid="error-alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {state === 'success' && categorizedTransactions.length > 0 && (
        <>
          {/* Save to Database Button */}
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    {saved ? "Transactions Saved!" : "Ready to Import"}
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {saved 
                      ? "Your transactions are now tracked and will be used for AI financial advice."
                      : `${categorizedTransactions.length} transactions analyzed. Save them to track your finances.`
                    }
                  </p>
                </div>
                <Button 
                  onClick={() => importMutation.mutate(categorizedTransactions)}
                  disabled={saved || importMutation.isPending}
                  className={saved ? "bg-green-600 hover:bg-green-600" : ""}
                  data-testid="save-transactions-button"
                >
                  {importMutation.isPending ? (
                    "Saving..."
                  ) : saved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save to My Finances
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Category Totals */}
          <Card data-testid="category-totals-card">
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>
                Analyzed {categorizedTransactions.length} transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoryTotals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">% of Spending</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryTotals.map((item) => (
                      <TableRow key={item.category}>
                        <TableCell className="font-medium">{item.category}</TableCell>
                        <TableCell className="text-right">
                          {item.total >= 0 ? '+' : ''}{item.total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.total < 0 ? `${item.percentage.toFixed(1)}%` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">No spending data available</p>
              )}
            </CardContent>
          </Card>

          {/* 30-Day Forecast Chart */}
          <Card data-testid="forecast-chart-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                30-Day Cash Flow Forecast
              </CardTitle>
              <CardDescription>
                Projected cumulative balance based on historical patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forecast.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={forecast}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="day" 
                      label={{ value: 'Days', position: 'insideBottom', offset: -5 }}
                      className="text-xs"
                    />
                    <YAxis 
                      label={{ value: 'Amount', angle: -90, position: 'insideLeft' }}
                      className="text-xs"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">No forecast data available</p>
              )}
            </CardContent>
          </Card>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Top Insights</h3>
              <div className="grid gap-4">
                {insights.map((insight, index) => (
                  <Card key={index} data-testid={`insight-card-${index}`}>
                    <CardHeader>
                      <CardTitle className="text-base">{safeString(insight.title)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{safeString(insight.message)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {state === 'idle' && (
        <Card className="border-dashed" data-testid="empty-state">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No Data Analyzed Yet</h3>
                <p className="text-muted-foreground">
                  Upload a CSV file or paste transaction data to get started
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

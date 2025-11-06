import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, TrendingUp, Target, DollarSign, PieChart, BarChart3, LineChart, AlertCircle } from "lucide-react";
import { PieChart as RePieChart, Pie, Cell, BarChart, Bar, LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

export default function AIInsightsDashboard() {
  const { t } = useTranslation();

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ["/api/financial-goals"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: preferences } = useQuery({
    queryKey: ['/api/user-preferences'],
  });

  // Calculate spending by category
  const spendingByCategory = transactions && Array.isArray(transactions)
    ? transactions
        .filter((t: any) => t.type === 'expense')
        .reduce((acc: any, t: any) => {
          const category = t.category || 'Other';
          acc[category] = (acc[category] || 0) + parseFloat(t.amount);
          return acc;
        }, {})
    : {};

  const spendingData = Object.entries(spendingByCategory).map(([name, value]) => ({
    name,
    value: Number(value),
  })).sort((a, b) => b.value - a.value);

  // Calculate goal progress
  const goalsData = goals && Array.isArray(goals)
    ? goals
        .filter((g: any) => g.status === 'active')
        .map((g: any) => {
          const current = parseFloat(g.currentAmount) || 0;
          const target = parseFloat(g.targetAmount) || 1;
          const progress = Math.min(100, (current / target) * 100);
          
          return {
            name: g.title.length > 20 ? g.title.substring(0, 20) + '...' : g.title,
            progress: Number(progress.toFixed(1)),
            current,
            target,
          };
        })
    : [];

  // Net worth projection - pull from UserPreferences
  const monthlyIncome = parseFloat((preferences as any)?.monthlyIncomeEstimate || '0') || 0;
  const monthlyExpenses = parseFloat((preferences as any)?.monthlyExpensesEstimate || '0') || 0;
  const currentSavings = parseFloat((preferences as any)?.currentSavingsEstimate || '0') || (stats as any)?.totalSavings || 0;
  const monthlySavings = monthlyIncome - monthlyExpenses;

  const projectionData = [
    { year: 'Now', savings: currentSavings, invested: currentSavings },
    { 
      year: '1Y', 
      savings: currentSavings + (monthlySavings * 12),
      invested: currentSavings * 1.08 + (monthlySavings * 12 * 1.04)
    },
    { 
      year: '5Y', 
      savings: currentSavings + (monthlySavings * 60),
      invested: currentSavings * Math.pow(1.08, 5) + (monthlySavings * 12 * ((Math.pow(1.08, 5) - 1) / 0.08))
    },
    { 
      year: '10Y', 
      savings: currentSavings + (monthlySavings * 120),
      invested: currentSavings * Math.pow(1.08, 10) + (monthlySavings * 12 * ((Math.pow(1.08, 10) - 1) / 0.08))
    },
  ];

  // Budget allocation (50/30/20 rule)
  const budgetData = monthlyIncome > 0 ? [
    { name: 'Needs (50%)', value: monthlyIncome * 0.5, recommended: true },
    { name: 'Wants (30%)', value: monthlyIncome * 0.3, recommended: true },
    { name: 'Savings (20%)', value: monthlyIncome * 0.2, recommended: true },
  ] : [];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('aiInsights.title', 'AI Financial Insights')}</h1>
          <p className="text-muted-foreground">{t('aiInsights.subtitle', 'Visual analytics powered by your AI advisor')}</p>
        </div>
      </div>

      {/* Spending Breakdown */}
      <Card data-testid="spending-chart-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-500" />
            <CardTitle>{t('aiInsights.spendingBreakdown', 'Spending Breakdown')}</CardTitle>
          </div>
          <CardDescription>
            {t('aiInsights.spendingDesc', 'See where your money goes by category')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : spendingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={spendingData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {spendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              </RePieChart>
            </ResponsiveContainer>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('aiInsights.noSpendingData', 'No spending data yet. Start tracking transactions to see insights!')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal Progress */}
        <Card data-testid="goal-progress-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <CardTitle>{t('aiInsights.goalProgress', 'Goal Progress')}</CardTitle>
            </div>
            <CardDescription>
              {t('aiInsights.goalDesc', 'Track your financial goals visually')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : goalsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={goalsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'progress') return [`${value.toFixed(1)}%`, 'Progress'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="progress" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('aiInsights.noGoals', 'No active goals yet. Set a financial goal to track your progress!')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Budget Allocation */}
        <Card data-testid="budget-allocation-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <CardTitle>{t('aiInsights.budgetAllocation', 'Budget Allocation')}</CardTitle>
            </div>
            <CardDescription>
              {t('aiInsights.budgetDesc', 'Recommended 50/30/20 budget rule')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {budgetData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={budgetData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name.split(' ')[0]}: $${value.toFixed(0)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {budgetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('aiInsights.noBudgetData', 'Set your monthly income in settings to see budget recommendations!')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Net Worth Projection */}
      <Card data-testid="networth-projection-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-orange-500" />
            <CardTitle>{t('aiInsights.networthProjection', 'Net Worth Projection')}</CardTitle>
          </div>
          <CardDescription>
            {t('aiInsights.projectionDesc', 'Compare saving vs investing with 8% annual return')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlySavings > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ReLineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(0)}`} />
                <Legend />
                <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} name="Just Saving" />
                <Line type="monotone" dataKey="invested" stroke="#10b981" strokeWidth={2} name="Saving + Investing" />
              </ReLineChart>
            </ResponsiveContainer>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('aiInsights.noProjectionData', 'Set your income and expenses in settings to see net worth projections!')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Smart Recommendations */}
      <Card data-testid="smart-recommendations-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <CardTitle>{t('aiInsights.smartRecommendations', 'Smart Recommendations')}</CardTitle>
          </div>
          <CardDescription>
            {t('aiInsights.recommendationsDesc', 'Actionable insights from your AI advisor')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {monthlySavings > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    {t('aiInsights.monthlySavings', 'Monthly Savings Potential')}
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {t('aiInsights.monthlySavingsDesc', 'You can save ${{amount}}/month. Invest this at 8% return to reach ${{projected}} in 5 years!', {
                      amount: monthlySavings.toFixed(0),
                      projected: (monthlySavings * 12 * ((Math.pow(1.08, 5) - 1) / 0.08)).toFixed(0)
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {goalsData.length > 0 && goalsData.some((g: any) => g.progress < 50) && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                    {t('aiInsights.goalsBehind', 'Goals Need Attention')}
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    {t('aiInsights.goalsBehindDesc', 'Some goals are behind schedule. Consider increasing contributions or adjusting target dates.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {spendingData.length > 0 && spendingData[0].value > monthlyIncome * 0.3 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <PieChart className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    {t('aiInsights.topSpending', 'Top Spending Category')}
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {t('aiInsights.topSpendingDesc', '{{category}} is your highest expense at ${{amount}}. Consider setting a monthly limit to save more.', {
                      category: spendingData[0].name,
                      amount: spendingData[0].value.toFixed(0)
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

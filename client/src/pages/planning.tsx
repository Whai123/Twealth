import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb, TrendingUp, Calendar, Target, AlertTriangle, CheckCircle, Clock, Brain, Zap, Star, Rocket, Award, BarChart3, DollarSign, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Suggestion {
  id: string;
  type: "increase_savings" | "reduce_expenses" | "optimize_goals" | "schedule_reminder";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  category: string;
  actionable: boolean;
}

export default function Planning() {
  const [activeTab, setActiveTab] = useState("suggestions");

  const { data: goals = [] } = useQuery<any[]>({
    queryKey: ["/api/financial-goals"],
    queryFn: () => fetch("/api/financial-goals").then(res => res.json()),
  });

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
    queryFn: () => fetch("/api/transactions?limit=100").then(res => res.json()),
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Generate smart suggestions based on user data
  const generateSuggestions = (): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    
    if (goals && goals.length > 0) {
      // Check for goals nearing deadline
      const urgentGoals = goals.filter((goal: any) => {
        const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
        return daysLeft < 90 && progress < 75;
      });

      if (urgentGoals.length > 0) {
        suggestions.push({
          id: "urgent-goals",
          type: "optimize_goals",
          title: "Goals Need Attention",
          description: `You have ${urgentGoals.length} goal(s) approaching their deadline with less than 75% progress. Consider increasing contributions or adjusting timelines.`,
          impact: "high",
          category: "Goals",
          actionable: true
        });
      }

      // Check for low progress goals
      const lowProgressGoals = goals.filter((goal: any) => {
        const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
        return progress < 25 && goal.status === "active";
      });

      if (lowProgressGoals.length > 0) {
        suggestions.push({
          id: "low-progress",
          type: "increase_savings",
          title: "Boost Your Savings Rate",
          description: "Some goals have low progress. Consider setting up automatic transfers or finding additional income sources.",
          impact: "medium",
          category: "Savings",
          actionable: true
        });
      }
    }

    if (transactions && transactions.length > 0) {
      // Analyze spending patterns
      const recentExpenses = transactions.filter((t: any) => {
        const isRecent = new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return t.type === "expense" && isRecent;
      });

      const expensesByCategory = recentExpenses.reduce((acc: any, t: any) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
        return acc;
      }, {});

      const highestExpenseCategory = Object.entries(expensesByCategory)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0];

      if (highestExpenseCategory && (highestExpenseCategory[1] as number) > 500) {
        suggestions.push({
          id: "high-expenses",
          type: "reduce_expenses",
          title: "Review High Spending Category",
          description: `Your highest spending category is ${highestExpenseCategory[0]} at $${(highestExpenseCategory[1] as number).toLocaleString()} this month. Look for optimization opportunities.`,
          impact: "medium",
          category: "Expenses",
          actionable: true
        });
      }
    }

    // Add general suggestions if no specific issues found
    if (suggestions.length === 0) {
      suggestions.push({
        id: "emergency-fund",
        type: "increase_savings",
        title: "Build Emergency Fund",
        description: "Aim to save 3-6 months of expenses in an emergency fund for financial security.",
        impact: "high",
        category: "Savings",
        actionable: true
      });

      suggestions.push({
        id: "automate-savings",
        type: "optimize_goals",
        title: "Automate Your Savings",
        description: "Set up automatic transfers to your savings goals to ensure consistent progress.",
        impact: "medium",
        category: "Automation",
        actionable: true
      });
    }

    return suggestions;
  };

  const suggestions = generateSuggestions();

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/20";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "high":
        return <AlertTriangle className="text-red-600" size={20} />;
      case "medium":
        return <Clock className="text-yellow-600" size={20} />;
      case "low":
        return <CheckCircle className="text-green-600" size={20} />;
      default:
        return <Lightbulb className="text-blue-600" size={20} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Modern Header with gradient background */}
      <header className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b border-border/50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 md:py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    🧠 Smart Financial Planning
                  </h1>
                  <p className="text-muted-foreground text-lg">AI-powered insights to accelerate your financial success</p>
                </div>
              </div>
              
              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">Planning Score</span>
                  </div>
                  <div className="text-xl font-bold text-indigo-600">85/100</div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Active Goals</span>
                  </div>
                  <div className="text-xl font-bold text-green-600">{goals?.filter((g: any) => g.status === "active")?.length || 0}</div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium">Optimization</span>
                  </div>
                  <div className="text-xl font-bold text-orange-600">92%</div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">AI Insights</span>
                  </div>
                  <div className="text-xl font-bold text-purple-600">{suggestions.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 md:py-8">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-1 rounded-xl border border-indigo-200/50 dark:border-indigo-700/50">
            <TabsTrigger 
              value="suggestions" 
              data-testid="tab-suggestions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              💡 Smart Suggestions
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              data-testid="tab-insights"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              📊 Financial Insights
            </TabsTrigger>
            <TabsTrigger 
              value="projections" 
              data-testid="tab-projections"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              🎯 Goal Projections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="space-y-6">
            {/* Modern Quick Actions */}
            <Card className="bg-gradient-to-br from-white to-indigo-50/50 dark:from-gray-900 dark:to-indigo-900/20 border-indigo-200/50 dark:border-indigo-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Rocket className="w-6 h-6 text-indigo-600" />
                  🚀 Quick Actions to Boost Your Wealth
                </CardTitle>
                <p className="text-muted-foreground">Take immediate action to improve your financial position</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link href="/money-tracking?budget=1" className="group">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-6 h-24 flex flex-col justify-center items-center text-center hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer" data-testid="button-create-budget">
                      <Target className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold">💰 Create Budget</span>
                    </div>
                  </Link>
                  <Link href="/financial-goals" className="group">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-6 h-24 flex flex-col justify-center items-center text-center hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer" data-testid="button-review-goals">
                      <TrendingUp className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold">📈 Review Goals</span>
                    </div>
                  </Link>
                  <Link href="/calendar?create=1" className="group">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl p-6 h-24 flex flex-col justify-center items-center text-center hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer" data-testid="button-schedule-review">
                      <Calendar className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold">📅 Schedule Review</span>
                    </div>
                  </Link>
                  <Link href="/financial-goals" className="group">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl p-6 h-24 flex flex-col justify-center items-center text-center hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer" data-testid="button-optimize-savings">
                      <Lightbulb className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold">⚡ Optimize Savings</span>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Smart Suggestions */}
            <Card className="bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-900 dark:to-purple-900/20 border-purple-200/50 dark:border-purple-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Brain className="w-6 h-6 text-purple-600" />
                  🤖 AI-Powered Recommendations
                </CardTitle>
                <p className="text-muted-foreground">Smart insights tailored to your financial behavior and goals</p>
              </CardHeader>
              <CardContent>
              {suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">You're doing great!</h3>
                  <p className="text-muted-foreground">
                    No urgent recommendations at the moment. Keep up the good work with your financial goals.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getImpactIcon(suggestion.impact)}
                          <div>
                            <h4 className="font-medium" data-testid={`text-suggestion-${suggestion.id}`}>
                              {suggestion.title}
                            </h4>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {suggestion.category}
                            </Badge>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getImpactColor(suggestion.impact)}`}>
                          {suggestion.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {suggestion.description}
                      </p>
                      {suggestion.actionable && (
                        <Button size="sm" data-testid={`button-action-${suggestion.id}`} asChild>
                          <Link href="/financial-goals">
                            Take Action
                          </Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Financial Health Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-semibold">Financial Health Score</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2" data-testid="text-health-score">78</div>
                  <Progress value={78} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">Good - Keep improving!</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-semibold">Savings Rate</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2" data-testid="text-savings-rate">23%</div>
                  <p className="text-sm text-muted-foreground">of monthly income</p>
                  <p className="text-xs text-green-600 mt-1">Above recommended 20%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-semibold">Goal Completion Rate</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2" data-testid="text-completion-rate">
                    {goals ? Math.round((goals.filter((g: any) => g.status === "completed").length / goals.length) * 100) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">goals completed on time</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Spending Analysis */}
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-semibold">Spending Analysis</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Housing</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={35} className="w-24 h-2" />
                    <span className="text-sm font-medium">35%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Food</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={15} className="w-24 h-2" />
                    <span className="text-sm font-medium">15%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Transportation</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={12} className="w-24 h-2" />
                    <span className="text-sm font-medium">12%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Entertainment</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={8} className="w-24 h-2" />
                    <span className="text-sm font-medium">8%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Other</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={30} className="w-24 h-2" />
                    <span className="text-sm font-medium">30%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projections" className="space-y-6">
          {/* Goal Projections */}
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-semibold">Goal Timeline Projections</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {goals && goals.length > 0 ? (
                <div className="space-y-6">
                  {goals.filter((goal: any) => goal.status === "active").map((goal: any) => {
                    const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
                    const remaining = parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount);
                    const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const monthlyNeeded = remaining / Math.max(1, daysLeft / 30);
                    
                    return (
                      <div key={goal.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium" data-testid={`text-projection-${goal.id}`}>
                            {goal.title}
                          </h4>
                          <Badge variant={daysLeft > 0 ? "secondary" : "destructive"}>
                            {daysLeft > 0 ? `${daysLeft} days left` : "Overdue"}
                          </Badge>
                        </div>
                        
                        <Progress value={progress} className="h-2 mb-3" />
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Current Progress</p>
                            <p className="font-medium">${parseFloat(goal.currentAmount).toLocaleString()} ({Math.round(progress)}%)</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Monthly Target</p>
                            <p className="font-medium ${monthlyNeeded > 1000 ? 'text-red-600' : 'text-green-600'}">
                              ${monthlyNeeded.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {monthlyNeeded > 1000 && (
                          <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
                            ⚠️ You need to save ${monthlyNeeded.toLocaleString()}/month to reach this goal on time
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active goals to project</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}

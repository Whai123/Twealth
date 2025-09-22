import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Target,
  Zap,
  PiggyBank,
  Clock,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { differenceInDays, differenceInMonths, addDays, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface Goal {
  id: string;
  title: string;
  description?: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  category?: string;
  priority: string;
  status: string;
  createdAt?: string;
}

interface Transaction {
  id: string;
  amount: string;
  type: string;
  category?: string;
  date: string;
  goalId?: string;
}

interface AutomatedSavingsSuggestionsProps {
  goals: Goal[];
  onImplementSuggestion?: (suggestion: any) => void;
}

interface SavingSuggestion {
  id: string;
  type: 'amount' | 'frequency' | 'automation' | 'optimization';
  goalId?: string;
  title: string;
  description: string;
  impact: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeToSee: string;
  monthlyIncrease?: number;
  annualIncrease?: number;
  confidence: number;
  actionButton: string;
}

export default function AutomatedSavingsSuggestions({ 
  goals, 
  onImplementSuggestion 
}: AutomatedSavingsSuggestionsProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  
  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: () => fetch("/api/transactions").then(res => res.json()),
  });

  const activeGoals = goals.filter(goal => goal.status === 'active');

  const generateSuggestions = (): SavingSuggestion[] => {
    const suggestions: SavingSuggestion[] = [];

    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Analyze spending patterns
    const recentTransactions = transactions.filter((t: Transaction) => 
      differenceInDays(new Date(), new Date(t.date)) <= 30
    );
    
    const monthlyIncome = recentTransactions
      .filter((t: Transaction) => t.type === 'income')
      .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0);
    
    const monthlyExpenses = recentTransactions
      .filter((t: Transaction) => t.type === 'expense')
      .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0);

    const discretionarySpending = recentTransactions
      .filter((t: Transaction) => 
        t.type === 'expense' && 
        ['entertainment', 'dining', 'shopping', 'subscriptions'].includes(t.category || '')
      )
      .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0);

    // Round-up savings suggestion
    if (monthlyExpenses > 0) {
      const roundUpPotential = recentTransactions
        .filter((t: Transaction) => t.type === 'expense')
        .length * 0.50; // Average 50 cents per transaction
      
      suggestions.push({
        id: 'round-up-savings',
        type: 'automation',
        title: 'Round-Up Savings',
        description: `Automatically round up purchases and save the change. Based on your spending, this could save ~$${roundUpPotential.toFixed(0)} monthly.`,
        impact: `+$${(roundUpPotential * 12).toFixed(0)} annually`,
        difficulty: 'easy',
        timeToSee: '1 week',
        monthlyIncrease: roundUpPotential,
        annualIncrease: roundUpPotential * 12,
        confidence: 95,
        actionButton: 'Enable Round-Up'
      });
    }

    // Reduce discretionary spending
    if (discretionarySpending > 200) {
      const reduction = discretionarySpending * 0.15; // 15% reduction
      suggestions.push({
        id: 'reduce-discretionary',
        type: 'optimization',
        title: 'Optimize Discretionary Spending',
        description: `Reducing entertainment and dining expenses by 15% could free up $${reduction.toFixed(0)} monthly for goals.`,
        impact: `+$${(reduction * 12).toFixed(0)} annually`,
        difficulty: 'medium',
        timeToSee: '2 weeks',
        monthlyIncrease: reduction,
        annualIncrease: reduction * 12,
        confidence: 80,
        actionButton: 'Set Spending Limits'
      });
    }

    // Goal-specific suggestions
    activeGoals.forEach(goal => {
      const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
      const daysRemaining = differenceInDays(new Date(goal.targetDate), new Date());
      const monthsRemaining = daysRemaining / 30;
      const requiredMonthly = monthsRemaining > 0 
        ? (parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount)) / monthsRemaining
        : 0;

      // Increase contribution suggestion
      if (progress < 50 && daysRemaining > 30 && requiredMonthly < monthlyIncome * 0.3) {
        const suggestedIncrease = Math.min(requiredMonthly * 1.2, monthlyIncome * 0.1);
        suggestions.push({
          id: `increase-${goal.id}`,
          type: 'amount',
          goalId: goal.id,
          title: `Accelerate "${goal.title}"`,
          description: `Increase monthly contributions by $${suggestedIncrease.toFixed(0)} to complete this goal ${Math.ceil(suggestedIncrease / requiredMonthly * 30)} days earlier.`,
          impact: `Goal completion ${Math.ceil(suggestedIncrease / requiredMonthly * 30)} days sooner`,
          difficulty: 'easy',
          timeToSee: '1 month',
          monthlyIncrease: suggestedIncrease,
          confidence: 85,
          actionButton: 'Increase Contribution'
        });
      }

      // Automated contribution suggestion
      if (progress < 25 && daysRemaining > 60) {
        suggestions.push({
          id: `automate-${goal.id}`,
          type: 'automation',
          goalId: goal.id,
          title: `Automate "${goal.title}" Savings`,
          description: `Set up automatic weekly transfers of $${(requiredMonthly / 4).toFixed(0)} to stay on track without thinking about it.`,
          impact: 'Consistent progress without manual effort',
          difficulty: 'easy',
          timeToSee: 'Immediate',
          monthlyIncrease: requiredMonthly,
          confidence: 90,
          actionButton: 'Set Up Automation'
        });
      }
    });

    // Income optimization
    if (monthlyIncome > 0 && monthlyIncome < 8000) {
      suggestions.push({
        id: 'income-optimization',
        type: 'optimization',
        title: 'Explore Income Opportunities',
        description: 'Consider side hustles, skill development, or asking for a raise to accelerate your savings goals.',
        impact: 'Potentially +20-50% income',
        difficulty: 'hard',
        timeToSee: '3-6 months',
        confidence: 60,
        actionButton: 'Explore Options'
      });
    }

    // Emergency fund suggestion
    const hasEmergencyGoal = activeGoals.some(goal => 
      goal.category === 'emergency' || goal.title.toLowerCase().includes('emergency')
    );
    
    if (!hasEmergencyGoal && monthlyExpenses > 0) {
      const emergencyTarget = monthlyExpenses * 3; // 3 months of expenses
      suggestions.push({
        id: 'emergency-fund',
        type: 'optimization',
        title: 'Create Emergency Fund Goal',
        description: `Build a safety net of $${emergencyTarget.toFixed(0)} (3 months of expenses) before focusing on other goals.`,
        impact: 'Financial security and peace of mind',
        difficulty: 'medium',
        timeToSee: '6-12 months',
        confidence: 95,
        actionButton: 'Create Emergency Fund'
      });
    }

    // High-yield savings suggestion
    const totalSavings = goals.reduce((sum, goal) => sum + parseFloat(goal.currentAmount), 0);
    if (totalSavings > 5000) {
      suggestions.push({
        id: 'high-yield-savings',
        type: 'optimization',
        title: 'Optimize Savings Account',
        description: `With $${totalSavings.toLocaleString()} saved, switching to a high-yield account could earn an extra $${(totalSavings * 0.04).toFixed(0)} annually.`,
        impact: `+$${(totalSavings * 0.04).toFixed(0)} annually in interest`,
        difficulty: 'easy',
        timeToSee: '1 month',
        annualIncrease: totalSavings * 0.04,
        confidence: 85,
        actionButton: 'Find Better Rates'
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  };

  const suggestions = generateSuggestions();
  
  const filteredSuggestions = selectedFilter === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.type === selectedFilter);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'amount': return DollarSign;
      case 'frequency': return Calendar;
      case 'automation': return Zap;
      case 'optimization': return TrendingUp;
      default: return Target;
    }
  };

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="mr-2 h-5 w-5" />
            AI Savings Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <PiggyBank className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Building Recommendations</h3>
            <p className="text-muted-foreground">
              Add some transactions and goals to unlock personalized savings strategies.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="mr-2 h-5 w-5" />
            AI Savings Suggestions
          </div>
          <Badge variant="secondary" className="flex items-center">
            <Sparkles className="mr-1 h-3 w-3" />
            {suggestions.length} suggestions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'all', label: 'All Suggestions' },
            { id: 'automation', label: 'Automation' },
            { id: 'amount', label: 'Amounts' },
            { id: 'optimization', label: 'Optimization' }
          ].map(filter => (
            <Button
              key={filter.id}
              variant={selectedFilter === filter.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter(filter.id)}
              data-testid={`filter-${filter.id}`}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredSuggestions.slice(0, 6).map((suggestion) => {
            const TypeIcon = getTypeIcon(suggestion.type);
            
            return (
              <div 
                key={suggestion.id}
                className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                data-testid={`suggestion-${suggestion.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <TypeIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{suggestion.title}</h4>
                        <Badge className={getDifficultyColor(suggestion.difficulty)}>
                          {suggestion.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {suggestion.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <div>
                            <span className="font-medium">Impact:</span>
                            <div className="text-green-600">{suggestion.impact}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <div>
                            <span className="font-medium">Timeline:</span>
                            <div className="text-blue-600">{suggestion.timeToSee}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => onImplementSuggestion?.(suggestion)}
                    className="ml-4 shrink-0"
                    data-testid={`button-implement-${suggestion.id}`}
                  >
                    {suggestion.actionButton}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSuggestions.length > 6 && (
          <div className="text-center pt-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View {filteredSuggestions.length - 6} More Suggestions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
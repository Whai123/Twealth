import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, TrendingUp, DollarSign, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function PremiumROIWidget() {
  const { data: subscription } = useQuery({
    queryKey: ["/api/subscription/current"],
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["/api/financial-goals"],
  });

  const isPremium = (subscription as any)?.subscription?.plan?.name === "Pro";

  if (!isPremium) {
    return null; // Only show for premium users
  }

  // Calculate savings this month ONLY (not historical or future)
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  // Filter to only THIS MONTH's transactions (with upper and lower bounds)
  const thisMonthTransactions = Array.isArray(transactions)
    ? transactions.filter((t: any) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= firstDayOfMonth && transactionDate < firstDayNextMonth;
      })
    : [];
  
  // Calculate savings from auto-categorization THIS MONTH (estimated $50-100/month in time saved)
  const thisMonthUncategorized = thisMonthTransactions.filter((t: any) => t.category === 'Other' || t.category === 'other').length;
  const thisMonthAutoCategorized = Math.max(0, thisMonthTransactions.length - thisMonthUncategorized);
  const timeSavingsValue = Math.min(100, thisMonthAutoCategorized * 2); // $2 per auto-categorized transaction

  // Calculate potential savings from budget tracking (already filtered to this month above)
  const thisMonthExpenses = thisMonthTransactions.filter((t: any) => t.type === 'expense');
  const monthlyExpenses = thisMonthExpenses.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
  
  // Estimate 5-10% savings from better expense tracking
  const budgetSavings = Math.min(500, monthlyExpenses * 0.07);

  // Calculate goal progress value (staying on track is worth money)
  const activeGoals = Array.isArray(goals) ? goals.filter((g: any) => g.status === 'active') : [];
  const goalValue = activeGoals.length * 50; // $50 value per active goal being tracked

  // Total estimated monthly value
  const totalValue = Math.round(timeSavingsValue + budgetSavings + goalValue);
  
  const subscriptionCost = 25; // $25/month premium
  const netBenefit = totalValue - subscriptionCost;
  const roi = totalValue > 0 ? (totalValue / subscriptionCost).toFixed(1) : "0";

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold">Your Premium ROI</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            This Month
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ROI Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Premium Subscription</span>
            <span className="font-medium text-red-600">-${subscriptionCost}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">AI Time Savings</span>
            </div>
            <span className="font-medium text-green-600">+${Math.round(timeSavingsValue)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-muted-foreground">Budget Optimization</span>
            </div>
            <span className="font-medium text-green-600">+${Math.round(budgetSavings)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" />
              <span className="text-muted-foreground">Goal Tracking Value</span>
            </div>
            <span className="font-medium text-green-600">+${goalValue}</span>
          </div>

          <div className="h-px bg-border my-3"></div>

          {/* Net Benefit */}
          <div className="flex items-center justify-between">
            <span className="font-semibold">Net Benefit</span>
            <span className={`text-xl font-bold ${netBenefit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netBenefit >= 0 ? '+' : ''}${netBenefit}
            </span>
          </div>

          {/* ROI Multiplier */}
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">You're saving</div>
            <div className="text-3xl font-bold text-primary">{roi}x</div>
            <div className="text-sm text-muted-foreground mt-1">your subscription cost</div>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground text-center mb-3">
            Premium features help you save an average of ${totalValue}/month through better financial management
          </p>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/subscription">
              <Crown className="h-4 w-4 mr-2" />
              View Premium Benefits
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

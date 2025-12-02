import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, Clock, DollarSign, Sparkles } from "lucide-react";

interface AIROICalculatorProps {
  userCurrency: string;
  currentTier: 'free' | 'pro' | 'enterprise';
}

const TIER_DATA = {
  free: {
    monthlyPrice: 0,
    scoutQueries: 50,
    advancedQueries: 0,
    hoursPerQuery: 0.25,
  },
  pro: {
    monthlyPrice: 9.99,
    scoutQueries: 500,
    advancedQueries: 100,
    hoursPerQuery: 0.5,
  },
  enterprise: {
    monthlyPrice: 49.99,
    scoutQueries: 999999,
    advancedQueries: 500,
    hoursPerQuery: 1,
  },
};

export default function AIROICalculator({ userCurrency, currentTier }: AIROICalculatorProps) {
  const [queriesPerMonth, setQueriesPerMonth] = useState(50);
  const [hourlyRate, setHourlyRate] = useState(50);

  const calculations = useMemo(() => {
    const tier = TIER_DATA[currentTier];
    const hoursWithoutAI = queriesPerMonth * 0.5;
    const hoursWithAI = queriesPerMonth * 0.05;
    const hoursSaved = hoursWithoutAI - hoursWithAI;
    const moneySaved = hoursSaved * hourlyRate;
    const netSavings = moneySaved - tier.monthlyPrice;
    const roi = tier.monthlyPrice > 0 ? ((moneySaved / tier.monthlyPrice) * 100).toFixed(0) : 'Infinite';

    return {
      hoursWithoutAI,
      hoursWithAI,
      hoursSaved,
      moneySaved,
      netSavings,
      roi,
      monthlyPrice: tier.monthlyPrice,
    };
  }, [queriesPerMonth, hourlyRate, currentTier]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: userCurrency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="border-border/40 bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">AI Value Calculator</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">See how much time and money you save</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Financial questions per month</label>
              <span className="text-sm font-bold text-primary">{queriesPerMonth}</span>
            </div>
            <Slider
              value={[queriesPerMonth]}
              onValueChange={(value) => setQueriesPerMonth(value[0])}
              min={10}
              max={200}
              step={10}
              className="w-full"
              data-testid="slider-queries"
            />
            <p className="text-xs text-muted-foreground">
              Budget reviews, spending analysis, investment questions, tax planning...
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Your hourly value</label>
              <span className="text-sm font-bold text-primary">{formatCurrency(hourlyRate)}/hr</span>
            </div>
            <Slider
              value={[hourlyRate]}
              onValueChange={(value) => setHourlyRate(value[0])}
              min={15}
              max={200}
              step={5}
              className="w-full"
              data-testid="slider-hourly-rate"
            />
            <p className="text-xs text-muted-foreground">
              What's your time worth? Consider salary or consulting rate.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-border/30 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Time Without AI</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {calculations.hoursWithoutAI.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">Research, calculations, analysis</p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-border/30 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium">Time With AI</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {calculations.hoursWithAI.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">Quick answers, instant insights</p>
          </div>

          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200/30 dark:border-green-800/30 space-y-2">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Hours Saved</span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {calculations.hoursSaved.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">Per month productivity gain</p>
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium">Value Created</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(calculations.moneySaved)}
            </div>
            <p className="text-xs text-muted-foreground">Time savings converted to money</p>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="font-semibold text-foreground">Your Monthly ROI</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {calculations.monthlyPrice > 0 
                  ? `After ${formatCurrency(calculations.monthlyPrice)}/month subscription`
                  : 'Free plan - no subscription cost'
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {calculations.monthlyPrice > 0 
                  ? `${calculations.roi}%`
                  : formatCurrency(calculations.moneySaved)
                }
              </div>
              {calculations.monthlyPrice > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Net savings: {formatCurrency(calculations.netSavings)}/mo
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

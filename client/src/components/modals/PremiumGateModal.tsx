import { Brain, Zap, Check, X, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { useUserCurrency } from "@/lib/userContext";

interface PremiumGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: 'deep_analysis' | 'orchestrator' | 'general';
  orchestratorType?: string;
}

export function PremiumGateModal({
  isOpen,
  onClose,
  trigger = 'general',
  orchestratorType
}: PremiumGateModalProps) {
  const [, setLocation] = useLocation();
  const { formatAmount, convertFromUSD } = useUserCurrency();

  const handleUpgrade = () => {
    setLocation("/upgrade");
    onClose();
  };

  // Customize messaging based on trigger
  const getTriggerMessage = () => {
    switch (trigger) {
      case 'deep_analysis':
        return {
          title: "Deep CFO-Level Analysis",
          description: "You've requested advanced AI analysis powered by Claude Opus 4.1",
          icon: Brain
        };
      case 'orchestrator':
        return {
          title: `${orchestratorType?.toUpperCase() || 'Advanced'} Analysis`,
          description: "This complex financial scenario requires premium AI orchestration",
          icon: Sparkles
        };
      default:
        return {
          title: "Premium AI Features",
          description: "Unlock advanced AI capabilities",
          icon: Brain
        };
    }
  };

  const triggerInfo = getTriggerMessage();
  const TriggerIcon = triggerInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]" data-testid="premium-gate-modal">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-black dark:bg-white">
              <TriggerIcon className="h-5 w-5 text-white dark:text-black" />
            </div>
            <div>
              <DialogTitle className="text-lg">{triggerInfo.title}</DialogTitle>
              <DialogDescription className="text-xs">
                {triggerInfo.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Limitation */}
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded bg-background border border-border">
                <Zap className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm mb-1">Free Plan</p>
                <p className="text-xs text-muted-foreground">
                  Scout AI (Llama 4) - Fast answers for simple queries
                </p>
              </div>
            </div>
          </div>

          {/* Premium Benefits */}
          <div className="bg-black dark:bg-white text-white dark:text-black rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-1.5 rounded bg-white/20 dark:bg-black/20">
                <Brain className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">Premium Plan</p>
                  <Badge variant="secondary" className="text-xs bg-white/20 dark:bg-black/20 hover:bg-white/20">
                    {formatAmount(convertFromUSD(9.99))}/mo
                  </Badge>
                </div>
                <p className="text-xs opacity-90">
                  Deep CFO-level analysis with Claude Opus 4.1
                </p>
              </div>
            </div>

            <Separator className="my-3 bg-white/20 dark:bg-black/20" />

            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-xs">
                <Check className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Advanced debt payoff strategies (Snowball vs Avalanche with projections)</span>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <Check className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Retirement planning with glidepath optimization</span>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <Check className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Tax optimization (Roth vs Traditional, bracket analysis)</span>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <Check className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Portfolio rebalancing & asset allocation analysis</span>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <Check className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Multi-year financial scenario planning</span>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <Check className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Unlimited deep analysis queries</span>
              </li>
            </ul>
          </div>

          {/* Value Prop */}
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">
              Get professional-grade financial insights for complex scenarios
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel-upgrade"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
            data-testid="button-upgrade-now"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade to Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

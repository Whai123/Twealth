import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Crown,
  Lock,
  Sparkles,
  Check,
  Zap,
  Brain,
  TrendingUp,
  Shield,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ProTrialPaywallProps {
  feature: string;
  description?: string;
  children?: React.ReactNode;
  showBlurred?: boolean;
}

const premiumFeatures = [
  { icon: Brain, label: "GPT-5 & Claude Opus AI" },
  { icon: TrendingUp, label: "Advanced Analytics" },
  { icon: Sparkles, label: "Unlimited AI Queries" },
  { icon: Shield, label: "Priority Support" },
];

export function ProTrialPaywall({
  feature,
  description,
  children,
  showBlurred = true,
}: ProTrialPaywallProps) {
  const [showModal, setShowModal] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <>
      <div className="relative">
        {showBlurred && children && (
          <div className="blur-sm pointer-events-none select-none opacity-60">
            {children}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${showBlurred ? 'absolute inset-0' : ''} flex items-center justify-center`}
        >
          <Card className="border-primary/30 bg-gradient-to-br from-background via-background to-primary/5 shadow-xl max-w-sm w-full mx-4">
            <CardContent className="p-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25"
              >
                <Lock className="w-7 h-7 text-primary-foreground" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                  <Crown className="w-3 h-3 mr-1" />
                  Pro Feature
                </Badge>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-semibold mb-2"
              >
                Unlock {feature}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-sm text-muted-foreground mb-5"
              >
                {description || `Get access to ${feature} and all premium features with Pro.`}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <Button
                  onClick={() => setShowModal(true)}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25"
                  data-testid="button-unlock-pro"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Unlock with Pro
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/subscription")}
                  className="text-xs text-muted-foreground"
                >
                  Compare all plans
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <ProUpgradeModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}

interface ProUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProUpgradeModal({ open, onOpenChange }: ProUpgradeModalProps) {
  const [, setLocation] = useLocation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-primary-foreground">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <X className="w-4 h-4" />
            </Button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm"
            >
              <Crown className="w-8 h-8" />
            </motion.div>

            <h2 className="text-2xl font-bold text-center mb-2">
              Upgrade to Pro
            </h2>
            <p className="text-center text-primary-foreground/80 text-sm">
              Unlock the full power of AI-driven financial management
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-3 mb-6">
              {premiumFeatures.map((feature, idx) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{feature.label}</span>
                  <Check className="w-4 h-4 text-green-500 ml-auto" />
                </motion.div>
              ))}
            </div>

            <div className="bg-muted/50 rounded-xl p-4 mb-6">
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-3xl font-bold">$9.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Cancel anytime. No questions asked.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <Button
                onClick={() => {
                  onOpenChange(false);
                  setLocation("/checkout/pro");
                }}
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 text-base"
                data-testid="button-start-pro-trial"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Pro Trial
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                7-day free trial, then $9.99/month
              </p>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

interface FeatureLockedBadgeProps {
  onClick?: () => void;
}

export function FeatureLockedBadge({ onClick }: FeatureLockedBadgeProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20 transition-colors"
    >
      <Crown className="w-3 h-3" />
      Pro
    </motion.button>
  );
}

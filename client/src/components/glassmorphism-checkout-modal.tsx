import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Check, Loader2, Shield, Lock, Sparkles, Crown, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  priceUsd: string;
  billingInterval: string;
  scoutLimit: number;
  sonnetLimit: number;
  gpt5Limit: number;
  opusLimit: number;
  features: string[];
}

interface GlassmorphismCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
  localizedPrice: {
    amount: number;
    currency: { symbol: string; code: string };
    isDiscounted?: boolean;
    originalAmount?: number;
  };
  userCurrency: string;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export default function GlassmorphismCheckoutModal({
  isOpen,
  onClose,
  plan,
  localizedPrice,
  userCurrency,
  onConfirm,
  isLoading = false,
}: GlassmorphismCheckoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!plan) return null;

  const isPro = plan.name === "pro";
  const isEnterprise = plan.name === "enterprise";

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  const getGradientColors = () => {
    if (isEnterprise) return "from-amber-500/20 via-yellow-500/10 to-orange-500/20";
    if (isPro) return "from-blue-500/20 via-indigo-500/10 to-purple-500/20";
    return "from-gray-500/20 via-slate-500/10 to-gray-500/20";
  };

  const getAccentColor = () => {
    if (isEnterprise) return "text-amber-400";
    if (isPro) return "text-blue-400";
    return "text-gray-400";
  };

  const getBorderGlow = () => {
    if (isEnterprise) return "shadow-[0_0_60px_-15px_rgba(251,191,36,0.3)]";
    if (isPro) return "shadow-[0_0_60px_-15px_rgba(59,130,246,0.3)]";
    return "shadow-[0_0_60px_-15px_rgba(100,100,100,0.3)]";
  };

  const getPlanIcon = () => {
    if (isEnterprise) return <Crown className="w-6 h-6 text-amber-400" />;
    if (isPro) return <Sparkles className="w-6 h-6 text-blue-400" />;
    return <Zap className="w-6 h-6 text-gray-400" />;
  };

  const getKeyFeatures = () => {
    const features = [];
    if (plan.scoutLimit === 999999) {
      features.push("Unlimited Scout AI queries");
    } else {
      features.push(`${plan.scoutLimit} Scout AI queries/month`);
    }
    if (plan.sonnetLimit > 0) features.push(`${plan.sonnetLimit} Sonnet reasoning queries`);
    if (plan.gpt5Limit > 0) features.push(`${plan.gpt5Limit} GPT-5 math queries`);
    if (plan.opusLimit > 0) features.push(`${plan.opusLimit === 999999 ? 'Unlimited' : plan.opusLimit} Opus CFO queries`);
    return features.slice(0, 4);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
            data-testid="modal-backdrop"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.4 
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className={`relative w-full max-w-md pointer-events-auto ${getBorderGlow()}`}
              data-testid="modal-checkout"
            >
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${getGradientColors()} blur-xl opacity-50`} />
              
              <div className="relative rounded-3xl border border-white/20 dark:border-white/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-700/50 transition-colors z-10"
                  data-testid="button-close-modal"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>

                <div className="relative p-6 pb-4">
                  <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-br ${getGradientColors()} opacity-60`} />
                  
                  <div className="relative">
                    <motion.div 
                      className="w-full aspect-[1.586/1] rounded-2xl relative overflow-hidden mb-6"
                      initial={{ rotateY: -10, rotateX: 5 }}
                      animate={{ rotateY: 0, rotateX: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${
                        isEnterprise 
                          ? "from-amber-600 via-yellow-500 to-orange-600"
                          : isPro 
                            ? "from-blue-600 via-indigo-600 to-purple-600"
                            : "from-gray-700 via-gray-600 to-gray-800"
                      } rounded-2xl`} />
                      
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/20 rounded-2xl" />
                      
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white/30 blur-lg" />
                        <div className="absolute bottom-8 right-8 w-20 h-20 rounded-full bg-white/20 blur-xl" />
                      </div>
                      
                      <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {getPlanIcon()}
                            <span className="font-semibold text-lg tracking-wide">{plan.displayName}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <CreditCard className="w-8 h-8 opacity-80" />
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-end gap-2 mb-1">
                            <span className="text-4xl font-bold tracking-tight">
                              {localizedPrice.currency.symbol}{localizedPrice.amount.toFixed(2)}
                            </span>
                            <span className="text-white/70 text-sm mb-1.5">/{plan.billingInterval}</span>
                          </div>
                          {userCurrency !== 'USD' && (
                            <p className="text-white/60 text-xs">
                              ≈ ${parseFloat(plan.priceUsd).toFixed(2)} USD
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-white/60 tracking-widest">
                            TWEALTH {plan.name.toUpperCase()}
                          </div>
                          <div className="flex gap-1">
                            <div className="w-6 h-6 rounded-full bg-white/30" />
                            <div className="w-6 h-6 rounded-full bg-white/20 -ml-3" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                <div className="px-6 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    What you'll get
                  </h3>
                  <div className="space-y-2.5">
                    {getKeyFeatures().map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isEnterprise 
                            ? "bg-amber-100 dark:bg-amber-900/30" 
                            : isPro 
                              ? "bg-blue-100 dark:bg-blue-900/30"
                              : "bg-gray-100 dark:bg-gray-800"
                        }`}>
                          <Check className={`w-3 h-3 ${getAccentColor()}`} />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-200/50 dark:border-gray-700/30">
                  <div className="flex items-center justify-center gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Secure checkout</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>256-bit encryption</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="flex-1 h-12 rounded-xl border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                      disabled={isProcessing || isLoading}
                      data-testid="button-cancel-checkout"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      disabled={isProcessing || isLoading}
                      className={`flex-1 h-12 rounded-xl font-medium transition-all duration-300 ${
                        isEnterprise
                          ? "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-lg shadow-amber-500/25"
                          : isPro
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
                            : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                      }`}
                      data-testid="button-confirm-checkout"
                    >
                      {isProcessing || isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>Continue to Payment</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </div>

                  <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                    You'll be redirected to Stripe for secure payment
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

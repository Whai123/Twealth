import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Check, Loader2, Shield, Lock, Sparkles, Crown, Zap, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Users, Calendar } from "lucide-react";
import { SiVisa, SiMastercard, SiApplepay, SiGooglepay } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements, PaymentRequestButtonElement } from "@stripe/react-stripe-js";
import { apiRequest, queryClient } from "@/lib/queryClient";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

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
  onSuccess: () => void;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

const cardElementOptionsDark = {
  style: {
    base: {
      fontSize: '16px',
      color: '#f9fafb',
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: '#6b7280',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center">
          <motion.div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              i + 1 <= currentStep 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
            initial={false}
            animate={{ scale: i + 1 === currentStep ? 1.1 : 1 }}
          >
            {i + 1 < currentStep ? <Check className="w-4 h-4" /> : i + 1}
          </motion.div>
          {i < totalSteps - 1 && (
            <div className={`w-8 h-0.5 mx-1 transition-colors ${
              i + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

function QuickPayButtons({ 
  plan, 
  localizedPrice, 
  onSuccess, 
  onError,
  isEnterprise,
  isPro
}: { 
  plan: SubscriptionPlan;
  localizedPrice: any;
  onSuccess: () => void;
  onError: (error: string) => void;
  isEnterprise: boolean;
  isPro: boolean;
}) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: localizedPrice.currency.code.toLowerCase(),
      total: {
        label: `Twealth ${plan.displayName}`,
        amount: Math.round(localizedPrice.amount * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
      }
    });

    pr.on('paymentmethod', async (ev) => {
      try {
        const response = await apiRequest("POST", "/api/subscription/create-payment-intent", { 
          planId: plan.id 
        });
        const data = await response.json();

        if (!data.clientSecret) {
          ev.complete('fail');
          onError("Unable to process payment");
          return;
        }

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          ev.complete('fail');
          onError(confirmError.message || "Payment failed");
        } else if (paymentIntent?.status === 'succeeded') {
          ev.complete('success');
          queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
          queryClient.invalidateQueries({ queryKey: ['/api/subscription/usage'] });
          onSuccess();
        } else if (paymentIntent?.status === 'requires_action') {
          ev.complete('success');
          const { error } = await stripe.confirmCardPayment(data.clientSecret);
          if (error) {
            onError(error.message || "Authentication failed");
          } else {
            queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
            queryClient.invalidateQueries({ queryKey: ['/api/subscription/usage'] });
            onSuccess();
          }
        } else {
          ev.complete('fail');
          onError("Payment could not be completed");
        }
      } catch (err: any) {
        ev.complete('fail');
        onError(err.message || "Payment failed");
      }
    });
  }, [stripe, plan, localizedPrice]);

  if (!canMakePayment || !paymentRequest) return null;

  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span>Express Checkout</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>
      
      <div className="rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
        <PaymentRequestButtonElement
          options={{
            paymentRequest,
            style: {
              paymentRequestButton: {
                type: 'default',
                theme: 'dark',
                height: '48px',
              },
            },
          }}
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span>Or pay with card</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

function EmbeddedPaymentForm({ 
  plan, 
  localizedPrice,
  userCurrency,
  onSuccess, 
  onBack,
  isEnterprise,
  isPro,
  onAuthError
}: { 
  plan: SubscriptionPlan;
  localizedPrice: any;
  userCurrency: string;
  onSuccess: () => void;
  onBack: () => void;
  isEnterprise: boolean;
  isPro: boolean;
  onAuthError: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [saveCard, setSaveCard] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const isFormComplete = cardComplete.cardNumber && cardComplete.cardExpiry && cardComplete.cardCvc;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!stripe || !elements) {
      setError("Payment system not initialized. Please try again.");
      return;
    }

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      setError("Card input not found");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await apiRequest("POST", "/api/subscription/create-payment-intent", { 
        planId: plan.id 
      });
      const data = await response.json();

      if (data.requiresSetup) {
        setError("Payment processing is being configured. Please try again later.");
        setIsProcessing(false);
        return;
      }

      const { clientSecret } = data;

      if (!clientSecret) {
        setError("Unable to initialize payment. Please try again.");
        setIsProcessing(false);
        return;
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumber,
        },
        setup_future_usage: saveCard ? 'off_session' : undefined,
      });

      if (result.error) {
        if (result.error.type === 'card_error' || result.error.type === 'validation_error') {
          setError(result.error.message || "Your card was declined. Please try a different card.");
        } else if (result.error.code === 'payment_intent_authentication_failure') {
          setError("Authentication failed. Please try again or use a different card.");
        } else {
          setError(result.error.message || "Payment failed. Please try again.");
        }
        setIsProcessing(false);
        return;
      }
      
      const { paymentIntent } = result;
      
      if (paymentIntent) {
        switch (paymentIntent.status) {
          case 'succeeded':
            queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
            queryClient.invalidateQueries({ queryKey: ['/api/subscription/usage'] });
            onSuccess();
            break;
          case 'requires_action':
          case 'requires_confirmation':
            const { error: actionError, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(clientSecret);
            
            if (actionError) {
              setError(actionError.message || "Authentication failed. Please try again.");
            } else if (confirmedIntent?.status === 'succeeded') {
              queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
              queryClient.invalidateQueries({ queryKey: ['/api/subscription/usage'] });
              onSuccess();
            } else {
              setError("Payment could not be completed. Please try again.");
            }
            break;
          case 'requires_payment_method':
            setError("Your card was declined. Please check your card details or try a different card.");
            setCardComplete({ cardNumber: false, cardExpiry: false, cardCvc: false });
            break;
          case 'processing':
            queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
            onSuccess();
            break;
          case 'canceled':
            setError("Payment was canceled. Please try again.");
            break;
          default:
            setError(`Unexpected payment status. Please contact support if the issue persists.`);
        }
      }
    } catch (err: any) {
      if (err.message?.includes('sign in') || err.message?.includes('401')) {
        onAuthError();
        return;
      }
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getAccentColor = () => {
    if (isEnterprise) return "from-amber-500 to-yellow-600";
    if (isPro) return "from-blue-600 to-indigo-600";
    return "from-gray-700 to-gray-900";
  };

  const currentOptions = isDark ? cardElementOptionsDark : cardElementOptions;
  const dailyCost = (localizedPrice.amount / 30).toFixed(2);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <StepIndicator currentStep={2} totalSteps={2} />
      
      <QuickPayButtons
        plan={plan}
        localizedPrice={localizedPrice}
        onSuccess={onSuccess}
        onError={setError}
        isEnterprise={isEnterprise}
        isPro={isPro}
      />

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Card Number
          </label>
          <div 
            className={`relative rounded-xl border transition-all duration-200 ${
              focusedField === 'number' 
                ? 'border-blue-500 ring-2 ring-blue-500/20' 
                : 'border-gray-200/50 dark:border-gray-700/50'
            } bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm`}
          >
            <div className="px-4 py-3.5">
              <CardNumberElement
                options={currentOptions}
                onFocus={() => setFocusedField('number')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setCardComplete(prev => ({ ...prev, cardNumber: e.complete }))}
              />
            </div>
            {cardComplete.cardNumber && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </motion.div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Expiry Date
            </label>
            <div 
              className={`relative rounded-xl border transition-all duration-200 ${
                focusedField === 'expiry' 
                  ? 'border-blue-500 ring-2 ring-blue-500/20' 
                  : 'border-gray-200/50 dark:border-gray-700/50'
              } bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm`}
            >
              <div className="px-4 py-3.5">
                <CardExpiryElement
                  options={currentOptions}
                  onFocus={() => setFocusedField('expiry')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setCardComplete(prev => ({ ...prev, cardExpiry: e.complete }))}
                />
              </div>
              {cardComplete.cardExpiry && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </motion.div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              CVC
            </label>
            <div 
              className={`relative rounded-xl border transition-all duration-200 ${
                focusedField === 'cvc' 
                  ? 'border-blue-500 ring-2 ring-blue-500/20' 
                  : 'border-gray-200/50 dark:border-gray-700/50'
              } bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm`}
            >
              <div className="px-4 py-3.5">
                <CardCvcElement
                  options={currentOptions}
                  onFocus={() => setFocusedField('cvc')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setCardComplete(prev => ({ ...prev, cardCvc: e.complete }))}
                />
              </div>
              {cardComplete.cardCvc && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/30">
        <Checkbox 
          id="save-card" 
          checked={saveCard} 
          onCheckedChange={(checked) => setSaveCard(checked as boolean)}
          data-testid="checkbox-save-card"
        />
        <label htmlFor="save-card" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
          Save card for future payments
        </label>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm"
            data-testid="alert-payment-error"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <Users className="w-3.5 h-3.5" />
          <span>Join 12,000+ users managing their wealth</span>
        </div>

        <Button
          type="submit"
          disabled={!stripe || !isFormComplete || isProcessing}
          className={`w-full h-12 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r ${getAccentColor()} text-white shadow-lg ${
            isEnterprise ? 'shadow-amber-500/25 hover:shadow-amber-500/40' : 
            isPro ? 'shadow-blue-500/25 hover:shadow-blue-500/40' : 
            'shadow-gray-500/25'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          data-testid="button-pay-now"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing Payment...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Pay {localizedPrice.currency.symbol}{localizedPrice.amount.toFixed(2)}</span>
            </div>
          )}
        </Button>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          Only {localizedPrice.currency.symbol}{dailyCost}/day
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isProcessing}
          className="w-full h-10 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
          data-testid="button-back-to-plan"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to plan details
        </Button>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-500 pt-2">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>256-bit SSL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          <span>PCI Compliant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>30-day guarantee</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 pt-1">
        <SiVisa className="w-8 h-5 text-gray-400" />
        <SiMastercard className="w-8 h-5 text-gray-400" />
        <SiApplepay className="w-8 h-5 text-gray-400" />
        <SiGooglepay className="w-8 h-5 text-gray-400" />
      </div>
    </form>
  );
}

function PaymentSuccessView({ plan, onClose }: { plan: SubscriptionPlan; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8 space-y-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.2 }}
        className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30"
      >
        <Check className="w-10 h-10 text-white" />
      </motion.div>

      <div className="space-y-2">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 dark:text-white"
        >
          Welcome to {plan.displayName}!
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 dark:text-gray-400"
        >
          Your subscription is now active. Enjoy your premium features!
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={onClose}
          className="px-8 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium shadow-lg shadow-green-500/25"
          data-testid="button-close-success"
        >
          Start Exploring
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default function GlassmorphismCheckoutModal({
  isOpen,
  onClose,
  plan,
  localizedPrice,
  userCurrency,
  onSuccess,
}: GlassmorphismCheckoutModalProps) {
  const [step, setStep] = useState<'confirm' | 'payment' | 'success'>('confirm');

  useEffect(() => {
    if (!isOpen) {
      setStep('confirm');
    }
  }, [isOpen]);

  if (!plan) return null;

  const isPro = plan.name === "pro";
  const isEnterprise = plan.name === "enterprise";
  const dailyCost = (localizedPrice.amount / 30).toFixed(2);

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

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const handlePaymentSuccess = () => {
    setStep('success');
    onSuccess();
  };

  const handleClose = () => {
    setStep('confirm');
    onClose();
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
            onClick={step !== 'payment' ? handleClose : undefined}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none overflow-y-auto"
          >
            <div 
              className={`relative w-full max-w-md pointer-events-auto my-4 ${getBorderGlow()}`}
              data-testid="modal-checkout"
            >
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${getGradientColors()} blur-xl opacity-50`} />
              
              <div className="relative rounded-3xl border border-white/20 dark:border-white/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-700/50 transition-colors z-10"
                  data-testid="button-close-modal"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>

                <AnimatePresence mode="wait">
                  {step === 'confirm' && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative p-6 pb-4">
                        <StepIndicator currentStep={1} totalSteps={2} />
                        
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
                                <div className="flex items-center gap-2">
                                  {userCurrency !== 'USD' && (
                                    <p className="text-white/60 text-xs">
                                      ≈ ${parseFloat(plan.priceUsd).toFixed(2)} USD
                                    </p>
                                  )}
                                  <p className="text-white/60 text-xs">
                                    ({localizedPrice.currency.symbol}{dailyCost}/day)
                                  </p>
                                </div>
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
                        <div className="flex items-center justify-center gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
                          <Users className="w-3.5 h-3.5" />
                          <span>Join 12,000+ users managing their wealth</span>
                        </div>

                        <div className="flex items-center justify-center gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" />
                            <span>Secure checkout</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" />
                            <span>256-bit encryption</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>30-day guarantee</span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1 h-12 rounded-xl border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                            data-testid="button-cancel-checkout"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleProceedToPayment}
                            className={`flex-1 h-12 rounded-xl font-medium transition-all duration-300 ${
                              isEnterprise
                                ? "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-lg shadow-amber-500/25"
                                : isPro
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
                                  : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                            }`}
                            data-testid="button-continue-to-payment"
                          >
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              <span>Continue</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 'payment' && (
                    <motion.div
                      key="payment"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="p-6"
                    >
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-2">
                          {getPlanIcon()}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {plan.displayName}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {localizedPrice.currency.symbol}{localizedPrice.amount.toFixed(2)}/{plan.billingInterval}
                            </p>
                          </div>
                        </div>
                      </div>

                      {stripePromise ? (
                        <Elements stripe={stripePromise}>
                          <EmbeddedPaymentForm
                            plan={plan}
                            localizedPrice={localizedPrice}
                            userCurrency={userCurrency}
                            onSuccess={handlePaymentSuccess}
                            onBack={() => setStep('confirm')}
                            isEnterprise={isEnterprise}
                            isPro={isPro}
                            onAuthError={() => {
                              handleClose();
                              window.location.href = '/auth';
                            }}
                          />
                        </Elements>
                      ) : (
                        <div className="text-center py-8 space-y-4">
                          <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              Payment Not Available
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Payment processing is being configured. Please try again later or contact support.
                            </p>
                          </div>
                          <Button
                            onClick={() => setStep('confirm')}
                            variant="outline"
                            className="mt-4"
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {step === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="p-6"
                    >
                      <PaymentSuccessView plan={plan} onClose={handleClose} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

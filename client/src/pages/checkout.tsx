import { useEffect, useState } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';
import { useLocation, useRoute } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

// Load Stripe outside component to avoid recreating on every render
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
 console.error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
 ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
 : null;

interface SubscriptionPlan {
 id: string;
 name: string;
 displayName: string;
 description: string;
 priceUsd: string;
 priceThb: string;
 aiChatLimit: number;
 billingInterval: string;
}

function CheckoutForm({ planId }: { planId: string }) {
 const stripe = useStripe();
 const elements = useElements();
 const { toast } = useToast();
 const [, setLocation] = useLocation();
 const [isProcessing, setIsProcessing] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 if (!stripe || !elements) {
 return;
 }

 setIsProcessing(true);

 try {
 const { error } = await stripe.confirmPayment({
 elements,
 confirmParams: {
 return_url: `${window.location.origin}/subscription?payment=success`,
 },
 });

 if (error) {
 toast({
 title: "Payment Failed",
 description: error.message,
 variant: "destructive",
 });
 }
 } catch (err: any) {
 toast({
 title: "Payment Error",
 description: err.message || "An unexpected error occurred",
 variant: "destructive",
 });
 } finally {
 setIsProcessing(false);
 }
 };

 return (
 <form onSubmit={handleSubmit} className="space-y-6">
 <PaymentElement />
 
 <div className="flex gap-3">
 <Button
 type="button"
 variant="outline"
 onClick={() => setLocation('/subscription')}
 className="flex-1"
 data-testid="button-back"
 >
 <ArrowLeft className="w-4 h-4 mr-2" />
 Back
 </Button>
 <Button
 type="submit"
 disabled={!stripe || isProcessing}
 className="flex-1 bg-white dark:bg-gray-900"
 data-testid="button-submit-payment"
 >
 {isProcessing ? (
 <>
 <Loader2 className="w-4 h-4 mr-2" />
 Processing...
 </>
 ) : (
 <>
 <CreditCard className="w-4 h-4 mr-2" />
 Subscribe Now
 </>
 )}
 </Button>
 </div>

 <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
 <Shield className="w-4 h-4" />
 <span>Secured by Stripe • Cancel anytime</span>
 </div>
 </form>
 );
}

export default function CheckoutPage() {
 const [, params] = useRoute('/checkout/:planId');
 const planId = params?.planId;
 const [, setLocation] = useLocation();
 const [clientSecret, setClientSecret] = useState<string>('');
 const { toast } = useToast();

 const { data: plans, isLoading: planLoading } = useQuery<SubscriptionPlan[]>({
 queryKey: ['/api/subscription/plans'],
 enabled: !!planId,
 });

 const plan = plans?.find(p => p.id === planId);

 useEffect(() => {
 if (!planId) {
 toast({
 title: "Invalid Plan",
 description: "No plan selected. Redirecting to subscription page.",
 variant: "destructive",
 });
 setLocation('/subscription');
 return;
 }

 // Create subscription session
 const createSubscription = async () => {
 try {
 // Use environment variable for Stripe Price ID or construct it from plan name
 const stripePriceId = import.meta.env[`VITE_STRIPE_PRICE_${plan?.name?.toUpperCase()}`] || 
 `price_${plan?.name?.toLowerCase()}`;
 
 const response = await apiRequest('POST', '/api/subscription/create-subscription', {
 planId,
 priceId: stripePriceId,
 });

 if (response.ok) {
 const data = await response.json();
 setClientSecret(data.clientSecret);
 } else {
 const error = await response.json();
 toast({
 title: "Setup Failed",
 description: error.message || "Failed to setup payment",
 variant: "destructive",
 });
 setLocation('/subscription');
 }
 } catch (error: any) {
 toast({
 title: "Error",
 description: error.message || "An error occurred",
 variant: "destructive",
 });
 setLocation('/subscription');
 }
 };

 if (plan) {
 createSubscription();
 }
 }, [planId, plan]);

 if (!stripePromise) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-orange-50 dark:bg-orange-900/20">
 <Card className="max-w-md">
 <CardHeader>
 <CardTitle className="text-red-600">Payment Unavailable</CardTitle>
 <CardDescription>
 Stripe is not configured. Please contact support.
 </CardDescription>
 </CardHeader>
 </Card>
 </div>
 );
 }

 if (planLoading || !plan) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-orange-50 dark:bg-orange-900/20">
 <Card className="w-full max-w-2xl">
 <CardHeader>
 <Skeleton className="h-8 w-48" />
 <Skeleton className="h-4 w-full" />
 </CardHeader>
 <CardContent className="space-y-4">
 <Skeleton className="h-40 w-full" />
 <Skeleton className="h-12 w-full" />
 </CardContent>
 </Card>
 </div>
 );
 }

 if (!clientSecret) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-orange-50 dark:bg-orange-900/20">
 <Card className="w-full max-w-2xl">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Loader2 className="w-5 h-5" />
 Setting up your subscription...
 </CardTitle>
 </CardHeader>
 </Card>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-orange-50 dark:bg-orange-900/20 py-12 px-4">
 <div className="container max-w-2xl mx-auto space-y-6">
 {/* Plan Summary */}
 <Card className="border-0 shadow-2xl">
 <CardHeader>
 <CardTitle className="text-2xl flex items-center gap-2">
 <CheckCircle2 className="w-6 h-6 text-green-500" />
 Subscribe to {plan.displayName}
 </CardTitle>
 <CardDescription>{plan.description}</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="flex items-baseline justify-between mb-6 p-6 bg-white dark:bg-gray-900 dark:from-orange-900/20 dark:to-pink-900/20 rounded-xl">
 <div>
 <div className="text-sm text-muted-foreground mb-1">Monthly Subscription</div>
 <div className="text-4xl font-bold text-foreground">
 ${parseFloat(plan.priceUsd).toFixed(2)}
 </div>
 </div>
 <div className="text-right">
 <div className="text-sm text-muted-foreground mb-1">AI Chats Included</div>
 <div className="text-3xl font-bold text-primary">
 {plan.aiChatLimit}
 </div>
 </div>
 </div>

 <div className="space-y-2 text-sm">
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-green-500" />
 <span>Cancel anytime, no commitments</span>
 </div>
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-green-500" />
 <span>Instant activation after payment</span>
 </div>
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-green-500" />
 <span>Secure payment processing by Stripe</span>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Payment Form */}
 <Card className="border-0 shadow-2xl">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <CreditCard className="w-5 h-5" />
 Payment Details
 </CardTitle>
 <CardDescription>
 Enter your payment information to complete subscription
 </CardDescription>
 </CardHeader>
 <CardContent>
 <Elements 
 stripe={stripePromise} 
 options={{ 
 clientSecret,
 appearance: {
 theme: 'stripe',
 variables: {
 colorPrimary: '#f97316',
 },
 },
 }}
 >
 <CheckoutForm planId={planId!} />
 </Elements>
 </CardContent>
 </Card>
 </div>
 </div>
 );
}

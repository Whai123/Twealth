import { useState } from"react";
import { Link } from"wouter";
import { Check, X, Shield } from"lucide-react";
import { useQuery } from"@tanstack/react-query";
import { Button } from"@/components/ui/button";
import logoUrl from"@assets/5-removebg-preview_1761748275134.png";

interface Plan {
 id: string;
 name: string;
 displayName: string;
 description: string;
 priceUsd: string;
 billingInterval: string;
 features: string[];
 aiChatLimit: number;
 aiDeepAnalysisLimit: number;
}

export default function Pricing() {
 const { data: plans = [], isLoading } = useQuery<Plan[]>({
  queryKey: ["/api/subscription/plans"],
 });

 const { data: currentSubscription } = useQuery({
  queryKey: ["/api/subscription/current"],
 });

 const freePlan = plans.find(p => p.name ==="Free") || {
  name:"Free",
  displayName:"Free",
  description:"Essential features to get started",
  priceUsd:"0",
  billingInterval:"forever",
  aiChatLimit: 10,
  aiDeepAnalysisLimit: 0,
  features: ["basic_tracking","10_ai_chats_monthly","basic_goals","mobile_app"]
 };

 const proPlan = plans.find(p => p.name ==="Pro") || {
  name:"Pro",
  displayName:"Pro",
  description:"Complete financial management platform",
  priceUsd:"25.00",
  billingInterval:"month",
  aiChatLimit: 500,
  aiDeepAnalysisLimit: 500,
  features: ["full_tracking","ai_chat_unlimited","advanced_goals","group_planning","crypto_tracking","advanced_analytics","priority_insights","all_features"]
 };

 const currentPlan = (currentSubscription as any)?.subscription?.planName ||"Free";

 const features = [
  { name:"AI Financial Advisor", free:"10 chats/month", pro:"500 chats/month" },
  { name:"Transaction tracking", free: true, pro: true },
  { name:"Financial goals", free:"3 goals", pro:"Unlimited" },
  { name:"Budget insights", free: true, pro: true },
  { name:"Transaction history", free:"30 days", pro:"Unlimited" },
  { name:"Crypto tracking", free: false, pro: true },
  { name:"Group planning", free: false, pro: true },
  { name:"Advanced analytics", free: false, pro: true },
  { name:"Market data", free: false, pro: true },
  { name:"Export & reports", free: false, pro: true },
  { name:"Priority support", free: false, pro: true },
 ];

 return (
  <div className="min-h-screen bg-white dark:bg-black">
   {/* Header */}
   <header className="border-b border-gray-200 dark:border-gray-800">
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
     <Link href="/">
      <a className="flex items-center gap-3">
       <img src={logoUrl} alt="Twealth" className="w-8 h-8" />
       <span className="text-xl font-semibold text-black dark:text-white">Twealth</span>
      </a>
     </Link>
     <Link href="/dashboard">
      <Button variant="ghost" className="text-sm font-medium">
       Dashboard
      </Button>
     </Link>
    </div>
   </header>

   {/* Hero */}
   <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-12 text-center">
    <h1 className="text-5xl font-semibold tracking-tight text-black dark:text-white mb-4">
     Simple, transparent pricing
    </h1>
    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
     Choose the plan that works for you. Free to start, upgrade anytime.
    </p>
   </section>

   {/* Pricing Cards */}
   <section className="max-w-5xl mx-auto px-6 lg:px-8 pb-20">
    <div className="grid md:grid-cols-2 gap-8">
     {/* Free Plan */}
     <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-8">
      <div className="mb-8">
       <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
        {freePlan.displayName}
       </h2>
       <p className="text-gray-600 dark:text-gray-400 mb-6">
        {freePlan.description}
       </p>
       <div className="flex items-baseline gap-2 mb-6">
        <span className="text-5xl font-semibold text-black dark:text-white">
         ${freePlan.priceUsd}
        </span>
        <span className="text-gray-600 dark:text-gray-400">
         /{freePlan.billingInterval}
        </span>
       </div>
       <Button
        variant={currentPlan ==="Free" ?"outline" :"default"}
        className="w-full h-12 font-medium"
        disabled={currentPlan ==="Free"}
        data-testid="button-free-plan"
       >
        {currentPlan ==="Free" ?"Current plan" :"Get started"}
       </Button>
      </div>
      <div className="space-y-3 text-sm">
       <div className="flex items-center gap-3">
        <Check className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
        <span className="text-gray-600 dark:text-gray-400">10 AI chats per month</span>
       </div>
       <div className="flex items-center gap-3">
        <Check className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
        <span className="text-gray-600 dark:text-gray-400">Up to 3 financial goals</span>
       </div>
       <div className="flex items-center gap-3">
        <Check className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
        <span className="text-gray-600 dark:text-gray-400">30-day transaction history</span>
       </div>
       <div className="flex items-center gap-3">
        <Check className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
        <span className="text-gray-600 dark:text-gray-400">Basic financial tracking</span>
       </div>
       <div className="flex items-center gap-3">
        <Check className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
        <span className="text-gray-600 dark:text-gray-400">11 language support</span>
       </div>
      </div>
     </div>

     {/* Pro Plan */}
     <div className="border-2 border-black dark:border-white rounded-lg p-8 relative">
      <div className="absolute top-0 right-8 -translate-y-1/2">
       <span className="bg-black dark:bg-white text-white dark:text-black text-xs font-semibold px-3 py-1 rounded-full">
        Popular
       </span>
      </div>
      <div className="mb-8">
       <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
        {proPlan.displayName}
       </h2>
       <p className="text-gray-600 dark:text-gray-400 mb-6">
        {proPlan.description}
       </p>
       <div className="flex items-baseline gap-2 mb-6">
        <span className="text-5xl font-semibold text-black dark:text-white">
         ${proPlan.priceUsd}
        </span>
        <span className="text-gray-600 dark:text-gray-400">
         /{proPlan.billingInterval}
        </span>
       </div>
       <Link href="/upgrade" className="block">
        <Button
         className="w-full h-12 font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
         disabled={currentPlan ==="Pro"}
         data-testid="button-pro-plan"
        >
         {currentPlan ==="Pro" ?"Current plan" :"Upgrade to Pro"}
        </Button>
       </Link>
      </div>
      <div className="space-y-3 text-sm">
       <div className="flex items-center gap-3">
        <Check className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
        <span className="text-gray-600 dark:text-gray-400">500 AI chats per month</span>
       </div>
       <div className="flex items-center gap-3">
        <Check className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
        <span className="text-gray-600 dark:text-gray-400">Unlimited financial goals</span>
       </div>
       <div className="flex items-center gap-3">
        <Check className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
        <span className="text-gray-600 dark:text-gray-400">Unlimited transaction history</span>
       </div>
       <div className="flex items-center gap-3">
        <Check className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
        <span className="text-gray-600 dark:text-gray-400">Crypto portfolio tracking</span>
       </div>
       <div className="flex items-center gap-3">
        <Check className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
        <span className="text-gray-600 dark:text-gray-400">Group financial planning</span>
       </div>
       <div className="flex items-center gap-3">
        <Check className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
        <span className="text-gray-600 dark:text-gray-400">Advanced analytics & reports</span>
       </div>
       <div className="flex items-center gap-3">
        <Check className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
        <span className="text-gray-600 dark:text-gray-400">Real-time market data</span>
       </div>
       <div className="flex items-center gap-3">
        <Check className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
        <span className="text-gray-600 dark:text-gray-400">Priority support</span>
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* Feature Comparison */}
   <section className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
    <div className="max-w-5xl mx-auto px-6 lg:px-8 py-20">
     <h2 className="text-3xl font-semibold text-black dark:text-white mb-12 text-center">
      Compare plans
     </h2>
     <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      <table className="w-full">
       <thead className="border-b border-gray-200 dark:border-gray-800">
        <tr>
         <th className="text-left py-4 px-6 text-sm font-semibold text-black dark:text-white">
          Feature
         </th>
         <th className="text-center py-4 px-6 text-sm font-semibold text-black dark:text-white w-32">
          Free
         </th>
         <th className="text-center py-4 px-6 text-sm font-semibold text-black dark:text-white w-32">
          Pro
         </th>
        </tr>
       </thead>
       <tbody>
        {features.map((feature, idx) => (
         <tr key={idx} className="border-b border-gray-200 dark:border-gray-800 last:border-0">
          <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
           {feature.name}
          </td>
          <td className="py-4 px-6 text-center text-sm">
           {typeof feature.free === 'boolean' ? (
            feature.free ? (
             <Check className="w-4 h-4 text-black dark:text-white mx-auto" />
            ) : (
             <X className="w-4 h-4 text-gray-300 dark:text-gray-700 mx-auto" />
            )
           ) : (
            <span className="text-gray-600 dark:text-gray-400">{feature.free}</span>
           )}
          </td>
          <td className="py-4 px-6 text-center text-sm">
           {typeof feature.pro === 'boolean' ? (
            feature.pro ? (
             <Check className="w-4 h-4 text-black dark:text-white mx-auto" />
            ) : (
             <X className="w-4 h-4 text-gray-300 dark:text-gray-700 mx-auto" />
            )
           ) : (
            <span className="text-gray-600 dark:text-gray-400">{feature.pro}</span>
           )}
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    </div>
   </section>

   {/* Trust Section */}
   <section className="border-t border-gray-200 dark:border-gray-800">
    <div className="max-w-5xl mx-auto px-6 lg:px-8 py-20 text-center">
     <h2 className="text-3xl font-semibold text-black dark:text-white mb-12">
      Trusted by thousands
     </h2>
     <div className="grid md:grid-cols-3 gap-8 mb-12">
      <div>
       <div className="text-black dark:text-white font-semibold mb-2">Enterprise security</div>
       <p className="text-sm text-gray-600 dark:text-gray-400">
        Bank-level encryption and security
       </p>
      </div>
      <div>
       <div className="text-black dark:text-white font-semibold mb-2">99.9% uptime</div>
       <p className="text-sm text-gray-600 dark:text-gray-400">
        Always available when you need it
       </p>
      </div>
      <div>
       <div className="text-black dark:text-white font-semibold mb-2">24/7 support</div>
       <p className="text-sm text-gray-600 dark:text-gray-400">
        Help whenever you need it
       </p>
      </div>
     </div>
     <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <Shield className="w-4 h-4" />
      <span>SOC 2 Type II Certified</span>
     </div>
    </div>
   </section>

   {/* Footer */}
   <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
     <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
      <div>
       <h4 className="text-sm font-semibold text-black dark:text-white mb-4">Product</h4>
       <ul className="space-y-3">
        <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Features</a></li>
        <li><a href="/pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Pricing</a></li>
        <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Security</a></li>
       </ul>
      </div>
      <div>
       <h4 className="text-sm font-semibold text-black dark:text-white mb-4">Company</h4>
       <ul className="space-y-3">
        <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">About</a></li>
        <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Blog</a></li>
        <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Careers</a></li>
       </ul>
      </div>
      <div>
       <h4 className="text-sm font-semibold text-black dark:text-white mb-4">Resources</h4>
       <ul className="space-y-3">
        <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Documentation</a></li>
        <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Help Center</a></li>
        <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Contact</a></li>
       </ul>
      </div>
      <div>
       <h4 className="text-sm font-semibold text-black dark:text-white mb-4">Legal</h4>
       <ul className="space-y-3">
        <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Privacy</a></li>
        <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Terms</a></li>
        <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Cookie Policy</a></li>
       </ul>
      </div>
     </div>
     <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-3">
       <img src={logoUrl} alt="Twealth" className="w-6 h-6" />
       <span className="text-sm text-gray-600 dark:text-gray-400">© 2025 Twealth. All rights reserved.</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
       <Shield className="w-3 h-3" />
       <span>SOC 2 Type II Certified</span>
      </div>
     </div>
    </div>
   </footer>
  </div>
 );
}

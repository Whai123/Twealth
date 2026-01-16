import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, TrendingUp, Sparkles, Target } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
    const [, setLocation] = useLocation();

    const quickLinks = [
        { icon: Home, label: "Dashboard", path: "/", color: "bg-blue-500" },
        { icon: TrendingUp, label: "Money", path: "/money-tracking", color: "bg-emerald-500" },
        { icon: Sparkles, label: "AI Assistant", path: "/ai-assistant", color: "bg-violet-500" },
        { icon: Target, label: "Goals", path: "/financial-goals", color: "bg-amber-500" },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
            <div className="max-w-md w-full text-center space-y-8">
                {/* 404 */}
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl" />
                    <h1 className="relative text-8xl font-bold text-blue-600 dark:text-blue-400">
                        404
                    </h1>
                </div>

                {/* Message */}
                <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                        Page Not Found
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-center">
                    <Button
                        onClick={() => window.history.back()}
                        variant="outline"
                        className="h-11 px-5 rounded-xl"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                    <Button
                        onClick={() => setLocation("/")}
                        className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Dashboard
                    </Button>
                </div>

                {/* Quick Links */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                        Quick Access
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                        {quickLinks.map((link) => (
                            <button
                                key={link.path}
                                onClick={() => setLocation(link.path)}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <div className={`w-10 h-10 rounded-xl ${link.color} flex items-center justify-center`}>
                                    <link.icon className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                    {link.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

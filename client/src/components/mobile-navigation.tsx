import { useState, useEffect, memo, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home,
    Target,
    Plus,
    Brain,
    Wallet,
    X
} from "lucide-react";
import { cn } from "../lib/utils";
import { Dialog, DialogContent } from "./ui/dialog";
import GoalForm from "./forms/goal-form";
import TransactionForm from "./forms/transaction-form";

const NAV_ITEMS = [
    { name: "Home", href: "/", icon: Home },
    { name: "AI", href: "/ai-assistant", icon: Brain },
    { name: "Money", href: "/money-tracking", icon: Wallet },
    { name: "Goals", href: "/financial-goals", icon: Target },
];

function MobileNavigationComponent() {
    const [location] = useLocation();
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [activeForm, setActiveForm] = useState<'goal' | 'transaction' | null>(null);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!isMobile) return null;

    return (
        <>
            {/* Floating Add Button */}
            <motion.button
                onClick={() => setShowQuickAdd(true)}
                className="fixed left-4 z-50 md:hidden w-12 h-12 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg flex items-center justify-center"
                style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Plus className="w-5 h-5" />
            </motion.button>

            {/* Quick Add Menu */}
            <AnimatePresence>
                {showQuickAdd && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center md:hidden"
                        onClick={() => setShowQuickAdd(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 rounded-t-3xl p-6 w-full max-w-md"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-6" />
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Quick Add</h3>
                            <div className="flex gap-3">
                                <motion.button
                                    onClick={() => { setActiveForm('transaction'); setShowQuickAdd(false); }}
                                    className="flex-1 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800"
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-zinc-900 dark:text-white">Transaction</p>
                                </motion.button>
                                <motion.button
                                    onClick={() => { setActiveForm('goal'); setShowQuickAdd(false); }}
                                    className="flex-1 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800"
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Target className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-zinc-900 dark:text-white">Goal</p>
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Form Dialogs */}
            <Dialog open={activeForm === 'transaction'} onOpenChange={(open) => !open && setActiveForm(null)}>
                <DialogContent className="max-w-md">
                    <TransactionForm onSuccess={() => setActiveForm(null)} />
                </DialogContent>
            </Dialog>

            <Dialog open={activeForm === 'goal'} onOpenChange={(open) => !open && setActiveForm(null)}>
                <DialogContent className="max-w-md">
                    <GoalForm onSuccess={() => setActiveForm(null)} />
                </DialogContent>
            </Dialog>

            {/* Bottom Tab Bar */}
            <nav
                className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-900 md:hidden z-40"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
            >
                <div className="flex items-center justify-around px-2 py-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = location === item.href ||
                            (item.href !== "/" && location.startsWith(item.href));

                        return (
                            <Link key={item.name} href={item.href}>
                                <motion.div
                                    className={cn(
                                        "flex flex-col items-center justify-center w-16 py-2 rounded-2xl",
                                        isActive
                                            ? "bg-zinc-900 dark:bg-white"
                                            : ""
                                    )}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <item.icon className={cn(
                                        "w-5 h-5 mb-0.5",
                                        isActive ? "text-white dark:text-zinc-900" : "text-zinc-400"
                                    )} />
                                    <span className={cn(
                                        "text-[10px] font-medium",
                                        isActive ? "text-white dark:text-zinc-900" : "text-zinc-400"
                                    )}>
                                        {item.name}
                                    </span>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Spacer */}
            <div className="h-20 md:hidden" />
        </>
    );
}

const MobileNavigation = memo(MobileNavigationComponent);
export default MobileNavigation;

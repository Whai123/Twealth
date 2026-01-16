import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/userContext";
import { Loader2, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, ShoppingBag, Coffee, Car, Home, Zap, Film, Heart, Briefcase, Gift, Wallet } from "lucide-react";

const transactionFormSchema = z.object({
    amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Must be positive"),
    type: z.enum(["income", "expense", "transfer"]),
    category: z.string().optional(),
    description: z.string().optional(),
    goalId: z.string().optional(),
    destination: z.string().optional(),
    date: z.string().min(1, "Date is required"),
});

type TransactionFormData = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
    onSuccess?: () => void;
}

const EXPENSE_CATEGORIES = [
    { value: "groceries", label: "Groceries", icon: ShoppingBag },
    { value: "dining", label: "Dining", icon: Coffee },
    { value: "transport", label: "Transport", icon: Car },
    { value: "rent", label: "Rent", icon: Home },
    { value: "utilities", label: "Utilities", icon: Zap },
    { value: "entertainment", label: "Fun", icon: Film },
    { value: "healthcare", label: "Health", icon: Heart },
    { value: "shopping", label: "Shopping", icon: ShoppingBag },
];

const INCOME_CATEGORIES = [
    { value: "salary", label: "Salary", icon: Briefcase },
    { value: "freelance", label: "Freelance", icon: Wallet },
    { value: "investment", label: "Investment", icon: ArrowUpRight },
    { value: "gift", label: "Gift", icon: Gift },
];

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useUser();

    const { data: goals } = useQuery({
        queryKey: ["/api/financial-goals"],
        queryFn: () => fetch("/api/financial-goals").then(res => res.json()),
    });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<TransactionFormData>({
        resolver: zodResolver(transactionFormSchema),
        defaultValues: {
            type: "expense",
            date: new Date().toISOString().split('T')[0],
        },
    });

    const selectedType = watch("type");
    const selectedCategory = watch("category");

    const createTransactionMutation = useMutation({
        mutationFn: (data: TransactionFormData) =>
            apiRequest("POST", "/api/transactions", {
                ...data,
                userId: user?.id,
                amount: parseFloat(data.amount),
                date: new Date(data.date).toISOString(),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
            toast({ title: "Transaction added!" });
            onSuccess?.();
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
        onSettled: () => setIsSubmitting(false),
    });

    const onSubmit = (data: TransactionFormData) => {
        if (!user) {
            toast({ title: "Sign in required", variant: "destructive" });
            return;
        }
        if (new Date(data.date) > new Date()) {
            toast({ title: "Invalid date", description: "Can't be in the future", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        createTransactionMutation.mutate(data);
    };

    const handleTypeChange = (type: string) => {
        setValue("type", type as any);
        setValue("category", "");
    };

    const categories = selectedType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    return (
        <div className="p-1">
            {/* Type Tabs */}
            <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-6">
                {[
                    { value: "expense", label: "Expense", icon: ArrowDownLeft, color: "text-red-500" },
                    { value: "income", label: "Income", icon: ArrowUpRight, color: "text-emerald-500" },
                    { value: "transfer", label: "Transfer", icon: ArrowLeftRight, color: "text-blue-500" },
                ].map((type) => (
                    <button
                        key={type.value}
                        type="button"
                        onClick={() => handleTypeChange(type.value)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${selectedType === type.value
                                ? "bg-white dark:bg-zinc-900 shadow-sm"
                                : "hover:bg-zinc-50 dark:hover:bg-zinc-700"
                            }`}
                    >
                        <type.icon className={`w-4 h-4 ${selectedType === type.value ? type.color : "text-zinc-400"}`} />
                        <span className={selectedType === type.value ? "text-zinc-900 dark:text-white" : "text-zinc-500"}>
                            {type.label}
                        </span>
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Amount */}
                <div>
                    <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Amount</Label>
                    <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-medium text-zinc-400">$</span>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register("amount")}
                            placeholder="0.00"
                            className="h-16 pl-12 text-3xl font-bold rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>}
                </div>

                {/* Description */}
                <div>
                    <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Description <span className="text-zinc-400 font-normal">(helps AI categorize)</span>
                    </Label>
                    <Input
                        {...register("description")}
                        placeholder="e.g., Starbucks, Gas station, Netflix..."
                        className="mt-2 h-12 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Category Grid */}
                {selectedType !== "transfer" && (
                    <div>
                        <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Category</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {categories.map((cat) => (
                                <motion.button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setValue("category", cat.value)}
                                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${selectedCategory === cat.value
                                            ? selectedType === "income"
                                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                                : "border-red-400 bg-red-50 dark:bg-red-900/20"
                                            : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                                        }`}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <cat.icon className={`w-5 h-5 ${selectedCategory === cat.value
                                            ? selectedType === "income" ? "text-emerald-500" : "text-red-500"
                                            : "text-zinc-400"
                                        }`} />
                                    <span className={`text-xs font-medium ${selectedCategory === cat.value
                                            ? selectedType === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                                            : "text-zinc-600 dark:text-zinc-400"
                                        }`}>
                                        {cat.label}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Transfer Options */}
                {selectedType === "transfer" && (
                    <div>
                        <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Transfer to</Label>
                        <Select value={selectedCategory || ""} onValueChange={(val) => setValue("category", val)}>
                            <SelectTrigger className="mt-2 h-12 rounded-xl">
                                <SelectValue placeholder="Select destination" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="savings">Savings Account</SelectItem>
                                <SelectItem value="investment">Investment Account</SelectItem>
                                <SelectItem value="goal_contribution">Financial Goal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Goal Selection for Goal Contribution */}
                {selectedType === "transfer" && selectedCategory === "goal_contribution" && (
                    <div>
                        <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Which goal?</Label>
                        <Select value={watch("goalId") || ""} onValueChange={(val) => setValue("goalId", val)}>
                            <SelectTrigger className="mt-2 h-12 rounded-xl">
                                <SelectValue placeholder="Select a goal" />
                            </SelectTrigger>
                            <SelectContent>
                                {(goals || []).filter((g: any) => g.status === "active").map((goal: any) => (
                                    <SelectItem key={goal.id} value={goal.id}>
                                        {goal.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Date */}
                <div>
                    <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Date</Label>
                    <Input
                        type="date"
                        {...register("date")}
                        className="mt-2 h-12 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full h-12 rounded-xl font-medium text-base ${selectedType === "income"
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : selectedType === "expense"
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-blue-600 hover:bg-blue-700"
                        } text-white`}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                        </>
                    ) : (
                        `Add ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}`
                    )}
                </Button>
            </form>
        </div>
    );
}

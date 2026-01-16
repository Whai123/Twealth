import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/userContext";
import { Loader2, Plus, TrendingUp, Target } from "lucide-react";

const addFundsFormSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Must be positive"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

type AddFundsFormData = z.infer<typeof addFundsFormSchema>;

interface AddFundsFormProps {
  goalId: string;
  goalTitle: string;
  currentAmount: string;
  targetAmount: string;
  onSuccess?: () => void;
}

const QUICK_AMOUNTS = [50, 100, 250, 500];

export default function AddFundsForm({ goalId, goalTitle, currentAmount, targetAmount, onSuccess }: AddFundsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddFundsFormData>({
    resolver: zodResolver(addFundsFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const currentValue = parseFloat(currentAmount) || 0;
  const targetValue = parseFloat(targetAmount) || 0;
  const progress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
  const remaining = targetValue - currentValue;
  const enteredAmount = parseFloat(watch("amount") || "0");
  const newProgress = targetValue > 0 ? ((currentValue + enteredAmount) / targetValue) * 100 : 0;

  const createTransactionMutation = useMutation({
    mutationFn: (data: AddFundsFormData) =>
      apiRequest("POST", "/api/transactions", {
        userId: user?.id,
        amount: parseFloat(data.amount),
        type: "transfer",
        category: "savings",
        description: data.description || `Added funds to ${goalTitle}`,
        goalId: goalId,
        date: new Date(data.date).toISOString(),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: `$${parseFloat(variables.amount).toLocaleString()} added to ${goalTitle}!` });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: AddFundsFormData) => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    if (new Date(data.date) > new Date()) {
      toast({ title: "Invalid date", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    createTransactionMutation.mutate(data);
  };

  return (
    <div className="p-1">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center">
          <Plus className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Add Funds</h2>
          <p className="text-sm text-zinc-500">{goalTitle}</p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-zinc-400" />
            <span className="text-sm text-zinc-500">Progress</span>
          </div>
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">
            ${currentValue.toLocaleString()} / ${targetValue.toLocaleString()}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-full relative"
            initial={{ width: `${progress}%` }}
            animate={{ width: `${Math.min(newProgress, 100)}%` }}
          >
            {enteredAmount > 0 && (
              <motion.div
                className="absolute right-0 top-0 h-full w-1 bg-emerald-300"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
          </motion.div>
        </div>

        <div className="flex justify-between mt-2 text-xs text-zinc-500">
          <span>{Math.round(progress)}% saved</span>
          <span>${remaining.toLocaleString()} to go</span>
        </div>

        {/* Preview */}
        {enteredAmount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              +${enteredAmount.toLocaleString()} → {Math.round(newProgress)}% complete
            </span>
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Quick Amounts */}
        <div>
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Quick Add</Label>
          <div className="flex gap-2 mt-2">
            {QUICK_AMOUNTS.map((amount) => (
              <motion.button
                key={amount}
                type="button"
                onClick={() => setValue("amount", amount.toString())}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${watch("amount") === amount.toString()
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                  }`}
                whileTap={{ scale: 0.95 }}
              >
                ${amount}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div>
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Amount</Label>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-zinc-400">$</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("amount")}
              placeholder="0.00"
              className="h-14 pl-10 text-2xl font-bold rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>}
        </div>

        {/* Date */}
        <div>
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Date</Label>
          <Input
            type="date"
            {...register("date")}
            className="mt-2 h-12 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting || !watch("amount")}
          className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            `Add $${enteredAmount.toLocaleString() || "0"}`
          )}
        </Button>
      </form>
    </div>
  );
}
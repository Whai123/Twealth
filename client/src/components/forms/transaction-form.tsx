import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/userContext";
import { Loader2 } from "lucide-react";

const transactionFormSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Must be a valid positive number"),
  type: z.enum(["income", "expense", "transfer"]),
  category: z.string().optional(), // Optional - backend will auto-categorize if not provided
  description: z.string().optional(),
  goalId: z.string().optional(),
  destination: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

type TransactionFormData = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
  onSuccess?: () => void;
}

const TRANSACTION_CATEGORIES = {
  income: [
    { value: "salary", label: "Salary" },
    { value: "freelance", label: "Freelance" },
    { value: "investment", label: "Investment Returns" },
    { value: "gift", label: "Gift" },
    { value: "other", label: "Other Income" }
  ],
  expense: [
    { value: "rent", label: "Rent/Mortgage" },
    { value: "utilities", label: "Utilities" },
    { value: "groceries", label: "Groceries" },
    { value: "dining", label: "Dining Out" },
    { value: "transport", label: "Transportation" },
    { value: "healthcare", label: "Healthcare" },
    { value: "entertainment", label: "Entertainment" },
    { value: "shopping", label: "Shopping" },
    { value: "other", label: "Other Expenses" }
  ],
  transfer: [
    { value: "savings", label: "Savings" },
    { value: "investment", label: "Investment" },
    { value: "goal_contribution", label: "Goal Contribution" }
  ]
};

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: userLoading } = useUser();

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
    reset,
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
        userId: user?.id, // Use actual user ID from context
        amount: parseFloat(data.amount),
        date: new Date(data.date).toISOString(),
      }),
    onMutate: async (newTransaction: TransactionFormData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/transactions"] });
      
      // Snapshot previous data
      const previousTransactions = queryClient.getQueryData(["/api/transactions"]);
      
      // Create optimistic transaction with temporary ID
      const optimisticTransaction = {
        id: `temp-${Date.now()}`,
        userId: user?.id,
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        category: newTransaction.category,
        description: newTransaction.description || "",
        date: new Date(newTransaction.date).toISOString(),
        destination: newTransaction.destination,
        goalId: newTransaction.goalId,
        createdAt: new Date().toISOString(),
      };
      
      // Optimistically update cache
      queryClient.setQueryData(["/api/transactions"], (old: any) => 
        Array.isArray(old) ? [optimisticTransaction, ...old] : [optimisticTransaction]
      );
      
      return { previousTransactions };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Transaction added",
        description: "Your transaction has been recorded successfully.",
      });
      onSuccess?.();
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(["/api/transactions"], context.previousTransactions);
      }
      
      const isValidationError = error.message?.includes('validation') || error.message?.includes('required');
      const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network');
      
      toast({
        title: "Couldn't Add Transaction",
        description: isNetworkError 
          ? "Check your internet connection and try again."
          : isValidationError
          ? "Please check that all required fields are filled correctly."
          : error.message || "Something went wrong. Please try again in a moment.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to track your income and expenses.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate date is not in the future
    if (new Date(data.date) > new Date()) {
      toast({
        title: "Invalid date",
        description: "Transaction date cannot be in the future.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    createTransactionMutation.mutate(data);
  };

  // Reset category when type changes
  const handleTypeChange = (type: string) => {
    setValue("type", type as any);
    setValue("category", "");
    setValue("goalId", undefined);
    setValue("destination", undefined);
  };

  // Reset destination when category changes
  const handleCategoryChange = (category: string) => {
    setValue("category", category);
    setValue("goalId", undefined);
    setValue("destination", undefined);
  };

  const availableCategories = TRANSACTION_CATEGORIES[selectedType] || [];
  const activeGoals = goals?.filter((goal: any) => goal.status === "active") || [];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Transaction</DialogTitle>
        <DialogDescription>
          Record a new income, expense, or transfer transaction
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Transaction Type - First Choice */}
        <div>
          <Label htmlFor="type" className="text-base font-semibold">Is this money in or out?</Label>
          <Select value={selectedType} onValueChange={handleTypeChange}>
            <SelectTrigger className="mt-2 h-12 text-base" data-testid="select-transaction-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">💰 Money In (Income)</SelectItem>
              <SelectItem value="expense">💸 Money Out (Expense)</SelectItem>
              <SelectItem value="transfer">💳 Transfer/Savings</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
          )}
        </div>

        {/* Amount - Most Important */}
        <div>
          <Label htmlFor="amount" className="text-base font-semibold">How much?</Label>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">$</span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              {...register("amount")}
              placeholder="0.00"
              className="h-12 pl-8 text-lg"
              data-testid="input-transaction-amount"
            />
          </div>
          {errors.amount && (
            <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>
          )}
        </div>

        {/* Description/Merchant - For auto-categorization */}
        <div>
          <Label htmlFor="description" className="text-base font-semibold">
            What's this for? <span className="text-sm font-normal text-muted-foreground">(helps AI categorize)</span>
          </Label>
          <Input
            id="description"
            {...register("description")}
            placeholder="e.g., Starbucks, Gas station, Netflix..."
            className="mt-2 h-12 text-base"
            data-testid="input-transaction-description"
          />
          {errors.description && (
            <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Category - Optional, AI will auto-categorize */}
        <div>
          <Label htmlFor="category" className="text-base font-semibold">
            What category? <span className="text-sm font-normal text-muted-foreground">(optional - AI will detect)</span>
          </Label>
          <Select value={selectedCategory || ""} onValueChange={handleCategoryChange}>
            <SelectTrigger className="mt-2 h-12 text-base" data-testid="select-transaction-category">
              <SelectValue placeholder="Leave blank for auto-categorization ✨" />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
          )}
        </div>

        {/* Destination - Only for Transfer/Savings */}
        {selectedType === "transfer" && selectedCategory === "goal_contribution" && (
          <div>
            <Label htmlFor="goalId" className="text-base font-semibold">💰 Which financial goal?</Label>
            <Select value={watch("goalId") || ""} onValueChange={(value) => setValue("goalId", value)}>
              <SelectTrigger className="mt-2 h-12 text-base" data-testid="select-goal">
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent>
                {activeGoals.length === 0 ? (
                  <SelectItem value="none" disabled>No active goals yet</SelectItem>
                ) : (
                  activeGoals.map((goal: any) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title} (${parseFloat(goal.currentAmount || '0').toFixed(0)} / ${parseFloat(goal.targetAmount).toFixed(0)})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedType === "transfer" && selectedCategory === "savings" && (
          <div>
            <Label htmlFor="destination" className="text-base font-semibold">🏦 Where is this money going?</Label>
            <Select value={watch("destination") || ""} onValueChange={(value) => setValue("destination", value)}>
              <SelectTrigger className="mt-2 h-12 text-base" data-testid="select-destination">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emergency_fund">🚨 Emergency Fund</SelectItem>
                <SelectItem value="general_savings">💵 General Savings</SelectItem>
                <SelectItem value="vacation_fund">✈️ Vacation Fund</SelectItem>
                <SelectItem value="down_payment">🏠 Down Payment</SelectItem>
                <SelectItem value="other">📦 Other Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedType === "transfer" && selectedCategory === "investment" && (
          <div>
            <Label htmlFor="destination" className="text-base font-semibold">📈 Which investment account?</Label>
            <Select value={watch("destination") || ""} onValueChange={(value) => setValue("destination", value)}>
              <SelectTrigger className="mt-2 h-12 text-base" data-testid="select-destination">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brokerage">🏦 Brokerage Account</SelectItem>
                <SelectItem value="401k">👴 401(k)</SelectItem>
                <SelectItem value="roth_ira">💎 Roth IRA</SelectItem>
                <SelectItem value="crypto">₿ Cryptocurrency</SelectItem>
                <SelectItem value="real_estate">🏘️ Real Estate</SelectItem>
                <SelectItem value="other">📊 Other Investment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date - Secondary */}
        <div>
          <Label htmlFor="date" className="text-sm font-medium">When? (optional)</Label>
          <Input
            id="date"
            type="date"
            {...register("date")}
            className="mt-1.5 h-11"
            data-testid="input-transaction-date"
          />
          {errors.date && (
            <p className="text-sm text-destructive mt-1">{errors.date.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[160px]"
            data-testid="button-submit-transaction"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Transaction"
            )}
          </Button>
        </div>
      </form>
    </>
  );
}

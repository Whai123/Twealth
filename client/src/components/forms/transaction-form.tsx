import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const transactionFormSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Must be a valid positive number"),
  type: z.enum(["income", "expense", "transfer"]),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  goalId: z.string().optional(),
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

  const { data: goals } = useQuery({
    queryKey: ["/api/financial-goals"],
    queryFn: () => fetch("/api/financial-goals?userId=demo").then(res => res.json()),
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
        userId: "demo", // In real app, this would come from auth
        amount: parseFloat(data.amount),
        date: new Date(data.date).toISOString(),
      }),
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
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: TransactionFormData) => {
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
  };

  const availableCategories = TRANSACTION_CATEGORIES[selectedType] || [];
  const activeGoals = goals?.filter((goal: any) => goal.status === "active") || [];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Transaction</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="type">Transaction Type</Label>
          <Select value={selectedType} onValueChange={handleTypeChange}>
            <SelectTrigger data-testid="select-transaction-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="transfer">Transfer/Savings</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              {...register("amount")}
              placeholder="0.00"
              data-testid="input-transaction-amount"
            />
            {errors.amount && (
              <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              {...register("date")}
              data-testid="input-transaction-date"
            />
            {errors.date && (
              <p className="text-sm text-destructive mt-1">{errors.date.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={selectedCategory || ""} onValueChange={(value) => setValue("category", value)}>
            <SelectTrigger data-testid="select-transaction-category">
              <SelectValue placeholder="Select a category" />
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

        {(selectedType === "transfer" && selectedCategory === "goal_contribution") && (
          <div>
            <Label htmlFor="goalId">Financial Goal</Label>
            <Select value={watch("goalId") || ""} onValueChange={(value) => setValue("goalId", value || undefined)}>
              <SelectTrigger data-testid="select-transaction-goal">
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent>
                {activeGoals.map((goal: any) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Add a note about this transaction"
            rows={3}
            data-testid="input-transaction-description"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="button-submit-transaction"
          >
            {isSubmitting ? "Adding..." : "Add Transaction"}
          </Button>
        </div>
      </form>
    </>
  );
}

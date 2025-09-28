import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/userContext";

const addFundsFormSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Must be a valid positive number"),
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

export default function AddFundsForm({ goalId, goalTitle, currentAmount, targetAmount, onSuccess }: AddFundsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: userLoading } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddFundsFormData>({
    resolver: zodResolver(addFundsFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data: AddFundsFormData) => 
      apiRequest("POST", "/api/transactions", {
        userId: user?.id,
        amount: parseFloat(data.amount),
        type: "transfer", // Use transfer type so the storage layer updates the goal
        category: "savings",
        description: data.description || `Added funds to ${goalTitle}`,
        goalId: goalId,
        date: new Date(data.date).toISOString(),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Funds added successfully",
        description: `$${parseFloat(variables.amount).toLocaleString()} has been added to your ${goalTitle} goal.`,
      });
      reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add funds. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: AddFundsFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add funds.",
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

  if (userLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
          <div className="h-10 bg-muted rounded mb-4"></div>
          <div className="h-10 bg-muted rounded mb-4"></div>
          <div className="h-10 bg-muted rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Funds to Goal</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4">
        {/* Goal Info */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Goal: {goalTitle}</p>
          <p className="text-sm text-muted-foreground">
            Current: ${parseFloat(currentAmount).toLocaleString()} / 
            Target: ${parseFloat(targetAmount).toLocaleString()}
          </p>
          <div className="mt-2">
            <div className="text-xs text-muted-foreground mb-1">
              Progress: {Math.round((parseFloat(currentAmount) / parseFloat(targetAmount)) * 100)}%
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                data-testid="input-add-funds-amount"
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
                data-testid="input-add-funds-date"
              />
              {errors.date && (
                <p className="text-sm text-destructive mt-1">{errors.date.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder={`Add a note about this contribution to ${goalTitle}`}
              rows={3}
              data-testid="input-add-funds-description"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onSuccess}
              data-testid="button-cancel-add-funds"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="button-confirm-add-funds"
            >
              {isSubmitting ? "Adding..." : "Add Funds"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
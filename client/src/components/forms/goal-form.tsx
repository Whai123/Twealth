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
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/userContext";
import { Users, Loader2 } from "lucide-react";

const goalFormSchema = z.object({
  title: z.string().min(1, "Goal title is required"),
  description: z.string().optional(),
  targetAmount: z.string().min(1, "Target amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Must be a valid positive number"),
  currentAmount: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), "Must be a valid positive number"),
  targetDate: z.string().min(1, "Target date is required"),
  category: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

type GoalFormData = z.infer<typeof goalFormSchema>;

interface GoalFormProps {
  onSuccess?: () => void;
}

const GOAL_CATEGORIES = [
  "emergency",
  "house",
  "vacation",
  "car",
  "education",
  "retirement",
  "investment",
  "other"
];

export default function GoalForm({ onSuccess }: GoalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareWithGroup, setShareWithGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [groupPermission, setGroupPermission] = useState<"view" | "can_contribute">("view");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: userLoading } = useUser();

  // Fetch user's groups
  const { data: groups } = useQuery({
    queryKey: ["/api/groups"],
    enabled: !!user,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      currentAmount: "0",
      priority: "medium",
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      const response = await apiRequest("POST", "/api/financial-goals", {
        ...data,
        targetAmount: data.targetAmount, // Keep as string for decimal field
        currentAmount: data.currentAmount || "0", // Keep as string for decimal field
        targetDate: new Date(data.targetDate), // Send as Date object for timestamp field
      });
      return await response.json();
    },
    onMutate: async (newGoal: GoalFormData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/financial-goals"] });
      
      // Snapshot previous data
      const previousGoals = queryClient.getQueryData(["/api/financial-goals"]);
      
      // Create optimistic goal with temporary ID
      const optimisticGoal = {
        id: `temp-${Date.now()}`,
        userId: user?.id,
        title: newGoal.title,
        targetAmount: newGoal.targetAmount,
        currentAmount: newGoal.currentAmount || "0",
        targetDate: new Date(newGoal.targetDate).toISOString(),
        priority: newGoal.priority,
        category: newGoal.category,
        description: newGoal.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Optimistically update cache
      queryClient.setQueryData(["/api/financial-goals"], (old: any) => 
        Array.isArray(old) ? [optimisticGoal, ...old] : [optimisticGoal]
      );
      
      return { previousGoals };
    },
    onSuccess: async (createdGoal: any) => {
      // If sharing with group, call the share API
      if (shareWithGroup && selectedGroupId) {
        try {
          await apiRequest("POST", `/api/goals/${createdGoal.id}/share-with-group`, {
            groupId: selectedGroupId,
            permission: groupPermission,
          });
          toast({
            title: "Goal created and shared",
            description: "Your goal has been created and shared with the group.",
          });
        } catch (error: any) {
          toast({
            title: "Goal created but sharing failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Goal created",
          description: "Your financial goal has been created successfully.",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onSuccess?.();
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousGoals) {
        queryClient.setQueryData(["/api/financial-goals"], context.previousGoals);
      }
      
      const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network');
      toast({
        title: "Couldn't Create Goal",
        description: isNetworkError 
          ? "Check your internet connection and try again."
          : error.message || "Please check your goal details and try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: GoalFormData) => {
    // Validate target date is in the future
    if (new Date(data.targetDate) <= new Date()) {
      toast({
        title: "Invalid date",
        description: "Target date must be in the future.",
        variant: "destructive",
      });
      return;
    }

    // Validate current amount doesn't exceed target amount
    const current = parseFloat(data.currentAmount || "0");
    const target = parseFloat(data.targetAmount);
    if (current > target) {
      toast({
        title: "Invalid amounts",
        description: "Current amount cannot exceed target amount.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to create financial goals and track your progress.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    createGoalMutation.mutate(data);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Financial Goal</DialogTitle>
        <DialogDescription>
          Set a target amount and date for your financial goal
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Goal Title - Most Important */}
        <div>
          <Label htmlFor="title" className="text-base font-semibold">What are you saving for?</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="Emergency Fund"
            className="mt-2 h-12 text-base"
            data-testid="input-goal-title"
          />
          {errors.title && (
            <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Target Amount - Critical */}
        <div>
          <Label htmlFor="targetAmount" className="text-base font-semibold">How much do you need?</Label>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">$</span>
            <Input
              id="targetAmount"
              type="number"
              step="0.01"
              min="0"
              {...register("targetAmount")}
              placeholder="10,000"
              className="h-12 pl-8 text-lg"
              data-testid="input-goal-target-amount"
            />
          </div>
          {errors.targetAmount && (
            <p className="text-sm text-destructive mt-1">{errors.targetAmount.message}</p>
          )}
        </div>

        {/* Target Date - Important */}
        <div>
          <Label htmlFor="targetDate" className="text-base font-semibold">When do you need it by?</Label>
          <Input
            id="targetDate"
            type="date"
            {...register("targetDate")}
            className="mt-2 h-12 text-base"
            data-testid="input-goal-target-date"
          />
          {errors.targetDate && (
            <p className="text-sm text-destructive mt-1">{String(errors.targetDate.message)}</p>
          )}
        </div>

        {/* Category - Helpful */}
        <div>
          <Label htmlFor="category" className="text-sm font-medium">Category</Label>
          <Select value={watch("category") || ""} onValueChange={(value) => setValue("category", value || undefined)}>
            <SelectTrigger className="mt-1.5 h-11" data-testid="select-goal-category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {GOAL_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Group Sharing Section */}
        {Array.isArray(groups) && groups.length > 0 && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="shareWithGroup" 
                checked={shareWithGroup} 
                onCheckedChange={(checked) => setShareWithGroup(checked as boolean)}
                data-testid="checkbox-share-with-group"
              />
              <Label htmlFor="shareWithGroup" className="flex items-center gap-2 cursor-pointer">
                <Users className="w-4 h-4" />
                Share with Group
              </Label>
            </div>

            {shareWithGroup && (
              <div className="space-y-3 pl-6">
                <div>
                  <Label htmlFor="groupSelect">Select Group</Label>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger data-testid="select-share-group">
                      <SelectValue placeholder="Choose a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {(groups as any[]).map((group: any) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="permissionSelect">Permission Level</Label>
                  <Select value={groupPermission} onValueChange={(val) => setGroupPermission(val as "view" | "can_contribute")}>
                    <SelectTrigger data-testid="select-group-permission">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View Only</SelectItem>
                      <SelectItem value="can_contribute">Can Contribute</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {groupPermission === "view" 
                      ? "Group members can view this goal but cannot contribute"
                      : "Group members can view and add money to this goal"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[140px]"
            data-testid="button-submit-goal"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Goal"
            )}
          </Button>
        </div>
      </form>
    </>
  );
}

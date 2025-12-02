import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/userContext";
import { Home, Car, PiggyBank, Target } from "lucide-react";

const groupFormSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  category: z.enum(["house", "car", "savings", "other"]).default("other"),
  budget: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : String(val),
    z.string().optional()
  ),
  color: z.string().default("#3B82F6"),
  status: z.enum(["active", "planning", "archived"]).default("active"),
});

type GroupFormData = z.infer<typeof groupFormSchema>;

interface GroupFormProps {
  onSuccess?: () => void;
}

export default function GroupForm({ onSuccess }: GroupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: userLoading } = useUser();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      category: "other",
      color: "#3B82F6",
      status: "active",
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: (data: GroupFormData) => 
      apiRequest("POST", "/api/groups", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Group created",
        description: "Your shared goal group has been created successfully.",
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

  const onSubmit = (data: GroupFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a group.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    createGroupMutation.mutate(data);
  };

  const categoryOptions = [
    { value: "house", label: "House / Property", icon: Home, description: "Down payment, renovation" },
    { value: "car", label: "Vehicle", icon: Car, description: "Car, motorcycle, boat" },
    { value: "savings", label: "Group Savings", icon: PiggyBank, description: "Vacation, event, gift" },
    { value: "other", label: "Other Goal", icon: Target, description: "Custom shared goal" },
  ];

  const watchCategory = watch("category");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div>
        <Label htmlFor="name">Group Name</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="e.g., Beach House Fund, Tesla Model 3"
          className="h-11"
          data-testid="input-group-name"
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label>Goal Category</Label>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          {categoryOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = watchCategory === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue("category", option.value as any)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected 
                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                    : "border-border hover:border-primary/50"
                }`}
                data-testid={`button-category-${option.value}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="budget">Target Amount (Optional)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="budget"
            type="number"
            {...register("budget")}
            placeholder="0.00"
            className="h-11 pl-7"
            data-testid="input-group-budget"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Set a target to track progress toward your goal
        </p>
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Describe your shared goal..."
          rows={2}
          data-testid="textarea-group-description"
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || userLoading || !user}
          className="min-h-[44px] min-w-[120px]"
          data-testid="button-submit-group"
        >
          {isSubmitting ? "Creating..." : userLoading ? "Loading..." : "Create Group"}
        </Button>
      </div>
    </form>
  );
}

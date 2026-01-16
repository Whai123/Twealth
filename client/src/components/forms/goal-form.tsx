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
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/userContext";
import { Users, Loader2, Target, Briefcase, Home, Plane, Car, GraduationCap, Wallet, Sparkles } from "lucide-react";

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

const CATEGORIES = [
  { value: "emergency", label: "Emergency Fund", icon: Wallet },
  { value: "house", label: "House", icon: Home },
  { value: "vacation", label: "Vacation", icon: Plane },
  { value: "car", label: "Car", icon: Car },
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "investment", label: "Investment", icon: Briefcase },
  { value: "other", label: "Other", icon: Sparkles },
];

export default function GoalForm({ onSuccess }: GoalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareWithGroup, setShareWithGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [groupPermission, setGroupPermission] = useState<"view" | "can_contribute">("view");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();

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
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      const response = await apiRequest("POST", "/api/financial-goals", {
        ...data,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount || "0",
        targetDate: new Date(data.targetDate),
      });
      return await response.json();
    },
    onSuccess: async (createdGoal: any) => {
      if (shareWithGroup && selectedGroupId) {
        try {
          await apiRequest("POST", `/api/goals/${createdGoal.id}/share-with-group`, {
            groupId: selectedGroupId,
            permission: groupPermission,
          });
          toast({ title: "Goal created and shared!" });
        } catch {
          toast({ title: "Goal created", description: "But sharing failed" });
        }
      } else {
        toast({ title: "Goal created!" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: GoalFormData) => {
    if (new Date(data.targetDate) <= new Date()) {
      toast({ title: "Invalid date", description: "Target date must be in the future", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    createGoalMutation.mutate(data);
  };

  const selectedCategory = watch("category");

  return (
    <div className="p-1">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">New Goal</h2>
          <p className="text-sm text-zinc-500">Set your savings target</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Goal Title */}
        <div>
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">What are you saving for?</Label>
          <Input
            {...register("title")}
            placeholder="e.g. Emergency Fund, New Car"
            className="mt-2 h-12 text-base rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        {/* Amount */}
        <div>
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Target Amount</Label>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-zinc-400">$</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("targetAmount")}
              placeholder="10,000"
              className="h-14 pl-10 text-xl font-semibold rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {errors.targetAmount && <p className="text-sm text-red-500 mt-1">{errors.targetAmount.message}</p>}
        </div>

        {/* Date */}
        <div>
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Target Date</Label>
          <Input
            type="date"
            {...register("targetDate")}
            className="mt-2 h-12 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.targetDate && <p className="text-sm text-red-500 mt-1">{String(errors.targetDate.message)}</p>}
        </div>

        {/* Category Grid */}
        <div>
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Category</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.value}
                type="button"
                onClick={() => setValue("category", cat.value)}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${selectedCategory === cat.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                whileTap={{ scale: 0.95 }}
              >
                <cat.icon className={`w-5 h-5 ${selectedCategory === cat.value ? "text-blue-500" : "text-zinc-400"}`} />
                <span className={`text-xs font-medium ${selectedCategory === cat.value ? "text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400"}`}>
                  {cat.label.split(" ")[0]}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Group Sharing */}
        {Array.isArray(groups) && groups.length > 0 && (
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <Checkbox
                id="shareWithGroup"
                checked={shareWithGroup}
                onCheckedChange={(checked) => setShareWithGroup(checked as boolean)}
              />
              <Label htmlFor="shareWithGroup" className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <Users className="w-4 h-4 text-zinc-500" />
                Share with a group
              </Label>
            </div>

            {shareWithGroup && (
              <div className="mt-4 space-y-3 pl-7">
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger className="h-11 rounded-lg">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {(groups as any[]).map((group: any) => (
                      <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={groupPermission} onValueChange={(val) => setGroupPermission(val as "view" | "can_contribute")}>
                  <SelectTrigger className="h-11 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View only</SelectItem>
                    <SelectItem value="can_contribute">Can contribute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-base"
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
      </form>
    </div>
  );
}

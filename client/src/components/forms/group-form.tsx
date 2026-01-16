import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/userContext";
import { Users, Home, Car, PiggyBank, Target, Loader2 } from "lucide-react";

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

const CATEGORIES = [
  { value: "house", label: "House", icon: Home, color: "text-blue-500" },
  { value: "car", label: "Vehicle", icon: Car, color: "text-emerald-500" },
  { value: "savings", label: "Savings", icon: PiggyBank, color: "text-amber-500" },
  { value: "other", label: "Other", icon: Target, color: "text-violet-500" },
];

export default function GroupForm({ onSuccess }: GroupFormProps) {
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
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      category: "other",
      color: "#3B82F6",
      status: "active",
    },
  });

  const watchCategory = watch("category");

  const createGroupMutation = useMutation({
    mutationFn: (data: GroupFormData) => apiRequest("POST", "/api/groups", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Group created!" });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: GroupFormData) => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    createGroupMutation.mutate(data);
  };

  return (
    <div className="p-1">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-violet-500 flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">New Group</h2>
          <p className="text-sm text-zinc-500">Collaborate on a shared goal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name */}
        <div>
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Group Name</Label>
          <Input
            {...register("name")}
            placeholder="e.g., Beach House Fund"
            className="mt-2 h-12 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        {/* Category Grid */}
        <div>
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Category</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.value}
                type="button"
                onClick={() => setValue("category", cat.value as any)}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${watchCategory === cat.value
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                  }`}
                whileTap={{ scale: 0.95 }}
              >
                <cat.icon className={`w-5 h-5 ${watchCategory === cat.value ? "text-violet-500" : "text-zinc-400"}`} />
                <span className={`text-xs font-medium ${watchCategory === cat.value ? "text-violet-600 dark:text-violet-400" : "text-zinc-600 dark:text-zinc-400"}`}>
                  {cat.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Target Amount */}
        <div>
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Target Amount <span className="text-zinc-400 font-normal">(optional)</span>
          </Label>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-zinc-400">$</span>
            <Input
              type="number"
              {...register("budget")}
              placeholder="0.00"
              className="h-12 pl-10 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description <span className="text-zinc-400 font-normal">(optional)</span>
          </Label>
          <Textarea
            {...register("description")}
            placeholder="What's this group for?"
            rows={2}
            className="mt-2 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Group"
          )}
        </Button>
      </form>
    </div>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, Home, Plane, Car, GraduationCap, Wallet, Briefcase, Sparkles } from "lucide-react";

const editGoalFormSchema = z.object({
    title: z.string().min(1, "Goal title is required"),
    description: z.string().optional(),
    targetAmount: z.string().min(1, "Target amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Must be positive"),
    currentAmount: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), "Must be positive"),
    targetDate: z.string().min(1, "Target date is required"),
    category: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
});

type EditGoalFormData = z.infer<typeof editGoalFormSchema>;

interface EditGoalFormProps {
    goal: any;
    onSuccess?: () => void;
}

const CATEGORIES = [
    { value: "emergency", label: "Emergency", icon: Wallet },
    { value: "house", label: "House", icon: Home },
    { value: "vacation", label: "Vacation", icon: Plane },
    { value: "car", label: "Car", icon: Car },
    { value: "education", label: "Education", icon: GraduationCap },
    { value: "investment", label: "Investment", icon: Briefcase },
    { value: "other", label: "Other", icon: Sparkles },
];

export default function EditGoalForm({ goal, onSuccess }: EditGoalFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const formatDateForInput = (date: string | Date) => {
        if (!date) return "";
        return new Date(date).toISOString().split('T')[0];
    };

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<EditGoalFormData>({
        resolver: zodResolver(editGoalFormSchema),
        defaultValues: {
            title: goal?.title || "",
            description: goal?.description || "",
            targetAmount: goal?.targetAmount || "",
            currentAmount: goal?.currentAmount || "0",
            targetDate: formatDateForInput(goal?.targetDate),
            category: goal?.category || "",
            priority: goal?.priority || "medium",
        },
    });

    const selectedCategory = watch("category");

    const updateGoalMutation = useMutation({
        mutationFn: (data: EditGoalFormData) =>
            apiRequest("PUT", `/api/financial-goals/${goal.id}`, {
                ...data,
                targetAmount: data.targetAmount,
                currentAmount: data.currentAmount || "0",
                targetDate: new Date(data.targetDate),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
            toast({ title: "Goal updated!" });
            onSuccess?.();
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
        onSettled: () => setIsSubmitting(false),
    });

    const onSubmit = (data: EditGoalFormData) => {
        if (new Date(data.targetDate) <= new Date()) {
            toast({ title: "Invalid date", description: "Must be in the future", variant: "destructive" });
            return;
        }
        const current = parseFloat(data.currentAmount || "0");
        const target = parseFloat(data.targetAmount);
        if (current > target) {
            toast({ title: "Invalid", description: "Current can't exceed target", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        updateGoalMutation.mutate(data);
    };

    return (
        <div className="p-1">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center">
                    <Pencil className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Edit Goal</h2>
                    <p className="text-sm text-zinc-500">Update your goal details</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Title */}
                <div>
                    <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Goal Name</Label>
                    <Input
                        {...register("title")}
                        className="mt-2 h-12 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Target</Label>
                        <div className="relative mt-2">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                            <Input
                                type="number"
                                step="0.01"
                                {...register("targetAmount")}
                                className="h-12 pl-8 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                    </div>
                    <div>
                        <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Current</Label>
                        <div className="relative mt-2">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                            <Input
                                type="number"
                                step="0.01"
                                {...register("currentAmount")}
                                className="h-12 pl-8 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Date */}
                <div>
                    <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Target Date</Label>
                    <Input
                        type="date"
                        {...register("targetDate")}
                        className="mt-2 h-12 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-amber-500"
                    />
                </div>

                {/* Category */}
                <div>
                    <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Category</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {CATEGORIES.map((cat) => (
                            <motion.button
                                key={cat.value}
                                type="button"
                                onClick={() => setValue("category", cat.value)}
                                className={`px-3 py-2 rounded-xl border-2 flex items-center gap-2 transition-all ${selectedCategory === cat.value
                                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                                    }`}
                                whileTap={{ scale: 0.95 }}
                            >
                                <cat.icon className={`w-4 h-4 ${selectedCategory === cat.value ? "text-amber-500" : "text-zinc-400"}`} />
                                <span className={`text-sm font-medium ${selectedCategory === cat.value ? "text-amber-600 dark:text-amber-400" : "text-zinc-600 dark:text-zinc-400"}`}>
                                    {cat.label}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Priority */}
                <div>
                    <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Priority</Label>
                    <Select value={watch("priority")} onValueChange={(val) => setValue("priority", val as any)}>
                        <SelectTrigger className="mt-2 h-12 rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={onSuccess} className="flex-1 h-12 rounded-xl">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
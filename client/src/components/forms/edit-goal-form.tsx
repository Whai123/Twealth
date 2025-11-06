import { useState } from"react";
import { useForm } from"react-hook-form";
import { zodResolver } from"@hookform/resolvers/zod";
import { useMutation, useQueryClient } from"@tanstack/react-query";
import { z } from"zod";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Textarea } from"@/components/ui/textarea";
import { Label } from"@/components/ui/label";
import { DialogHeader, DialogTitle, DialogDescription } from"@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select";
import { apiRequest } from"@/lib/queryClient";
import { useToast } from"@/hooks/use-toast";

const editGoalFormSchema = z.object({
 title: z.string().min(1,"Goal title is required"),
 description: z.string().optional(),
 targetAmount: z.string().min(1,"Target amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,"Must be a valid positive number"),
 currentAmount: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),"Must be a valid positive number"),
 targetDate: z.string().min(1,"Target date is required"),
 category: z.string().optional(),
 priority: z.enum(["low","medium","high"]).default("medium"),
});

type EditGoalFormData = z.infer<typeof editGoalFormSchema>;

interface EditGoalFormProps {
 goal: any; // The existing goal data to edit
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

export default function EditGoalForm({ goal, onSuccess }: EditGoalFormProps) {
 const [isSubmitting, setIsSubmitting] = useState(false);
 const { toast } = useToast();
 const queryClient = useQueryClient();

 // Format date for input field (YYYY-MM-DD)
 const formatDateForInput = (date: string | Date) => {
  if (!date) return"";
  const d = new Date(date);
  return d.toISOString().split('T')[0];
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
   title: goal?.title ||"",
   description: goal?.description ||"",
   targetAmount: goal?.targetAmount ||"",
   currentAmount: goal?.currentAmount ||"0",
   targetDate: formatDateForInput(goal?.targetDate),
   category: goal?.category ||"",
   priority: goal?.priority ||"medium",
  },
 });

 const updateGoalMutation = useMutation({
  mutationFn: (data: EditGoalFormData) => 
   apiRequest("PUT", `/api/financial-goals/${goal.id}`, {
    ...data,
    targetAmount: data.targetAmount, // Keep as string for decimal field
    currentAmount: data.currentAmount ||"0", // Keep as string for decimal field
    targetDate: new Date(data.targetDate), // Send as Date object for timestamp field
   }),
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
   queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
   toast({
    title:"Goal updated",
    description:"Your financial goal has been updated successfully.",
   });
   onSuccess?.();
  },
  onError: (error: any) => {
   toast({
    title:"Error",
    description: error.message,
    variant:"destructive",
   });
  },
  onSettled: () => {
   setIsSubmitting(false);
  },
 });

 const onSubmit = (data: EditGoalFormData) => {
  // Validate target date is in the future
  if (new Date(data.targetDate) <= new Date()) {
   toast({
    title:"Invalid date",
    description:"Target date must be in the future.",
    variant:"destructive",
   });
   return;
  }

  // Validate current amount doesn't exceed target amount
  const current = parseFloat(data.currentAmount ||"0");
  const target = parseFloat(data.targetAmount);
  if (current > target) {
   toast({
    title:"Invalid amounts",
    description:"Current amount cannot exceed target amount.",
    variant:"destructive",
   });
   return;
  }
  
  setIsSubmitting(true);
  updateGoalMutation.mutate(data);
 };

 return (
  <>
   <DialogHeader>
    <DialogTitle>Edit Financial Goal</DialogTitle>
    <DialogDescription>
     Update your goal details, target amount, or deadline
    </DialogDescription>
   </DialogHeader>
   
   <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
    <div>
     <Label htmlFor="title">Goal Title</Label>
     <Input
      id="title"
      {...register("title")}
      placeholder="e.g., Emergency Fund, Vacation, House Down Payment"
      data-testid="input-edit-goal-title"
     />
     {errors.title && (
      <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
     )}
    </div>

    <div>
     <Label htmlFor="description">Description (Optional)</Label>
     <Textarea
      id="description"
      {...register("description")}
      placeholder="Describe your goal and why it's important to you"
      rows={3}
      data-testid="input-edit-goal-description"
     />
    </div>

    <div className="grid grid-cols-2 gap-4">
     <div>
      <Label htmlFor="targetAmount">Target Amount ($)</Label>
      <Input
       id="targetAmount"
       type="number"
       step="0.01"
       min="0"
       {...register("targetAmount")}
       placeholder="10000"
       data-testid="input-edit-goal-target-amount"
      />
      {errors.targetAmount && (
       <p className="text-sm text-destructive mt-1">{errors.targetAmount.message}</p>
      )}
     </div>

     <div>
      <Label htmlFor="currentAmount">Current Amount ($)</Label>
      <Input
       id="currentAmount"
       type="number"
       step="0.01"
       min="0"
       {...register("currentAmount")}
       placeholder="0"
       data-testid="input-edit-goal-current-amount"
      />
      {errors.currentAmount && (
       <p className="text-sm text-destructive mt-1">{errors.currentAmount.message}</p>
      )}
     </div>
    </div>

    <div>
     <Label htmlFor="targetDate">Target Date</Label>
     <Input
      id="targetDate"
      type="date"
      {...register("targetDate")}
      data-testid="input-edit-goal-target-date"
     />
     {errors.targetDate && (
      <p className="text-sm text-destructive mt-1">{errors.targetDate.message}</p>
     )}
    </div>

    <div className="grid grid-cols-2 gap-4">
     <div>
      <Label htmlFor="category">Category</Label>
      <Select value={watch("category") ||""} onValueChange={(value) => setValue("category", value || undefined)}>
       <SelectTrigger data-testid="select-edit-goal-category">
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

     <div>
      <Label htmlFor="priority">Priority</Label>
      <Select value={watch("priority")} onValueChange={(value) => setValue("priority", value as any)}>
       <SelectTrigger data-testid="select-edit-goal-priority">
        <SelectValue />
       </SelectTrigger>
       <SelectContent>
        <SelectItem value="low">Low</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="high">High</SelectItem>
       </SelectContent>
      </Select>
     </div>
    </div>

    <div className="flex justify-end space-x-2 pt-4">
     <Button
      type="button"
      variant="outline"
      onClick={onSuccess}
      data-testid="button-cancel-edit"
     >
      Cancel
     </Button>
     <Button
      type="submit"
      disabled={isSubmitting}
      data-testid="button-save-goal"
     >
      {isSubmitting ?"Saving..." :"Save Changes"}
     </Button>
    </div>
   </form>
  </>
 );
}
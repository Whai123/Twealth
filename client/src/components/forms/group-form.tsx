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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/userContext";

const groupFormSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
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
      color: "#3B82F6",
      status: "active",
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: (data: GroupFormData) => 
      apiRequest("POST", "/api/groups", {
        ...data,
        ownerId: user?.id, // Use actual user ID from context
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Group created",
        description: "Your new group has been created successfully.",
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

  const colorOptions = [
    { value: "#3B82F6", label: "Blue", color: "bg-blue-500" },
    { value: "#10B981", label: "Green", color: "bg-green-500" },
    { value: "#F59E0B", label: "Yellow", color: "bg-yellow-500" },
    { value: "#EF4444", label: "Red", color: "bg-red-500" },
    { value: "#8B5CF6", label: "Purple", color: "bg-purple-500" },
    { value: "#EC4899", label: "Pink", color: "bg-pink-500" },
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Group</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Group Name</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Enter group name"
            data-testid="input-group-name"
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Enter group description"
            rows={3}
            data-testid="input-group-description"
          />
        </div>

        <div>
          <Label htmlFor="color">Color Theme</Label>
          <Select value={watch("color")} onValueChange={(value) => setValue("color", value)}>
            <SelectTrigger data-testid="select-group-color">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded ${option.color}`}></div>
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={watch("status")} onValueChange={(value) => setValue("status", value as any)}>
            <SelectTrigger data-testid="select-group-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || userLoading || !user}
            data-testid="button-submit-group"
          >
            {isSubmitting ? "Creating..." : userLoading ? "Loading..." : "Create Group"}
          </Button>
        </div>
      </form>
    </>
  );
}

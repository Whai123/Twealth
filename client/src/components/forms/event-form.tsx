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
import { apiRequest, parseJsonSafely } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/userContext";
import { Calendar, Loader2, AlertCircle, MapPin, Clock, Target } from "lucide-react";

const eventFormSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().optional(),
  budget: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), "Must be a valid positive number"),
  plannedDurationMinutes: z.string().optional().refine((val) => !val || (!isNaN(parseInt(val)) && parseInt(val) > 0), "Must be a valid positive number"),
  linkedGoalId: z.string().optional(),
  groupId: z.string().optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  onSuccess?: () => void;
}

export default function EventForm({ onSuccess }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const { data: goals } = useQuery({
    queryKey: ["/api/financial-goals"],
    enabled: !!user,
  });

  const { data: groups } = useQuery({
    queryKey: ["/api/groups"],
    enabled: !!user,
  });

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  
  const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      startTime: formatDateTimeLocal(now),
      endTime: formatDateTimeLocal(oneHourLater),
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const response = await apiRequest("POST", "/api/events", {
        title: data.title,
        description: data.description || null,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        location: data.location || null,
        budget: data.budget || null,
        plannedDurationMinutes: data.plannedDurationMinutes ? parseInt(data.plannedDurationMinutes) : null,
        linkedGoalId: data.linkedGoalId || null,
        groupId: data.groupId || null,
      });
      return await parseJsonSafely(response);
    },
    onSuccess: () => {
      toast({
        title: "Event created",
        description: "Your event has been scheduled successfully.",
        icon: <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network');
      toast({
        title: "Couldn't Create Event",
        description: isNetworkError 
          ? "Check your internet connection and try again."
          : error.message || "Please check your event details and try again.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />,
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: EventFormData) => {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (endTime <= startTime) {
      toast({
        title: "Invalid times",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to create events.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    createEventMutation.mutate(data);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Schedule New Event</DialogTitle>
        <DialogDescription>
          Plan your activities and track time spent
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label htmlFor="title" className="text-base font-semibold">Event Title</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="Team meeting"
            className="mt-2 h-12 text-base"
            data-testid="input-event-title"
          />
          {errors.title && (
            <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startTime" className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Start Time
            </Label>
            <Input
              id="startTime"
              type="datetime-local"
              {...register("startTime")}
              className="mt-1.5 h-11"
              data-testid="input-event-start-time"
            />
            {errors.startTime && (
              <p className="text-sm text-destructive mt-1">{errors.startTime.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="endTime" className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              End Time
            </Label>
            <Input
              id="endTime"
              type="datetime-local"
              {...register("endTime")}
              className="mt-1.5 h-11"
              data-testid="input-event-end-time"
            />
            {errors.endTime && (
              <p className="text-sm text-destructive mt-1">{errors.endTime.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            Location (optional)
          </Label>
          <Input
            id="location"
            {...register("location")}
            placeholder="Conference Room A"
            className="mt-1.5 h-11"
            data-testid="input-event-location"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium">Description (optional)</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Event details..."
            className="mt-1.5"
            rows={3}
            data-testid="textarea-event-description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budget" className="text-sm font-medium">Budget (optional)</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                {...register("budget")}
                placeholder="0.00"
                className="h-11 pl-7"
                data-testid="input-event-budget"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="plannedDurationMinutes" className="text-sm font-medium">Duration (mins)</Label>
            <Input
              id="plannedDurationMinutes"
              type="number"
              min="1"
              {...register("plannedDurationMinutes")}
              placeholder="60"
              className="mt-1.5 h-11"
              data-testid="input-event-duration"
            />
          </div>
        </div>

        {Array.isArray(goals) && goals.length > 0 && (
          <div>
            <Label htmlFor="linkedGoalId" className="text-sm font-medium flex items-center gap-1">
              <Target className="h-4 w-4" />
              Link to Goal (optional)
            </Label>
            <Select value={watch("linkedGoalId") || ""} onValueChange={(value) => setValue("linkedGoalId", value || undefined)}>
              <SelectTrigger className="mt-1.5 h-11" data-testid="select-event-goal">
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent>
                {(goals as any[]).map((goal: any) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {Array.isArray(groups) && groups.length > 0 && (
          <div>
            <Label htmlFor="groupId" className="text-sm font-medium">Group (optional)</Label>
            <Select value={watch("groupId") || ""} onValueChange={(value) => setValue("groupId", value || undefined)}>
              <SelectTrigger className="mt-1.5 h-11" data-testid="select-event-group">
                <SelectValue placeholder="Select a group" />
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
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[140px]"
            data-testid="button-submit-event"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Event"
            )}
          </Button>
        </div>
      </form>
    </>
  );
}

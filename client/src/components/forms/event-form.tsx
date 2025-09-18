import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CalendarDays, MapPin, Users, Clock, Sparkles, Brain, Zap, Target, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/userContext";

const eventFormSchema = z.object({
  title: z.string().min(1, "Event title is required").max(100, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().max(200, "Location too long").optional(),
  groupId: z.string().optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  onSuccess?: () => void;
  eventToEdit?: any;
}

export default function EventForm({ onSuccess, eventToEdit }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: userLoading } = useUser();

  const { data: groups } = useQuery({
    queryKey: ["/api/groups"],
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: eventToEdit?.title || "",
      description: eventToEdit?.description || "",
      startTime: eventToEdit?.startTime 
        ? new Date(eventToEdit.startTime).toISOString().slice(0, 16)
        : new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
      endTime: eventToEdit?.endTime 
        ? new Date(eventToEdit.endTime).toISOString().slice(0, 16)
        : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
      location: eventToEdit?.location || "",
      groupId: eventToEdit?.groupId || undefined,
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const response = await apiRequest("POST", "/api/events", {
        ...data,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        createdBy: user?.id,
        attendees: [],
        groupId: data.groupId === "personal" ? null : data.groupId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "🎉 Event Created Successfully!",
        description: "Your collaborative event is ready for RSVPs",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Failed to Create Event",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const response = await apiRequest("PUT", `/api/events/${eventToEdit.id}`, {
        ...data,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        groupId: data.groupId === "personal" ? null : data.groupId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "✅ Event Updated Successfully!",
        description: "Your event details have been updated",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Failed to Update Event",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: EventFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create an event.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate end time is after start time
    if (new Date(data.endTime) <= new Date(data.startTime)) {
      toast({
        title: "Invalid time",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    if (eventToEdit) {
      updateEventMutation.mutate(data);
    } else {
      createEventMutation.mutate(data);
    }
  };


  return (
    <div className="w-full">
      <DialogHeader className="mb-4">
        <div className="text-center mb-3">
          <DialogTitle className="text-lg sm:text-xl font-bold">
            {eventToEdit ? "✏️ Edit Event" : "🚀 Create Event"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {eventToEdit ? "Update your event details" : "Create a new event for your calendar"}
          </DialogDescription>
        </div>
      </DialogHeader>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-3">
          <Label htmlFor="title" className="text-base font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Event Title *
          </Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="e.g., Q4 Financial Strategy Meeting 💰"
            className="text-base p-3 border-2 focus:border-purple-500 transition-all duration-200"
            data-testid="input-event-title"
          />
          {errors.title && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              ❌ {errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="description" className="text-base font-bold">
            📝 Event Description
          </Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Tell people what to expect! What are the goals? What should they bring? What will they learn? 🎯"
            className="min-h-[80px] text-sm p-3 border-2 focus:border-blue-500 transition-all duration-200 resize-none"
            data-testid="input-event-description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              {...register("startTime")}
              data-testid="input-event-start-time"
            />
            {errors.startTime && (
              <p className="text-sm text-destructive mt-1">{errors.startTime.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="datetime-local"
              {...register("endTime")}
              data-testid="input-event-end-time"
            />
            {errors.endTime && (
              <p className="text-sm text-destructive mt-1">{errors.endTime.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="location">Location (Optional)</Label>
          <Input
            id="location"
            {...register("location")}
            placeholder="Enter location"
            data-testid="input-event-location"
          />
        </div>

        <div>
          <Label htmlFor="groupId">Group (Optional)</Label>
          <Select value={watch("groupId") || "personal"} onValueChange={(value) => setValue("groupId", value === "personal" ? undefined : value)}>
            <SelectTrigger data-testid="select-event-group">
              <SelectValue placeholder="Select a group (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal Event</SelectItem>
              {Array.isArray(groups) ? groups.map((group: any) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              )) : null}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="button-submit-event"
          >
            {isSubmitting 
              ? (eventToEdit ? "Updating..." : "Creating...") 
              : (eventToEdit ? "Update Event" : "Create Event")
            }
          </Button>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CalendarDays, MapPin, Users, Clock, Calendar, Sparkles, Brain, Zap, Target, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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

// Helper functions for time conversion
const timeToMinutes = (timeString: string) => {
  const date = new Date(timeString);
  return date.getHours() * 60 + date.getMinutes();
};

const minutesToTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const formatTimeDisplay = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
};

// Helper to format date as local datetime-local string without timezone conversion
const formatDateTimeLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper to get current date from form or default to today
const getCurrentDate = (currentStartTime?: string) => {
  if (currentStartTime) {
    return new Date(currentStartTime);
  }
  return new Date();
};

export default function EventForm({ onSuccess, eventToEdit }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: userLoading } = useUser();
  
  // Time slider state
  const [timeRange, setTimeRange] = useState(() => {
    const startDefault = eventToEdit?.startTime 
      ? timeToMinutes(eventToEdit.startTime)
      : 9 * 60; // 9:00 AM
    const endDefault = eventToEdit?.endTime 
      ? timeToMinutes(eventToEdit.endTime)
      : 10 * 60; // 10:00 AM
    return [startDefault, endDefault];
  });

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
        ? formatDateTimeLocal(new Date(eventToEdit.startTime))
        : (() => {
            const now = new Date();
            now.setHours(9, 0, 0, 0); // 9:00 AM
            return formatDateTimeLocal(now);
          })(),
      endTime: eventToEdit?.endTime 
        ? formatDateTimeLocal(new Date(eventToEdit.endTime))
        : (() => {
            const now = new Date();
            now.setHours(10, 0, 0, 0); // 10:00 AM
            return formatDateTimeLocal(now);
          })(),
      location: eventToEdit?.location || "",
      groupId: eventToEdit?.groupId || undefined,
    },
  });

  // Sync timeRange with form values on mount and when editing
  useEffect(() => {
    const currentStartTime = watch("startTime");
    const currentEndTime = watch("endTime");
    
    if (currentStartTime && currentEndTime) {
      const startMinutes = timeToMinutes(currentStartTime);
      const endMinutes = timeToMinutes(currentEndTime);
      setTimeRange([startMinutes, endMinutes]);
    }
  }, [eventToEdit?.id]); // Re-sync when editing different events

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
            placeholder="Tell people what to expect! Goals, what to bring, what they'll learn..."
            className="min-h-[80px] text-sm p-3 border-2 focus:border-blue-500 transition-all duration-200 resize-none text-no-overflow"
            data-testid="input-event-description"
          />
        </div>

        {/* Interactive Date Slider */}
        <div className="space-y-4">
          <Label className="text-base font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-500" />
            📅 Which day? Slide to choose! 
          </Label>
          
          <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
            <div className="space-y-4">
              {/* Current Date Display */}
              <div className="text-center">
                <p className="text-sm text-green-600 font-medium">Event Date</p>
                <p className="text-2xl font-bold text-green-800" data-testid="text-event-date">
                  {new Date(getCurrentDate(watch("startTime"))).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              {/* Date Slider - Days from today */}
              <div className="px-2">
                <Slider
                  value={[Math.max(0, Math.floor((new Date(getCurrentDate(watch("startTime"))).getTime() - new Date().setHours(0,0,0,0)) / (24 * 60 * 60 * 1000)))]}
                  onValueChange={(value) => {
                    const daysFromToday = value[0];
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selectedDate = new Date(today.getTime() + daysFromToday * 24 * 60 * 60 * 1000);
                    
                    // Update both start and end times with new date but preserve times
                    const currentStart = watch("startTime");
                    const currentEnd = watch("endTime");
                    
                    if (currentStart && currentEnd) {
                      const startTime = new Date(currentStart);
                      const endTime = new Date(currentEnd);
                      
                      // Set new date but keep same time
                      startTime.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                      endTime.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                      
                      setValue("startTime", formatDateTimeLocal(startTime), { shouldValidate: true, shouldDirty: true });
                      setValue("endTime", formatDateTimeLocal(endTime), { shouldValidate: true, shouldDirty: true });
                    }
                  }}
                  min={0}
                  max={365}
                  step={1}
                  className="w-full"
                  data-testid="slider-event-date"
                />
              </div>
              
              {/* Date Scale */}
              <div className="flex justify-between text-xs text-gray-500 px-2">
                <span>Today</span>
                <span>+3 months</span>
                <span>+6 months</span>
                <span>+9 months</span>
                <span>+1 year</span>
              </div>
              
              {/* Quick Date Presets */}
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const currentStart = watch("startTime");
                    const currentEnd = watch("endTime");
                    
                    if (currentStart && currentEnd) {
                      const startTime = new Date(currentStart);
                      const endTime = new Date(currentEnd);
                      
                      startTime.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
                      endTime.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
                      
                      setValue("startTime", formatDateTimeLocal(startTime), { shouldValidate: true, shouldDirty: true });
                      setValue("endTime", formatDateTimeLocal(endTime), { shouldValidate: true, shouldDirty: true });
                    }
                  }}
                  className="text-xs"
                  data-testid="button-preset-today"
                >
                  📅 Today
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const currentStart = watch("startTime");
                    const currentEnd = watch("endTime");
                    
                    if (currentStart && currentEnd) {
                      const startTime = new Date(currentStart);
                      const endTime = new Date(currentEnd);
                      
                      startTime.setFullYear(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
                      endTime.setFullYear(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
                      
                      setValue("startTime", formatDateTimeLocal(startTime), { shouldValidate: true, shouldDirty: true });
                      setValue("endTime", formatDateTimeLocal(endTime), { shouldValidate: true, shouldDirty: true });
                    }
                  }}
                  className="text-xs"
                  data-testid="button-preset-tomorrow"
                >
                  ➡️ Tomorrow
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    const currentStart = watch("startTime");
                    const currentEnd = watch("endTime");
                    
                    if (currentStart && currentEnd) {
                      const startTime = new Date(currentStart);
                      const endTime = new Date(currentEnd);
                      
                      startTime.setFullYear(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate());
                      endTime.setFullYear(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate());
                      
                      setValue("startTime", formatDateTimeLocal(startTime), { shouldValidate: true, shouldDirty: true });
                      setValue("endTime", formatDateTimeLocal(endTime), { shouldValidate: true, shouldDirty: true });
                    }
                  }}
                  className="text-xs"
                  data-testid="button-preset-next-week"
                >
                  📅 Next Week
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Interactive Time Range Slider */}
        <div className="space-y-4">
          <Label className="text-base font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            ⏰ What time? Slide to choose! 
          </Label>
          
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <div className="space-y-6">
              {/* Time Display */}
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <p className="text-sm text-blue-600 font-medium">Start Time</p>
                  <p className="text-2xl font-bold text-blue-800" data-testid="text-start-time">
                    {formatTimeDisplay(timeRange[0])}
                  </p>
                </div>
                <div className="text-center px-4">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {Math.round((timeRange[1] - timeRange[0]) / 60 * 10) / 10}h
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-purple-600 font-medium">End Time</p>
                  <p className="text-2xl font-bold text-purple-800" data-testid="text-end-time">
                    {formatTimeDisplay(timeRange[1])}
                  </p>
                </div>
              </div>
              
              {/* Time Range Slider */}
              <div className="px-2">
                <Slider
                  value={timeRange}
                  onValueChange={(value) => {
                    setTimeRange(value);
                    
                    // Preserve the current date from form values or use today
                    const baseDate = getCurrentDate(watch("startTime"));
                    
                    // Create new dates preserving the original date
                    const startDate = new Date(baseDate);
                    startDate.setHours(Math.floor(value[0] / 60), value[0] % 60, 0, 0);
                    const endDate = new Date(baseDate);
                    endDate.setHours(Math.floor(value[1] / 60), value[1] % 60, 0, 0);
                    
                    // Use timezone-safe formatting
                    setValue("startTime", formatDateTimeLocal(startDate), { shouldValidate: true, shouldDirty: true });
                    setValue("endTime", formatDateTimeLocal(endDate), { shouldValidate: true, shouldDirty: true });
                  }}
                  min={0}
                  max={24 * 60 - 1}
                  step={15}
                  className="w-full"
                  data-testid="slider-time-range"
                />
              </div>
              
              {/* Time Scale */}
              <div className="flex justify-between text-xs text-gray-500 px-2">
                <span>12 AM</span>
                <span>6 AM</span>
                <span>12 PM</span>
                <span>6 PM</span>
                <span>11:45 PM</span>
              </div>
              
              {/* Quick Time Presets */}
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const preset = [9 * 60, 10 * 60]; // 9-10 AM
                    setTimeRange(preset);
                    
                    // Preserve current date
                    const baseDate = getCurrentDate(watch("startTime"));
                    const startDate = new Date(baseDate);
                    startDate.setHours(9, 0, 0, 0);
                    const endDate = new Date(baseDate);
                    endDate.setHours(10, 0, 0, 0);
                    
                    setValue("startTime", formatDateTimeLocal(startDate), { shouldValidate: true, shouldDirty: true });
                    setValue("endTime", formatDateTimeLocal(endDate), { shouldValidate: true, shouldDirty: true });
                  }}
                  className="text-xs"
                  data-testid="button-preset-morning"
                >
                  🌅 Morning (9-10 AM)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const preset = [12 * 60, 13 * 60]; // 12-1 PM
                    setTimeRange(preset);
                    
                    // Preserve current date
                    const baseDate = getCurrentDate(watch("startTime"));
                    const startDate = new Date(baseDate);
                    startDate.setHours(12, 0, 0, 0);
                    const endDate = new Date(baseDate);
                    endDate.setHours(13, 0, 0, 0);
                    
                    setValue("startTime", formatDateTimeLocal(startDate), { shouldValidate: true, shouldDirty: true });
                    setValue("endTime", formatDateTimeLocal(endDate), { shouldValidate: true, shouldDirty: true });
                  }}
                  className="text-xs"
                  data-testid="button-preset-lunch"
                >
                  🍽️ Lunch (12-1 PM)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const preset = [14 * 60, 15 * 60]; // 2-3 PM
                    setTimeRange(preset);
                    
                    // Preserve current date
                    const baseDate = getCurrentDate(watch("startTime"));
                    const startDate = new Date(baseDate);
                    startDate.setHours(14, 0, 0, 0);
                    const endDate = new Date(baseDate);
                    endDate.setHours(15, 0, 0, 0);
                    
                    setValue("startTime", formatDateTimeLocal(startDate), { shouldValidate: true, shouldDirty: true });
                    setValue("endTime", formatDateTimeLocal(endDate), { shouldValidate: true, shouldDirty: true });
                  }}
                  className="text-xs"
                  data-testid="button-preset-afternoon"
                >
                  ☀️ Afternoon (2-3 PM)
                </Button>
              </div>
            </div>
          </Card>
          
          {/* Hidden inputs for form validation */}
          <input
            type="hidden"
            {...register("startTime")}
            data-testid="input-event-start-time"
          />
          <input
            type="hidden"
            {...register("endTime")}
            data-testid="input-event-end-time"
          />
          
          {(errors.startTime || errors.endTime) && (
            <p className="text-sm text-destructive flex items-center gap-1">
              ❌ {errors.startTime?.message || errors.endTime?.message}
            </p>
          )}
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

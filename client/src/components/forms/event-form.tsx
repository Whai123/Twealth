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
}

export default function EventForm({ onSuccess }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: userLoading } = useUser();

  const { data: groups } = useQuery({
    queryKey: ["/api/groups"],
    queryFn: () => fetch("/api/groups").then(res => res.json()),
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
      title: "",
      description: "",
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
      location: "",
      groupId: undefined,
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
    createEventMutation.mutate(data);
  };


  return (
    <div className="max-w-2xl mx-auto">
      <DialogHeader className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl"></div>
            <div className="relative p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl">
              <Wand2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              🚀 Create Collaborative Event
            </DialogTitle>
            <DialogDescription className="text-lg mt-2 text-muted-foreground">
              Plan together, grow together - AI-powered event creation
            </DialogDescription>
          </div>
        </div>
        
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 border-2 border-dashed border-green-200 dark:border-green-800 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-6 w-6 text-purple-600" />
            <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              🤖 AI-Powered Features
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Smart scheduling</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Viability analysis</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <Zap className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Success prediction</span>
            </div>
          </div>
        </Card>
      </DialogHeader>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="title" className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Event Title *
          </Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="e.g., Q4 Financial Strategy Meeting 💰"
            className="text-lg p-4 border-2 focus:border-purple-500 transition-all duration-200"
            data-testid="input-event-title"
          />
          {errors.title && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              ❌ {errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="description" className="text-lg font-bold">
            📝 Event Description
          </Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Tell people what to expect! What are the goals? What should they bring? What will they learn? 🎯"
            className="min-h-[120px] text-base p-4 border-2 focus:border-blue-500 transition-all duration-200 resize-none"
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
              {groups?.map((group: any) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="button-submit-event"
          >
            {isSubmitting ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>
    </div>
  );
}

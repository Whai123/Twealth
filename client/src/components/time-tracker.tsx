import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Clock, Target, TrendingUp } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TimeTrackerProps {
  eventId: string;
  eventTitle: string;
  plannedDurationMinutes?: number;
  actualDurationMinutes?: number;
  isActive?: boolean;
  onTimeUpdate?: (minutes: number) => void;
}

interface TimeSession {
  startTime: Date;
  endTime?: Date;
  duration: number; // in milliseconds
}

export function TimeTracker({ 
  eventId, 
  eventTitle, 
  plannedDurationMinutes = 0,
  actualDurationMinutes = 0,
  isActive = false,
  onTimeUpdate 
}: TimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(isActive);
  const [elapsedTime, setElapsedTime] = useState(actualDurationMinutes * 60 * 1000); // Convert to milliseconds
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [baselineElapsed, setBaselineElapsed] = useState(0); // Track time at session start for proper duration calculation
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Start time tracking mutation
  const startTrackingMutation = useMutation({
    mutationFn: async () => {
      const startTime = new Date();
      return apiRequest('POST', '/api/time-tracking/start', {
        eventId,
        startTime: startTime.toISOString()
      });
    },
    onSuccess: () => {
      toast({
        title: "Time tracking started",
        description: `Started tracking time for "${eventTitle}"`,
        duration: 2000
      });
    },
    onError: (error) => {
      console.error('Failed to start time tracking:', error);
      toast({
        title: "Error",
        description: "Failed to start time tracking",
        variant: "destructive",
        duration: 3000
      });
      // Cleanup on error
      setIsTracking(false);
      setSessionStartTime(null);
      setBaselineElapsed(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  });

  // Stop time tracking mutation
  const stopTrackingMutation = useMutation({
    mutationFn: async (activeDuration: number) => {
      return apiRequest('POST', '/api/time-tracking/stop', {
        eventId,
        endTime: new Date().toISOString(),
        durationMinutes: Math.round(activeDuration / (60 * 1000))
      });
    },
    onSuccess: (data) => {
      // Complete cache invalidation for all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'time-value'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/time-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/insights/time-value'] });
      
      const totalMinutes = Math.round(elapsedTime / (60 * 1000));
      onTimeUpdate?.(totalMinutes);
      
      toast({
        title: "Time tracking stopped",
        description: `Logged ${formatDuration(elapsedTime)} for "${eventTitle}"`,
        duration: 3000
      });
    },
    onError: (error) => {
      console.error('Failed to stop time tracking:', error);
      toast({
        title: "Error", 
        description: "Failed to stop time tracking",
        variant: "destructive",
        duration: 3000
      });
    }
  });

  // Format duration for display
  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Start tracking
  const handleStart = () => {
    const startTime = new Date();
    setIsTracking(true);
    setSessionStartTime(startTime);
    setBaselineElapsed(elapsedTime); // Remember elapsed time at start of session
    startTrackingMutation.mutate();
    
    // Start the timer interval
    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1000);
    }, 1000);
  };

  // Pause tracking (keep session but stop timer)
  const handlePause = () => {
    setIsTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Resume tracking
  const handleResume = () => {
    setIsTracking(true);
    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1000);
    }, 1000);
  };

  // Stop and save tracking
  const handleStop = () => {
    setIsTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (sessionStartTime) {
      // Calculate only the active duration from this session (excluding previous time and pauses)
      const activeDuration = elapsedTime - baselineElapsed;
      stopTrackingMutation.mutate(activeDuration);
    }
    
    setSessionStartTime(null);
    setBaselineElapsed(0);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Calculate progress vs planned time
  const currentMinutes = Math.round(elapsedTime / (60 * 1000));
  const progressPercentage = plannedDurationMinutes > 0 ? (currentMinutes / plannedDurationMinutes) * 100 : 0;
  const isOverPlanned = currentMinutes > plannedDurationMinutes && plannedDurationMinutes > 0;

  return (
    <Card className={`time-tracker ${isTracking ? 'border-time-active' : ''}`} data-testid="time-tracker">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className={isTracking ? "text-time-active animate-pulse" : "text-time"} size={20} />
          Time Tracker
          {isTracking && (
            <Badge variant="default" className="bg-time-active text-white animate-pulse">
              Recording
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="text-center">
          <div className={`text-3xl font-mono font-bold ${isTracking ? 'text-time-active' : 'text-foreground'}`} data-testid="text-elapsed-time">
            {formatDuration(elapsedTime)}
          </div>
          {sessionStartTime && (
            <p className="text-sm text-muted-foreground mt-1">
              Started at {sessionStartTime.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Progress vs Planned */}
        {plannedDurationMinutes > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress vs Planned</span>
              <span className={isOverPlanned ? "text-value-negative" : "text-value-positive"}>
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isOverPlanned ? 'bg-value-negative' : 'bg-time-active'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Planned: {Math.round(plannedDurationMinutes)}min</span>
              <span>Current: {currentMinutes}min</span>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2 justify-center">
          {!isTracking && !sessionStartTime && (
            <Button 
              onClick={handleStart}
              disabled={startTrackingMutation.isPending}
              className="bg-time-active hover:bg-time-active/90"
              data-testid="button-start-tracking"
            >
              <Play size={16} className="mr-2" />
              Start Tracking
            </Button>
          )}
          
          {isTracking && (
            <Button 
              onClick={handlePause}
              variant="outline"
              data-testid="button-pause-tracking"
            >
              <Pause size={16} className="mr-2" />
              Pause
            </Button>
          )}
          
          {!isTracking && sessionStartTime && (
            <Button 
              onClick={handleResume}
              className="bg-time-active hover:bg-time-active/90"
              data-testid="button-resume-tracking"
            >
              <Play size={16} className="mr-2" />
              Resume
            </Button>
          )}
          
          {sessionStartTime && (
            <Button 
              onClick={handleStop}
              variant="destructive"
              disabled={stopTrackingMutation.isPending}
              data-testid="button-stop-tracking"
            >
              <Square size={16} className="mr-2" />
              Stop & Save
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        {actualDurationMinutes > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t">
            <div className="text-center">
              <div className="text-sm font-medium">{Math.round(actualDurationMinutes)}min</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            {plannedDurationMinutes > 0 && (
              <>
                <div className="text-center">
                  <div className="text-sm font-medium">{Math.round(plannedDurationMinutes)}min</div>
                  <div className="text-xs text-muted-foreground">Planned</div>
                </div>
                <div className="text-center">
                  <div className={`text-sm font-medium ${
                    actualDurationMinutes <= plannedDurationMinutes ? 'text-value-positive' : 'text-value-negative'
                  }`}>
                    {actualDurationMinutes <= plannedDurationMinutes ? '+' : ''}{Math.round(plannedDurationMinutes - actualDurationMinutes)}min
                  </div>
                  <div className="text-xs text-muted-foreground">Variance</div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
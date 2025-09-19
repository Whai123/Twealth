import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [accumulatedActiveMs, setAccumulatedActiveMs] = useState(actualDurationMinutes * 60 * 1000);
  const [lastStartedAt, setLastStartedAt] = useState<number | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false); // Track if we have an active session (even when paused)
  const intervalRef = useRef<number | null>(null);
  
  // Refs to store current values for timer access
  const isTrackingRef = useRef(isTracking);
  const accumulatedActiveMsRef = useRef(accumulatedActiveMs);
  const lastStartedAtRef = useRef(lastStartedAt);
  
  // Update refs when state changes
  useEffect(() => {
    isTrackingRef.current = isTracking;
    accumulatedActiveMsRef.current = accumulatedActiveMs;
    lastStartedAtRef.current = lastStartedAt;
  }, [isTracking, accumulatedActiveMs, lastStartedAt]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Session persistence key
  const sessionKey = `timetracker_${eventId}`;

  // Load persisted session on mount
  useEffect(() => {
    const persistedSession = localStorage.getItem(sessionKey);
    if (persistedSession) {
      try {
        const { isTracking: wasTracking, accumulatedMs, startedAt, hasSession } = JSON.parse(persistedSession);
        if (hasSession) {
          setAccumulatedActiveMs(accumulatedMs);
          setElapsedTime(accumulatedMs); // Update UI to show accumulated time
          setHasActiveSession(true);
          if (wasTracking && startedAt) {
            setLastStartedAt(startedAt);
            setIsTracking(true);
            startTimer();
          } else {
            // Paused session
            setIsTracking(false);
            setLastStartedAt(null);
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem(sessionKey);
      }
    }
  }, [eventId]);

  // Persist session state
  const persistSession = (tracking: boolean, accumulated: number, started: number | null, hasSession: boolean) => {
    if (hasSession) {
      localStorage.setItem(sessionKey, JSON.stringify({
        isTracking: tracking,
        accumulatedMs: accumulated,
        startedAt: started,
        hasSession: hasSession
      }));
    } else {
      localStorage.removeItem(sessionKey);
    }
  };

  // Start timer interval with direct implementation
  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      // Access current values from refs to avoid stale closures
      const currentAccumulated = accumulatedActiveMsRef.current;
      const currentStartedAt = lastStartedAtRef.current;
      const currentTracking = isTrackingRef.current;
      
      let currentElapsed = currentAccumulated;
      if (currentTracking && currentStartedAt) {
        currentElapsed += (now - currentStartedAt);
      }
      setElapsedTime(currentElapsed);
    }, 1000);
  };

  // Handle visibility change to manage tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isTracking) {
        // Persist current state when tab becomes hidden
        const now = Date.now();
        const accumulated = accumulatedActiveMs + (lastStartedAt ? now - lastStartedAt : 0);
        persistSession(true, accumulated, now, true);
      }
    };

    const handleBeforeUnload = () => {
      if (isTracking && lastStartedAt) {
        // Auto-save session on page unload
        const now = Date.now();
        const accumulated = accumulatedActiveMs + (now - lastStartedAt);
        persistSession(true, accumulated, now, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isTracking, lastStartedAt, accumulatedActiveMs, sessionKey]);

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
      
      // Calculate any time already tracked since handleStart
      const now = Date.now();
      const currentAccumulated = accumulatedActiveMsRef.current;
      const currentStartedAt = lastStartedAtRef.current;
      const tracked = currentStartedAt ? now - currentStartedAt : 0;
      const totalAccumulated = currentAccumulated + tracked;
      
      // Preserve session with tracked time so user can save later
      setIsTracking(false);
      setHasActiveSession(true); // Keep session active
      setLastStartedAt(null);
      setAccumulatedActiveMs(totalAccumulated);
      setElapsedTime(totalAccumulated);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Persist the tracked time for later saving
      persistSession(false, totalAccumulated, null, true);
      
      toast({
        title: "Error",
        description: "Failed to start time tracking. Your tracked time is saved, you can try again or stop to save.",
        variant: "destructive",
        duration: 4000
      });
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
      // Clear session state only after successful API call
      setAccumulatedActiveMs(0);
      setHasActiveSession(false);
      localStorage.removeItem(sessionKey);
      
      // Complete cache invalidation for all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'time-value'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/time-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/insights/time-value'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming'] });
      
      const totalMinutes = Math.round(elapsedTime / (60 * 1000));
      onTimeUpdate?.(totalMinutes);
      
      toast({
        title: "Time tracking stopped",
        description: `Logged ${formatDuration(elapsedTime)} for "${eventTitle}"`,
        duration: 3000
      });
    },
    onError: (error, totalActiveDuration) => {
      console.error('Failed to stop time tracking:', error);
      
      // Restore session using the exact attempted duration to prevent race condition
      setHasActiveSession(true);
      persistSession(false, totalActiveDuration, null, true);
      
      toast({
        title: "Error", 
        description: "Failed to stop time tracking. Your session is saved, you can try again.",
        variant: "destructive",
        duration: 4000
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
    const now = Date.now();
    setIsTracking(true);
    setLastStartedAt(now);
    setHasActiveSession(true);
    startTrackingMutation.mutate();
    startTimer();
    persistSession(true, accumulatedActiveMs, now, true);
  };

  // Pause tracking (keep session but stop timer)
  const handlePause = () => {
    if (isTracking && lastStartedAt) {
      const now = Date.now();
      const newAccumulated = accumulatedActiveMs + (now - lastStartedAt);
      
      setAccumulatedActiveMs(newAccumulated);
      setElapsedTime(newAccumulated); // Update UI immediately
      setIsTracking(false);
      setLastStartedAt(null);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Keep session active but paused
      persistSession(false, newAccumulated, null, true);
    }
  };

  // Resume tracking
  const handleResume = () => {
    const now = Date.now();
    setIsTracking(true);
    setLastStartedAt(now);
    startTimer();
    persistSession(true, accumulatedActiveMs, now, true);
  };

  // Stop and save tracking
  const handleStop = () => {
    let totalActiveDuration;
    
    if (isTracking && lastStartedAt) {
      // Currently tracking - add current session
      const now = Date.now();
      const sessionDuration = now - lastStartedAt;
      totalActiveDuration = accumulatedActiveMs + sessionDuration;
    } else if (hasActiveSession) {
      // Paused - use accumulated time only
      totalActiveDuration = accumulatedActiveMs;
    } else {
      return; // No session to stop
    }
    
    // Update both elapsed time and accumulated time to prevent data loss
    setElapsedTime(totalActiveDuration);
    setAccumulatedActiveMs(totalActiveDuration);
    
    // Stop timer but keep session until API succeeds
    setIsTracking(false);
    setLastStartedAt(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Persist the complete session before API call to prevent data loss
    persistSession(false, totalActiveDuration, null, true);
    
    // Send total active duration - session cleanup in onSuccess
    stopTrackingMutation.mutate(totalActiveDuration);
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
          {lastStartedAt && (
            <p className="text-sm text-muted-foreground mt-1">
              Started at {new Date(lastStartedAt).toLocaleTimeString()}
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
          {!hasActiveSession && (
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
          
          {isTracking && hasActiveSession && (
            <Button 
              onClick={handlePause}
              variant="outline"
              data-testid="button-pause-tracking"
            >
              <Pause size={16} className="mr-2" />
              Pause
            </Button>
          )}
          
          {!isTracking && hasActiveSession && (
            <Button 
              onClick={handleResume}
              className="bg-time-active hover:bg-time-active/90"
              data-testid="button-resume-tracking"
            >
              <Play size={16} className="mr-2" />
              Resume
            </Button>
          )}
          
          {hasActiveSession && (
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
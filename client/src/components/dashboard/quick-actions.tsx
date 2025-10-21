import { useState, useEffect, useCallback } from "react";
import { 
  Plus, 
  Target, 
  DollarSign, 
  Calendar, 
  Users, 
  TrendingUp,
  Clock,
  Zap
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import GoalForm from "@/components/forms/goal-form";
import TransactionForm from "@/components/forms/transaction-form";
import EventForm from "@/components/forms/event-form";
import { TimeTracker } from "@/components/time-tracker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function QuickActions() {
  const [isGoalDrawerOpen, setIsGoalDrawerOpen] = useState(false);
  const [isTransactionDrawerOpen, setIsTransactionDrawerOpen] = useState(false);
  const [isEventDrawerOpen, setIsEventDrawerOpen] = useState(false);
  const [isTimerDrawerOpen, setIsTimerDrawerOpen] = useState(false);
  const [selectedEventForTimer, setSelectedEventForTimer] = useState<string | null>(null);

  // Get upcoming events for timer
  const { data: upcomingEvents } = useQuery({
    queryKey: ['/api/events/upcoming'],
    queryFn: () => fetch('/api/events/upcoming?limit=5').then(res => res.json()),
  });

  // Keyboard shortcuts handler
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Only trigger if no modifier keys are pressed and not in an input/textarea
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    
    switch (event.key.toLowerCase()) {
      case 'g':
        event.preventDefault();
        setIsGoalDrawerOpen(true);
        break;
      case 't':
        event.preventDefault();
        setIsTransactionDrawerOpen(true);
        break;
      case 'e':
        event.preventDefault();
        setIsEventDrawerOpen(true);
        break;
    }
  }, []);

  // Set up keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const quickActions = [
    {
      id: "add-goal",
      title: "New Goal",
      description: "Set financial target",
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
      action: () => setIsGoalDrawerOpen(true),
      shortcut: "G"
    },
    {
      id: "add-transaction",
      title: "Add Transaction",
      description: "Record income/expense",
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
      action: () => setIsTransactionDrawerOpen(true),
      shortcut: "T"
    },
    {
      id: "schedule-event",
      title: "Add Event",
      description: "Plan new activity",
      icon: Calendar,
      color: "text-warning",
      bgColor: "bg-warning/10",
      action: () => setIsEventDrawerOpen(true),
      shortcut: "E"
    },
    {
      id: "time-tracker",
      title: "Start Timer",
      description: "Track productivity",
      icon: Clock,
      color: "text-info",
      bgColor: "bg-info/10",
      action: () => setIsTimerDrawerOpen(true),
      shortcut: "⏲️"
    }
  ];

  return (
    <>
      <Card className="overflow-hidden border-0 bg-gradient-hero shadow-lg" role="region" aria-label="Quick Actions">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-primary-foreground flex items-center gap-2">
            <Zap className="h-5 w-5" aria-hidden="true" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={action.id}
                variant="ghost"
                onClick={action.action}
                className={`h-auto p-3 md:p-4 flex flex-col items-center gap-2 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] button-press fade-in group touch-manipulation`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  borderRadius: 'var(--radius-lg)',
                  minHeight: 'clamp(100px, 15vw, 120px)'
                }}
                data-testid={`button-${action.id}`}
                aria-label={`${action.title}: ${action.description}. Keyboard shortcut: ${action.shortcut}`}
              >
                <div 
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-xl ${action.bgColor} ${action.color} flex items-center justify-center transition-all duration-300 group-hover:scale-110`}
                >
                  <action.icon size={18} className="md:w-5 md:h-5" />
                </div>
                <div className="text-center flex-1">
                  <p className="font-medium text-primary-foreground text-xs md:text-sm leading-tight">
                    {action.title}
                  </p>
                  <p className="text-xs text-primary-foreground/70 mt-1 hidden sm:block">
                    {action.description}
                  </p>
                </div>
                <div className="text-xs bg-white/20 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-primary-foreground/80 font-mono">
                  {action.shortcut}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goal Creation Drawer */}
      <Drawer open={isGoalDrawerOpen} onOpenChange={setIsGoalDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          <div className="p-4 pb-6">
            <DrawerTitle className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Create New Financial Goal
            </DrawerTitle>
            <DrawerDescription className="text-muted-foreground mb-4">
              Set up a new savings target and track your progress with smart insights
            </DrawerDescription>
            <GoalForm onSuccess={() => setIsGoalDrawerOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Transaction Creation Drawer */}
      <Drawer open={isTransactionDrawerOpen} onOpenChange={setIsTransactionDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          <div className="p-4 pb-6">
            <DrawerTitle className="text-xl font-semibold mb-2 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              Add New Transaction
            </DrawerTitle>
            <DrawerDescription className="text-muted-foreground mb-4">
              Record your income, expenses, or transfers to keep your finances up to date
            </DrawerDescription>
            <TransactionForm onSuccess={() => setIsTransactionDrawerOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Event Creation Drawer */}
      <Drawer open={isEventDrawerOpen} onOpenChange={setIsEventDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          <div className="p-4 pb-6">
            <DrawerTitle className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-warning" />
              Schedule New Event
            </DrawerTitle>
            <DrawerDescription className="text-muted-foreground mb-4">
              Plan your time effectively and track the value of your scheduled activities
            </DrawerDescription>
            <EventForm onSuccess={() => setIsEventDrawerOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Timer Selection Drawer */}
      <Drawer open={isTimerDrawerOpen} onOpenChange={setIsTimerDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          <div className="p-4 pb-6">
            <DrawerTitle className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-5 w-5 text-info" />
              Start Time Tracking
            </DrawerTitle>
            <DrawerDescription className="text-muted-foreground mb-4">
              Track time spent on your activities to optimize productivity and calculate value
            </DrawerDescription>
            
            {upcomingEvents && Array.isArray(upcomingEvents) && upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select an event to track:</label>
                  <Select value={selectedEventForTimer || ""} onValueChange={setSelectedEventForTimer}>
                    <SelectTrigger data-testid="select-event-timer">
                      <SelectValue placeholder="Choose an event..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(upcomingEvents) && upcomingEvents.map((event: any) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title} - {new Date(event.startTime).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedEventForTimer && (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <TimeTracker
                      eventId={selectedEventForTimer}
                      eventTitle={Array.isArray(upcomingEvents) ? upcomingEvents.find((e: any) => e.id === selectedEventForTimer)?.title || "" : ""}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Events Scheduled</h3>
                <p className="text-muted-foreground mb-4">Create an event first to start tracking time</p>
                <Button 
                  onClick={() => {
                    setIsTimerDrawerOpen(false);
                    setIsEventDrawerOpen(true);
                  }}
                  data-testid="button-create-event-for-timer"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Event
                </Button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
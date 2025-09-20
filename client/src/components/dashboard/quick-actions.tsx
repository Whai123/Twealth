import { useState } from "react";
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

export default function QuickActions() {
  const [isGoalDrawerOpen, setIsGoalDrawerOpen] = useState(false);
  const [isTransactionDrawerOpen, setIsTransactionDrawerOpen] = useState(false);
  const [isEventDrawerOpen, setIsEventDrawerOpen] = useState(false);

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
      title: "Schedule Event",
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
      action: () => console.log("Start timer"),
      shortcut: "⏲️"
    }
  ];

  return (
    <>
      <Card className="overflow-hidden border-0 bg-gradient-hero shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-primary-foreground flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={action.id}
                variant="ghost"
                onClick={action.action}
                className={`h-auto p-4 flex flex-col items-center gap-2 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 button-press fade-in group`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  borderRadius: 'var(--radius-lg)'
                }}
                data-testid={`button-${action.id}`}
              >
                <div 
                  className={`w-10 h-10 rounded-xl ${action.bgColor} ${action.color} flex items-center justify-center transition-all duration-300 group-hover:scale-110`}
                >
                  <action.icon size={20} />
                </div>
                <div className="text-center">
                  <p className="font-medium text-primary-foreground text-sm">
                    {action.title}
                  </p>
                  <p className="text-xs text-primary-foreground/70 mt-1">
                    {action.description}
                  </p>
                </div>
                <div className="text-xs bg-white/20 px-2 py-1 rounded-full text-primary-foreground/80 font-mono">
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
    </>
  );
}
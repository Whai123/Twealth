import { useState } from "react";
import { Plus, Calendar, Clock, DollarSign, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import EventForm from "@/components/forms/event-form";
import { motion, AnimatePresence } from "framer-motion";

interface MobileFloatingActionsProps {
  onFilterClick: () => void;
  onQuickEventClick: () => void;
}

export default function MobileFloatingActions({ 
  onFilterClick, 
  onQuickEventClick 
}: MobileFloatingActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const actions = [
    {
      id: 'filter',
      label: 'Filters',
      icon: <Filter size={20} />,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => {
        setIsExpanded(false);
        onFilterClick();
      }
    },
    {
      id: 'quick-event',
      label: 'Quick Event',
      icon: <Clock size={20} />,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => {
        setIsExpanded(false);
        onQuickEventClick();
      }
    },
    {
      id: 'create-event',
      label: 'New Event',
      icon: <Calendar size={20} />,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        setIsExpanded(false);
        setIsCreateDialogOpen(true);
      }
    }
  ];

  return (
    <>
      {/* Backdrop overlay when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40 md:hidden"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Action Menu */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 md:hidden">
        {/* Secondary Actions */}
        <AnimatePresence>
          {isExpanded && (
            <div className="flex flex-col gap-3">
              {actions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ scale: 0, y: 20, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    y: 0, 
                    opacity: 1,
                    transition: { delay: index * 0.1 }
                  }}
                  exit={{ 
                    scale: 0, 
                    y: 20, 
                    opacity: 0,
                    transition: { delay: (actions.length - 1 - index) * 0.05 }
                  }}
                  className="flex items-center gap-3"
                >
                  <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-full shadow-lg border">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {action.label}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    onClick={action.action}
                    className={`
                      w-12 h-12 rounded-full shadow-lg text-white transition-all duration-200
                      ${action.color}
                      hover:scale-110 active:scale-95
                    `}
                    data-testid={`mobile-fab-${action.id}`}
                  >
                    {action.icon}
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.div
          whileTap={{ scale: 0.9 }}
          className="relative"
        >
          <Button
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              w-14 h-14 rounded-full shadow-xl transition-all duration-300
              ${isExpanded 
                ? 'bg-red-500 hover:bg-red-600 rotate-45' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              }
              text-white border-4 border-white dark:border-gray-800
            `}
            data-testid="mobile-fab-main"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isExpanded ? 'close' : 'plus'}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                {isExpanded ? <X size={24} /> : <Plus size={24} />}
              </motion.div>
            </AnimatePresence>
          </Button>

          {/* Pulse Animation Ring */}
          {!isExpanded && (
            <div className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-20" />
          )}
        </motion.div>
      </div>

      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <EventForm onSuccess={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
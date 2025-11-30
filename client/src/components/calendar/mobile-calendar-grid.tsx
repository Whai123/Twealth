import { ChevronLeft, ChevronRight, Plus, Filter } from"lucide-react";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { useState } from"react";

const DAYS = ["S","M","T","W","T","F","S"];
const DAYS_FULL = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = [
"January","February","March","April","May","June",
"July","August","September","October","November","December"
];

interface MobileCalendarGridProps {
 currentDate: Date;
 events: any[];
 onNavigate: (direction: 'prev' | 'next') => void;
 onTodayClick: () => void;
 onEventClick: (eventId: string) => void;
 onDayClick: (date: Date) => void;
 onFiltersClick: () => void;
}

export default function MobileCalendarGrid({
 currentDate,
 events,
 onNavigate,
 onTodayClick,
 onEventClick,
 onDayClick,
 onFiltersClick
}: MobileCalendarGridProps) {

 const getDaysInMonth = () => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  // Add empty cells for previous month
  for (let i = 0; i < startingDayOfWeek; i++) {
   days.push(null);
  }
  // Add days of current month
  for (let day = 1; day <= daysInMonth; day++) {
   days.push(new Date(year, month, day));
  }
  return days;
 };

 const getEventsForDate = (date: Date) => {
  if (!events || !Array.isArray(events)) return [];
  return events.filter((event: any) => {
   const eventDate = new Date(event.startTime);
   return (
    eventDate.getFullYear() === date.getFullYear() &&
    eventDate.getMonth() === date.getMonth() &&
    eventDate.getDate() === date.getDate()
   );
  });
 };

 const getEventIndicator = (event: any) => {
  const actualDuration = event.actualDurationMinutes || 0;
  const plannedDuration = event.plannedDurationMinutes || 0;
  const duration = actualDuration || plannedDuration;
  const timeValue = Math.round((duration / 60) * 50); // $50/hr default
  
  if (timeValue > 500) return { color: 'bg-blue-500', label: '$$$' };
  if (timeValue > 200) return { color: 'bg-blue-500', label: '$$' };
  if (timeValue > 0) return { color: 'bg-green-500', label: '$' };
  return { color: 'bg-gray-400', label: '•' };
 };

 const today = new Date();
 const days = getDaysInMonth();

 const handleDayClick = (date: Date) => {
  onDayClick(date);
 };

 return (
  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
   {/* Mobile-Optimized Header */}
   <div className="bg-white dark:bg-gray-900 p-4">
    <div className="flex items-center justify-between">
     <div className="flex items-center gap-3">
      <Button 
       variant="ghost" 
       size="sm" 
       onClick={() => onNavigate('prev')}
       className="text-white hover:bg-white/20 p-1.5 rounded-lg"
       data-testid="button-mobile-prev-month"
      >
       <ChevronLeft size={18} />
      </Button>
      <div className="text-center">
       <h2 className="text-lg font-bold text-white">
        {MONTHS[currentDate.getMonth()]}
       </h2>
       <p className="text-sm text-blue-100">
        {currentDate.getFullYear()}
       </p>
      </div>
      <Button 
       variant="ghost" 
       size="sm" 
       onClick={() => onNavigate('next')}
       className="text-white hover:bg-white/20 p-1.5 rounded-lg"
       data-testid="button-mobile-next-month"
      >
       <ChevronRight size={18} />
      </Button>
     </div>

     <div className="flex items-center gap-2">
      <Button 
       variant="ghost" 
       size="sm"
       onClick={onFiltersClick}
       className="text-white hover:bg-white/20 p-2 rounded-lg"
       data-testid="button-mobile-filters"
      >
       <Filter size={16} />
      </Button>
      <Button 
       variant="ghost" 
       size="sm"
       onClick={onTodayClick}
       className="text-white hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium"
       data-testid="button-mobile-today"
      >
       Today
      </Button>
     </div>
    </div>
   </div>

   {/* Mobile Calendar Grid */}
   <div className="p-3">
    {/* Day Headers */}
    <div className="grid grid-cols-7 gap-1 mb-2">
     {DAYS.map((day, index) => (
      <div key={day} className="p-2 text-center">
       <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
        {day}
       </span>
       <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 hidden sm:block">
        {DAYS_FULL[index].slice(0, 3)}
       </div>
      </div>
     ))}
    </div>
    
    {/* Calendar Days */}
    <div className="grid grid-cols-7 gap-1">
     {days.map((date, index) => {
      const dayEvents = date ? getEventsForDate(date) : [];
      const isToday = date && date.toDateString() === today.toDateString();
      const hasEvents = dayEvents.length > 0;
      
      return (
       <div
        key={index}
        className={`
         relative aspect-square border border-gray-200 dark:border-gray-700 rounded-lg
         cursor-pointer
         ${date 
          ? 'bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
          : 'bg-gray-50 dark:bg-gray-900/50 cursor-not-allowed'
         }
         ${isToday ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''}
         ${hasEvents ? 'shadow-sm' : ''}
        `}
        onClick={() => date && handleDayClick(date)}
        data-testid={date ? `mobile-calendar-day-${date.getDate()}` : undefined}
       >
        {date && (
         <>
          {/* Day Number */}
          <div className={`
           absolute top-1 left-1 right-1 text-center
           text-sm font-semibold
           ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}
          `}>
           {date.getDate()}
          </div>
          
          {/* Event Indicators */}
          {dayEvents.length > 0 && (
           <div className="absolute bottom-1 left-1 right-1 flex justify-center">
            {dayEvents.length === 1 ? (
             <div 
              className={`
               w-5 h-1.5 rounded-full ${getEventIndicator(dayEvents[0]).color}
               
              `}
              onClick={(e) => {
               e.stopPropagation();
               onEventClick(dayEvents[0].id);
              }}
             />
            ) : dayEvents.length <= 3 ? (
             <div className="flex gap-0.5">
              {dayEvents.slice(0, 3).map((event, i) => (
               <div 
                key={event.id}
                className={`
                 w-3 h-1.5 rounded-full ${getEventIndicator(event).color}
                `}
                onClick={(e) => {
                 e.stopPropagation();
                 onEventClick(event.id);
                }}
               />
              ))}
             </div>
            ) : (
             <div className="flex items-center gap-0.5">
              <div className={`w-2 h-1.5 rounded-full ${getEventIndicator(dayEvents[0]).color}`} />
              <div className={`w-2 h-1.5 rounded-full ${getEventIndicator(dayEvents[1]).color}`} />
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
               +{dayEvents.length - 2}
              </Badge>
             </div>
            )}
           </div>
          )}
         </>
        )}
       </div>
      );
     })}
    </div>
   </div>

  </div>
 );
}
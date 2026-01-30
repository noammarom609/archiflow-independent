import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isToday, isBefore, startOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';

// Generate hours array from 6:00 to 22:00
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

export default function SchedulerWeekView({ 
  currentDate, 
  onDateChange, 
  selectedSlots, 
  onAddSlot,
  existingEvents = []
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const gridRef = useRef(null);

  const weekStart = startOfWeek(currentDate, { locale: he });
  const weekEnd = endOfWeek(currentDate, { locale: he });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const nextWeek = () => onDateChange(addWeeks(currentDate, 1));
  const prevWeek = () => onDateChange(subWeeks(currentDate, 1));

  // Check if a day/hour is in the past
  const isSlotInPast = (day, hour) => {
    const now = new Date();
    const slotTime = new Date(day);
    slotTime.setHours(hour, 0, 0, 0);
    return isBefore(slotTime, now);
  };

  // Check if a slot overlaps with existing events
  const isSlotBusy = (day, hour) => {
    return existingEvents.some(event => {
      if (!event.start_date) return false;
      const eventDate = new Date(event.start_date);
      const eventHour = eventDate.getHours();
      return (
        eventDate.toDateString() === day.toDateString() && 
        eventHour === hour
      );
    });
  };

  // Check if slot is already selected
  const isSlotSelected = (day, hour) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return selectedSlots.some(slot => {
      if (slot.date !== dateStr) return false;
      const startHour = parseInt(slot.start_time.split(':')[0]);
      const endHour = parseInt(slot.end_time.split(':')[0]);
      return hour >= startHour && hour < endHour;
    });
  };

  // Handle mouse events for drag selection
  const handleMouseDown = (day, hour) => {
    if (isSlotBusy(day, hour) || isSlotInPast(day, hour)) return;
    setIsDragging(true);
    setDragStart({ day, hour });
    setDragEnd({ day, hour });
  };

  const handleMouseEnter = (day, hour) => {
    if (!isDragging || dragStart.day.toDateString() !== day.toDateString()) return;
    if (isSlotBusy(day, hour) || isSlotInPast(day, hour)) return;
    setDragEnd({ day, hour });
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      return;
    }

    const startHour = Math.min(dragStart.hour, dragEnd.hour);
    const endHour = Math.max(dragStart.hour, dragEnd.hour) + 1;

    const newSlot = {
      date: format(dragStart.day, 'yyyy-MM-dd'),
      start_time: `${String(startHour).padStart(2, '0')}:00`,
      end_time: `${String(endHour).padStart(2, '0')}:00`
    };

    onAddSlot(newSlot);
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Check if cell is in drag range
  const isInDragRange = (day, hour) => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    if (dragStart.day.toDateString() !== day.toDateString()) return false;
    
    const minHour = Math.min(dragStart.hour, dragEnd.hour);
    const maxHour = Math.max(dragStart.hour, dragEnd.hour);
    return hour >= minHour && hour <= maxHour;
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">
            {format(weekStart, 'd MMM', { locale: he })} - {format(weekEnd, 'd MMM yyyy', { locale: he })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())}>
              היום
            </Button>
            <Button variant="outline" size="icon" onClick={prevWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          גרור על הלוח לבחירת חלונות זמן זמינים
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {/* Days Header */}
        <div className="grid grid-cols-8 border-b border-border sticky top-0 bg-background z-10">
          <div className="p-2 border-l border-border" />
          {daysInWeek.map((day, index) => {
            const isCurrentDay = isToday(day);
            return (
              <div 
                key={index} 
                className={`text-center p-3 border-l border-border ${isCurrentDay ? 'bg-primary/10' : ''}`}
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {format(day, 'EEE', { locale: he })}
                </div>
                <div className={`text-lg font-bold ${isCurrentDay ? 'text-primary' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time Grid */}
        <div 
          ref={gridRef}
          className="overflow-y-auto max-h-[500px] select-none"
          onMouseLeave={() => {
            if (isDragging) handleMouseUp();
          }}
        >
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-border/50 min-h-[50px]">
              {/* Hour label */}
              <div className="p-2 text-xs text-muted-foreground text-left border-l border-border bg-muted/30 flex items-start justify-end pr-2">
                {String(hour).padStart(2, '0')}:00
              </div>
              
              {/* Day cells */}
              {daysInWeek.map((day, dayIndex) => {
                const isPast = isSlotInPast(day, hour);
                const isBusy = isSlotBusy(day, hour);
                const isSelected = isSlotSelected(day, hour);
                const inDragRange = isInDragRange(day, hour);
                const isCurrentDay = isToday(day);
                const isDisabled = isPast || isBusy;
                
                return (
                  <motion.div 
                    key={dayIndex} 
                    className={`
                      border-l border-border/50 min-h-[50px] transition-all
                      ${isCurrentDay ? 'bg-primary/5' : ''}
                      ${isPast ? 'bg-slate-100 cursor-not-allowed opacity-50' : 'cursor-pointer'}
                      ${isBusy && !isPast ? 'bg-red-100 cursor-not-allowed' : ''}
                      ${isSelected && !isDisabled ? 'bg-green-200 border-green-400' : ''}
                      ${inDragRange && !isSelected && !isDisabled ? 'bg-primary/30' : ''}
                      ${!isDisabled && !isSelected && !inDragRange ? 'hover:bg-primary/10' : ''}
                    `}
                    onMouseDown={() => handleMouseDown(day, hour)}
                    onMouseEnter={() => handleMouseEnter(day, hour)}
                    onMouseUp={handleMouseUp}
                    whileHover={!isDisabled ? { scale: 1.02 } : {}}
                  >
                    {isPast && (
                      <div className="h-full w-full flex items-center justify-center">
                        <span className="text-[10px] text-slate-400">עבר</span>
                      </div>
                    )}
                    {isBusy && !isPast && (
                      <div className="h-full w-full flex items-center justify-center">
                        <span className="text-xs text-red-600">תפוס</span>
                      </div>
                    )}
                    {isSelected && !isDisabled && (
                      <div className="h-full w-full flex items-center justify-center">
                        <span className="text-xs text-green-700 font-medium">✓ נבחר</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
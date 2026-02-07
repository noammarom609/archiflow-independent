import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, parseISO, isToday, getHours, getMinutes } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/providers/LanguageProvider';

// Generate hours array from 6:00 to 22:00
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

export default function WeekView({ currentDate, onDateChange, events, onEventClick }) {
  const { t } = useLanguage();
  const weekStart = startOfWeek(currentDate, { locale: he });
  const weekEnd = endOfWeek(currentDate, { locale: he });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDayAndHour = (day, hour) => {
    return events.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      if (!isSameDay(eventDate, day)) return false;
      
      // If event has start_date with time, check the hour
      if (event.start_date) {
        try {
          const startDate = parseISO(event.start_date);
          const eventHour = getHours(startDate);
          return eventHour === hour;
        } catch {
          return hour === 9; // Default to 9:00 if can't parse
        }
      }
      // Events without specific time show at 9:00
      return hour === 9;
    });
  };

  const getEventsForDay = (day) => {
    return events.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, day);
    });
  };

  const getEventTypeColor = (event) => {
    // Special styling for pending approval meetings
    if (event.status === 'pending_approval') {
      return 'bg-amber-100 text-amber-800 border-amber-300 border-r-4 border-r-amber-500 border-dashed border-2';
    }
    
    const colors = {
      meeting: 'bg-blue-100 text-blue-800 border-blue-200 border-r-4 border-r-blue-500',
      deadline: 'bg-red-100 text-red-800 border-red-200 border-r-4 border-r-red-500',
      task: 'bg-purple-100 text-purple-800 border-purple-200 border-r-4 border-r-purple-500',
      journal: 'bg-green-100 text-green-800 border-green-200 border-r-4 border-r-green-500',
      other: 'bg-slate-100 text-slate-800 border-slate-200 border-r-4 border-r-slate-500',
    };
    return colors[event.type] || colors.other;
  };

  const nextWeek = () => onDateChange(addWeeks(currentDate, 1));
  const prevWeek = () => onDateChange(subWeeks(currentDate, 1));

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            {format(weekStart, 'd MMM', { locale: he })} - {format(weekEnd, 'd MMM yyyy', { locale: he })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())}>
              היום
            </Button>
            <Button variant="outline" size="icon" onClick={prevWeek} aria-label={t('a11y.previousWeek')} title={t('a11y.previousWeek')}>
              <ChevronRight className="w-4 h-4" aria-hidden />
            </Button>
            <Button variant="outline" size="icon" onClick={nextWeek} aria-label={t('a11y.nextWeek')} title={t('a11y.nextWeek')}>
              <ChevronLeft className="w-4 h-4" aria-hidden />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Days Header */}
        <div className="grid grid-cols-8 border-b border-border sticky top-0 bg-white z-10">
          {/* Empty cell for hours column */}
          <div className="p-2 border-l border-border" />
          
          {/* Day headers */}
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
                <div className={`text-xl font-bold ${isCurrentDay ? 'text-primary' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time Grid */}
        <div className="overflow-y-auto max-h-[600px]">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-border/50 min-h-[60px]">
              {/* Hour label */}
              <div className="p-2 text-xs text-muted-foreground text-left border-l border-border bg-muted/30 flex items-start justify-end pr-2">
                {String(hour).padStart(2, '0')}:00
              </div>
              
              {/* Day cells */}
              {daysInWeek.map((day, dayIndex) => {
                const hourEvents = getEventsForDayAndHour(day, hour);
                const isCurrentDay = isToday(day);
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`border-l border-border/50 p-1 min-h-[60px] ${isCurrentDay ? 'bg-primary/5' : 'hover:bg-muted/30'} transition-colors`}
                  >
                    {hourEvents.map((event, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => onEventClick(event)}
                          className={`text-xs px-2 py-1.5 rounded cursor-pointer hover:opacity-80 transition-all mb-1 ${getEventTypeColor(event)}`}
                        >
                          <div className="font-semibold truncate text-[11px] flex items-center gap-1">
                            {event.status === 'pending_approval' && (
                              <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            )}
                            {event.title}
                          </div>
                          {event.start_date && (
                            <div className="text-[10px] opacity-75">
                              {format(parseISO(event.start_date), 'HH:mm')}
                            </div>
                          )}
                          {event.status === 'pending_approval' && (
                            <div className="text-[9px] text-amber-700 font-medium mt-0.5">⏳ ממתין לאישור</div>
                          )}
                        </motion.div>
                      ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format, addDays, startOfDay, isSameDay, parseISO, isToday, isTomorrow } from 'date-fns';
import { he } from 'date-fns/locale';

const eventTypeColors = {
  meeting: 'bg-blue-100 text-blue-800 border-blue-200',
  deadline: 'bg-red-100 text-red-800 border-red-200',
  task: 'bg-purple-100 text-purple-800 border-purple-200',
  journal: 'bg-green-100 text-green-800 border-green-200',
  other: 'bg-slate-100 text-slate-800 border-slate-200',
};

const eventTypeLabels = {
  meeting: 'פגישה',
  deadline: 'דדליין',
  task: 'משימה',
  journal: 'יומן',
  other: 'אחר',
};

const priorityColors = {
  urgent: 'border-r-4 border-red-500',
  high: 'border-r-4 border-orange-500',
  medium: 'border-r-4 border-yellow-500',
  low: 'border-r-4 border-green-500',
};

export default function AgendaView({ startDate, daysCount = 7, events, onEventClick, onDateChange }) {
  const days = Array.from({ length: daysCount }, (_, i) => addDays(startOfDay(startDate), i));

  const getEventsForDay = (day) => {
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        return isSameDay(eventDate, day);
      })
      .sort((a, b) => {
        const aTime = a.start_date ? new Date(a.start_date).getTime() : 0;
        const bTime = b.start_date ? new Date(b.start_date).getTime() : 0;
        return aTime - bTime;
      });
  };

  const getDayLabel = (day) => {
    if (isToday(day)) return 'היום';
    if (isTomorrow(day)) return 'מחר';
    return format(day, 'EEEE', { locale: he });
  };

  const nextWeek = () => onDateChange(addDays(startDate, daysCount));
  const prevWeek = () => onDateChange(addDays(startDate, -daysCount));

  return (
    <Card className="border-slate-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">
            תצוגת אג'נדה - {daysCount} ימים
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Days List */}
        <div className="space-y-6">
          {days.map((day, dayIndex) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentDay = isToday(day);

            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: dayIndex * 0.05 }}
              >
                {/* Day Header */}
                <div className={`flex items-center gap-4 mb-3 pb-3 border-b-2 ${isCurrentDay ? 'border-indigo-600' : 'border-slate-200'}`}>
                  <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center ${isCurrentDay ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                    <span className="text-sm font-medium">
                      {getDayLabel(day)}
                    </span>
                    <span className="text-2xl font-bold">
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600">
                      {format(day, 'dd MMMM yyyy', { locale: he })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {dayEvents.length} אירועים
                    </p>
                  </div>
                </div>

                {/* Events */}
                {dayEvents.length === 0 ? (
                  <div className="py-4 text-center text-sm text-slate-500 bg-slate-50 rounded-lg">
                    אין אירועים מתוכננים
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayEvents.map((event, idx) => {
                      const priorityClass = event.priority ? priorityColors[event.priority] : '';

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => onEventClick(event)}
                          className={`p-4 bg-white rounded-lg border-2 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer ${priorityClass}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Time & Title */}
                              <div className="flex items-center gap-3 mb-2">
                                {event.start_date && (
                                  <div className="flex items-center gap-1 text-sm text-slate-600 flex-shrink-0">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-medium">
                                      {format(parseISO(event.start_date), 'HH:mm')}
                                    </span>
                                  </div>
                                )}
                                <h4 className="font-semibold text-slate-900 truncate">
                                  {event.title}
                                </h4>
                              </div>

                              {/* Description */}
                              {event.description && (
                                <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                                  {event.description}
                                </p>
                              )}

                              {/* Meta Info */}
                              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                {event.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                                {event.attendees && event.attendees.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>{event.attendees.length} משתתפים</span>
                                  </div>
                                )}
                                {event.project_name && (
                                  <Badge variant="outline" className="text-xs">
                                    {event.project_name}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Type Badge */}
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={`${eventTypeColors[event.type]} text-xs whitespace-nowrap`}>
                                {eventTypeLabels[event.type]}
                              </Badge>
                              {event.status === 'pending' && (
                                <Badge className="bg-amber-100 text-amber-800 text-xs">
                                  ממתין לאישור
                                </Badge>
                              )}
                              {event.priority === 'urgent' && (
                                <Badge className="bg-red-600 text-white text-xs">
                                  דחוף!
                                </Badge>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
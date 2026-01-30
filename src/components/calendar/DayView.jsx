import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, addDays, subDays, parseISO, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function DayView({ currentDate, onDateChange, events, onEventClick }) {
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return isSameDay(eventDate, currentDate);
  }).sort((a, b) => {
    const dateA = new Date(a.start_date || a.date);
    const dateB = new Date(b.start_date || b.date);
    return dateA - dateB;
  });

  const eventTypeColors = {
    meeting: 'border-l-4 border-blue-500 bg-blue-50',
    deadline: 'border-l-4 border-red-500 bg-red-50',
    task: 'border-l-4 border-purple-500 bg-purple-50',
    journal: 'border-l-4 border-green-500 bg-green-50',
    other: 'border-l-4 border-slate-500 bg-slate-50',
  };

  const eventTypeLabels = {
    meeting: 'פגישה',
    deadline: 'דדליין',
    task: 'משימה',
    journal: 'יומן',
    other: 'אחר',
  };

  const nextDay = () => onDateChange(addDays(currentDate, 1));
  const prevDay = () => onDateChange(subDays(currentDate, 1));
  const today = () => onDateChange(new Date());

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            {format(currentDate, 'EEEE, dd MMMM yyyy', { locale: he })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={today}>
              היום
            </Button>
            <Button variant="outline" size="icon" onClick={prevDay}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextDay}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {dayEvents.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">אין אירועים מתוכננים ליום זה</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onEventClick(event)}
                className={`p-4 rounded-lg cursor-pointer hover:shadow-md transition-all ${eventTypeColors[event.type]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {event.start_date && (
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span>{format(parseISO(event.start_date), 'HH:mm')}</span>
                          {event.end_date && (
                            <span>- {format(parseISO(event.end_date), 'HH:mm')}</span>
                          )}
                        </div>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {eventTypeLabels[event.type]}
                      </Badge>
                      {event.status === 'pending' && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          ממתין לאישור
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
                    )}
                    {event.location && (
                      <p className="text-xs text-slate-500 mt-2">📍 {event.location}</p>
                    )}
                  </div>
                  {event.status === 'pending' && (
                    <div className="flex flex-col gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        אשר
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        דחה
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
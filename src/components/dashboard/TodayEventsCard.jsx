import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { archiflow } from '@/api/archiflow';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { CalendarDays, Clock, ExternalLink } from 'lucide-react';
import { format, parseISO, isToday, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * Compact card showing only today's calendar events for the Dashboard "Today's Focus" section.
 * Uses same queryKey as WeeklyScheduleWidget for cache sharing.
 */
export default function TodayEventsCard() {
  const navigate = useNavigate();

  const { data: calendarEvents = [], isLoading } = useQuery({
    queryKey: ['calendarEvents', 'week'],
    queryFn: () => archiflow.entities.CalendarEvent.list('-start_date'),
  });

  const today = new Date();
  const todayEvents = calendarEvents
    .filter((event) => {
      if (!event.start_date) return false;
      const eventDate = parseISO(event.start_date);
      return isSameDay(eventDate, today);
    })
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return format(parseISO(dateStr), 'HH:mm', { locale: he });
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 bg-muted rounded w-28 animate-pulse" />
              <div className="h-3 bg-muted rounded w-40 animate-pulse" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-primary" />
          </div>
          אירועים היום
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {format(today, 'EEEE, d בMMMM', { locale: he })}
        </p>
      </CardHeader>
      <CardContent>
        {todayEvents.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="אין אירועים היום"
            description="הוסף אירוע או צור פגישה בלוח השנה"
            compact
            action={
              <Button
                size="sm"
                onClick={() => navigate(createPageUrl('Calendar'))}
                className="gap-2"
              >
                הוסף אירוע
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2" role="list">
            {todayEvents.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => navigate(createPageUrl('Calendar'))}
                  className="w-full text-right flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground shrink-0">
                    <Clock className="w-3.5 h-3.5" aria-hidden />
                    {formatTime(event.start_date)}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-sm font-medium text-foreground">
                    {event.title || 'ללא כותרת'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        {todayEvents.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-muted-foreground"
            onClick={() => navigate(createPageUrl('Calendar'))}
          >
            הצג לו״ז שבועי
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

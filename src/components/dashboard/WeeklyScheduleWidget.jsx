import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { archiflow } from '@/api/archiflow';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, List, MapPin, Clock, CheckCircle2, Circle, FolderKanban, ExternalLink, Edit2, X, Save, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, parseISO, isPast } from 'date-fns';
import { he } from 'date-fns/locale';
import { useLanguage } from '@/components/providers/LanguageProvider';

const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export default function WeeklyScheduleWidget() {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState('days'); // 'days' or 'list'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState(null);
  const queryClient = useQueryClient();
  
  // Get week boundaries
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 }); // Saturday
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch calendar events
  const { data: calendarEvents = [], isLoading: loadingCalendar } = useQuery({
    queryKey: ['calendarEvents', 'week'],
    queryFn: () => archiflow.entities.CalendarEvent.list('-start_date'),
  });

  // Fetch projects for name lookup
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => archiflow.entities.Project.list(),
  });

  // Create project lookup map
  const projectsMap = projects.reduce((acc, p) => {
    acc[p.id] = p.name;
    return acc;
  }, {});

  // Update event mutation with optimistic updates
  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }) => archiflow.entities.CalendarEvent.update(id, data),
    // Optimistic update for smooth UI
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['calendarEvents', 'week'] });
      
      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData(['calendarEvents', 'week']);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['calendarEvents', 'week'], (old) => {
        if (!old) return old;
        return old.map(event => 
          event.id === id ? { ...event, ...data } : event
        );
      });
      
      // Return a context object with the snapshotted value
      return { previousEvents, isToggle: data.completed !== undefined && Object.keys(data).length === 1 };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousEvents) {
        queryClient.setQueryData(['calendarEvents', 'week'], context.previousEvents);
      }
    },
    onSuccess: (data, variables, context) => {
      // For toggle operations, don't refetch - optimistic update is enough
      // For other edits, refetch to ensure consistency
      if (!context?.isToggle) {
        queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
        setSelectedEvent(null);
      }
      setIsEditing(false);
    },
  });

  // Filter events for current week
  const weekEvents = calendarEvents.filter(event => {
    if (!event.start_date) return false;
    const eventDate = parseISO(event.start_date);
    return eventDate >= weekStart && eventDate <= weekEnd;
  });

  // Group events by day
  const eventsByDay = daysOfWeek.map(day => ({
    date: day,
    dayName: dayNames[day.getDay()],
    events: weekEvents.filter(event => {
      const eventDate = parseISO(event.start_date);
      return isSameDay(eventDate, day);
    }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
  }));

  // All events sorted by date for list view
  const sortedEvents = [...weekEvents].sort((a, b) => 
    new Date(a.start_date) - new Date(b.start_date)
  );

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return format(parseISO(dateStr), 'HH:mm');
    } catch {
      return '';
    }
  };

  // Check if event is completed based on the completed field
  const isEventCompleted = (event) => {
    return event.completed === true;
  };

  // Toggle completed status
  const toggleCompleted = (event, e) => {
    e.stopPropagation(); // Don't open dialog
    updateEventMutation.mutate({ 
      id: event.id, 
      data: { completed: !event.completed } 
    });
  };

  // Get project name by ID
  const getProjectName = (projectId) => {
    if (!projectId) return null;
    return projectsMap[projectId] || null;
  };

  // Handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setEditedEvent({ ...event });
    setIsEditing(false);
  };

  // Handle save
  const handleSave = () => {
    if (editedEvent && selectedEvent) {
      updateEventMutation.mutate({ id: selectedEvent.id, data: editedEvent });
    }
  };

  const EventCard = ({ event, compact = false }) => {
    const startTime = formatTime(event.start_date);
    const endTime = formatTime(event.end_date);
    const isCompleted = isEventCompleted(event);
    const projectName = getProjectName(event.project_id);
    
    return (
      <motion.div
        layout="position"
        initial={false}
        animate={{ opacity: 1 }}
        onClick={() => handleEventClick(event)}
        className={`
          p-2 rounded-lg border cursor-pointer relative overflow-hidden
          transition-colors duration-300 ease-out
          ${isCompleted 
            ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-muted-foreground' 
            : 'bg-background border-border hover:border-primary/30 hover:shadow-sm'
          }
          ${compact ? 'text-xs' : 'text-sm'}
        `}
      >
        <div className="flex items-start gap-2">
          <button
            onClick={(e) => toggleCompleted(event, e)}
            className="mt-0.5 flex-shrink-0 relative w-4 h-4 group"
            title={isCompleted ? 'סמן כלא בוצע' : 'סמן כבוצע'}
          >
            <span className={`
              absolute inset-0 flex items-center justify-center
              transition-all duration-200 ease-out
              ${isCompleted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
            `}>
              <span className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </span>
            </span>
            <span className={`
              absolute inset-0 flex items-center justify-center
              transition-all duration-200 ease-out
              ${isCompleted ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
            `}>
              <Circle className="w-3.5 h-3.5 text-muted-foreground group-hover:text-green-500 transition-colors" />
            </span>
          </button>
          
          <div className="flex-1 min-w-0">
            <p className={`
              font-medium truncate transition-all duration-200
              ${isCompleted ? 'opacity-60 line-through' : 'opacity-100'}
            `}>
              {event.title}
            </p>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-muted-foreground">
              {(startTime || endTime) && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {startTime}{endTime && ` - ${endTime}`}
                </span>
              )}
              
              {event.location && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[100px]">{event.location}</span>
                </span>
              )}
            </div>
            
            {projectName && (
              <Badge variant="outline" className="mt-1.5 text-[10px] px-1.5 py-0">
                <FolderKanban className="w-2.5 h-2.5 ml-1" />
                {projectName}
              </Badge>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-organic">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            לו״ז שבועי
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Link to={createPageUrl('Calendar')}>
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                ללוח שנה
              </Button>
            </Link>
            
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList className="h-8">
                <TabsTrigger value="days" className="text-xs px-2 h-6">
                  <CalendarDays className="w-3.5 h-3.5 ml-1" />
                  ימים
                </TabsTrigger>
                <TabsTrigger value="list" className="text-xs px-2 h-6">
                  <List className="w-3.5 h-3.5 ml-1" />
                  רשימה
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          {format(weekStart, 'd בMMMM', { locale: he })} - {format(weekEnd, 'd בMMMM yyyy', { locale: he })}
        </p>
      </CardHeader>
      
      <CardContent>
        {loadingCalendar ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : viewMode === 'days' ? (
          /* Days View */
          <div className="grid grid-cols-7 gap-2">
            {eventsByDay.map(({ date, dayName, events }) => (
              <div 
                key={date.toISOString()} 
                className={`
                  min-h-[120px] rounded-lg p-2 border transition-all
                  ${isToday(date) 
                    ? 'bg-primary/5 border-primary/30' 
                    : 'bg-muted/30 border-transparent'
                  }
                `}
              >
                <div className={`text-center mb-2 ${isToday(date) ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                  <div className="text-xs">{dayName}</div>
                  <div className={`text-lg font-bold ${isToday(date) ? 'text-primary' : 'text-foreground'}`}>
                    {format(date, 'd')}
                  </div>
                </div>
                
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {events.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground text-center py-2">-</p>
                  ) : (
                    events.map(event => (
                      <EventCard key={event.id} event={event} compact />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {sortedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                אין אירועים מתוכננים לשבוע זה
              </p>
            ) : (
              sortedEvents.map(event => {
                const eventDate = parseISO(event.start_date);
                return (
                  <div key={event.id} className="flex gap-3">
                    <div className={`
                      text-center min-w-[50px] py-1 px-2 rounded-lg
                      ${isToday(eventDate) ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'}
                    `}>
                      <div className="text-[10px]">{dayNames[eventDate.getDay()]}</div>
                      <div className="text-sm font-bold">{format(eventDate, 'd')}</div>
                    </div>
                    <div className="flex-1">
                      <EventCard event={event} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Event Details Dialog */}
        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{isEditing ? 'עריכת אירוע' : 'פרטי אירוע'}</span>
                {!isEditing && (
                  <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label={t('a11y.edit')}>
                    <Edit2 className="w-4 h-4" aria-hidden />
                  </Button>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {selectedEvent && (
              <div className="space-y-4">
                {isEditing ? (
                  /* Edit Mode */
                  <>
                    <div className="space-y-2">
                      <Label>כותרת</Label>
                      <Input 
                        value={editedEvent?.title || ''} 
                        onChange={(e) => setEditedEvent({...editedEvent, title: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>תיאור</Label>
                      <Textarea 
                        value={editedEvent?.description || ''} 
                        onChange={(e) => setEditedEvent({...editedEvent, description: e.target.value})}
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>תאריך ושעת התחלה</Label>
                        <Input 
                          type="datetime-local"
                          value={editedEvent?.start_date ? format(parseISO(editedEvent.start_date), "yyyy-MM-dd'T'HH:mm") : ''}
                          onChange={(e) => setEditedEvent({...editedEvent, start_date: new Date(e.target.value).toISOString()})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>תאריך ושעת סיום</Label>
                        <Input 
                          type="datetime-local"
                          value={editedEvent?.end_date ? format(parseISO(editedEvent.end_date), "yyyy-MM-dd'T'HH:mm") : ''}
                          onChange={(e) => setEditedEvent({...editedEvent, end_date: new Date(e.target.value).toISOString()})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>מיקום</Label>
                      <Input 
                        value={editedEvent?.location || ''} 
                        onChange={(e) => setEditedEvent({...editedEvent, location: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>פרויקט קשור</Label>
                      <Select 
                        value={editedEvent?.project_id || 'none'} 
                        onValueChange={(val) => setEditedEvent({...editedEvent, project_id: val === 'none' ? null : val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="בחר פרויקט" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">ללא פרויקט</SelectItem>
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  /* View Mode */
                  <>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompleted(selectedEvent, e);
                        }}
                        className="mt-0.5 hover:scale-110 transition-transform"
                        title={isEventCompleted(selectedEvent) ? 'סמן כלא בוצע' : 'סמן כבוצע'}
                      >
                        {isEventCompleted(selectedEvent) ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-primary hover:text-green-500" />
                        )}
                      </button>
                      <div>
                        <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                        <Badge variant={isEventCompleted(selectedEvent) ? 'secondary' : 'default'} className="mt-1">
                          {isEventCompleted(selectedEvent) ? 'בוצע' : 'לביצוע'}
                        </Badge>
                      </div>
                    </div>
                    
                    {selectedEvent.description && (
                      <p className="text-muted-foreground text-sm">{selectedEvent.description}</p>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {format(parseISO(selectedEvent.start_date), 'EEEE, d בMMMM yyyy', { locale: he })}
                          {' בשעה '}
                          {formatTime(selectedEvent.start_date)}
                          {selectedEvent.end_date && ` - ${formatTime(selectedEvent.end_date)}`}
                        </span>
                      </div>
                      
                      {selectedEvent.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedEvent.location}</span>
                        </div>
                      )}
                      
                      {selectedEvent.project_id && getProjectName(selectedEvent.project_id) && (
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-muted-foreground" />
                          <Link 
                            to={createPageUrl('Projects') + `?id=${selectedEvent.project_id}`}
                            className="text-primary hover:underline"
                          >
                            {getProjectName(selectedEvent.project_id)}
                          </Link>
                        </div>
                      )}
                      
                      {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground">משתתפים:</span>
                          <span>{selectedEvent.attendees.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            
            <DialogFooter>
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 ml-1" />
                    ביטול
                  </Button>
                  <Button onClick={handleSave} disabled={updateEventMutation.isPending}>
                    {updateEventMutation.isPending ? (
                      <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 ml-1" />
                    )}
                    שמור
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                  סגור
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
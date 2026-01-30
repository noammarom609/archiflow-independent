import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Toaster moved to App.jsx for global fixed positioning
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/utils/authHelpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Filter, Grid, List, Columns, ListTodo, GanttChart, ChevronDown, ChevronUp, BarChart3, UserPlus, Clock, BookOpen } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { he } from 'date-fns/locale';
import AddEventDialog from '../components/calendar/AddEventDialog';
import EventDetailsDialog from '../components/calendar/EventDetailsDialog';
import JournalView from '../components/journal/JournalView';
import CalendarFilters from '../components/calendar/CalendarFilters';
import GoogleCalendarSync from '../components/calendar/GoogleCalendarSync';
import WeekView from '../components/calendar/WeekView';
import DayView from '../components/calendar/DayView';
import AgendaView from '../components/calendar/AgendaView';
import GanttView from '../components/calendar/GanttView';
import PageHeader from '../components/layout/PageHeader';
import SchedulerModeOverlay from '../components/calendar/MeetingScheduler/SchedulerModeOverlay';
import SchedulerWeekView from '../components/calendar/MeetingScheduler/SchedulerWeekView';
import CreateMeetingLinkDialog from '../components/calendar/MeetingScheduler/CreateMeetingLinkDialog';
import PendingMeetingsCard from '../components/calendar/PendingMeetingsCard';
import MeetingApprovalDialog from '../components/calendar/MeetingApprovalDialog';

// Collapsible Section Component
function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-accent/50 transition-all duration-300 py-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
            <span>{title}</span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </motion.div>
        </CardTitle>
      </CardHeader>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <CardContent className="pt-0">
              {children}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('week'); // 'month' | 'week' | 'day' | 'agenda' | 'gantt'
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [agendaDays, setAgendaDays] = useState(7);
  
  // Meeting Scheduler State
  const [isSchedulerMode, setIsSchedulerMode] = useState(false);
  const [schedulerSlots, setSchedulerSlots] = useState([]);
  const [schedulerDuration, setSchedulerDuration] = useState(60);
  const [showCreateLinkDialog, setShowCreateLinkDialog] = useState(false);
  
  const [filters, setFilters] = useState({
    meeting: true,
    deadline: true,
    task: true,
    journal: true,
    other: true,
    approved: true,
    pending: true,
  });

  // Fetch current user for multi-tenant filtering (with bypass support)
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(base44),
  });

  // Multi-tenant: Determine filtering
  const isSuperAdmin = user?.app_role === 'super_admin';

  // Fetch calendar events
  const { data: allCalendarEvents = [] } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: () => base44.entities.CalendarEvent.list('-start_date', 200),
  });

  // Multi-tenant filtering for calendar events
  const calendarEvents = isSuperAdmin 
    ? allCalendarEvents 
    : allCalendarEvents.filter(e => e.created_by === user?.email);

  // Fetch tasks with due dates
  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-due_date', 100),
  });

  // Multi-tenant filtering for tasks
  const tasks = isSuperAdmin 
    ? allTasks 
    : allTasks.filter(t => t.created_by === user?.email);

  // Fetch journal entries
  const { data: allJournalEntries = [] } = useQuery({
    queryKey: ['journalEntries'],
    queryFn: () => base44.entities.JournalEntry.list('-created_date', 100),
  });

  // Multi-tenant filtering for journal entries
  const journalEntries = isSuperAdmin 
    ? allJournalEntries 
    : allJournalEntries.filter(j => j.created_by === user?.email);

  // Fetch meeting slots (pending and approved)
  const { data: allMeetingSlots = [] } = useQuery({
    queryKey: ['meetingSlotsForCalendar'],
    queryFn: async () => {
      const pending = await base44.entities.MeetingSlot.filter({ status: 'pending_approval' });
      const approved = await base44.entities.MeetingSlot.filter({ status: 'approved' });
      return [...pending, ...approved];
    },
  });

  // Multi-tenant filtering for meeting slots
  const meetingSlots = isSuperAdmin 
    ? allMeetingSlots 
    : allMeetingSlots.filter(m => m.created_by === user?.email);

  // Combine all events
  const allEvents = [
    ...calendarEvents.map(e => ({
      ...e,
      type: e.event_type,
      date: e.start_date,
      source: 'calendar',
      status: e.status || 'approved',
    })),
    ...tasks
      .filter(t => t.due_date)
      .map(t => ({
        id: `task-${t.id}`,
        title: t.title,
        type: 'task',
        date: t.due_date,
        description: t.description,
        priority: t.priority,
        source: 'task',
        status: 'approved',
      })),
    ...journalEntries.map(j => ({
      id: `journal-${j.id}`,
      title: j.title,
      type: 'journal',
      date: j.entry_date || j.created_date,
      description: j.content,
      source: 'journal',
      status: 'approved',
    })),
    ...meetingSlots
      .filter(m => m.selected_slot)
      .map(m => ({
        id: `meeting-slot-${m.id}`,
        originalId: m.id,
        title: m.title || `פגישה עם ${m.client_name || 'לקוח'}`,
        type: 'meeting',
        date: m.selected_slot.date,
        start_date: `${m.selected_slot.date}T${m.selected_slot.start_time}:00`,
        end_date: `${m.selected_slot.date}T${m.selected_slot.end_time}:00`,
        description: m.notes,
        source: 'meeting_slot',
        status: m.status,
        client_name: m.client_name,
        client_email: m.client_email,
        client_phone: m.client_phone,
        duration_minutes: m.duration_minutes,
        project_name: m.project_name,
      })),
  ].filter(e => {
    const typeMatch = filters[e.type];
    // Map pending_approval to pending filter
    const statusKey = e.status === 'pending_approval' ? 'pending' : e.status;
    const statusMatch = filters[statusKey];
    return typeMatch && statusMatch;
  });

  // Calendar calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for a specific day
  const getEventsForDay = (day) => {
    return allEvents.filter(event => {
      if (!event.date) return false;
      try {
        const eventDate = new Date(event.date);
        if (isNaN(eventDate.getTime())) return false;
        return isSameDay(eventDate, day);
      } catch (e) {
        return false;
      }
    });
  };

  const eventTypeColors = {
    meeting: 'bg-blue-100 text-blue-800 border-blue-200',
    deadline: 'bg-red-100 text-red-800 border-red-200',
    task: 'bg-purple-100 text-purple-800 border-purple-200',
    journal: 'bg-green-100 text-green-800 border-green-200',
    other: 'bg-slate-100 text-slate-800 border-border',
  };

  const eventTypeLabels = {
    meeting: 'פגישה',
    deadline: 'דדליין',
    task: 'משימה',
    journal: 'יומן',
    other: 'אחר',
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  // Get events for selected date
  const selectedDayEvents = getEventsForDay(selectedDate);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <PageHeader 
          title="לוח שנה" 
          subtitle="כל האירועים והמשימות במקום אחד"
          icon="📅"
        >
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* View Mode Toggle */}
            <motion.div 
              className="flex items-center gap-0.5 sm:gap-1 bg-white border border-border rounded-lg p-0.5 sm:p-1 overflow-x-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.9 }}
            >
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className={`p-2 ${viewMode === 'month' ? 'bg-primary hover:bg-indigo-700' : ''}`}
                title="תצוגת חודש"
              >
                <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className={`p-2 ${viewMode === 'week' ? 'bg-primary hover:bg-indigo-700' : ''}`}
                title="תצוגת שבוע"
              >
                <Columns className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('day')}
                className={`p-2 hidden sm:flex ${viewMode === 'day' ? 'bg-primary hover:bg-indigo-700' : ''}`}
                title="תצוגת יום"
              >
                <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant={viewMode === 'agenda' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('agenda')}
                className={`p-2 ${viewMode === 'agenda' ? 'bg-primary hover:bg-indigo-700' : ''}`}
                title="אג'נדה"
              >
                <ListTodo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant={viewMode === 'gantt' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('gantt')}
                className={`p-2 hidden md:flex ${viewMode === 'gantt' ? 'bg-primary hover:bg-indigo-700' : ''}`}
                title="גנט"
              >
                <GanttChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant={viewMode === 'journal' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('journal')}
                className={`p-2 ${viewMode === 'journal' ? 'bg-primary hover:bg-indigo-700' : ''}`}
                title="יומן"
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 100, delay: 1 }}
            >
              <Button
                variant="outline"
                onClick={() => setShowSyncDialog(true)}
                className="px-2 sm:px-4 py-2 text-xs sm:text-sm"
                size="sm"
              >
                <CalendarIcon className="w-3.5 h-3.5 sm:hidden" />
                <span className="hidden sm:inline">Google</span>
              </Button>
            </motion.div>
            
            {/* Meeting Scheduler Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 150, delay: 1.05 }}
            >
              {!isSchedulerMode ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSchedulerMode(true);
                    setViewMode('week');
                    setSchedulerSlots([]);
                  }}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
                  size="sm"
                >
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">תיאום</span>
                  <span className="sm:hidden">פגישה</span>
                  <span className="hidden sm:inline">פגישה</span>
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Select value={String(schedulerDuration)} onValueChange={(v) => setSchedulerDuration(Number(v))}>
                    <SelectTrigger className="w-24 sm:w-28 text-xs sm:text-sm">
                      <Clock className="w-3 h-3 ml-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 דקות</SelectItem>
                      <SelectItem value="60">שעה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 150, delay: 1.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-primary hover:bg-indigo-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">חדש</span>
              </Button>
            </motion.div>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Calendar - Takes full width on mobile, ~80% on desktop */}
          <div className="lg:col-span-10 order-2 lg:order-1">
            {isSchedulerMode ? (
              <SchedulerWeekView
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                selectedSlots={schedulerSlots}
                onAddSlot={(slot) => setSchedulerSlots([...schedulerSlots, slot])}
                existingEvents={allEvents}
              />
            ) : viewMode === 'journal' ? (
              <JournalView />
            ) : viewMode === 'gantt' ? (
              <GanttView
                currentDate={currentDate}
                onDateChange={setCurrentDate}
              />
            ) : viewMode === 'agenda' ? (
              <AgendaView
                startDate={currentDate}
                daysCount={agendaDays}
                events={allEvents}
                onEventClick={setSelectedEvent}
                onDateChange={setCurrentDate}
              />
            ) : viewMode === 'week' ? (
              <WeekView 
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                events={allEvents}
                onEventClick={setSelectedEvent}
              />
            ) : viewMode === 'day' ? (
              <DayView
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                events={allEvents}
                onEventClick={setSelectedEvent}
              />
            ) : (
              <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold">
                    {format(currentDate, 'MMMM yyyy', { locale: he })}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={today}>
                      היום
                    </Button>
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Day Headers */}
                  {['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'].map(day => (
                    <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}

                  {/* Days */}
                  {daysInMonth.map((day, index) => {
                    const dayEvents = getEventsForDay(day);
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentDay = isToday(day);
                    
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          min-h-24 p-2 rounded-lg cursor-pointer transition-all border-2
                          ${isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-transparent hover:border-border'}
                          ${!isSameMonth(day, currentDate) ? 'opacity-40' : ''}
                          ${isCurrentDay ? 'bg-indigo-100' : 'bg-white'}
                        `}
                      >
                        <div className="text-right mb-1">
                          <span className={`text-sm font-semibold ${isCurrentDay ? 'text-indigo-700' : 'text-foreground'}`}>
                            {format(day, 'd')}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event, idx) => (
                            <div
                              key={idx}
                              className={`text-xs px-2 py-1 rounded truncate ${eventTypeColors[event.type]}`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground px-2">
                              +{dayEvents.length - 3} נוספים
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Compact ~20% - Shown first on mobile */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 order-1 lg:order-2">
            {/* Selected Day Events - Now at top */}
            <Card className="border-border">
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  {format(selectedDate, 'dd MMMM yyyy', { locale: he })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayEvents.length === 0 ? (
                  <div className="text-center py-6">
                    <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">אין אירועים ביום זה</p>
                    {allEvents.length === 0 && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setShowSyncDialog(true)}
                        className="mt-2 text-xs text-primary"
                      >
                        חבר יומן Google
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDayEvents.map((event, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedEvent(event)}
                        className="p-2 rounded-lg border border-border hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-foreground text-xs">{event.title}</h4>
                          <Badge className={`${eventTypeColors[event.type]} text-[10px]`}>
                            {eventTypeLabels[event.type]}
                          </Badge>
                        </div>
                        {event.start_date && (
                          <p className="text-[10px] text-muted-foreground">
                            {format(parseISO(event.start_date), 'HH:mm', { locale: he })}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filters - Now collapsible, default closed */}
            <CollapsibleSection title="סינון" icon={Filter} defaultOpen={false}>
              <CalendarFilters filters={filters} onFiltersChange={setFilters} compact />
            </CollapsibleSection>

            {/* Pending Meetings */}
            <PendingMeetingsCard />

            {/* Quick Stats - Now collapsible, default closed */}
            <CollapsibleSection title="סטטיסטיקות" icon={BarChart3} defaultOpen={false}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">סה״כ אירועים</span>
                  <span className="text-sm font-bold text-foreground">{allEvents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">פגישות</span>
                  <span className="text-sm font-bold text-blue-600">
                    {allEvents.filter(e => e.type === 'meeting').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">משימות</span>
                  <span className="text-sm font-bold text-purple-600">
                    {allEvents.filter(e => e.type === 'task').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">דדליינים</span>
                  <span className="text-sm font-bold text-red-600">
                    {allEvents.filter(e => e.type === 'deadline').length}
                  </span>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </motion.div>

      {/* Dialogs */}
      <AddEventDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        selectedDate={selectedDate}
      />

      <EventDetailsDialog
        event={selectedEvent?.source !== 'meeting_slot' || selectedEvent?.status !== 'pending_approval' ? selectedEvent : null}
        onClose={() => setSelectedEvent(null)}
      />

      <MeetingApprovalDialog
        event={selectedEvent?.source === 'meeting_slot' && selectedEvent?.status === 'pending_approval' ? selectedEvent : null}
        onClose={() => setSelectedEvent(null)}
      />

      <GoogleCalendarSync
        isOpen={showSyncDialog}
        onClose={() => setShowSyncDialog(false)}
      />
      
      {/* Meeting Scheduler Overlay - Hidden when CreateMeetingLinkDialog is open */}
      {isSchedulerMode && !showCreateLinkDialog && (
        <SchedulerModeOverlay
          isActive={isSchedulerMode}
          selectedSlots={schedulerSlots}
          onRemoveSlot={(idx) => setSchedulerSlots(schedulerSlots.filter((_, i) => i !== idx))}
          onCancel={() => {
            setIsSchedulerMode(false);
            setSchedulerSlots([]);
          }}
          onConfirm={() => setShowCreateLinkDialog(true)}
          duration={schedulerDuration}
        />
      )}
      
      {/* Create Meeting Link Dialog */}
      <CreateMeetingLinkDialog
        isOpen={showCreateLinkDialog}
        onClose={() => {
          setShowCreateLinkDialog(false);
          setIsSchedulerMode(false);
          setSchedulerSlots([]);
        }}
        selectedSlots={schedulerSlots}
        duration={schedulerDuration}
      />
    </div>
  );
}
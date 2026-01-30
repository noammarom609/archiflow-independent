import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Check,
  UserPlus,
  Loader2
} from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isBefore, isToday, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { archiflow } from '@/api/archiflow';
import { useQuery } from '@tanstack/react-query';
import CreateMeetingLinkDialog from '../../calendar/MeetingScheduler/CreateMeetingLinkDialog';

/**
 * ProjectMeetingSchedulerModal - Modal לתיאום פגישה מתוך Flow הפרויקט
 * 
 * @param {boolean} isOpen - האם המודל פתוח
 * @param {function} onClose - פונקציה לסגירת המודל
 * @param {object} project - נתוני הפרויקט
 * @param {string} meetingTitle - כותרת מוצעת לפגישה
 * @param {string} meetingContext - הקשר הפגישה (לתיאור)
 * @param {string} projectStage - שלב הפרויקט (לצורך הודעת וואטסאפ מותאמת)
 */
export default function ProjectMeetingSchedulerModal({ 
  isOpen, 
  onClose, 
  project, 
  meetingTitle = 'פגישה',
  meetingContext = '',
  projectStage = ''
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [duration, setDuration] = useState(60);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  // Fetch existing calendar events to show busy times
  const { data: calendarEvents = [] } = useQuery({
    queryKey: ['calendarEventsForScheduler'],
    queryFn: () => archiflow.entities.CalendarEvent.list('-start_date', 100),
    enabled: isOpen,
  });

  // Week calculations
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));

  // Check if slot is in the past
  const isPastSlot = (day, hour) => {
    const slotTime = new Date(day);
    slotTime.setHours(hour, 0, 0, 0);
    return isBefore(slotTime, new Date());
  };

  // Check if slot is busy (has existing event)
  const isBusySlot = (day, hour) => {
    return calendarEvents.some(event => {
      if (!event.start_date) return false;
      const eventStart = new Date(event.start_date);
      return isSameDay(eventStart, day) && eventStart.getHours() === hour;
    });
  };

  // Check if slot is selected
  const isSelectedSlot = (day, hour) => {
    return selectedSlots.some(slot => 
      isSameDay(new Date(slot.date), day) && slot.hour === hour
    );
  };

  // Toggle slot selection
  const toggleSlot = (day, hour) => {
    if (isPastSlot(day, hour) || isBusySlot(day, hour)) return;

    const slotKey = `${format(day, 'yyyy-MM-dd')}-${hour}`;
    const exists = selectedSlots.some(s => 
      s.date === format(day, 'yyyy-MM-dd') && s.hour === hour
    );

    if (exists) {
      setSelectedSlots(selectedSlots.filter(s => 
        !(s.date === format(day, 'yyyy-MM-dd') && s.hour === hour)
      ));
    } else {
      setSelectedSlots([...selectedSlots, {
        date: format(day, 'yyyy-MM-dd'),
        hour,
        start_time: `${hour.toString().padStart(2, '0')}:00`,
        end_time: `${(hour + (duration / 60)).toString().padStart(2, '0')}:00`
      }]);
    }
  };

  // Handle drag selection
  const handleMouseDown = (day, hour) => {
    if (isPastSlot(day, hour) || isBusySlot(day, hour)) return;
    setIsDragging(true);
    setDragStart({ day, hour });
    toggleSlot(day, hour);
  };

  const handleMouseEnter = (day, hour) => {
    if (!isDragging || isPastSlot(day, hour) || isBusySlot(day, hour)) return;
    if (!isSelectedSlot(day, hour)) {
      toggleSlot(day, hour);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Proceed to create link
  const handleProceed = () => {
    if (selectedSlots.length === 0) return;
    setShowCreateLink(true);
  };

  // Reset and close
  const handleClose = () => {
    setSelectedSlots([]);
    setShowCreateLink(false);
    onClose();
  };

  // Close after link created
  const handleLinkCreated = () => {
    setSelectedSlots([]);
    setShowCreateLink(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !showCreateLink} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
          {/* Header - Fixed */}
          <DialogHeader className="p-4 sm:p-6 pb-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  תיאום פגישה - {meetingTitle}
                </DialogTitle>
                {project && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    פרויקט: {project.name} | לקוח: {project.client}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                  <SelectTrigger className="w-24 sm:w-28">
                    <Clock className="w-3 h-3 ml-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 דקות</SelectItem>
                    <SelectItem value="60">שעה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="sm" onClick={prevWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <h3 className="font-semibold text-lg">
                {format(weekStart, 'd MMMM', { locale: he })} - {format(addDays(weekStart, 6), 'd MMMM yyyy', { locale: he })}
              </h3>
              <Button variant="outline" size="sm" onClick={nextWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="border rounded-xl overflow-hidden">
              {/* Day Headers */}
              <div className="grid grid-cols-8 bg-slate-100 border-b">
                <div className="p-2 text-center text-xs font-medium text-slate-500 border-l">שעה</div>
                {weekDays.map((day, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2 text-center border-l ${isToday(day) ? 'bg-indigo-100' : ''}`}
                  >
                    <p className="text-xs text-slate-500">{format(day, 'EEEE', { locale: he })}</p>
                    <p className={`text-sm font-semibold ${isToday(day) ? 'text-indigo-600' : ''}`}>
                      {format(day, 'd/M')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              <div className="max-h-[400px] overflow-y-auto">
                {hours.map(hour => (
                  <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
                    <div className="p-2 text-center text-xs text-slate-500 border-l bg-slate-50">
                      {hour}:00
                    </div>
                    {weekDays.map((day, dayIdx) => {
                      const isPast = isPastSlot(day, hour);
                      const isBusy = isBusySlot(day, hour);
                      const isSelected = isSelectedSlot(day, hour);

                      return (
                        <div
                          key={dayIdx}
                          onMouseDown={() => handleMouseDown(day, hour)}
                          onMouseEnter={() => handleMouseEnter(day, hour)}
                          className={`
                            p-2 border-l min-h-[40px] cursor-pointer transition-all select-none
                            ${isPast ? 'bg-slate-100 cursor-not-allowed' : ''}
                            ${isBusy ? 'bg-red-50 cursor-not-allowed' : ''}
                            ${isSelected ? 'bg-indigo-500 text-white' : ''}
                            ${!isPast && !isBusy && !isSelected ? 'hover:bg-indigo-100' : ''}
                          `}
                        >
                          {isBusy && <span className="text-xs text-red-500">תפוס</span>}
                          {isSelected && <Check className="w-4 h-4 mx-auto" />}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-indigo-500 rounded" />
                <span>נבחר</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-50 border border-red-200 rounded" />
                <span>תפוס</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-slate-100 rounded" />
                <span>עבר</span>
              </div>
            </div>

            {/* Selected Slots Summary */}
            {selectedSlots.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 sm:p-4 bg-indigo-50 rounded-xl border border-indigo-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-indigo-900 text-sm sm:text-base">
                    זמנים שנבחרו ({selectedSlots.length})
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSlots([])}
                    className="text-indigo-600 hover:text-indigo-700 text-xs sm:text-sm"
                  >
                    נקה הכל
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {selectedSlots.map((slot, idx) => (
                    <Badge 
                      key={idx} 
                      className="bg-white text-indigo-700 border border-indigo-200 gap-1 text-xs"
                    >
                      {format(new Date(slot.date), 'EEE d/M', { locale: he })} בשעה {slot.start_time}
                      <button
                        onClick={() => setSelectedSlots(selectedSlots.filter((_, i) => i !== idx))}
                        className="mr-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Actions - Fixed at bottom */}
          <div className="p-4 sm:p-6 pt-4 border-t bg-slate-50 flex items-center justify-between flex-shrink-0">
            <Button variant="outline" onClick={handleClose}>
              ביטול
            </Button>
            <Button
              onClick={handleProceed}
              disabled={selectedSlots.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2 text-sm"
            >
              <Calendar className="w-4 h-4" />
              המשך ליצירת קישור ({selectedSlots.length} זמנים)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Meeting Link Dialog */}
      <CreateMeetingLinkDialog
        isOpen={showCreateLink}
        onClose={handleLinkCreated}
        selectedSlots={selectedSlots}
        duration={duration}
        prefilledData={{
          title: meetingTitle,
          client_name: project?.client || '',
          client_email: project?.client_email || '',
          client_phone: project?.client_phone || '',
          project_id: project?.id ? String(project.id) : '',
          project_name: project?.name || '',
          notes: meetingContext,
          stage: projectStage || project?.status || ''
        }}
      />
    </>
  );
}
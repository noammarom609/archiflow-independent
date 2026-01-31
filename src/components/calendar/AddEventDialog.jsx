import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, MapPin, Users, Plus, Loader2, CheckCircle, Upload } from 'lucide-react';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { showSuccess, showError } from '../utils/notifications';
import { format } from 'date-fns';
import { useNotifications } from '@/hooks/use-notifications';

export default function AddEventDialog({ isOpen, onClose, selectedDate, prefilledData }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { sendTemplate } = useNotifications();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'meeting',
    start_date: '',
    end_date: '',
    all_day: false,
    location: '',
    attendees: '',
    reminder: true,
    reminder_minutes: 30,
    color: '#4F46E5',
    status: 'approved',
    requires_approval: false,
    exportToGoogle: true,
    project_id: '',
  });

  React.useEffect(() => {
    if (isOpen) {
      // Default dates from selectedDate
      let start = '';
      let end = '';
      
      if (selectedDate) {
        start = format(selectedDate, "yyyy-MM-dd'T'09:00");
        end = format(selectedDate, "yyyy-MM-dd'T'10:00");
      } else {
        // Default to next hour if no date selected
        const now = new Date();
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);
        start = format(now, "yyyy-MM-dd'T'HH:mm");
        const nextHour = new Date(now);
        nextHour.setHours(nextHour.getHours() + 1);
        end = format(nextHour, "yyyy-MM-dd'T'HH:mm");
      }

      setFormData(prev => ({
        ...prev,
        start_date: start,
        end_date: end,
        ...prefilledData,
        // Handle array to string conversion for attendees input
        attendees: prefilledData?.attendees 
          ? (Array.isArray(prefilledData.attendees) ? prefilledData.attendees.join(', ') : prefilledData.attendees)
          : prev.attendees
      }));
    }
  }, [isOpen, selectedDate, prefilledData]);

  const createEventMutation = useMutation({
    mutationFn: async (data) => {
      const { exportToGoogle, reminder, reminder_minutes, color, requires_approval, ...rest } = data;
      const userEmail = user?.email || '';
      // Build payload for calendar_events: only DB columns, attendees as comma-separated string
      const attendeesStr = Array.isArray(rest.attendees)
        ? rest.attendees.filter(Boolean).join(', ')
        : (typeof rest.attendees === 'string' ? rest.attendees : '');
      const toISO = (v) => {
        if (!v) return null;
        const d = new Date(v);
        return isNaN(d.getTime()) ? v : d.toISOString();
      };
      const insertPayload = {
        title: rest.title,
        description: rest.description ?? '',
        event_type: rest.event_type ?? 'meeting',
        start_date: toISO(rest.start_date) || rest.start_date,
        end_date: toISO(rest.end_date) || toISO(rest.start_date) || rest.end_date || rest.start_date,
        all_day: rest.all_day ?? false,
        location: rest.location ?? '',
        status: rest.status ?? 'approved',
        created_by: userEmail || null,
        owner_email: userEmail || null,
        attendees: attendeesStr || null,
        ...(rest.project_id ? { project_id: rest.project_id } : {}),
      };
      const event = await archiflow.entities.CalendarEvent.create(insertPayload);
      
      // Export to Google Calendar if requested
      if (exportToGoogle) {
        try {
          await archiflow.functions.invoke('exportToGoogleCalendar', { eventId: event.id });
        } catch (error) {
          console.error('Failed to export to Google Calendar:', error);
        }
      }
      
      return { event, originalData: data };
    },
    onSuccess: ({ event, originalData }) => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      showSuccess('אירוע נוסף בהצלחה ✓');
      
      // Send push notification to attendees (if they have user accounts linked)
      // Format date for notification
      const eventDate = originalData.start_date 
        ? format(new Date(originalData.start_date), 'dd/MM/yyyy')
        : '';
      const eventTime = originalData.start_date 
        ? format(new Date(originalData.start_date), 'HH:mm')
        : '';

      // If project is linked, notify the client (async, non-blocking)
      if (originalData.project_id) {
        // Look up the project to get the client_id
        archiflow.entities.Project.filter({ id: originalData.project_id })
          .then(projects => {
            if (projects.length > 0 && projects[0].client_id) {
              sendTemplate('meetingScheduled', projects[0].client_id, {
                meetingTitle: originalData.title,
                date: eventDate,
                time: eventTime,
                location: originalData.location || 'לא צוין',
                projectName: projects[0].name
              });
            }
          })
          .catch(err => console.error('Failed to send meeting notification:', err));
      }
      
      onClose();
      resetForm();
    },
    onError: (err) => {
      console.error('[AddEventDialog] Create event error:', err?.message || err);
      const msg = err?.message || err?.error_description || 'שגיאה בהוספת אירוע';
      showError(typeof msg === 'string' ? msg : 'שגיאה בהוספת אירוע');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'meeting',
      start_date: '',
      end_date: '',
      all_day: false,
      location: '',
      attendees: '',
      reminder: true,
      reminder_minutes: 30,
      color: '#4F46E5',
      status: 'approved',
      requires_approval: false,
      exportToGoogle: true,
      project_id: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const eventData = {
      ...formData,
      attendees: formData.attendees ? formData.attendees.split(',').map(a => a.trim()) : [],
      status: formData.requires_approval ? 'pending' : 'approved',
      exportToGoogle: formData.exportToGoogle,
    };

    createEventMutation.mutate(eventData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            אירוע חדש
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">כותרת האירוע *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="לדוגמה: פגישה עם משפחת כהן"
              required
            />
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="event_type">סוג אירוע</Label>
            <Select
              value={formData.event_type}
              onValueChange={(value) => setFormData({ ...formData, event_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">פגישה</SelectItem>
                <SelectItem value="deadline">דדליין</SelectItem>
                <SelectItem value="task">משימה</SelectItem>
                <SelectItem value="other">אחר</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <DateTimePicker
              label="תאריך ושעת התחלה"
              value={formData.start_date}
              onChange={(value) => setFormData({ ...formData, start_date: value })}
              placeholder="בחר תאריך ושעה"
              required
            />
            <DateTimePicker
              label="תאריך ושעת סיום"
              value={formData.end_date}
              onChange={(value) => setFormData({ ...formData, end_date: value })}
              placeholder="בחר תאריך ושעה"
            />
          </div>

          {/* All Day */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <Label htmlFor="all_day" className="cursor-pointer">אירוע של יום שלם</Label>
            <Switch
              id="all_day"
              checked={formData.all_day}
              onCheckedChange={(checked) => setFormData({ ...formData, all_day: checked })}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="w-4 h-4 inline ml-1" />
              מיקום
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="כתובת או מיקום"
            />
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <Label htmlFor="attendees">
              <Users className="w-4 h-4 inline ml-1" />
              משתתפים
            </Label>
            <Input
              id="attendees"
              value={formData.attendees}
              onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
              placeholder="שמות מופרדים בפסיקים"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="פרטים נוספים על האירוע..."
              rows={3}
            />
          </div>

          {/* Reminder */}
          <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
              <Label htmlFor="reminder" className="cursor-pointer">תזכורת</Label>
              <Switch
                id="reminder"
                checked={formData.reminder}
                onCheckedChange={(checked) => setFormData({ ...formData, reminder: checked })}
              />
            </div>
            {formData.reminder && (
              <div className="space-y-2">
                <Label htmlFor="reminder_minutes">תזכורת לפני (דקות)</Label>
                <Input
                  id="reminder_minutes"
                  type="number"
                  value={formData.reminder_minutes}
                  onChange={(e) => setFormData({ ...formData, reminder_minutes: parseInt(e.target.value) })}
                  min="5"
                  step="5"
                />
              </div>
            )}
          </div>

          {/* Requires Approval */}
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-600" />
              <Label htmlFor="requires_approval" className="cursor-pointer text-amber-900">
                דרוש אישור לאירוע
              </Label>
            </div>
            <Switch
              id="requires_approval"
              checked={formData.requires_approval}
              onCheckedChange={(checked) => setFormData({ ...formData, requires_approval: checked })}
            />
          </div>

          {/* Export to Google Calendar */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <Label htmlFor="exportToGoogle" className="cursor-pointer text-blue-900">
                ייצא אוטומטית ל-Google Calendar
              </Label>
            </div>
            <Switch
              id="exportToGoogle"
              checked={formData.exportToGoogle}
              onCheckedChange={(checked) => setFormData({ ...formData, exportToGoogle: checked })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              ביטול
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              disabled={createEventMutation.isPending}
            >
              {createEventMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף אירוע
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
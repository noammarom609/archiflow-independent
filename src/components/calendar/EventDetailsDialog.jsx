import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Trash2, Edit, X, FileText, ExternalLink, Sparkles } from 'lucide-react';
import MeetingAssistant from '../recordings/MeetingAssistant';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '../utils/notifications';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function EventDetailsDialog({ event, onClose }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showAssistant, setShowAssistant] = useState(false);

  const deleteEventMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      showSuccess('אירוע נמחק בהצלחה');
      onClose();
    },
    onError: () => {
      showError('שגיאה במחיקת אירוע');
    },
  });

  const createJournalMutation = useMutation({
    mutationFn: (data) => base44.entities.JournalEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      showSuccess('נוסף ליומן בהצלחה! ✓');
    },
    onError: () => showError('שגיאה בהוספה ליומן'),
  });

  const handleAddToJournal = () => {
    const journalData = {
      title: event.title,
      content: event.description || `אירוע מסוג ${eventTypeLabels[event.type]}`,
      category: event.type === 'meeting' ? 'meeting' : 'note',
      entry_date: event.date || event.start_date,
      location: event.location,
      attendees: event.attendees || [],
      tags: [eventTypeLabels[event.type]],
      project_name: event.project_name,
      mood: 'neutral',
    };
    createJournalMutation.mutate(journalData);
  };

  const handleViewInJournal = () => {
    navigate(createPageUrl('Journal'));
    onClose();
  };

  if (!event) return null;

  const eventTypeColors = {
    meeting: 'bg-blue-100 text-blue-800',
    deadline: 'bg-red-100 text-red-800',
    task: 'bg-purple-100 text-purple-800',
    journal: 'bg-green-100 text-green-800',
    other: 'bg-slate-100 text-slate-800',
  };

  const eventTypeLabels = {
    meeting: 'פגישה',
    deadline: 'דדליין',
    task: 'משימה',
    journal: 'יומן',
    other: 'אחר',
  };

  const handleDelete = () => {
    if (event.source === 'calendar' && confirm('האם למחוק את האירוע?')) {
      deleteEventMutation.mutate(event.id);
    }
  };

  if (showAssistant && event.type === 'meeting') {
    return (
      <Dialog open={!!event} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <MeetingAssistant event={event} onClose={() => setShowAssistant(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={!!event} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-bold">{event.title}</DialogTitle>
            <Badge className={eventTypeColors[event.type]}>
              {eventTypeLabels[event.type]}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Date & Time */}
          {event.start_date && (
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <Calendar className="w-5 h-5 text-slate-600 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">
                  {format(parseISO(event.start_date), 'dd MMMM yyyy', { locale: he })}
                </p>
                <p className="text-sm text-slate-600">
                  {format(parseISO(event.start_date), 'HH:mm', { locale: he })}
                  {event.end_date && ` - ${format(parseISO(event.end_date), 'HH:mm', { locale: he })}`}
                </p>
              </div>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-700">מיקום</p>
                <p className="text-slate-900">{event.location}</p>
              </div>
            </div>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-slate-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-700">משתתפים</p>
                <p className="text-slate-900">{event.attendees.join(', ')}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-semibold text-slate-700 mb-2">תיאור</p>
              <p className="text-slate-900 text-sm leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Priority (for tasks) */}
          {event.priority && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">עדיפות:</span>
              <Badge className={
                event.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                event.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                event.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }>
                {event.priority === 'urgent' ? 'דחוף' :
                 event.priority === 'high' ? 'גבוהה' :
                 event.priority === 'medium' ? 'בינונית' : 'נמוכה'}
              </Badge>
            </div>
          )}

          {/* Status Actions for Pending Events */}
          {event.status === 'pending' && event.source === 'calendar' && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  // Handle approval
                  showSuccess('אירוע אושר');
                  onClose();
                }}
              >
                אשר אירוע
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700"
                onClick={() => {
                  // Handle decline
                  showSuccess('אירוע נדחה');
                  onClose();
                }}
              >
                דחה
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t flex-wrap">
            {event.type === 'meeting' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAssistant(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Sparkles className="w-4 h-4 ml-2" />
                AI Assistant
              </Button>
            )}
            {event.source !== 'journal' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddToJournal}
                disabled={createJournalMutation.isPending}
              >
                <FileText className="w-4 h-4 ml-2" />
                הוסף ליומן
              </Button>
            )}
            {event.source === 'journal' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewInJournal}
              >
                <ExternalLink className="w-4 h-4 ml-2" />
                הצג ביומן
              </Button>
            )}
            <div className="flex-1"></div>
            {event.source === 'calendar' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleteEventMutation.isPending}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
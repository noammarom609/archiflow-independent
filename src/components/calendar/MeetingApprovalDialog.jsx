import React from 'react';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Check, 
  X, 
  Loader2,
  MessageSquare,
  Briefcase
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { showSuccess, showError } from '../utils/notifications';

export default function MeetingApprovalDialog({ event, onClose }) {
  const queryClient = useQueryClient();
  const isOpen = !!event && event.source === 'meeting_slot' && event.status === 'pending_approval';

  const approveMutation = useMutation({
    mutationFn: async ({ approved }) => {
      const status = approved ? 'approved' : 'cancelled';
      return await archiflow.entities.MeetingSlot.update(event.originalId, { status });
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ['meetingSlotsForCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['pendingMeetings'] });
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      onClose();
      if (approved) {
        showSuccess('הפגישה אושרה בהצלחה!');
      } else {
        showSuccess('הפגישה נדחתה');
      }
    },
    onError: () => {
      showError('שגיאה בעדכון הפגישה');
    }
  });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            פגישה ממתינה לאישור
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meeting Title */}
          <div>
            <h3 className="font-bold text-lg text-slate-900">{event.title}</h3>
            {event.project_name && (
              <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                <Briefcase className="w-3 h-3" />
                {event.project_name}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-medium">
                {format(parseISO(event.date), 'EEEE, d בMMMM yyyy', { locale: he })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <span>
                {event.start_date && format(parseISO(event.start_date), 'HH:mm')} - {event.end_date && format(parseISO(event.end_date), 'HH:mm')}
              </span>
              <Badge variant="outline" className="mr-auto">
                {event.duration_minutes} דקות
              </Badge>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm text-slate-700 mb-2">פרטי הלקוח</h4>
            {event.client_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-slate-400" />
                <span>{event.client_name}</span>
              </div>
            )}
            {event.client_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <span dir="ltr">{event.client_email}</span>
              </div>
            )}
            {event.client_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <span dir="ltr">{event.client_phone}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {event.description && (
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-800 mb-1">
                <MessageSquare className="w-4 h-4" />
                הערות מהלקוח
              </div>
              <p className="text-sm text-amber-900">{event.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 h-11 bg-green-600 hover:bg-green-700"
              onClick={() => approveMutation.mutate({ approved: true })}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 ml-2" />
                  אישור הפגישה
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-11 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => approveMutation.mutate({ approved: false })}
              disabled={approveMutation.isPending}
            >
              <X className="w-4 h-4 ml-2" />
              דחייה
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
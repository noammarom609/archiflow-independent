import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserCheck, 
  Clock, 
  Calendar, 
  Check, 
  X, 
  User,
  Mail,
  Phone,
  Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { showSuccess, showError } from '../utils/notifications';

export default function PendingMeetingsCard() {
  const queryClient = useQueryClient();

  const { data: pendingMeetings = [], isLoading } = useQuery({
    queryKey: ['pendingMeetings'],
    queryFn: () => base44.entities.MeetingSlot.filter({ status: 'pending_approval' }),
    refetchInterval: 30000
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approved }) => {
      const status = approved ? 'approved' : 'cancelled';
      return await base44.entities.MeetingSlot.update(id, { status });
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ['pendingMeetings'] });
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      if (approved) {
        showSuccess('הפגישה אושרה בהצלחה');
      } else {
        showSuccess('הפגישה נדחתה');
      }
    },
    onError: () => {
      showError('שגיאה בעדכון הפגישה');
    }
  });

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (pendingMeetings.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-amber-800">
          <UserCheck className="w-4 h-4" />
          פגישות ממתינות לאישור
          <Badge className="bg-amber-100 text-amber-800 mr-auto">
            {pendingMeetings.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
          {pendingMeetings.map((meeting, idx) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-lg p-3 border border-amber-200 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-semibold text-sm text-slate-900">
                    {meeting.title || 'פגישה'}
                  </h4>
                  {meeting.project_name && (
                    <p className="text-xs text-slate-500">{meeting.project_name}</p>
                  )}
                </div>
              </div>

              {/* Client Info */}
              <div className="space-y-1 mb-3 text-xs text-slate-600">
                {meeting.client_name && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {meeting.client_name}
                  </div>
                )}
                {meeting.client_email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {meeting.client_email}
                  </div>
                )}
                {meeting.client_phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {meeting.client_phone}
                  </div>
                )}
              </div>

              {/* Selected Time */}
              {meeting.selected_slot && (
                <div className="bg-slate-50 rounded p-2 mb-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-3 h-3 text-primary" />
                    <span className="font-medium">
                      {format(parseISO(meeting.selected_slot.date), 'EEEE, d/M', { locale: he })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <Clock className="w-3 h-3 text-primary" />
                    <span>
                      {meeting.selected_slot.start_time} - {meeting.selected_slot.end_time}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {meeting.notes && (
                <p className="text-xs text-slate-500 mb-3 bg-slate-50 p-2 rounded">
                  💬 {meeting.notes}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-8 bg-green-600 hover:bg-green-700"
                  onClick={() => approveMutation.mutate({ id: meeting.id, approved: true })}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3 h-3 ml-1" />
                      אישור
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => approveMutation.mutate({ id: meeting.id, approved: false })}
                  disabled={approveMutation.isPending}
                >
                  <X className="w-3 h-3 ml-1" />
                  דחייה
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
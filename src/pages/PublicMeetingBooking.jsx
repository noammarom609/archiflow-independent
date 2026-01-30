import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Check, 
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Video,
  ExternalLink
} from 'lucide-react';
import { format, parseISO, addMinutes, isBefore, isAfter, startOfDay, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { showSuccess, showError } from '../components/utils/notifications';
// Toaster moved to App.jsx for global fixed positioning
import AttachedContentSection from '../components/meeting/AttachedContentSection';

export default function PublicMeetingBooking() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [step, setStep] = useState('select'); // 'select' | 'details' | 'confirmed'
  const [clientDetails, setClientDetails] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [zoomMeetingLink, setZoomMeetingLink] = useState(null);
  const [isCreatingZoom, setIsCreatingZoom] = useState(false);

  // Fetch meeting slot by token
  const { data: meetingSlot, isLoading, error } = useQuery({
    queryKey: ['meetingSlot', token],
    queryFn: async () => {
      const slots = await base44.entities.MeetingSlot.filter({ link_token: token });
      return slots[0];
    },
    enabled: !!token
  });

  // Update meeting slot mutation
  const bookMeetingMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.MeetingSlot.update(meetingSlot.id, data);
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetingSlot', token] });
      setStep('confirmed');
      showSuccess('הפגישה נקבעה בהצלחה!');
      
      // Send notification to architect about new meeting request
      if (meetingSlot?.created_by) {
        try {
          const meetingDate = selectedDate ? format(selectedDate, 'dd/MM/yyyy') : '';
          const meetingTime = selectedTime?.start || '';
          
          // Create in-app notification
          await base44.entities.Notification.create({
            user_id: meetingSlot.created_by,
            title: '📅 בקשה לפגישה חדשה',
            message: `${clientDetails.name} ביקש/ה לקבוע פגישה בתאריך ${meetingDate} בשעה ${meetingTime}`,
            type: 'meeting_request',
            link: '/Calendar',
            is_read: false,
            created_date: new Date().toISOString()
          });
          
          // Send push notification
          base44.functions.invoke('sendPushNotification', {
            userId: meetingSlot.created_by,
            title: '📅 בקשה לפגישה חדשה',
            body: `${clientDetails.name} ביקש/ה לקבוע פגישה בתאריך ${meetingDate}`,
            url: '/Calendar',
            tag: 'meeting_request'
          }).catch(err => console.error('Push notification error:', err));
        } catch (err) {
          console.error('Failed to send meeting notification:', err);
        }
      }
    },
    onError: () => {
      showError('שגיאה בקביעת הפגישה');
    }
  });

  // Generate available time slots for selected date
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !meetingSlot) return [];

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const daySlot = meetingSlot.available_slots?.find(s => s.date === dateStr);
    
    if (!daySlot) return [];

    const slots = [];
    const startHour = parseInt(daySlot.start_time.split(':')[0]);
    const endHour = parseInt(daySlot.end_time.split(':')[0]);
    const duration = meetingSlot.duration_minutes || 60;
    const intervalMinutes = duration;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const slotStart = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const endMinutes = hour * 60 + minute + duration;
        const endHourCalc = Math.floor(endMinutes / 60);
        const endMinuteCalc = endMinutes % 60;
        
        // Don't exceed the available window
        if (endHourCalc > endHour || (endHourCalc === endHour && endMinuteCalc > 0)) break;
        
        const slotEnd = `${String(endHourCalc).padStart(2, '0')}:${String(endMinuteCalc).padStart(2, '0')}`;
        slots.push({ start: slotStart, end: slotEnd });
      }
    }

    return slots;
  }, [selectedDate, meetingSlot]);

  // Get unique dates from available slots
  const availableDates = useMemo(() => {
    if (!meetingSlot?.available_slots) return [];
    return meetingSlot.available_slots
      .map(s => s.date)
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort();
  }, [meetingSlot]);

  const handleSelectTime = (time) => {
    setSelectedTime(time);
    // Pre-fill client details if available
    setClientDetails({
      name: meetingSlot?.client_name || '',
      email: meetingSlot?.client_email || '',
      phone: meetingSlot?.client_phone || '',
      notes: ''
    });
    setStep('details');
  };

  const handleConfirmBooking = async () => {
    if (!clientDetails.name || !clientDetails.email) {
      showError('יש למלא שם ואימייל');
      return;
    }

    const selectedSlot = {
      date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: selectedTime.start,
      end_time: selectedTime.end
    };

    let zoomLink = null;

    // Create Google Meet if enabled
    if (meetingSlot?.zoom_enabled) {
      setIsCreatingZoom(true);
      try {
        const startDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime.start}`);
        
        const response = await base44.functions.invoke('createGoogleMeet', {
          userId: meetingSlot.created_by,
          topic: meetingSlot.title || `פגישה עם ${clientDetails.name}`,
          start_time: startDateTime.toISOString(),
          duration: meetingSlot.duration_minutes || 60,
          timezone: 'Asia/Jerusalem',
          description: meetingSlot.notes || clientDetails.notes || '',
          attendee_email: clientDetails.email
        });

        if (response.success && response.meeting) {
          zoomLink = response.meeting.meet_link;
          setZoomMeetingLink(zoomLink);
        }
      } catch (error) {
        console.error('Error creating Google Meet:', error);
        // Continue without Meet link - don't fail the booking
      } finally {
        setIsCreatingZoom(false);
      }
    }

    await bookMeetingMutation.mutateAsync({
      selected_slot: selectedSlot,
      client_name: clientDetails.name,
      client_email: clientDetails.email,
      client_phone: clientDetails.phone,
      notes: clientDetails.notes,
      status: 'pending_approval',
      zoom_meeting_link: zoomLink
    });
  };

  // Error states
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">קישור לא תקין</h2>
            <p className="text-slate-600">הקישור שהזנת אינו תקין או פג תוקף</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!meetingSlot || meetingSlot.status === 'expired' || meetingSlot.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">הקישור אינו זמין</h2>
            <p className="text-slate-600">קישור זה פג תוקף או בוטל</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (meetingSlot.status === 'pending_approval' || meetingSlot.status === 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">הפגישה כבר נקבעה</h2>
            <p className="text-slate-600 mb-4">
              {meetingSlot.selected_slot && (
                <>
                  {format(parseISO(meetingSlot.selected_slot.date), 'EEEE, d בMMMM yyyy', { locale: he })}
                  <br />
                  בשעה {meetingSlot.selected_slot.start_time}
                </>
              )}
            </p>
            <Badge className={meetingSlot.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
              {meetingSlot.status === 'approved' ? 'מאושר' : 'ממתין לאישור'}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8" dir="rtl">
      
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {meetingSlot.title || 'קביעת פגישה'}
          </h1>
          {meetingSlot.project_name && (
            <p className="text-slate-600">פרויקט: {meetingSlot.project_name}</p>
          )}
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>משך הפגישה: {meetingSlot.duration_minutes} דקות</span>
          </div>
        </motion.div>

        {/* Attached Content Section - Always visible */}
        {meetingSlot?.attached_content_ids?.length > 0 && step !== 'confirmed' && (
          <AttachedContentSection contentIds={meetingSlot.attached_content_ids} />
        )}

        {step === 'select' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">בחר/י תאריך ושעה</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Selection */}
                <div>
                  <Label className="mb-3 block">תאריך</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableDates.map((dateStr) => {
                      const date = parseISO(dateStr);
                      const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;
                      
                      return (
                        <Button
                          key={dateStr}
                          variant={isSelected ? 'default' : 'outline'}
                          className={`h-auto py-3 flex-col ${isSelected ? 'bg-primary' : ''}`}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedTime(null);
                          }}
                        >
                          <span className="text-xs opacity-75">
                            {format(date, 'EEEE', { locale: he })}
                          </span>
                          <span className="text-lg font-bold">
                            {format(date, 'd/M')}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Label className="mb-3 block">שעה</Label>
                    {availableTimeSlots.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">אין שעות פנויות בתאריך זה</p>
                    ) : (
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {availableTimeSlots.map((slot, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            className="h-12"
                            onClick={() => handleSelectTime(slot)}
                          >
                            {slot.start}
                          </Button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'details' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">פרטים אישיים</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setStep('select')}>
                    <ChevronRight className="w-4 h-4 ml-1" />
                    חזרה
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected Time Summary */}
                <div className="bg-primary/5 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        {format(selectedDate, 'EEEE, d בMMMM yyyy', { locale: he })}
                      </p>
                      <p className="text-sm text-slate-600">
                        {selectedTime.start} - {selectedTime.end}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>שם מלא *</Label>
                  <div className="relative mt-1">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={clientDetails.name}
                      onChange={(e) => setClientDetails({ ...clientDetails, name: e.target.value })}
                      placeholder="הכנס/י את שמך"
                      className="pr-10"
                    />
                  </div>
                </div>

                <div>
                  <Label>אימייל *</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      value={clientDetails.email}
                      onChange={(e) => setClientDetails({ ...clientDetails, email: e.target.value })}
                      placeholder="example@email.com"
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <Label>טלפון</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="tel"
                      value={clientDetails.phone}
                      onChange={(e) => setClientDetails({ ...clientDetails, phone: e.target.value })}
                      placeholder="050-1234567"
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <Label>הערות (אופציונלי)</Label>
                  <Textarea
                    value={clientDetails.notes}
                    onChange={(e) => setClientDetails({ ...clientDetails, notes: e.target.value })}
                    placeholder="האם יש משהו שחשוב לציין לפני הפגישה?"
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={handleConfirmBooking}
                  disabled={bookMeetingMutation.isPending}
                  className="w-full h-12 text-lg gap-2"
                >
                  {bookMeetingMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  אישור הפגישה
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'confirmed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">הפגישה נקבעה!</h2>
                <p className="text-slate-600 mb-4">
                  הפגישה ממתינה לאישור. תקבל/י עדכון ברגע שתאושר.
                </p>
                <div className="bg-slate-50 rounded-lg p-4 text-right">
                  <p className="font-medium mb-1">פרטי הפגישה:</p>
                  <p className="text-sm text-slate-600">
                    {format(selectedDate, 'EEEE, d בMMMM yyyy', { locale: he })}
                  </p>
                  <p className="text-sm text-slate-600">
                    שעה: {selectedTime.start} - {selectedTime.end}
                  </p>
                </div>

                {/* Google Meet Link */}
                {zoomMeetingLink && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Video className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">קישור לפגישת Google Meet</span>
                    </div>
                    <a
                      href={zoomMeetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      הצטרף לפגישה
                    </a>
                    <p className="text-xs text-green-600 mt-2">
                      שמור/י את הקישור - הוא יישלח גם באימייל
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attached Content - stays visible after booking */}
            <AttachedContentSection contentIds={meetingSlot?.attached_content_ids} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automation handler for CalendarEvent entity changes
 * Triggers notifications when meetings are scheduled
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || event.type !== 'create') {
      return Response.json({ success: true, message: 'No action needed' });
    }

    const eventTitle = data.title || 'אירוע';
    const eventId = event.entity_id;
    const attendees = data.attendees || [];

    // Format date for display
    let dateStr = '';
    if (data.start_date) {
      const date = new Date(data.start_date);
      dateStr = date.toLocaleDateString('he-IL', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // Notify all attendees except the creator
    for (const attendeeEmail of attendees) {
      if (attendeeEmail !== data.created_by) {
        await base44.asServiceRole.functions.invoke('createNotification', {
          user_email: attendeeEmail,
          title: 'פגישה חדשה נקבעה',
          message: `הוזמנת ל"${eventTitle}"${dateStr ? ` ב${dateStr}` : ''}`,
          type: 'meeting_scheduled',
          priority: 'normal',
          link: 'Calendar',
          entity_type: 'CalendarEvent',
          entity_id: eventId,
          metadata: { 
            event_title: eventTitle,
            start_date: data.start_date,
            location: data.location
          }
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in onCalendarEventChange:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
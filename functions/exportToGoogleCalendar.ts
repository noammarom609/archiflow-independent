import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { eventId } = await req.json();

        if (!eventId) {
            return Response.json({ error: 'Event ID is required' }, { status: 400 });
        }

        // Get the event from our database
        const events = await base44.entities.CalendarEvent.filter({ id: eventId });
        const event = events[0];

        if (!event) {
            return Response.json({ error: 'Event not found' }, { status: 404 });
        }

        // Check if already exported
        if (event.google_calendar_id) {
            return Response.json({ 
                success: true, 
                message: 'Event already synced with Google Calendar',
                googleCalendarId: event.google_calendar_id 
            });
        }

        // Get Google Calendar access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

        // Prepare Google Calendar event data
        const googleEvent = {
            summary: event.title,
            description: event.description || '',
            location: event.location || '',
            start: event.all_day 
                ? { date: event.start_date.split('T')[0] }
                : { dateTime: event.start_date, timeZone: 'Asia/Jerusalem' },
            end: event.all_day
                ? { date: event.end_date.split('T')[0] }
                : { dateTime: event.end_date, timeZone: 'Asia/Jerusalem' },
            attendees: (event.attendees || []).map(email => ({ email })),
            reminders: event.reminder ? {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: event.reminder_minutes || 30 }
                ]
            } : undefined,
        };

        // Create event in Google Calendar
        const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(googleEvent),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            return Response.json({ error: 'Failed to create Google Calendar event', details: error }, { status: response.status });
        }

        const createdEvent = await response.json();

        // Update our event with Google Calendar ID
        await base44.asServiceRole.entities.CalendarEvent.update(eventId, {
            google_calendar_id: createdEvent.id,
        });

        return Response.json({
            success: true,
            googleCalendarId: createdEvent.id,
            googleCalendarLink: createdEvent.htmlLink,
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
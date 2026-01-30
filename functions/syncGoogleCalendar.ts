import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get Google Calendar access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

        // Fetch events from Google Calendar (next 30 days)
        const timeMin = new Date().toISOString();
        const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const error = await response.text();
            return Response.json({ error: 'Failed to fetch Google Calendar events', details: error }, { status: response.status });
        }

        const data = await response.json();
        const googleEvents = data.items || [];

        // Get existing events to avoid duplicates
        const existingEvents = await base44.asServiceRole.entities.CalendarEvent.filter({
            google_calendar_id: { $ne: null }
        });

        const existingGoogleIds = new Set(existingEvents.map(e => e.google_calendar_id));

        // Import new events
        let importedCount = 0;
        const errors = [];

        for (const gEvent of googleEvents) {
            // Skip if already imported
            if (existingGoogleIds.has(gEvent.id)) {
                continue;
            }

            try {
                const eventData = {
                    title: gEvent.summary || 'ללא כותרת',
                    description: gEvent.description || '',
                    event_type: 'meeting',
                    start_date: gEvent.start.dateTime || gEvent.start.date,
                    end_date: gEvent.end.dateTime || gEvent.end.date,
                    all_day: !gEvent.start.dateTime,
                    location: gEvent.location || '',
                    attendees: (gEvent.attendees || []).map(a => a.email),
                    google_calendar_id: gEvent.id,
                    status: 'approved',
                };

                await base44.asServiceRole.entities.CalendarEvent.create(eventData);
                importedCount++;
            } catch (error) {
                errors.push({ eventId: gEvent.id, error: error.message });
            }
        }

        return Response.json({
            success: true,
            imported: importedCount,
            total: googleEvents.length,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
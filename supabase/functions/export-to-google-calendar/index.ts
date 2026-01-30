// Export to Google Calendar Edge Function
// Exports a calendar event to Google Calendar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get the current user from the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { eventId } = await req.json()

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'Event ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the event from database
    const { data: event, error: eventError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already exported
    if (event.google_calendar_id) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Event already synced with Google Calendar',
          googleCalendarId: event.google_calendar_id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's Google token
    const { data: googleToken, error: tokenError } = await supabase
      .from('user_google_tokens')
      .select('*')
      .eq('user_email', authUser.email)
      .single()

    if (tokenError || !googleToken?.access_token) {
      return new Response(
        JSON.stringify({ 
          error: 'Google Calendar not connected',
          details: 'יש לחבר את חשבון Google Calendar דרך הגדרות המערכת'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
      attendees: (event.attendees || []).map((email: string) => ({ email })),
      reminders: event.reminder ? {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: event.reminder_minutes || 30 }
        ]
      } : undefined,
    }

    // Create event in Google Calendar
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleEvent),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      
      // Check if token expired
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'Google token expired',
            details: 'יש להתחבר מחדש ל-Google Calendar'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create Google Calendar event', 
          details: errorText 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const createdEvent = await response.json()

    // Update our event with Google Calendar ID
    await supabase
      .from('calendar_events')
      .update({ google_calendar_id: createdEvent.id })
      .eq('id', eventId)

    return new Response(
      JSON.stringify({
        success: true,
        googleCalendarId: createdEvent.id,
        googleCalendarLink: createdEvent.htmlLink,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in exportToGoogleCalendar:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

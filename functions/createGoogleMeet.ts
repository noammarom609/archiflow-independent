/**
 * Edge Function: createGoogleMeet
 * 
 * Creates a Google Meet meeting link using Google Calendar API
 * 
 * This function creates a calendar event with Google Meet conferencing enabled,
 * which automatically generates a Meet link.
 * 
 * Prerequisites:
 * 1. User must have connected their Google account via OAuth
 * 2. The refresh token should be stored in the user's profile or passed as parameter
 * 
 * @param userId - The user ID to get their Google refresh token
 * @param topic - Meeting topic/title
 * @param start_time - Meeting start time in ISO format
 * @param duration - Meeting duration in minutes
 * @param description - Optional meeting description
 * @param attendee_email - Optional attendee email to invite
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

interface GoogleMeetRequest {
  userId?: string;
  refreshToken?: string;
  topic: string;
  start_time: string;
  duration: number;
  description?: string;
  attendee_email?: string;
  timezone?: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  hangoutLink?: string;
  conferenceData?: {
    entryPoints: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
    conferenceId: string;
    conferenceSolution: {
      name: string;
      iconUri: string;
    };
  };
}

// Get new access token using refresh token
async function getAccessToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth credentials. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google OAuth error:", errorText);
    throw new Error(`Failed to refresh Google access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Create calendar event with Google Meet
async function createCalendarEventWithMeet(
  accessToken: string,
  meetingData: GoogleMeetRequest
): Promise<GoogleCalendarEvent> {
  const startTime = new Date(meetingData.start_time);
  const endTime = new Date(startTime.getTime() + meetingData.duration * 60000);
  const timezone = meetingData.timezone || "Asia/Jerusalem";

  const eventBody: any = {
    summary: meetingData.topic,
    description: meetingData.description || "",
    start: {
      dateTime: startTime.toISOString(),
      timeZone: timezone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: timezone,
    },
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
  };

  // Add attendee if provided
  if (meetingData.attendee_email) {
    eventBody.attendees = [{ email: meetingData.attendee_email }];
  }

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events?conferenceDataVersion=1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google Calendar API error:", errorText);
    throw new Error(`Failed to create calendar event: ${response.status}`);
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const body = await req.json();
    const { userId, refreshToken, topic, start_time, duration, description, attendee_email, timezone } = body;

    // Validate required fields
    if (!topic || !start_time || !duration) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: topic, start_time, duration" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let googleRefreshToken = refreshToken;

    // If userId provided but no refresh token, try to get it from database
    if (userId && !googleRefreshToken) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: user } = await supabase
          .from("User")
          .select("google_refresh_token")
          .eq("id", userId)
          .single();
        
        googleRefreshToken = user?.google_refresh_token;
      }
    }

    if (!googleRefreshToken) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "No Google refresh token available. User needs to connect Google Calendar first.",
          needsAuth: true 
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get access token
    const accessToken = await getAccessToken(googleRefreshToken);

    // Create calendar event with Meet
    const event = await createCalendarEventWithMeet(accessToken, {
      topic,
      start_time,
      duration,
      description,
      attendee_email,
      timezone: timezone || "Asia/Jerusalem",
    });

    // Extract Meet link
    const meetLink = event.hangoutLink || 
      event.conferenceData?.entryPoints?.find(e => e.entryPointType === "video")?.uri;

    return new Response(
      JSON.stringify({
        success: true,
        meeting: {
          id: event.id,
          topic: event.summary,
          start_time: event.start.dateTime,
          duration: duration,
          meet_link: meetLink,
          calendar_event_id: event.id,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error creating Google Meet:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

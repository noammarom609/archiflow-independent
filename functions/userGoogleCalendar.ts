import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'email',
  'profile'
].join(' ');

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action, code, redirectUri } = await req.json();

  switch (action) {
    case 'status':
      return await getStatus(base44, user.email);
    
    case 'getAuthUrl':
      return getAuthUrl(redirectUri);
    
    case 'exchangeCode':
      return await exchangeCode(base44, user.email, code, redirectUri);
    
    case 'sync':
      return await syncCalendar(base44, user.email);
    
    case 'disconnect':
      return await disconnect(base44, user.email);
    
    default:
      return Response.json({ error: 'Invalid action' }, { status: 400 });
  }
});

// Check if user has a connected Google account
async function getStatus(base44, userEmail) {
  const tokens = await base44.entities.UserGoogleToken.filter({ user_email: userEmail });
  
  if (tokens.length === 0) {
    return Response.json({ connected: false });
  }
  
  const token = tokens[0];
  return Response.json({
    connected: true,
    google_email: token.google_email,
    token_expiry: token.token_expiry
  });
}

// Generate Google OAuth URL
function getAuthUrl(redirectUri) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent'
  });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return Response.json({ authUrl });
}

// Exchange authorization code for tokens
async function exchangeCode(base44, userEmail, code, redirectUri) {
  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error('Token exchange failed:', error);
    return Response.json({ error: 'Failed to exchange code' }, { status: 400 });
  }

  const tokenData = await tokenResponse.json();
  
  // Get user info from Google
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  
  let googleEmail = null;
  if (userInfoResponse.ok) {
    const userInfo = await userInfoResponse.json();
    googleEmail = userInfo.email;
  }

  // Calculate token expiry
  const expiryDate = new Date(Date.now() + (tokenData.expires_in * 1000));
  
  // Check if user already has a token record
  const existingTokens = await base44.asServiceRole.entities.UserGoogleToken.filter({ user_email: userEmail });
  
  const tokenRecord = {
    user_email: userEmail,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || (existingTokens[0]?.refresh_token || ''),
    token_expiry: expiryDate.toISOString(),
    google_email: googleEmail
  };

  if (existingTokens.length > 0) {
    await base44.asServiceRole.entities.UserGoogleToken.update(existingTokens[0].id, tokenRecord);
  } else {
    await base44.asServiceRole.entities.UserGoogleToken.create(tokenRecord);
  }

  return Response.json({ 
    success: true, 
    google_email: googleEmail 
  });
}

// Refresh access token if expired
async function refreshTokenIfNeeded(base44, tokenRecord) {
  const expiry = new Date(tokenRecord.token_expiry);
  const now = new Date();
  
  // Refresh if token expires in less than 5 minutes
  if (expiry.getTime() - now.getTime() > 5 * 60 * 1000) {
    return tokenRecord.access_token;
  }

  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: tokenRecord.refresh_token,
      grant_type: 'refresh_token'
    })
  });

  if (!refreshResponse.ok) {
    throw new Error('Failed to refresh token');
  }

  const newTokenData = await refreshResponse.json();
  const newExpiry = new Date(Date.now() + (newTokenData.expires_in * 1000));

  await base44.asServiceRole.entities.UserGoogleToken.update(tokenRecord.id, {
    access_token: newTokenData.access_token,
    token_expiry: newExpiry.toISOString()
  });

  return newTokenData.access_token;
}

// Sync events from Google Calendar
async function syncCalendar(base44, userEmail) {
  const tokens = await base44.asServiceRole.entities.UserGoogleToken.filter({ user_email: userEmail });
  
  if (tokens.length === 0) {
    return Response.json({ error: 'Not connected to Google' }, { status: 400 });
  }

  const tokenRecord = tokens[0];
  
  let accessToken;
  try {
    accessToken = await refreshTokenIfNeeded(base44, tokenRecord);
  } catch (error) {
    return Response.json({ error: 'Token refresh failed. Please reconnect.' }, { status: 401 });
  }

  // Fetch events from Google Calendar (next 30 days)
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const calendarResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    `timeMin=${now.toISOString()}&timeMax=${thirtyDaysLater.toISOString()}&singleEvents=true&orderBy=startTime`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!calendarResponse.ok) {
    const error = await calendarResponse.text();
    console.error('Calendar fetch failed:', error);
    return Response.json({ error: 'Failed to fetch calendar' }, { status: 400 });
  }

  const calendarData = await calendarResponse.json();
  const events = calendarData.items || [];

  // Get existing calendar events for this user
  const existingEvents = await base44.entities.CalendarEvent.filter({ created_by: userEmail });
  const existingGoogleIds = new Set(
    existingEvents
      .filter(e => e.google_calendar_id)
      .map(e => e.google_calendar_id)
  );

  let created = 0;
  let updated = 0;

  for (const event of events) {
    const eventData = {
      title: event.summary || 'אירוע ללא שם',
      description: event.description || '',
      event_type: 'meeting',
      start_date: event.start?.dateTime || event.start?.date,
      end_date: event.end?.dateTime || event.end?.date,
      all_day: !event.start?.dateTime,
      location: event.location || '',
      google_calendar_id: event.id,
      status: 'approved'
    };

    if (existingGoogleIds.has(event.id)) {
      // Update existing event
      const existing = existingEvents.find(e => e.google_calendar_id === event.id);
      if (existing) {
        await base44.entities.CalendarEvent.update(existing.id, eventData);
        updated++;
      }
    } else {
      // Create new event
      await base44.entities.CalendarEvent.create(eventData);
      created++;
    }
  }

  return Response.json({ 
    success: true, 
    synced: events.length,
    created,
    updated
  });
}

// Disconnect Google account
async function disconnect(base44, userEmail) {
  const tokens = await base44.asServiceRole.entities.UserGoogleToken.filter({ user_email: userEmail });
  
  if (tokens.length > 0) {
    await base44.asServiceRole.entities.UserGoogleToken.delete(tokens[0].id);
  }

  return Response.json({ success: true });
}
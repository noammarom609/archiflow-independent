import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'email',
  'profile'
].join(' ')

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Read secrets inside handler to get fresh values
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
  
  console.log('[user-google-calendar] Handler called. GOOGLE_CLIENT_ID exists:', !!GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_SECRET exists:', !!GOOGLE_CLIENT_SECRET)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    const { action, code, redirectUri, userEmail } = body

    // Get user email from body or JWT
    let email = userEmail
    if (!email) {
      // Try to get from authorization header
      const authHeader = req.headers.get('Authorization')
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '')
          const payload = JSON.parse(atob(token.split('.')[1]))
          email = payload.email
        } catch (e) {
          console.log('Could not extract email from token')
        }
      }
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'User email required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[user-google-calendar] Action: ${action}, User: ${email}`)

    switch (action) {
      case 'status':
        return await getStatus(supabase, email, corsHeaders)
      
      case 'getAuthUrl':
        return getAuthUrl(redirectUri, corsHeaders, GOOGLE_CLIENT_ID)
      
      case 'exchangeCode':
        return await exchangeCode(supabase, email, code, redirectUri, corsHeaders, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
      
      case 'sync':
        return await syncCalendar(supabase, email, corsHeaders, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
      
      case 'disconnect':
        return await disconnect(supabase, email, corsHeaders)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Check if user has a connected Google account
async function getStatus(supabase: any, userEmail: string, corsHeaders: any) {
  const { data: tokens, error } = await supabase
    .from('user_google_tokens')
    .select('*')
    .eq('user_email', userEmail)
    .limit(1)

  if (error || !tokens || tokens.length === 0) {
    return new Response(
      JSON.stringify({ connected: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const token = tokens[0]
  return new Response(
    JSON.stringify({
      connected: true,
      google_email: token.google_email,
      token_expiry: token.token_expiry || token.expires_at
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Generate Google OAuth URL
function getAuthUrl(redirectUri: string, corsHeaders: any, GOOGLE_CLIENT_ID: string | undefined) {
  console.log('[getAuthUrl] GOOGLE_CLIENT_ID set:', !!GOOGLE_CLIENT_ID, 'value length:', GOOGLE_CLIENT_ID?.length)
  console.log('[getAuthUrl] redirectUri:', redirectUri)
  
  if (!GOOGLE_CLIENT_ID) {
    // Debug: List all available env vars (without values for security)
    const envVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
    const envStatus = envVars.map(v => `${v}: ${Deno.env.get(v) ? 'SET' : 'NOT SET'}`)
    console.error('[getAuthUrl] Environment status:', envStatus.join(', '))
    
    // Return 200 with error info so client can read it
    return new Response(
      JSON.stringify({ 
        authUrl: null,
        error: 'Google client ID not configured',
        debug: {
          envStatus: envStatus,
          note: 'GOOGLE_CLIENT_ID must be set in Supabase Edge Function secrets'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent'
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  return new Response(
    JSON.stringify({ authUrl }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Exchange authorization code for tokens
async function exchangeCode(supabase: any, userEmail: string, code: string, redirectUri: string, corsHeaders: any, GOOGLE_CLIENT_ID: string | undefined, GOOGLE_CLIENT_SECRET: string | undefined) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Google credentials not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

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
  })

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text()
    console.error('Token exchange failed:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to exchange code' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const tokenData = await tokenResponse.json()

  // Get user info from Google
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  })

  let googleEmail = null
  if (userInfoResponse.ok) {
    const userInfo = await userInfoResponse.json()
    googleEmail = userInfo.email
  }

  // Calculate token expiry
  const expiryDate = new Date(Date.now() + (tokenData.expires_in * 1000))

  // Check if user already has a token record
  const { data: existingTokens } = await supabase
    .from('user_google_tokens')
    .select('*')
    .eq('user_email', userEmail)

  const tokenRecord = {
    user_email: userEmail,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || (existingTokens?.[0]?.refresh_token || ''),
    token_expiry: expiryDate.toISOString(),
    expires_at: expiryDate.toISOString(),
    google_email: googleEmail,
    updated_at: new Date().toISOString()
  }

  if (existingTokens && existingTokens.length > 0) {
    await supabase
      .from('user_google_tokens')
      .update(tokenRecord)
      .eq('id', existingTokens[0].id)
  } else {
    await supabase
      .from('user_google_tokens')
      .insert(tokenRecord)
  }

  return new Response(
    JSON.stringify({ success: true, google_email: googleEmail }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Refresh access token if expired
async function refreshTokenIfNeeded(supabase: any, tokenRecord: any, GOOGLE_CLIENT_ID: string, GOOGLE_CLIENT_SECRET: string) {
  const expiry = new Date(tokenRecord.token_expiry || tokenRecord.expires_at)
  const now = new Date()

  // Refresh if token expires in less than 5 minutes
  if (expiry.getTime() - now.getTime() > 5 * 60 * 1000) {
    return tokenRecord.access_token
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google credentials not configured')
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
  })

  if (!refreshResponse.ok) {
    throw new Error('Failed to refresh token')
  }

  const newTokenData = await refreshResponse.json()
  const newExpiry = new Date(Date.now() + (newTokenData.expires_in * 1000))

  await supabase
    .from('user_google_tokens')
    .update({
      access_token: newTokenData.access_token,
      token_expiry: newExpiry.toISOString(),
      expires_at: newExpiry.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', tokenRecord.id)

  return newTokenData.access_token
}

// Sync events from Google Calendar
async function syncCalendar(supabase: any, userEmail: string, corsHeaders: any, GOOGLE_CLIENT_ID: string | undefined, GOOGLE_CLIENT_SECRET: string | undefined) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Google credentials not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: tokens, error } = await supabase
    .from('user_google_tokens')
    .select('*')
    .eq('user_email', userEmail)

  if (error || !tokens || tokens.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Not connected to Google' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const tokenRecord = tokens[0]

  let accessToken
  try {
    accessToken = await refreshTokenIfNeeded(supabase, tokenRecord, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Token refresh failed. Please reconnect.' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Fetch events from Google Calendar (next 30 days)
  const now = new Date()
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const calendarResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    `timeMin=${now.toISOString()}&timeMax=${thirtyDaysLater.toISOString()}&singleEvents=true&orderBy=startTime`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  )

  if (!calendarResponse.ok) {
    const error = await calendarResponse.text()
    console.error('Calendar fetch failed:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch calendar' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const calendarData = await calendarResponse.json()
  const events = calendarData.items || []

  // Get existing calendar events for this user
  const { data: existingEvents } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('created_by', userEmail)

  const existingGoogleIds = new Set(
    (existingEvents || [])
      .filter((e: any) => e.google_calendar_event_id)
      .map((e: any) => e.google_calendar_event_id)
  )

  let imported = 0
  let updated = 0

  for (const event of events) {
    const eventData = {
      title: event.summary || 'אירוע ללא שם',
      description: event.description || '',
      event_type: 'meeting',
      start_date: event.start?.dateTime || event.start?.date,
      end_date: event.end?.dateTime || event.end?.date,
      all_day: !event.start?.dateTime,
      location: event.location || '',
      google_calendar_event_id: event.id,
      status: 'approved',
      created_by: userEmail,
      architect_email: userEmail
    }

    if (existingGoogleIds.has(event.id)) {
      // Update existing event
      const existing = existingEvents?.find((e: any) => e.google_calendar_event_id === event.id)
      if (existing) {
        await supabase
          .from('calendar_events')
          .update(eventData)
          .eq('id', existing.id)
        updated++
      }
    } else {
      // Create new event
      await supabase.from('calendar_events').insert(eventData)
      imported++
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      total: events.length,
      imported,
      updated
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Disconnect Google account
async function disconnect(supabase: any, userEmail: string, corsHeaders: any) {
  await supabase
    .from('user_google_tokens')
    .delete()
    .eq('user_email', userEmail)

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

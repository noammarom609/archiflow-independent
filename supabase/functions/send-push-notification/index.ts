// Send Push Notification Edge Function
// Uses web-push to send push notifications

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Web Push library for Deno
const webPush = {
  setVapidDetails: (_subject: string, _publicKey: string, _privateKey: string) => {},
  sendNotification: async (subscription: PushSubscription, payload: string) => {
    // Implementation using fetch to the push endpoint
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
      },
      body: payload
    })
    return response
  }
}

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { userEmail, userId, title, body, url, tag, icon } = await req.json()

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!userEmail && !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: userEmail or userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If we have userId but not email, look up the user's email
    let targetEmail = userEmail?.toLowerCase()
    if (!targetEmail && userId) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()
      
      if (userError || !userData) {
        console.log('Could not find user by ID:', userId)
        return new Response(
          JSON.stringify({ success: true, sent: 0, message: 'User not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      targetEmail = userData.email?.toLowerCase()
    }

    if (!targetEmail) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No email found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get push subscriptions for the user
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_email', targetEmail)

    if (subError) {
      throw subError
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/archiflow-logoV2.png',
      badge: '/archiflow-logoV2.png',
      tag: tag || 'notification',
      data: { url: url || '/' }
    })

    let sent = 0
    const errors: string[] = []

    for (const sub of subscriptions) {
      try {
        const subscription: PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }

        await webPush.sendNotification(subscription, payload)
        sent++
      } catch (error) {
        console.error('Failed to send to subscription:', error)
        errors.push(error.message)
        
        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent, 
        total: subscriptions.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending push notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

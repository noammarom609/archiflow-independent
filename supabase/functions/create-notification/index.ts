// Create Notification Edge Function
// Creates in-app notifications and optionally sends push notifications

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const payload = await req.json()
    
    const {
      user_id,
      user_email,
      title,
      message,
      type = 'general',
      priority = 'normal',
      link,
      entity_type,
      entity_id,
      metadata,
      send_push = true
    } = payload

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!user_id && !user_email) {
      return new Response(
        JSON.stringify({ error: 'Must provide user_id or user_email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create in-app notification
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: user_id || null,
        user_email: user_email || null,
        title,
        message,
        type,
        priority,
        link,
        entity_type,
        entity_id,
        metadata,
        is_read: false,
        created_date: new Date().toISOString()
      })
      .select()
      .single()

    if (notifError) {
      throw notifError
    }

    // Send push notification if enabled
    if (send_push && user_email) {
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userEmail: user_email.toLowerCase(),
            title,
            body: message,
            url: link ? `/${link}` : '/',
            tag: type
          })
        })
      } catch (pushError) {
        console.error('Failed to send push notification:', pushError)
        // Don't fail the whole operation if push fails
      }
    }

    return new Response(
      JSON.stringify({ success: true, notification_id: notification.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

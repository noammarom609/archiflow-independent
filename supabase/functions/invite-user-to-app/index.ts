// Invite User to App Edge Function
// Sends invitation emails and creates user records

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

    const { 
      email, 
      role = 'user', 
      app_role = 'user',
      allowed_pages = [],
      full_name,
      entity_type,
      entity_id 
    } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User already exists',
          user: existingUser
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('users')
      .insert({
        email: normalizedEmail,
        full_name: full_name || normalizedEmail.split('@')[0],
        role,
        app_role,
        allowed_pages,
        status: 'invited',
        created_date: new Date().toISOString()
      })
      .select()
      .single()

    if (inviteError) {
      throw inviteError
    }

    // Update entity if provided (link user to consultant/contractor/client)
    if (entity_type && entity_id) {
      const tableMap: Record<string, string> = {
        consultant: 'consultants',
        contractor: 'contractors',
        client: 'clients',
        team_member: 'team_members',
      }

      const tableName = tableMap[entity_type]
      if (tableName) {
        await supabase
          .from(tableName)
          .update({ 
            user_id: invitation.id,
            access_status: 'invited'
          })
          .eq('id', entity_id)
      }
    }

    // Send invitation email
    const appUrl = Deno.env.get('APP_URL') || 'https://archiflow.app'
    const inviteUrl = `${appUrl}/sign-up?email=${encodeURIComponent(normalizedEmail)}`

    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: normalizedEmail,
          subject: 'הוזמנת להצטרף ל-ArchiFlow',
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1a1a2e;">ברוכים הבאים ל-ArchiFlow!</h1>
              <p>הוזמנת להצטרף למערכת ArchiFlow.</p>
              <p>לחץ על הכפתור למטה כדי להשלים את ההרשמה:</p>
              <a href="${inviteUrl}" style="display: inline-block; background: #1a1a2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                הצטרף עכשיו
              </a>
              <p style="color: #666; font-size: 14px;">אם לא ביקשת הזמנה זו, אפשר להתעלם מהמייל הזה.</p>
            </div>
          `
        })
      })
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      // Don't fail the whole operation if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation sent',
        user: invitation
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error inviting user:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

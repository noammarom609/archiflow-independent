// Get Architect Users Edge Function
// Returns list of users with architect role

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

    // Get all users with architect-related roles
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, app_role, image_url, status, created_date')
      .or('app_role.eq.Super Admin,app_role.eq.Admin,app_role.eq.architect,role.eq.architect')
      .order('created_date', { ascending: false })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        users: users || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error getting architect users:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

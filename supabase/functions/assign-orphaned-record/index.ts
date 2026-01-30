// Assign Orphaned Record Edge Function
// Assigns orphaned entity records to a specific architect

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

    // Get the user record to check app_role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .single()

    if (userError || !currentUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Only super admin can assign orphaned records
    if (currentUser.app_role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Only Super Admin can assign records' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { entityType, recordId, targetArchitectId } = await req.json()
    
    if (!entityType || !recordId || !targetArchitectId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify architect exists
    const { data: architect, error: archError } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetArchitectId)
      .single()
    
    if (archError || !architect) {
      return new Response(
        JSON.stringify({ error: 'Architect not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map entity type to table name
    const tableMap: Record<string, string> = {
      'client': 'clients',
      'contractor': 'contractors',
      'team_member': 'team_members',
      'consultant': 'consultants',
    }

    const tableName = tableMap[entityType]
    if (!tableName) {
      return new Response(
        JSON.stringify({ error: 'Invalid entity type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the record with architect_id
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ architect_id: targetArchitectId })
      .eq('id', recordId)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Record assigned successfully',
        recordId,
        architectId: targetArchitectId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in assignOrphanedRecord:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

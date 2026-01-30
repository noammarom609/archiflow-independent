// Admin Assign User Edge Function
// Assigns users to architects or promotes user roles

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

    const { action, userId, targetArchitectId, newRole, newAppRole } = await req.json()

    if (!action || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: action, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result

    switch (action) {
      case 'assign_to_architect':
        if (!targetArchitectId) {
          return new Response(
            JSON.stringify({ error: 'Missing targetArchitectId for assign_to_architect action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        const { data: assignData, error: assignError } = await supabase
          .from('users')
          .update({ 
            architect_id: targetArchitectId,
            updated_date: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single()

        if (assignError) throw assignError
        result = assignData
        break

      case 'promote_to_architect':
        const { data: promoteData, error: promoteError } = await supabase
          .from('users')
          .update({ 
            app_role: 'architect',
            role: 'architect',
            updated_date: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single()

        if (promoteError) throw promoteError
        result = promoteData
        break

      case 'update_role':
        const updateData: Record<string, unknown> = {
          updated_date: new Date().toISOString()
        }
        if (newRole) updateData.role = newRole
        if (newAppRole) updateData.app_role = newAppRole

        const { data: updateResult, error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId)
          .select()
          .single()

        if (updateError) throw updateError
        result = updateResult
        break

      case 'delete_user':
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', userId)

        if (deleteError) throw deleteError
        result = { deleted: true, userId }
        break

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        action,
        result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in admin assign user:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

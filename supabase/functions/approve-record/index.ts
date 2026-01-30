// Approve Record Edge Function
// Handles approval/rejection of various entity records

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

    const { entityType, recordId, action, rejectionReason } = await req.json()

    if (!entityType || !recordId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: entityType, recordId, action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map entity types to table names
    const tableMap: Record<string, string> = {
      proposal: 'proposals',
      document: 'documents',
      invoice: 'invoices',
      meeting: 'meeting_slots',
      task: 'tasks',
    }

    const tableName = tableMap[entityType.toLowerCase()]
    if (!tableName) {
      return new Response(
        JSON.stringify({ error: `Unknown entity type: ${entityType}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const updateData: Record<string, unknown> = {
      updated_date: new Date().toISOString()
    }

    if (action === 'approve') {
      updateData.status = 'approved'
      updateData.approved_at = new Date().toISOString()
    } else if (action === 'reject') {
      updateData.status = 'rejected'
      updateData.rejected_at = new Date().toISOString()
      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason
      }
    } else {
      return new Response(
        JSON.stringify({ error: `Invalid action: ${action}. Must be 'approve' or 'reject'` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', recordId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        record: data,
        action
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error approving record:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

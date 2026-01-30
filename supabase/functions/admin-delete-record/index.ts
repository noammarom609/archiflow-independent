// Admin Delete Record Edge Function
// Deletes records with admin privileges

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

    const { entityType, recordId } = await req.json()

    if (!entityType || !recordId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: entityType, recordId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map entity types to table names
    const tableMap: Record<string, string> = {
      project: 'projects',
      client: 'clients',
      task: 'tasks',
      document: 'documents',
      recording: 'recordings',
      proposal: 'proposals',
      invoice: 'invoices',
      expense: 'expenses',
      team_member: 'team_members',
      consultant: 'consultants',
      contractor: 'contractors',
      supplier: 'suppliers',
      notification: 'notifications',
      comment: 'comments',
      calendar_event: 'calendar_events',
      time_entry: 'time_entries',
      journal_entry: 'journal_entries',
      moodboard: 'moodboards',
      content_item: 'content_items',
    }

    const tableName = tableMap[entityType.toLowerCase()]
    if (!tableName) {
      return new Response(
        JSON.stringify({ error: `Unknown entity type: ${entityType}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', recordId)

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${entityType} deleted successfully`,
        entityType,
        recordId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error deleting record:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

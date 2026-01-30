// Get Public Proposal Edge Function
// Returns proposal data for public viewing (no auth required)

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

    const url = new URL(req.url)
    const proposalId = url.searchParams.get('id')
    const shareToken = url.searchParams.get('token')

    if (!proposalId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get proposal
    const { data: proposal, error } = await supabase
      .from('proposals')
      .select(`
        id,
        title,
        content,
        status,
        version,
        project_id,
        created_date,
        updated_date,
        share_token,
        is_public,
        projects (
          id,
          name,
          client_id,
          clients (
            id,
            name,
            email
          )
        )
      `)
      .eq('id', proposalId)
      .single()

    if (error) {
      throw error
    }

    // Check if proposal is accessible
    if (!proposal.is_public && proposal.share_token !== shareToken) {
      return new Response(
        JSON.stringify({ error: 'Proposal not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        proposal
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error getting proposal:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

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

    // Support both POST body and URL query params
    let proposalId: string | null = null
    let shareToken: string | null = null
    let type: string = 'proposal'

    // Try to get from POST body first
    if (req.method === 'POST') {
      try {
        const body = await req.json()
        proposalId = body.id
        shareToken = body.token
        type = body.type || 'proposal'
      } catch {
        // Body parsing failed, try URL params
      }
    }

    // Fall back to URL query params
    if (!proposalId) {
      const url = new URL(req.url)
      proposalId = url.searchParams.get('id')
      shareToken = url.searchParams.get('token')
      type = url.searchParams.get('type') || 'proposal'
    }

    if (!proposalId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // The id parameter is actually project_id for all types
    const projectId = proposalId

    console.log('Looking for project with id:', projectId, 'type:', typeof projectId)

    // Get project first - try as-is first, then try as number if it fails
    let project = null
    let projectError = null

    // Query the project - use * to get all columns since we don't know exact schema
    const result1 = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (!result1.error) {
      project = result1.data
      console.log('Project found:', project?.name)
    } else {
      console.log('Query failed:', result1.error.message)
      projectError = result1.error
    }

    if (!project) {
      console.error('Project fetch error:', projectError)
      return new Response(
        JSON.stringify({ error: 'Project not found', details: projectError?.message, queriedId: projectId }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let proposal = null
    let template = null
    let documents: any[] = []

    // If type is proposal, get the proposal data
    if (type === 'proposal') {
      console.log('Fetching proposal for project:', projectId)
      
      // Use * to get all columns and maybeSingle to handle 0 results gracefully
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
        .eq('project_id', projectId)
        .order('created_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      console.log('Proposal query result:', { 
        found: !!proposalData, 
        error: proposalError?.message,
        proposalId: proposalData?.id 
      })

      if (proposalError) {
        console.error('Proposal query error:', proposalError)
      }

      if (proposalData) {
        proposal = proposalData

        // Get template if exists
        if (proposalData.template_id) {
          const { data: templateData } = await supabase
            .from('proposal_templates')
            .select('*')
            .eq('id', proposalData.template_id)
            .maybeSingle()
          
          if (templateData) {
            template = templateData
          }
        }
      } else {
        console.log('No proposal found for this project')
      }
    }

    // Get documents for the type
    const docType = type === 'proposal' ? 'proposal' : 
                    type === 'technical' ? 'technical' :
                    type === 'sketches' ? 'sketch' :
                    type === 'renderings' ? 'rendering' : type

    const { data: docsData } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .or(`file_type.eq.${docType},category.eq.${docType}`)
      .order('created_date', { ascending: false })

    if (docsData) {
      documents = docsData
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        project,
        proposal,
        template,
        documents
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

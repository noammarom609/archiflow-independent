// Submit Public Approval Edge Function
// Handles approval submissions from public links

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

    const body = await req.json()
    
    // Support both old format (entityType, entityId, action) and new format (projectId, type, proposalId)
    let entityType = body.entityType || body.type
    let entityId = body.entityId || body.proposalId || body.projectId
    const action = body.action || 'approve' // Default to approve for new format
    const signature = body.signature || body.signatureData
    const comments = body.comments
    const approverName = body.approverName || body.clientName
    const approverEmail = body.approverEmail
    const token = body.token
    const projectId = body.projectId

    console.log('Received approval request:', { entityType, entityId, action, projectId, hasSignature: !!signature })

    // If we have projectId but no proposalId, try to find the proposal
    if (projectId && !body.proposalId && entityType === 'proposal') {
      console.log('Looking up proposal for project:', projectId)
      const { data: proposal } = await supabase
        .from('proposals')
        .select('id')
        .eq('project_id', projectId)
        .order('created_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (proposal) {
        entityId = proposal.id
        console.log('Found proposal:', entityId)
      }
    }

    if (!entityType || !entityId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: entityType/type and entityId/proposalId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map entity types to table names
    const tableMap: Record<string, string> = {
      proposal: 'proposals',
      document: 'documents',
    }

    const tableName = tableMap[entityType.toLowerCase()]
    if (!tableName) {
      return new Response(
        JSON.stringify({ error: `Unknown entity type: ${entityType}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the entity exists and has the correct token
    const { data: entity, error: fetchError } = await supabase
      .from(tableName)
      .select('id, share_token, status')
      .eq('id', entityId)
      .single()

    if (fetchError || !entity) {
      return new Response(
        JSON.stringify({ error: 'Entity not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (token && entity.share_token !== token) {
      return new Response(
        JSON.stringify({ error: 'Invalid access token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the entity
    const updateData: Record<string, unknown> = {
      updated_date: new Date().toISOString()
    }

    if (action === 'approve') {
      updateData.status = 'approved'
      updateData.approved_at = new Date().toISOString()
      updateData.approver_name = approverName
      updateData.approver_email = approverEmail
      if (signature) {
        updateData.signature = signature
      }
    } else if (action === 'reject') {
      updateData.status = 'rejected'
      updateData.rejected_at = new Date().toISOString()
      updateData.rejection_reason = comments
    } else if (action === 'request_changes') {
      updateData.status = 'changes_requested'
      updateData.change_request_comments = comments
    }

    if (comments) {
      updateData.approval_comments = comments
    }

    const { data: updated, error: updateError } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', entityId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Send notification to the owner
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/create-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: action === 'approve' ? 'אושר!' : action === 'reject' ? 'נדחה' : 'נדרשים שינויים',
          message: `${entityType} ${action === 'approve' ? 'אושר' : action === 'reject' ? 'נדחה' : 'דורש שינויים'} על ידי ${approverName || 'לקוח'}`,
          type: 'approval',
          entity_type: entityType,
          entity_id: entityId
        })
      })
    } catch (notifError) {
      console.error('Failed to send notification:', notifError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        entity: updated,
        action
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error submitting approval:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

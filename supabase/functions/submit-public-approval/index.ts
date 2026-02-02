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
    
    console.log('📩 Raw request body:', JSON.stringify(body, null, 2))
    
    // Support both old format (entityType, entityId, action) and new format (projectId, type, proposalId)
    let entityType = body.entityType || body.type || 'proposal'
    // Don't use projectId as entityId - it's a different ID!
    let entityId = body.entityId || body.proposalId
    const action = body.action || 'approve' // Default to approve for new format
    const signature = body.signature || body.signatureData
    const comments = body.comments
    const approverName = body.approverName || body.clientName
    const approverEmail = body.approverEmail
    const token = body.token
    const projectId = body.projectId

    console.log('🔍 Parsed approval request:', { entityType, entityId, action, projectId, hasSignature: !!signature, approverName })

    // If we have projectId but no proposalId, try to find the proposal
    if (projectId && (!body.proposalId || !entityId) && (entityType === 'proposal' || !entityType)) {
      console.log('Looking up proposal for project:', projectId)
      const { data: proposal, error: lookupError } = await supabase
        .from('proposals')
        .select('id')
        .eq('project_id', projectId)
        .order('created_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (lookupError) {
        console.error('Error looking up proposal:', lookupError)
      }
      
      if (proposal) {
        entityId = proposal.id
        entityType = 'proposal'
        console.log('Found proposal:', entityId)
      } else {
        console.log('No proposal found for project:', projectId)
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

    // Verify the entity exists
    const { data: entity, error: fetchError } = await supabase
      .from(tableName)
      .select('id, status, share_token')
      .eq('id', entityId)
      .maybeSingle()

    if (fetchError) {
      console.error('Database error:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Database error: ' + fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!entity) {
      console.log('Entity not found, entityId:', entityId, 'tableName:', tableName)
      return new Response(
        JSON.stringify({ error: 'Entity not found', entityId, tableName }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Only validate token if both token is provided AND entity has a share_token set
    if (token && entity.share_token && entity.share_token !== token) {
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

    // If proposal was approved, update the project to mark lead conversion
    if (action === 'approve' && entityType === 'proposal' && projectId) {
      const now = new Date().toISOString()
      const { error: projectUpdateError } = await supabase
        .from('projects')
        .update({
          proposal_approved_at: now,
          lead_converted_at: now,
          current_stage: 'gantt',
          status: 'gantt'
        })
        .eq('id', projectId)

      if (projectUpdateError) {
        console.error('Error updating project for lead conversion:', projectUpdateError)
      } else {
        console.log('✅ Project updated: lead converted to active project')
      }

      // Also update client status to active
      const { data: project } = await supabase
        .from('projects')
        .select('client_id')
        .eq('id', projectId)
        .single()

      if (project?.client_id) {
        const { error: clientUpdateError } = await supabase
          .from('clients')
          .update({ status: 'active' })
          .eq('id', project.client_id)

        if (clientUpdateError) {
          console.error('Error updating client status:', clientUpdateError)
        } else {
          console.log('✅ Client status updated to active')
        }
      }
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

// On Document Change Edge Function
// Automation handler for Document entity changes - triggers notifications

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

    const { event, data, old_data } = await req.json()

    if (!data) {
      return new Response(
        JSON.stringify({ success: true, message: 'No data provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const documentName = data.name || data.title || 'מסמך'
    const documentId = event?.entity_id || data.id

    // Helper function to create notification
    const createNotification = async (params: any) => {
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/create-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        })
      } catch (error) {
        console.error('Failed to create notification:', error)
      }
    }

    if ((event?.type === 'update' || old_data) && old_data) {
      // Check if document was approved
      if (data.approval_status === 'approved' && old_data.approval_status !== 'approved') {
        // Notify document creator
        if (data.created_by) {
          await createNotification({
            user_email: data.created_by,
            title: 'מסמך אושר',
            message: `המסמך "${documentName}" אושר`,
            type: 'document_approved',
            priority: 'normal',
            link: data.project_id ? `Projects?id=${data.project_id}&tab=documents` : 'Dashboard',
            entity_type: 'Document',
            entity_id: documentId,
            metadata: { 
              document_name: documentName
            }
          })
        }
      }

      // Check if document was rejected
      if (data.approval_status === 'rejected' && old_data.approval_status !== 'rejected') {
        if (data.created_by) {
          await createNotification({
            user_email: data.created_by,
            title: 'מסמך נדחה',
            message: `המסמך "${documentName}" נדחה${data.rejection_reason ? `: ${data.rejection_reason}` : ''}`,
            type: 'document_rejected',
            priority: 'high',
            link: data.project_id ? `Projects?id=${data.project_id}&tab=documents` : 'Dashboard',
            entity_type: 'Document',
            entity_id: documentId,
            metadata: { 
              document_name: documentName,
              rejection_reason: data.rejection_reason
            }
          })
        }
      }

      // Check if requires approval changed to true
      if (data.requires_approval && !old_data.requires_approval) {
        // Get project owner to notify
        if (data.project_id) {
          const { data: project } = await supabase
            .from('projects')
            .select('created_by')
            .eq('id', data.project_id)
            .single()

          if (project?.created_by) {
            await createNotification({
              user_email: project.created_by,
              title: 'מסמך ממתין לאישור',
              message: `המסמך "${documentName}" מחכה לאישורך`,
              type: 'document_pending_approval',
              priority: 'normal',
              link: `Projects?id=${data.project_id}&tab=documents`,
              entity_type: 'Document',
              entity_id: documentId,
              metadata: { 
                document_name: documentName
              }
            })
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in onDocumentChange:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

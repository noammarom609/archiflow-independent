// On Project Change Edge Function
// Automation handler for Project entity changes - triggers notifications

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

    const projectName = data.name || 'פרויקט'
    const projectId = event?.entity_id || data.id

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

    // Get all admin users to notify
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .or('role.eq.admin,app_role.eq.super_admin,app_role.eq.admin')

    const admins = users || []

    if (event?.type === 'create' || (!event && !old_data)) {
      // Notify admins about new project
      for (const admin of admins) {
        await createNotification({
          user_id: admin.id,
          user_email: admin.email,
          title: 'פרויקט חדש נוצר',
          message: `הפרויקט "${projectName}" נוצר במערכת`,
          type: 'project_created',
          priority: 'normal',
          link: `Projects?id=${projectId}`,
          entity_type: 'Project',
          entity_id: projectId,
          metadata: { project_name: projectName }
        })
      }
    }

    if ((event?.type === 'update' || old_data) && old_data) {
      // Check if stage changed
      if (data.current_stage !== old_data.current_stage) {
        const stageNames: Record<string, string> = {
          'first_call': 'שיחה ראשונה',
          'survey': 'סיור',
          'concept': 'קונספט',
          'proposal': 'הצעת מחיר',
          'sketches': 'סקיצות',
          'technical_plans': 'תכניות טכניות',
          'permits': 'היתרים',
          'selections': 'בחירות',
          'execution': 'ביצוע',
          'completion': 'מסירה'
        }
        
        const newStageName = stageNames[data.current_stage] || data.current_stage
        
        // Notify project creator and admins
        const notifyUsers = new Set([data.created_by])
        admins.forEach(a => notifyUsers.add(a.email))

        for (const userEmail of notifyUsers) {
          if (userEmail) {
            await createNotification({
              user_email: userEmail,
              title: 'שלב פרויקט השתנה',
              message: `הפרויקט "${projectName}" עבר לשלב: ${newStageName}`,
              type: 'project_stage_changed',
              priority: 'normal',
              link: `Projects?id=${projectId}`,
              entity_type: 'Project',
              entity_id: projectId,
              metadata: { 
                project_name: projectName,
                old_stage: old_data.current_stage,
                new_stage: data.current_stage
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
    console.error('Error in onProjectChange:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// On Task Change Edge Function
// Automation handler for Task entity changes - triggers notifications

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

    const taskTitle = data.title || 'משימה'
    const taskId = event?.entity_id || data.id
    const projectName = data.project_name || ''

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

    if (event?.type === 'create' || (!event && !old_data)) {
      // Notify assigned users about new task
      const assignedTo = data.assigned_to || []
      
      for (const userId of assignedTo) {
        await createNotification({
          user_email: userId,
          title: 'משימה חדשה הוקצתה לך',
          message: `המשימה "${taskTitle}" הוקצתה לך${projectName ? ` בפרויקט ${projectName}` : ''}`,
          type: 'task_assigned',
          priority: data.priority === 'urgent' ? 'urgent' : data.priority === 'high' ? 'high' : 'normal',
          link: data.project_id ? `Projects?id=${data.project_id}&tab=tasks` : 'Dashboard',
          entity_type: 'Task',
          entity_id: taskId,
          metadata: { 
            task_title: taskTitle,
            project_name: projectName,
            due_date: data.due_date
          }
        })
      }
    }

    if ((event?.type === 'update' || old_data) && old_data) {
      // Check if task was completed
      if (data.status === 'completed' && old_data.status !== 'completed') {
        if (data.created_by) {
          await createNotification({
            user_email: data.created_by,
            title: 'משימה הושלמה',
            message: `המשימה "${taskTitle}" סומנה כהושלמה${projectName ? ` בפרויקט ${projectName}` : ''}`,
            type: 'task_completed',
            priority: 'normal',
            link: data.project_id ? `Projects?id=${data.project_id}&tab=tasks` : 'Dashboard',
            entity_type: 'Task',
            entity_id: taskId,
            metadata: { 
              task_title: taskTitle,
              project_name: projectName
            }
          })
        }
      }

      // Check if assignment changed
      const oldAssigned = old_data.assigned_to || []
      const newAssigned = data.assigned_to || []
      const newlyAssigned = newAssigned.filter((u: string) => !oldAssigned.includes(u))

      for (const userId of newlyAssigned) {
        await createNotification({
          user_email: userId,
          title: 'משימה הוקצתה לך',
          message: `המשימה "${taskTitle}" הוקצתה לך${projectName ? ` בפרויקט ${projectName}` : ''}`,
          type: 'task_assigned',
          priority: data.priority === 'urgent' ? 'urgent' : data.priority === 'high' ? 'high' : 'normal',
          link: data.project_id ? `Projects?id=${data.project_id}&tab=tasks` : 'Dashboard',
          entity_type: 'Task',
          entity_id: taskId,
          metadata: { 
            task_title: taskTitle,
            project_name: projectName,
            due_date: data.due_date
          }
        })
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in onTaskChange:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

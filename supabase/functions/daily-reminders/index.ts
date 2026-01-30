// Daily Reminders Edge Function
// Sends daily reminder notifications for tasks and meetings
// Should be triggered by a cron job

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

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayStr = today.toISOString().split('T')[0]
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const results = {
      tasks_reminded: 0,
      meetings_reminded: 0,
      errors: []
    }

    // Get tasks due today or overdue
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, due_date, assigned_to, project_id')
      .lte('due_date', todayStr)
      .neq('status', 'completed')
      .neq('status', 'cancelled')

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      results.errors.push({ type: 'tasks', error: tasksError.message })
    } else if (tasks) {
      for (const task of tasks) {
        if (task.assigned_to) {
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/create-notification`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                user_email: task.assigned_to,
                title: 'תזכורת משימה',
                message: `המשימה "${task.title}" מגיעה לתאריך היעד היום`,
                type: 'task_reminder',
                priority: 'high',
                link: `Projects?projectId=${task.project_id}`,
                entity_type: 'task',
                entity_id: task.id
              })
            })
            results.tasks_reminded++
          } catch (error) {
            results.errors.push({ type: 'task_notification', taskId: task.id, error: error.message })
          }
        }
      }
    }

    // Get meetings for today
    const { data: meetings, error: meetingsError } = await supabase
      .from('calendar_events')
      .select('id, title, start_date, attendees, project_id')
      .gte('start_date', todayStr)
      .lt('start_date', tomorrowStr)

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError)
      results.errors.push({ type: 'meetings', error: meetingsError.message })
    } else if (meetings) {
      for (const meeting of meetings) {
        // Send reminder to each attendee
        const attendees = meeting.attendees || []
        for (const attendee of attendees) {
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/create-notification`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                user_email: attendee,
                title: 'תזכורת פגישה',
                message: `הפגישה "${meeting.title}" מתוכננת להיום`,
                type: 'meeting_reminder',
                priority: 'normal',
                link: 'Calendar',
                entity_type: 'calendar_event',
                entity_id: meeting.id
              })
            })
            results.meetings_reminded++
          } catch (error) {
            results.errors.push({ type: 'meeting_notification', meetingId: meeting.id, error: error.message })
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        date: todayStr
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing daily reminders:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

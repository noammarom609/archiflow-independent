// Distribute Recording Data V2 Edge Function
// Distributes extracted data from recordings to various entities

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

    const { recording, selections } = await req.json()

    if (!recording || !selections) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recording, selections' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = {
      tasks: [],
      calendar_events: [],
      journal_entries: [],
      notifications: [],
      errors: []
    }

    // Process tasks
    if (selections.tasks && Array.isArray(selections.tasks)) {
      for (const task of selections.tasks) {
        try {
          const { data, error } = await supabase
            .from('tasks')
            .insert({
              title: task.title,
              description: task.description,
              project_id: recording.project_id,
              status: 'pending',
              priority: task.priority || 'medium',
              due_date: task.due_date,
              source: 'recording',
              source_recording_id: recording.id,
              created_date: new Date().toISOString()
            })
            .select()
            .single()

          if (error) throw error
          results.tasks.push(data)
        } catch (error) {
          results.errors.push({ type: 'task', error: error.message })
        }
      }
    }

    // Process calendar events
    if (selections.calendar_events && Array.isArray(selections.calendar_events)) {
      for (const event of selections.calendar_events) {
        try {
          const { data, error } = await supabase
            .from('calendar_events')
            .insert({
              title: event.title,
              description: event.description,
              project_id: recording.project_id,
              start_date: event.start_date,
              end_date: event.end_date,
              all_day: event.all_day || false,
              source: 'recording',
              source_recording_id: recording.id,
              created_date: new Date().toISOString()
            })
            .select()
            .single()

          if (error) throw error
          results.calendar_events.push(data)
        } catch (error) {
          results.errors.push({ type: 'calendar_event', error: error.message })
        }
      }
    }

    // Process journal entries
    if (selections.journal_entries && Array.isArray(selections.journal_entries)) {
      for (const entry of selections.journal_entries) {
        try {
          const { data, error } = await supabase
            .from('journal_entries')
            .insert({
              content: entry.content,
              project_id: recording.project_id,
              entry_type: entry.type || 'note',
              source: 'recording',
              source_recording_id: recording.id,
              entry_date: new Date().toISOString(),
              created_date: new Date().toISOString()
            })
            .select()
            .single()

          if (error) throw error
          results.journal_entries.push(data)
        } catch (error) {
          results.errors.push({ type: 'journal_entry', error: error.message })
        }
      }
    }

    // Update recording status
    await supabase
      .from('recordings')
      .update({ 
        distribution_status: 'completed',
        distributed_at: new Date().toISOString()
      })
      .eq('id', recording.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary: {
          tasks_created: results.tasks.length,
          events_created: results.calendar_events.length,
          entries_created: results.journal_entries.length,
          errors: results.errors.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error distributing recording data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

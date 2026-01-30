import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recording_id, selections, edited_data } = await req.json();

    console.log('🚀 Starting data distribution for recording:', recording_id);
    
    const distributionLog = [];
    const results = {
      tasks_created: [],
      journal_created: null,
      projects_updated: [],
      notifications_sent: [],
      calendar_events_created: [],
      budget_updated: [],
    };

    // Fetch recording
    const recordings = await base44.asServiceRole.entities.Recording.filter({ id: recording_id });
    const recording = recordings[0];
    
    if (!recording) {
      throw new Error('Recording not found');
    }

    // 1. Create Tasks
    if (selections.createTasks && edited_data.tasks?.length > 0) {
      console.log('📋 Creating tasks...');
      for (const taskData of edited_data.tasks) {
        try {
          const task = await base44.asServiceRole.entities.Task.create({
            title: taskData.task,
            description: `נוצר אוטומטית מהקלטה: ${recording.title}`,
            status: 'pending',
            priority: taskData.priority || 'medium',
            due_date: taskData.deadline || null,
            assigned_to: taskData.assignee ? [taskData.assignee] : [],
            project_name: edited_data.projects?.[0]?.project_name || '',
            contractor_name: taskData.assignee || '',
          });
          
          results.tasks_created.push(task);
          distributionLog.push({
            action: 'task_created',
            entity: 'Task',
            entity_id: task.id,
            timestamp: new Date().toISOString(),
            details: taskData.task
          });
        } catch (error) {
          console.error('Error creating task:', error);
        }
      }
    }

    // 2. Create Journal Entry
    if (selections.createJournalEntry) {
      console.log('📝 Creating journal entry...');
      try {
        const analysis = recording.analysis || {};
        const deepAnalysis = recording.deep_analysis || {};
        
        const journalEntry = await base44.asServiceRole.entities.JournalEntry.create({
          title: recording.title,
          content: `${recording.transcription || ''}\n\n**סיכום:**\n${analysis.summary || ''}\n\n**החלטות:**\n${analysis.decisions?.map(d => `- ${d}`).join('\n') || 'אין'}\n\n**נושאים:**\n${analysis.topics?.join(', ') || 'אין'}`,
          category: 'meeting',
          entry_date: new Date().toISOString().split('T')[0],
          project_name: edited_data.projects?.[0]?.project_name || '',
          tags: analysis.topics || [],
          attachments: recording.audio_url ? [{
            type: 'audio',
            url: recording.audio_url,
            name: recording.title
          }] : [],
        });
        
        results.journal_created = journalEntry;
        distributionLog.push({
          action: 'journal_created',
          entity: 'JournalEntry',
          entity_id: journalEntry.id,
          timestamp: new Date().toISOString(),
          details: recording.title
        });
      } catch (error) {
        console.error('Error creating journal entry:', error);
      }
    }

    // 3. Send Notifications
    if (selections.sendNotifications && edited_data.tasks?.length > 0) {
      console.log('🔔 Sending notifications...');
      
      // Get unique assignees
      const assignees = [...new Set(
        edited_data.tasks
          .map(t => t.assignee)
          .filter(Boolean)
      )];
      
      for (const assignee of assignees) {
        try {
          const assigneeTasks = edited_data.tasks.filter(t => t.assignee === assignee);
          
          const notification = await base44.asServiceRole.entities.Notification.create({
            title: 'משימות חדשות מהקלטה',
            message: `נוצרו ${assigneeTasks.length} משימות חדשות עבורך מההקלטה "${recording.title}"`,
            type: 'task',
            priority: 'medium',
            recipient_email: assignee,
            related_id: recording.id,
            related_type: 'recording',
          });
          
          results.notifications_sent.push(notification);
          distributionLog.push({
            action: 'notification_sent',
            entity: 'Notification',
            entity_id: notification.id,
            timestamp: new Date().toISOString(),
            details: `To: ${assignee}`
          });
        } catch (error) {
          console.error('Error sending notification:', error);
        }
      }
    }

    // 4. Create Calendar Events
    if (selections.createCalendarEvents && edited_data.tasks?.length > 0) {
      console.log('📅 Creating calendar events...');
      
      for (const taskData of edited_data.tasks) {
        if (taskData.deadline) {
          try {
            const calendarEvent = await base44.asServiceRole.entities.CalendarEvent.create({
              title: taskData.task,
              description: `Follow-up מהקלטה: ${recording.title}`,
              event_type: 'task',
              start_date: `${taskData.deadline}T09:00:00`,
              end_date: `${taskData.deadline}T10:00:00`,
              all_day: false,
              reminder: true,
              reminder_minutes: 60,
              status: 'approved',
            });
            
            results.calendar_events_created.push(calendarEvent);
            distributionLog.push({
              action: 'calendar_event_created',
              entity: 'CalendarEvent',
              entity_id: calendarEvent.id,
              timestamp: new Date().toISOString(),
              details: taskData.task
            });
          } catch (error) {
            console.error('Error creating calendar event:', error);
          }
        }
      }
    }

    // 5. Update Recording Status
    console.log('✅ Updating recording status...');
    await base44.asServiceRole.entities.Recording.update(recording_id, {
      status: 'distributed',
      distribution_log: distributionLog,
    });

    console.log('🎉 Distribution completed successfully!');
    
    return Response.json({
      success: true,
      results,
      distribution_log: distributionLog,
      summary: {
        tasks_created: results.tasks_created.length,
        journal_created: !!results.journal_created,
        notifications_sent: results.notifications_sent.length,
        calendar_events_created: results.calendar_events_created.length,
      }
    });

  } catch (error) {
    console.error('❌ Distribution error:', error);
    return Response.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      recording,
      selections,
      clientData,
      projectData,
      tasks,
      journal,
      email,
      changedFields
    } = await req.json();

    console.log('🚀 Starting V2 data distribution');
    console.log('Selections:', selections);
    console.log('Changed fields:', changedFields?.length || 0);
    
    const distributionLog = [];
    const results = {
      client_updated: null,
      project_updated: null,
      tasks_created: [],
      journal_created: null,
      email_sent: null,
      learnings_saved: 0
    };

    // 1. Update Client (auto - no approval needed)
    if (selections.updateClient && clientData) {
      console.log('👤 Updating client data...');
      try {
        // Find existing client by phone or email
        let existingClient = null;
        
        if (clientData.phone) {
          const byPhone = await base44.asServiceRole.entities.Client.filter({ phone: clientData.phone });
          if (byPhone.length > 0) existingClient = byPhone[0];
        }
        
        if (!existingClient && clientData.email) {
          const byEmail = await base44.asServiceRole.entities.Client.filter({ email: clientData.email });
          if (byEmail.length > 0) existingClient = byEmail[0];
        }

        // Prepare update data - only update empty fields
        const updateData = {};
        
        if (existingClient) {
          // Smart merge - only update if current value is empty/null
          Object.entries(clientData).forEach(([key, value]) => {
            if (value && !existingClient[key]) {
              updateData[key] = value;
            }
          });
          
          // Merge preferences (arrays)
          if (clientData.preferences) {
            const mergedPrefs = { ...existingClient.preferences };
            ['styles', 'colors', 'materials', 'priorities', 'inspirations'].forEach(field => {
              if (clientData.preferences[field]?.length > 0) {
                const existing = mergedPrefs[field] || [];
                const incoming = clientData.preferences[field];
                mergedPrefs[field] = [...new Set([...existing, ...incoming])];
              }
            });
            if (clientData.preferences.budget_range && !mergedPrefs.budget_range) {
              mergedPrefs.budget_range = clientData.preferences.budget_range;
            }
            updateData.preferences = mergedPrefs;
          }
          
          // Merge AI insights
          if (clientData.ai_insights) {
            updateData.ai_insights = {
              ...existingClient.ai_insights,
              ...clientData.ai_insights
            };
          }

          if (Object.keys(updateData).length > 0) {
            await base44.asServiceRole.entities.Client.update(existingClient.id, updateData);
            results.client_updated = { id: existingClient.id, fields_updated: Object.keys(updateData) };
            
            distributionLog.push({
              action: 'client_updated',
              entity: 'Client',
              entity_id: existingClient.id,
              timestamp: new Date().toISOString(),
              details: `Updated ${Object.keys(updateData).length} fields`
            });
          }
        } else if (clientData.full_name && clientData.phone) {
          // Create new client
          const newClient = await base44.asServiceRole.entities.Client.create({
            ...clientData,
            status: 'lead',
            first_contact_date: new Date().toISOString().split('T')[0]
          });
          results.client_updated = { id: newClient.id, created: true };
          
          distributionLog.push({
            action: 'client_created',
            entity: 'Client',
            entity_id: newClient.id,
            timestamp: new Date().toISOString(),
            details: clientData.full_name
          });
        }
      } catch (error) {
        console.error('Error updating client:', error);
      }
    }

    // 2. Update Project (auto - no approval needed)
    if (selections.updateProject && projectData && recording?.project_id) {
      console.log('🏗️ Updating project data...');
      try {
        const updateFields = {};
        
        if (projectData.budget) updateFields.budget = projectData.budget;
        if (projectData.timeline) updateFields.timeline = projectData.timeline;
        if (projectData.location) updateFields.location = projectData.location;
        if (projectData.description) updateFields.description = projectData.description;
        if (projectData.program_data) updateFields.program_data = projectData.program_data;

        if (Object.keys(updateFields).length > 0) {
          await base44.asServiceRole.entities.Project.update(recording.project_id, updateFields);
          results.project_updated = { id: recording.project_id, fields_updated: Object.keys(updateFields) };
          
          distributionLog.push({
            action: 'project_updated',
            entity: 'Project',
            entity_id: recording.project_id,
            timestamp: new Date().toISOString(),
            details: `Updated ${Object.keys(updateFields).length} fields`
          });
        }
      } catch (error) {
        console.error('Error updating project:', error);
      }
    }

    // 3. Create Tasks (requires approval)
    if (selections.createTasks && tasks?.length > 0) {
      console.log('📋 Creating tasks...');
      for (const taskData of tasks) {
        if (!taskData.title) continue;
        
        try {
          const task = await base44.asServiceRole.entities.Task.create({
            title: taskData.title,
            description: `נוצר אוטומטית מהקלטה: ${recording?.title || 'הקלטה'}`,
            status: 'pending',
            priority: taskData.priority || 'medium',
            due_date: taskData.deadline || null,
            assigned_to: taskData.assignee ? [taskData.assignee] : [],
            project_id: recording?.project_id,
            project_name: recording?.project_name || '',
            contractor_name: taskData.assignee || '',
          });
          
          results.tasks_created.push(task);
          distributionLog.push({
            action: 'task_created',
            entity: 'Task',
            entity_id: task.id,
            timestamp: new Date().toISOString(),
            details: taskData.title
          });
        } catch (error) {
          console.error('Error creating task:', error);
        }
      }
    }

    // 4. Create Journal Entry (requires approval)
    if (selections.createJournal && journal?.enabled && journal?.content) {
      console.log('📝 Creating journal entry...');
      try {
        const journalEntry = await base44.asServiceRole.entities.JournalEntry.create({
          title: recording?.title || 'סיכום פגישה',
          content: journal.content,
          category: 'meeting',
          entry_date: new Date().toISOString().split('T')[0],
          project_id: recording?.project_id,
          project_name: recording?.project_name || '',
          attachments: recording?.audio_url ? [{
            type: 'document',
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
          details: recording?.title
        });
      } catch (error) {
        console.error('Error creating journal entry:', error);
      }
    }

    // 5. Send Email (requires approval)
    if (selections.sendEmail && email?.enabled && email?.body && clientData?.email) {
      console.log('📧 Sending email...');
      try {
        await base44.integrations.Core.SendEmail({
          to: clientData.email,
          subject: email.subject || 'תודה על הפגישה',
          body: email.body
        });
        
        results.email_sent = { to: clientData.email, subject: email.subject };
        distributionLog.push({
          action: 'email_sent',
          entity: 'Email',
          timestamp: new Date().toISOString(),
          details: `To: ${clientData.email}`
        });
      } catch (error) {
        console.error('Error sending email:', error);
      }
    }

    // 6. Update Recording status
    if (recording?.id) {
      await base44.asServiceRole.entities.Recording.update(recording.id, {
        status: 'distributed',
        distribution_log: distributionLog,
      });
    }

    console.log('🎉 Distribution V2 completed!');
    
    return Response.json({
      success: true,
      results,
      distribution_log: distributionLog,
      summary: {
        client_updated: !!results.client_updated,
        project_updated: !!results.project_updated,
        tasks_created: results.tasks_created.length,
        journal_created: !!results.journal_created,
        email_sent: !!results.email_sent
      }
    });

  } catch (error) {
    console.error('❌ Distribution error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
});
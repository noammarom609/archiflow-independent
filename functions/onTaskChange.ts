import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automation handler for Task entity changes
 * Triggers notifications when tasks are assigned, completed, etc.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (!data) {
      return Response.json({ success: true, message: 'No data provided' });
    }

    const taskTitle = data.title || 'משימה';
    const taskId = event.entity_id;
    const projectName = data.project_name || '';

    if (event.type === 'create') {
      // Notify assigned users about new task
      const assignedTo = data.assigned_to || [];
      
      for (const userId of assignedTo) {
        await base44.asServiceRole.functions.invoke('createNotification', {
          user_email: userId, // assigned_to stores emails
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
        });
      }
    }

    if (event.type === 'update' && old_data) {
      // Check if task was completed
      if (data.status === 'completed' && old_data.status !== 'completed') {
        // Notify task creator
        if (data.created_by) {
          await base44.asServiceRole.functions.invoke('createNotification', {
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
          });
        }
      }

      // Check if assignment changed
      const oldAssigned = old_data.assigned_to || [];
      const newAssigned = data.assigned_to || [];
      const newlyAssigned = newAssigned.filter(u => !oldAssigned.includes(u));

      for (const userId of newlyAssigned) {
        await base44.asServiceRole.functions.invoke('createNotification', {
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
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in onTaskChange:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
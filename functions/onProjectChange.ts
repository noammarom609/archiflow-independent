import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automation handler for Project entity changes
 * Triggers notifications when projects are created or updated
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (!data) {
      return Response.json({ success: true, message: 'No data provided' });
    }

    const projectName = data.name || 'פרויקט';
    const projectId = event.entity_id;

    // Get all admin users to notify
    const users = await base44.asServiceRole.entities.User.list();
    const admins = users.filter(u => u.role === 'admin' || u.app_role === 'super_admin' || u.app_role === 'admin');

    if (event.type === 'create') {
      // Notify admins about new project
      for (const admin of admins) {
        await base44.asServiceRole.functions.invoke('createNotification', {
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
        });
      }
    }

    if (event.type === 'update' && old_data) {
      // Check if stage changed
      if (data.current_stage !== old_data.current_stage) {
        const stageNames = {
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
        };
        
        const newStageName = stageNames[data.current_stage] || data.current_stage;
        
        // Notify project creator and admins
        const notifyUsers = new Set([data.created_by]);
        admins.forEach(a => notifyUsers.add(a.email));

        for (const userEmail of notifyUsers) {
          if (userEmail) {
            await base44.asServiceRole.functions.invoke('createNotification', {
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
            });
          }
        }
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in onProjectChange:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
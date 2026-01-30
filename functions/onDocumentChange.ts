import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automation handler for Document entity changes
 * Triggers notifications when documents are uploaded
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || event.type !== 'create') {
      return Response.json({ success: true, message: 'No action needed' });
    }

    const docTitle = data.title || 'מסמך';
    const docId = event.entity_id;
    const projectName = data.project_name || '';
    const projectId = data.project_id;

    // Notify users who have access to the project
    if (projectId) {
      // Get project to find related users
      const projects = await base44.asServiceRole.entities.Project.filter({ id: projectId });
      const project = projects[0];
      
      if (project) {
        const notifyEmails = new Set();
        
        // Add project creator
        if (project.created_by) notifyEmails.add(project.created_by);
        
        // Add assigned team members
        if (project.assigned_to) {
          project.assigned_to.forEach(email => notifyEmails.add(email));
        }

        // Don't notify the uploader
        notifyEmails.delete(data.created_by);

        for (const email of notifyEmails) {
          await base44.asServiceRole.functions.invoke('createNotification', {
            user_email: email,
            title: 'מסמך חדש הועלה',
            message: `המסמך "${docTitle}" הועלה${projectName ? ` לפרויקט ${projectName}` : ''}`,
            type: 'document_uploaded',
            priority: 'normal',
            link: projectId ? `Projects?id=${projectId}&tab=documents` : 'Dashboard',
            entity_type: 'Document',
            entity_id: docId,
            metadata: { 
              document_title: docTitle,
              project_name: projectName,
              category: data.category
            }
          });
        }
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in onDocumentChange:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automation handler for Comment entity changes
 * Triggers notifications when new comments are added
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || event.type !== 'create') {
      return Response.json({ success: true, message: 'No action needed' });
    }

    const authorName = data.author_name || 'משתמש';
    const commentId = event.entity_id;
    const relatedType = data.related_type;
    const relatedId = data.related_id;

    // Get the related entity to find owner
    let ownerEmail = null;
    let itemTitle = '';
    let link = 'Dashboard';

    if (relatedType === 'document' && relatedId) {
      const docs = await base44.asServiceRole.entities.Document.filter({ id: relatedId });
      if (docs[0]) {
        ownerEmail = docs[0].created_by;
        itemTitle = docs[0].title;
        link = docs[0].project_id ? `Projects?id=${docs[0].project_id}&tab=documents` : 'Dashboard';
      }
    } else if (relatedType === 'task' && relatedId) {
      const tasks = await base44.asServiceRole.entities.Task.filter({ id: relatedId });
      if (tasks[0]) {
        ownerEmail = tasks[0].created_by;
        itemTitle = tasks[0].title;
        link = tasks[0].project_id ? `Projects?id=${tasks[0].project_id}&tab=tasks` : 'Dashboard';
      }
    } else if (relatedType === 'project' && relatedId) {
      const projects = await base44.asServiceRole.entities.Project.filter({ id: relatedId });
      if (projects[0]) {
        ownerEmail = projects[0].created_by;
        itemTitle = projects[0].name;
        link = `Projects?id=${relatedId}`;
      }
    }

    // Don't notify if the commenter is the owner
    if (ownerEmail && ownerEmail !== data.author_email) {
      await base44.asServiceRole.functions.invoke('createNotification', {
        user_email: ownerEmail,
        title: 'תגובה חדשה',
        message: `${authorName} הגיב על "${itemTitle}"`,
        type: 'new_comment',
        priority: 'normal',
        link,
        entity_type: 'Comment',
        entity_id: commentId,
        metadata: { 
          author_name: authorName,
          related_type: relatedType,
          related_id: relatedId,
          item_title: itemTitle
        }
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in onCommentChange:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
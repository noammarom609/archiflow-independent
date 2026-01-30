import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automation handler for Proposal entity changes
 * Triggers notifications when proposals are approved/rejected
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (!data) {
      return Response.json({ success: true, message: 'No data provided' });
    }

    const proposalTitle = data.title || 'הצעת מחיר';
    const proposalId = event.entity_id;
    const projectName = data.project_name || '';

    if (event.type === 'update' && old_data) {
      // Check if status changed to approved
      if (data.status === 'approved' && old_data.status !== 'approved') {
        // Notify proposal creator
        if (data.created_by) {
          await base44.asServiceRole.functions.invoke('createNotification', {
            user_email: data.created_by,
            title: 'הצעת מחיר אושרה! 🎉',
            message: `ההצעה "${proposalTitle}"${projectName ? ` לפרויקט ${projectName}` : ''} אושרה`,
            type: 'proposal_approved',
            priority: 'high',
            link: data.project_id ? `Projects?id=${data.project_id}` : 'Dashboard',
            entity_type: 'Proposal',
            entity_id: proposalId,
            metadata: { 
              proposal_title: proposalTitle,
              project_name: projectName,
              total_amount: data.total_amount
            }
          });
        }
      }

      // Check if status changed to rejected
      if (data.status === 'rejected' && old_data.status !== 'rejected') {
        if (data.created_by) {
          await base44.asServiceRole.functions.invoke('createNotification', {
            user_email: data.created_by,
            title: 'הצעת מחיר נדחתה',
            message: `ההצעה "${proposalTitle}"${projectName ? ` לפרויקט ${projectName}` : ''} נדחתה`,
            type: 'proposal_rejected',
            priority: 'normal',
            link: data.project_id ? `Projects?id=${data.project_id}` : 'Dashboard',
            entity_type: 'Proposal',
            entity_id: proposalId,
            metadata: { 
              proposal_title: proposalTitle,
              project_name: projectName
            }
          });
        }
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in onProposalChange:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
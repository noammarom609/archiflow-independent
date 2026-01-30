import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automation handler for Consultant entity changes
 * Triggers notifications when consultants are added
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || event.type !== 'create') {
      return Response.json({ success: true, message: 'No action needed' });
    }

    const consultantName = data.name || 'יועץ';
    const consultantId = event.entity_id;

    // Notify the architect who owns this consultant
    if (data.architect_email) {
      await base44.asServiceRole.functions.invoke('createNotification', {
        user_email: data.architect_email,
        title: 'יועץ חדש נוסף',
        message: `היועץ "${consultantName}" נוסף למערכת`,
        type: 'consultant_added',
        priority: 'normal',
        link: 'People',
        entity_type: 'Consultant',
        entity_id: consultantId,
        metadata: { 
          consultant_name: consultantName,
          consultant_type: data.consultant_type
        }
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in onConsultantChange:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
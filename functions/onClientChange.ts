import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automation handler for Client entity changes
 * Triggers notifications when clients are added
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || event.type !== 'create') {
      return Response.json({ success: true, message: 'No action needed' });
    }

    const clientName = data.full_name || 'לקוח';
    const clientId = event.entity_id;

    // Notify the architect who owns this client
    if (data.architect_email) {
      await base44.asServiceRole.functions.invoke('createNotification', {
        user_email: data.architect_email,
        title: 'לקוח חדש נוסף',
        message: `הלקוח "${clientName}" נוסף למערכת`,
        type: 'client_added',
        priority: 'normal',
        link: 'People',
        entity_type: 'Client',
        entity_id: clientId,
        metadata: { 
          client_name: clientName,
          phone: data.phone
        }
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in onClientChange:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
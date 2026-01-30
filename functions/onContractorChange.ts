import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automation handler for Contractor entity changes
 * Triggers notifications when contractors are added
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || event.type !== 'create') {
      return Response.json({ success: true, message: 'No action needed' });
    }

    const contractorName = data.name || 'קבלן';
    const contractorId = event.entity_id;
    const typeLabel = data.type === 'partner' ? 'שותף' : 'קבלן';

    // Notify the architect who owns this contractor
    if (data.architect_email) {
      await base44.asServiceRole.functions.invoke('createNotification', {
        user_email: data.architect_email,
        title: `${typeLabel} חדש נוסף`,
        message: `ה${typeLabel} "${contractorName}" נוסף למערכת`,
        type: 'contractor_added',
        priority: 'normal',
        link: 'People',
        entity_type: 'Contractor',
        entity_id: contractorId,
        metadata: { 
          contractor_name: contractorName,
          specialty: data.specialty
        }
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in onContractorChange:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automation handler for Supplier entity changes
 * Triggers notifications when suppliers are added
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || event.type !== 'create') {
      return Response.json({ success: true, message: 'No action needed' });
    }

    const supplierName = data.name || 'ספק';
    const supplierId = event.entity_id;

    // Notify the architect who owns this supplier
    if (data.architect_email) {
      await base44.asServiceRole.functions.invoke('createNotification', {
        user_email: data.architect_email,
        title: 'ספק חדש נוסף',
        message: `הספק "${supplierName}" נוסף למערכת`,
        type: 'supplier_added',
        priority: 'normal',
        link: 'People',
        entity_type: 'Supplier',
        entity_id: supplierId,
        metadata: { 
          supplier_name: supplierName,
          category: data.category
        }
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in onSupplierChange:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automation handler for Invoice entity changes
 * Triggers notifications when payments are received
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (!data) {
      return Response.json({ success: true, message: 'No data provided' });
    }

    const invoiceNumber = data.invoice_number || 'חשבונית';
    const invoiceId = event.entity_id;

    if (event.type === 'update' && old_data) {
      // Check if status changed to paid
      if (data.status === 'paid' && old_data.status !== 'paid') {
        // Notify invoice creator
        if (data.created_by) {
          const amount = data.total_amount ? `₪${data.total_amount.toLocaleString()}` : '';
          
          await base44.asServiceRole.functions.invoke('createNotification', {
            user_email: data.created_by,
            title: 'תשלום התקבל! 💰',
            message: `התקבל תשלום${amount ? ` בסך ${amount}` : ''} עבור ${invoiceNumber}`,
            type: 'payment_received',
            priority: 'high',
            link: 'Financials',
            entity_type: 'Invoice',
            entity_id: invoiceId,
            metadata: { 
              invoice_number: invoiceNumber,
              amount: data.total_amount,
              client_name: data.client_name
            }
          });
        }
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in onInvoiceChange:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
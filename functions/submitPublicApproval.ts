import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' }, 
      { status: 405, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  try {
    let body = {};
    try {
        const text = await req.text();
        if (text) body = JSON.parse(text);
    } catch (e) {
        return Response.json(
            { error: 'Invalid JSON body' }, 
            { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
    }

    const { projectId, type, clientName, comments, proposalId, signatureData } = body;

    if (!projectId || !clientName) {
      return Response.json(
        { error: 'Missing required fields: projectId and clientName' }, 
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Create client from request
    const base44 = createClientFromRequest(req);

    // Fetch project to verify it exists
    const projects = await base44.asServiceRole.entities.Project.filter({ id: projectId });
    const project = projects[0];

    if (!project) {
      return Response.json(
        { error: 'Project not found' }, 
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const typeLabels = {
      sketches: 'סקיצות',
      renderings: 'הדמיות',
      technical: 'תוכניות טכניות',
      proposal: 'הצעת מחיר'
    };

    // Create signature record
    const signatureRecord = await base44.asServiceRole.entities.DocumentSignature.create({
      document_id: type === 'proposal' ? (proposalId || 'proposal') : 'approval',
      document_title: `אישור ${typeLabels[type] || type} - ${project.name}`,
      document_type: type,
      signer_id: project.client_id || 'client',
      signer_name: clientName,
      signer_role: 'client',
      signature_data: signatureData || 'digital_approval_via_email',
      timestamp: new Date().toISOString(),
      verified: true,
      project_id: String(project.id),
      ip_address: req.headers.get('x-forwarded-for') || 'N/A',
      notes: comments || `אישור ${typeLabels[type] || type} לפרויקט ${project.name}`
    });

    // If proposal, update proposal status
    if (type === 'proposal' && proposalId) {
      await base44.asServiceRole.entities.Proposal.update(proposalId, {
        status: 'approved',
        approved_date: new Date().toISOString().split('T')[0]
      });
    }

    // Update project with approval
    const updateData = {};
    updateData[`${type}_approved`] = true;
    updateData[`${type}_signature_id`] = signatureRecord.id;
    
    await base44.asServiceRole.entities.Project.update(project.id, updateData);

    // ========== SEND NOTIFICATION TO ARCHITECT ==========
    // Get the project owner (architect) to notify them
    const architectId = project.created_by || project.owner_id || project.architect_id;
    
    if (architectId) {
      // Notification titles based on type
      const notificationTitles = {
        proposal: '🎉 הצעת מחיר אושרה!',
        sketches: '✅ סקיצות אושרו!',
        renderings: '✅ הדמיות אושרו!',
        technical: '✅ תוכניות טכניות אושרו!'
      };

      const notificationBodies = {
        proposal: `${clientName} אישר/ה את הצעת המחיר לפרויקט "${project.name}"`,
        sketches: `${clientName} אישר/ה את הסקיצות לפרויקט "${project.name}"`,
        renderings: `${clientName} אישר/ה את ההדמיות לפרויקט "${project.name}"`,
        technical: `${clientName} אישר/ה את התוכניות הטכניות לפרויקט "${project.name}"`
      };

      // Create in-app notification for architect
      await base44.asServiceRole.entities.Notification.create({
        user_id: architectId,
        title: notificationTitles[type] || `אישור ${typeLabels[type]}`,
        message: notificationBodies[type] || `${clientName} אישר/ה ${typeLabels[type]} לפרויקט "${project.name}"`,
        type: `${type}_approved`,
        link: `/Projects?id=${project.id}`,
        is_read: false,
        created_date: new Date().toISOString(),
        metadata: {
          projectId: project.id,
          projectName: project.name,
          clientName: clientName,
          approvalType: type,
          signatureId: signatureRecord.id
        }
      });

      // Get architect's push subscriptions and send push notification
      try {
        const subscriptions = await base44.asServiceRole.entities.PushSubscription.filter({ 
          user_id: architectId 
        });

        if (subscriptions.length > 0) {
          // Import web-push dynamically
          const webpush = await import('npm:web-push@3.6.7');
          
          const VAPID_PUBLIC_KEY = 'BIxGERcpaEpxa4xiWw0iViM4TrB5307TgrkLTLe6fv6ysW4RNWgxFWUVIX1pk-voUv_qo_EfFuT3GqqLn7hclZY';
          const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || 'nSSz5t7ZXlQNVqVo9utmcUfxg0fL-sQEpNiD1iQluJU';
          
          webpush.setVapidDetails(
            'mailto:support@archiflow.app',
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
          );

          const payload = JSON.stringify({
            title: notificationTitles[type] || `אישור ${typeLabels[type]}`,
            body: notificationBodies[type] || `${clientName} אישר/ה ${typeLabels[type]}`,
            icon: '/archiflow-logoV2.png',
            badge: '/archiflow-logoV2.png',
            url: `/Projects?id=${project.id}`,
            tag: `${type}-approved-${project.id}`,
            requireInteraction: true
          });

          // Send to all subscriptions
          for (const sub of subscriptions) {
            try {
              await webpush.sendNotification(
                { 
                  endpoint: sub.endpoint, 
                  keys: { 
                    p256dh: sub.p256dh, 
                    auth: sub.auth 
                  } 
                },
                payload
              );
              console.log('[Push] Sent approval notification to architect');
            } catch (pushError) {
              console.error('[Push] Error sending notification:', pushError);
              // Remove expired subscriptions
              if (pushError.statusCode === 404 || pushError.statusCode === 410) {
                await base44.asServiceRole.entities.PushSubscription.delete(sub.id);
              }
            }
          }
        }
      } catch (pushError) {
        console.error('[Push] Error fetching subscriptions:', pushError);
        // Don't fail the whole request if push fails
      }

      console.log(`[Notification] Sent ${type} approval notification to architect:`, architectId);
    }
    // ========== END NOTIFICATION ==========

    return Response.json({
      success: true,
      signatureId: signatureRecord.id,
      message: 'Approval submitted successfully'
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Error in submitPublicApproval:', error);
    return Response.json(
      { error: error.message, success: false }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
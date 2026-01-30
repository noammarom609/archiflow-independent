import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { 
      status: 405, 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  }

  try {
    const { userId, userEmail, subscriptions: providedSubscriptions, title, body, url, tag, data } = await req.json();

    if (!title || !body) {
      return Response.json(
        { error: 'Missing required fields: title, body' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const base44 = createClientFromRequest(req);
    
    let subscriptions = [];
    
    // If subscriptions are provided directly, use them
    if (providedSubscriptions && Array.isArray(providedSubscriptions) && providedSubscriptions.length > 0) {
      subscriptions = providedSubscriptions.map(sub => ({
        endpoint: sub.endpoint,
        p256dh: sub.keys?.p256dh || sub.p256dh,
        auth: sub.keys?.auth || sub.auth
      }));
    } else {
      // Get user's push subscriptions from database
      let filter = { is_active: true };
      if (userEmail) {
        filter.user_email = userEmail.toLowerCase();
      } else if (userId) {
        filter.user_id = userId;
      } else {
        return Response.json(
          { error: 'Must provide userId, userEmail, or subscriptions' },
          { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
      
      subscriptions = await base44.asServiceRole.entities.PushSubscription.filter(filter);
    }

    if (subscriptions.length === 0) {
      return Response.json(
        { success: false, message: 'No active subscriptions found for user' },
        { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Configure VAPID
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('VAPID keys not configured');
      return Response.json(
        { error: 'Server configuration error' },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    webpush.setVapidDetails(
      'mailto:support@archiflow.app',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    const payload = JSON.stringify({
      title,
      body,
      icon: '/archiflow-logoV2.png',
      badge: '/archiflow-logoV2.png',
      url: url || '/',
      tag: tag || 'archiflow-notification',
      data: data || {},
      dir: 'rtl',
      lang: 'he'
    });

    let sent = 0;
    let failed = 0;
    const expiredIds = [];

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, payload);
        sent++;
        
        // Update last_used
        await base44.asServiceRole.entities.PushSubscription.update(sub.id, {
          last_used: new Date().toISOString()
        });
        
      } catch (error) {
        failed++;
        console.error('Push error:', error.statusCode, error.message);
        
        // Remove expired subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          expiredIds.push(sub.id);
          await base44.asServiceRole.entities.PushSubscription.delete(sub.id);
        }
      }
    }

    console.log(`[Push] Sent: ${sent}, Failed: ${failed}, Expired removed: ${expiredIds.length}`);

    return Response.json({
      success: true,
      sent,
      failed,
      expiredRemoved: expiredIds.length
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('sendPushNotification error:', error);
    return Response.json(
      { error: error.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
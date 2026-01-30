import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Backend function to create notifications and optionally send push notifications
 * Called by entity automations when events occur
 * 
 * Parameters:
 * - user_id: Target user ID
 * - user_email: Target user email (alternative to user_id)
 * - title: Notification title
 * - message: Notification message
 * - type: Notification type
 * - priority: low | normal | high | urgent
 * - link: Optional link to relevant page
 * - entity_type: Related entity type
 * - entity_id: Related entity ID
 * - metadata: Additional data
 * - send_push: Whether to send push notification (default: true)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const {
      user_id,
      user_email,
      title,
      message,
      type = 'general',
      priority = 'normal',
      link,
      entity_type,
      entity_id,
      metadata,
      send_push = true
    } = payload;

    if (!title || !message) {
      return Response.json({ error: 'Missing required fields: title, message' }, { status: 400 });
    }

    if (!user_id && !user_email) {
      return Response.json({ error: 'Must provide user_id or user_email' }, { status: 400 });
    }

    // Create in-app notification
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_id: user_id || user_email,
      user_email,
      title,
      message,
      type,
      priority,
      link,
      entity_type,
      entity_id,
      metadata,
      is_read: false
    });

    // Send push notification if enabled
    if (send_push && user_email) {
      try {
        // Send push via the sendPushNotification function
        await base44.asServiceRole.functions.invoke('sendPushNotification', {
          userEmail: user_email.toLowerCase(),
          title,
          body: message,
          url: link ? `/${link}` : '/',
          tag: type
        });
      } catch (pushError) {
        console.error('Failed to send push notification:', pushError);
        // Don't fail the whole operation if push fails
      }
    }

    return Response.json({ 
      success: true, 
      notification_id: notification.id 
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
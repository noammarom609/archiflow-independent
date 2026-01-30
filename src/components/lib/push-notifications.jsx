/**
 * Push Notifications utility functions
 * Handles Web Push API subscription and management
 */

import { base44 } from '@/api/base44Client';

// VAPID Public Key - must match the one used in the backend
const VAPID_PUBLIC_KEY = 'BCpBJ36HxvLa9SdBjJQJNQLdMcQ6GjqzZvEqSK8g8j6qP5d7I_2q8Pk-v5A3bA6xHmOqIbNBvPzj9yJLPD9qKm0';

/**
 * Check if push notifications are supported in this browser
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Get current permission status
 * @returns {'default' | 'granted' | 'denied'}
 */
export function getPermissionStatus() {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Check if user is currently subscribed to push
 */
export async function isSubscribed() {
  if (!isPushSupported()) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

/**
 * Convert URL-safe base64 to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications
 * @param {string} userId - User ID to associate with subscription
 */
export async function subscribeToPush(userId) {
  if (!isPushSupported()) {
    return { success: false, error: 'Push not supported in this browser' };
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Permission denied' };
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Extract keys from subscription
    const subscriptionJSON = subscription.toJSON();
    
    // Get current user email
    let userEmail = null;
    try {
      const user = await base44.auth.me();
      userEmail = user?.email?.toLowerCase();
    } catch (e) {
      console.error('Could not get user email:', e);
    }

    // Save to database
    await base44.entities.PushSubscription.create({
      user_id: userId,
      user_email: userEmail,
      endpoint: subscriptionJSON.endpoint,
      p256dh: subscriptionJSON.keys.p256dh,
      auth: subscriptionJSON.keys.auth,
      platform: 'web',
      device_name: navigator.userAgent.includes('Mobile') ? 'נייד' : 'מחשב',
      is_active: true
    });

    return { success: true, message: 'Subscribed successfully' };
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unsubscribe from push notifications
 * @param {string} userId - User ID to remove subscriptions for
 */
export async function unsubscribeFromPush(userId) {
  if (!isPushSupported()) {
    return { success: false, error: 'Push not supported' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe from browser
      await subscription.unsubscribe();

      // Remove from database - find by endpoint
      const subs = await base44.entities.PushSubscription.filter({
        endpoint: subscription.endpoint
      });
      
      for (const sub of subs) {
        await base44.entities.PushSubscription.delete(sub.id);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a test notification to the current user
 */
export async function sendTestNotification() {
  if (getPermissionStatus() !== 'granted') {
    return { success: false, error: 'Permission not granted' };
  }

  try {
    // Show a local notification
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('🔔 בדיקת התראות', {
      body: 'מעולה! התראות פועלות כמו שצריך',
      icon: '/archiflow-logoV2.png',
      badge: '/archiflow-logoV2.png',
      dir: 'rtl',
      lang: 'he',
      tag: 'test-notification',
      vibrate: [200, 100, 200]
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending test notification:', error);
    return { success: false, error: error.message };
  }
}
/**
 * PWA Push Notifications Module
 * Handles subscription, permission requests, and notification management
 */

// VAPID Public Key - generated for ArchiFlow
// ⚠️ IMPORTANT: Keep the private key secure on your server!
const VAPID_PUBLIC_KEY = 'BIxGERcpaEpxa4xiWw0iViM4TrB5307TgrkLTLe6fv6ysW4RNWgxFWUVIX1pk-voUv_qo_EfFuT3GqqLn7hclZY';

/**
 * Convert VAPID key from base64 to Uint8Array
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
 * Check if push notifications are supported
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
}

/**
 * Get current notification permission status
 * @returns {'granted' | 'denied' | 'default'}
 */
export function getPermissionStatus() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Check if user is already subscribed
 */
export async function isSubscribed() {
  if (!isPushSupported()) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    console.error('[Push] Error checking subscription:', error);
    return false;
  }
}

/**
 * Request permission and subscribe to push notifications
 * @param {string} userId - The user's ID
 * @returns {Object} Result object with success status and subscription
 */
export async function subscribeToPush(userId) {
  if (!isPushSupported()) {
    return { 
      success: false, 
      error: 'התראות Push אינן נתמכות בדפדפן זה',
      code: 'NOT_SUPPORTED'
    };
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      return { 
        success: false, 
        error: permission === 'denied' 
          ? 'ההתראות נחסמו. יש לאפשר אותן בהגדרות הדפדפן'
          : 'לא ניתנה הרשאה להתראות',
        code: 'PERMISSION_DENIED'
      };
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    // If already subscribed, return existing subscription
    if (subscription) {
      // Save/update subscription on server
      await saveSubscriptionToServer(subscription, userId);
      return { 
        success: true, 
        subscription,
        message: 'כבר רשום להתראות'
      };
    }

    // Create new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Save subscription to server
    await saveSubscriptionToServer(subscription, userId);

    console.log('[Push] Successfully subscribed:', subscription);
    
    return { 
      success: true, 
      subscription,
      message: 'נרשמת בהצלחה להתראות!'
    };
  } catch (error) {
    console.error('[Push] Subscription error:', error);
    return { 
      success: false, 
      error: 'שגיאה בהרשמה להתראות: ' + error.message,
      code: 'SUBSCRIPTION_ERROR'
    };
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(userId) {
  if (!isPushSupported()) return { success: false };

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      await removeSubscriptionFromServer(subscription.endpoint, userId);
    }

    return { success: true, message: 'בוטלה ההרשמה להתראות' };
  } catch (error) {
    console.error('[Push] Unsubscribe error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save subscription to PushSubscription entity
 */
async function saveSubscriptionToServer(subscription, userId) {
  const { archiflow } = await import('@/api/archiflow');
  
  const subscriptionJson = subscription.toJSON();
  const subscriptionData = {
    user_id: userId,
    endpoint: subscription.endpoint,
    p256dh: subscriptionJson.keys.p256dh,
    auth: subscriptionJson.keys.auth,
    is_active: true,
    last_used: new Date().toISOString()
  };

  try {
    // Check if subscription already exists
    const existing = await archiflow.entities.PushSubscription.filter({
      endpoint: subscription.endpoint
    });

    if (existing && existing.length > 0) {
      // Update existing subscription
      await archiflow.entities.PushSubscription.update(existing[0].id, {
        user_id: userId,
        is_active: true,
        last_used: new Date().toISOString()
      });
      console.log('[Push] Subscription updated');
    } else {
      // Create new subscription
      await archiflow.entities.PushSubscription.create(subscriptionData);
      console.log('[Push] Subscription saved');
    }

    // Also save to localStorage as backup
    localStorage.setItem('pushSubscription', JSON.stringify(subscriptionData));
    
    return true;
  } catch (error) {
    console.error('[Push] Error saving subscription:', error);
    // Still save locally even if server fails
    localStorage.setItem('pushSubscription', JSON.stringify(subscriptionData));
    return false;
  }
}

/**
 * Remove subscription from database
 */
async function removeSubscriptionFromServer(endpoint, userId) {
  try {
    const { archiflow } = await import('@/api/archiflow');
    
    // Find and deactivate the subscription
    const existing = await archiflow.entities.PushSubscription.filter({
      endpoint: endpoint
    });

    if (existing && existing.length > 0) {
      // Mark as inactive instead of deleting (for audit trail)
      await archiflow.entities.PushSubscription.update(existing[0].id, {
        is_active: false
      });
      console.log('[Push] Subscription deactivated');
    }
    
    localStorage.removeItem('pushSubscription');
  } catch (error) {
    console.error('[Push] Error removing subscription:', error);
  }
}

/**
 * Show a local notification (for testing or in-app notifications)
 */
export async function showLocalNotification(title, options = {}) {
  if (!isPushSupported()) return;
  
  if (Notification.permission !== 'granted') {
    console.warn('[Push] No permission for notifications');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(title, {
      icon: '/archiflow-logoV2.png',
      badge: '/archiflow-logoV2.png',
      dir: 'rtl',
      lang: 'he',
      vibrate: [100, 50, 100],
      ...options
    });
  } catch (error) {
    console.error('[Push] Error showing notification:', error);
  }
}

/**
 * Test notification - for debugging
 */
export async function sendTestNotification() {
  await showLocalNotification('בדיקת התראות ArchiFlow 🔔', {
    body: 'ההתראות עובדות! תקבל עדכונים על פרויקטים, פגישות ועוד.',
    tag: 'test-notification',
    data: {
      url: '/Dashboard'
    }
  });
}

export default {
  isPushSupported,
  getPermissionStatus,
  isSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
  showLocalNotification,
  sendTestNotification
};

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, Check, Smartphone, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  isPushSupported, 
  getPermissionStatus, 
  isSubscribed, 
  subscribeToPush, 
  unsubscribeFromPush,
  sendTestNotification 
} from '@/components/lib/push-notifications';
import { useAuth } from '@/lib/AuthContext';
import { showSuccess, showError } from '@/components/utils/notifications';
import { PWAInstallButton } from '@/components/pwa/PWAInstallPrompt';

/**
 * Floating prompt to ask users to enable push notifications
 */
export function PushNotificationPrompt({ delay = 5000 }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Don't show if not supported or already decided
    if (!isPushSupported()) return;
    
    const permission = getPermissionStatus();
    const dismissed = localStorage.getItem('pushPromptDismissed');
    
    // Only show if permission is 'default' (not yet asked) and not dismissed
    if (permission === 'default' && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [delay]);

  const handleEnable = async () => {
    setIsLoading(true);
    
    const result = await subscribeToPush(user?.id || 'anonymous');
    
    if (result.success) {
      showSuccess('🔔 התראות הופעלו! תקבל עדכונים על פרויקטים, פגישות ועוד');
      
      // Send a test notification
      setTimeout(() => {
        sendTestNotification();
      }, 1000);
    } else {
      showError('לא ניתן להפעיל התראות: ' + result.error);
    }
    
    setIsLoading(false);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pushPromptDismissed', 'true');
    setShowPrompt(false);
  };

  const handleLater = () => {
    // Will show again on next visit
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-white relative">
            <button 
              onClick={handleDismiss}
              className="absolute top-3 left-3 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-3 pr-2">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">הישאר מעודכן!</h3>
                <p className="text-white/80 text-sm">הפעל התראות ב-ArchiFlow</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-gray-600 text-sm mb-4">
              קבל התראות בזמן אמת על:
            </p>
            
            <ul className="space-y-2 mb-4">
              {[
                'אישורי הצעות מחיר מלקוחות',
                'תזכורות לפגישות',
                'עדכונים על פרויקטים',
                'הודעות חדשות'
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                onClick={handleEnable}
                disabled={isLoading}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Bell className="w-4 h-4 ml-2" />
                    הפעל התראות
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleLater}
                className="text-gray-500"
                data-testid="notification-popup-later"
              >
                אחר כך
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Toggle button for notification settings
 */
export function NotificationToggle({ className = '' }) {
  const [subscribed, setSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState('default');
  const { user } = useAuth();

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!isPushSupported()) {
      setIsLoading(false);
      return;
    }
    
    setPermission(getPermissionStatus());
    const sub = await isSubscribed();
    setSubscribed(sub);
    setIsLoading(false);
  };

  const handleToggle = async () => {
    setIsLoading(true);
    
    if (subscribed) {
      const result = await unsubscribeFromPush(user?.id);
      if (result.success) {
        setSubscribed(false);
        showSuccess('התראות כבויות - לא תקבל יותר התראות push');
      }
    } else {
      const result = await subscribeToPush(user?.id);
      if (result.success) {
        setSubscribed(true);
        setPermission('granted');
        showSuccess('🔔 התראות הופעלו! ' + result.message);
        sendTestNotification();
      } else {
        showError('שגיאה: ' + result.error);
      }
    }
    
    setIsLoading(false);
  };

  if (!isPushSupported()) {
    return (
      <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
        <BellOff className="w-4 h-4" />
        <span className="text-sm">התראות לא נתמכות בדפדפן זה</span>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className={`flex items-center gap-2 text-red-500 ${className}`}>
        <BellOff className="w-4 h-4" />
        <span className="text-sm">התראות נחסמו - יש לאפשר בהגדרות הדפדפן</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        {subscribed ? (
          <Bell className="w-5 h-5 text-primary" />
        ) : (
          <BellOff className="w-5 h-5 text-gray-400" />
        )}
        <div>
          <p className="font-medium text-gray-900">התראות Push</p>
          <p className="text-sm text-gray-500">
            {subscribed ? 'התראות מופעלות' : 'התראות כבויות'}
          </p>
        </div>
      </div>
      
      <Button
        variant={subscribed ? "outline" : "default"}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        ) : subscribed ? (
          'כבה'
        ) : (
          'הפעל'
        )}
      </Button>
    </div>
  );
}

/**
 * Full notification settings panel
 */
export function NotificationSettings() {
  const [testSent, setTestSent] = useState(false);

  const handleTestNotification = async () => {
    await sendTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* PWA Install Section */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          התקנת האפליקציה
        </h3>
        
        <PWAInstallButton />
      </div>

      <hr className="border-border" />

      {/* Push Notifications Section */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          התראות Push
        </h3>
        
        <div className="bg-muted/50 rounded-xl p-4 space-y-4">
          <NotificationToggle />
          
          <hr className="border-border" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">בדיקת התראות</p>
                <p className="text-sm text-muted-foreground">שלח התראת בדיקה למכשיר</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              disabled={testSent}
            >
              {testSent ? (
                <>
                  <Check className="w-4 h-4 ml-1" />
                  נשלח!
                </>
              ) : (
                'שלח בדיקה'
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 טיפ:</strong> התקנת האפליקציה מאפשרת קבלת התראות מלאות, 
          גישה מהירה מהמסך ועבודה גם ללא חיבור לאינטרנט.
        </p>
      </div>
    </div>
  );
}

export default PushNotificationPrompt;
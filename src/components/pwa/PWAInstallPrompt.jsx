import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Smartphone, 
  Share, 
  PlusSquare, 
  Check, 
  X,
  ChevronDown,
  Apple,
  Chrome
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Detect user's platform
 */
function getPlatform() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  
  // iOS detection
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    return 'ios';
  }
  
  // Android detection
  if (/android/i.test(ua)) {
    return 'android';
  }
  
  // Mac detection
  if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(ua)) {
    return 'mac';
  }
  
  // Windows detection
  if (/Win32|Win64|Windows|WinCE/.test(ua)) {
    return 'windows';
  }
  
  return 'other';
}

/**
 * Check if running as installed PWA
 */
function isInstalledPWA() {
  // Check display-mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // iOS Safari check
  if (window.navigator.standalone === true) {
    return true;
  }
  
  return false;
}

/**
 * Check if browser supports PWA installation
 */
function canInstallPWA() {
  // Chrome/Edge/Samsung Internet support
  if ('BeforeInstallPromptEvent' in window || window.deferredPrompt) {
    return true;
  }
  
  // iOS Safari - manual installation only
  const platform = getPlatform();
  if (platform === 'ios') {
    return true; // Can install manually
  }
  
  return true; // Most modern browsers support it
}

/**
 * PWA Install Button for Settings page
 */
export function PWAInstallButton() {
  const [platform, setPlatform] = useState('other');
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    setPlatform(getPlatform());
    setIsInstalled(isInstalledPWA());

    // Listen for beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    // For Android/Chrome - use native prompt
    if (deferredPrompt) {
      setIsInstalling(true);
      deferredPrompt.prompt();
      
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setIsInstalling(false);
      return;
    }

    // For iOS or when no prompt available - show instructions
    setShowInstructions(true);
  };

  return (
    <div className="space-y-4">
      {/* Install Button */}
      <div className={`flex items-center justify-between p-4 rounded-xl border ${
        isInstalled 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
          : 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isInstalled 
              ? 'bg-green-100 dark:bg-green-800' 
              : 'bg-primary/20'
          }`}>
            {isInstalled ? (
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <Download className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <p className={`font-medium ${isInstalled ? 'text-green-800 dark:text-green-200' : 'text-foreground'}`}>
              {isInstalled ? 'האפליקציה מותקנת!' : 'התקן את ArchiFlow'}
            </p>
            <p className={`text-sm ${isInstalled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
              {isInstalled 
                ? 'ArchiFlow פועלת כאפליקציה על המכשיר שלך'
                : platform === 'ios' 
                  ? 'הוסף למסך הבית לחוויה מלאה' 
                  : 'התקן כאפליקציה על המכשיר'}
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleInstallClick}
          disabled={isInstalling || isInstalled}
          className={isInstalled 
            ? 'bg-green-600 hover:bg-green-600 cursor-not-allowed opacity-80' 
            : 'bg-primary hover:bg-primary/90'}
        >
          {isInstalling ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isInstalled ? (
            <>
              <Check className="w-4 h-4 ml-2" />
              מותקן
            </>
          ) : (
            <>
              <Download className="w-4 h-4 ml-2" />
              התקן
            </>
          )}
        </Button>
      </div>

      {/* Instructions Panel */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-primary/30 overflow-hidden">
              <CardContent className="p-0">
                {/* Header */}
                <div className="bg-primary/10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {platform === 'ios' ? (
                      <Apple className="w-5 h-5 text-primary" />
                    ) : (
                      <Chrome className="w-5 h-5 text-primary" />
                    )}
                    <span className="font-medium text-foreground">
                      {platform === 'ios' ? 'הוראות התקנה ל-iPhone/iPad' : 'הוראות התקנה'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowInstructions(false)}
                    className="p-1 hover:bg-primary/20 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* iOS Instructions */}
                {platform === 'ios' && (
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      בצע את השלבים הבאים להתקנת האפליקציה:
                    </p>
                    
                    <div className="space-y-3">
                      {/* Step 1 */}
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          1
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">לחץ על כפתור השיתוף</p>
                          <p className="text-sm text-muted-foreground">
                            בתחתית המסך ב-Safari (ריבוע עם חץ למעלה)
                          </p>
                          <div className="mt-2 flex items-center justify-center p-3 bg-background rounded-lg border">
                            <Share className="w-8 h-8 text-blue-500" />
                          </div>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          2
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">גלול ובחר "הוסף למסך הבית"</p>
                          <p className="text-sm text-muted-foreground">
                            Add to Home Screen
                          </p>
                          <div className="mt-2 flex items-center gap-3 p-3 bg-background rounded-lg border">
                            <PlusSquare className="w-6 h-6 text-gray-600" />
                            <span className="text-sm">הוסף למסך הבית</span>
                          </div>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          3
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">לחץ "הוסף"</p>
                          <p className="text-sm text-muted-foreground">
                            האפליקציה תופיע במסך הבית שלך!
                          </p>
                          <div className="mt-2 flex items-center justify-end">
                            <span className="text-blue-500 font-medium">הוסף</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tip */}
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>💡 חשוב:</strong> וודא שאתה גולש דרך Safari. 
                        התקנה לא תעבוד מ-Chrome או דפדפנים אחרים ב-iPhone.
                      </p>
                    </div>
                  </div>
                )}

                {/* Android/Desktop Instructions */}
                {platform !== 'ios' && (
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      בצע את השלבים הבאים להתקנת האפליקציה:
                    </p>
                    
                    <div className="space-y-3">
                      {/* Step 1 */}
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          1
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">פתח את תפריט הדפדפן</p>
                          <p className="text-sm text-muted-foreground">
                            לחץ על שלוש הנקודות (⋮) בפינה העליונה
                          </p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          2
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">בחר "התקן אפליקציה" או "הוסף למסך הבית"</p>
                          <p className="text-sm text-muted-foreground">
                            Install app / Add to Home screen
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          3
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">אשר את ההתקנה</p>
                          <p className="text-sm text-muted-foreground">
                            האפליקציה תותקן ותופיע כמו אפליקציה רגילה!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Benefits - Show only when not installed */}
      {!isInstalled && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Check className="w-4 h-4 text-green-500" />
            <span>גישה מהירה מהמסך</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Check className="w-4 h-4 text-green-500" />
            <span>התראות Push</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Check className="w-4 h-4 text-green-500" />
            <span>עובד גם אופליין</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Check className="w-4 h-4 text-green-500" />
            <span>חוויה כמו אפליקציה</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PWAInstallButton;

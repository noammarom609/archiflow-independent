import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

/**
 * Initialize Capacitor plugins for native apps
 */
export async function initCapacitor() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Capacitor] Running in web mode');
    return;
  }

  console.log('[Capacitor] Running in native mode:', Capacitor.getPlatform());

  try {
    // Hide splash screen after app loads
    await SplashScreen.hide();

    // Set status bar style
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#984E39' });
    }
    await StatusBar.setStyle({ style: Style.Dark });

    // Setup keyboard listeners
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.setProperty('--keyboard-height', '0px');
    });

    // Setup back button handler for Android
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('[Capacitor] App state changed, active:', isActive);
    });

    console.log('[Capacitor] Initialized successfully');
  } catch (error) {
    console.error('[Capacitor] Initialization error:', error);
  }
}

/**
 * Trigger haptic feedback
 * @param {'light' | 'medium' | 'heavy'} style - Impact style
 */
export async function haptic(style = 'light') {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const impactStyle = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy
    }[style] || ImpactStyle.Light;

    await Haptics.impact({ style: impactStyle });
  } catch (error) {
    console.error('[Capacitor] Haptic error:', error);
  }
}

/**
 * Share content using native share dialog
 * @param {Object} options - Share options
 * @param {string} options.title - Share title
 * @param {string} options.text - Share text
 * @param {string} options.url - Share URL
 */
export async function shareContent({ title, text, url }) {
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title, text, url });
    } else if (navigator.share) {
      await navigator.share({ title, text, url });
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url || text);
      return { copied: true };
    }
    return { shared: true };
  } catch (error) {
    console.error('[Share] Error:', error);
    return { error };
  }
}

/**
 * Show/hide status bar
 */
export async function setStatusBarVisible(visible) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (visible) {
      await StatusBar.show();
    } else {
      await StatusBar.hide();
    }
  } catch (error) {
    console.error('[StatusBar] Error:', error);
  }
}

/**
 * Set status bar color (Android only)
 */
export async function setStatusBarColor(color) {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;

  try {
    await StatusBar.setBackgroundColor({ color });
  } catch (error) {
    console.error('[StatusBar] Error setting color:', error);
  }
}

/**
 * Check if running as native app
 */
export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

/**
 * Get current platform
 */
export function getPlatform() {
  return Capacitor.getPlatform();
}

export default {
  initCapacitor,
  haptic,
  shareContent,
  setStatusBarVisible,
  setStatusBarColor,
  isNativeApp,
  getPlatform
};

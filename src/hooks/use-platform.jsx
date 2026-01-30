import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook to detect the current platform
 * @returns {Object} Platform information
 */
export function usePlatform() {
  const [platform, setPlatform] = useState({
    isNative: false,
    isAndroid: false,
    isIOS: false,
    isWeb: true,
    isPWA: false,
    platform: 'web'
  });

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    const currentPlatform = Capacitor.getPlatform();
    
    // Check if running as PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone === true;

    setPlatform({
      isNative,
      isAndroid: currentPlatform === 'android',
      isIOS: currentPlatform === 'ios',
      isWeb: currentPlatform === 'web',
      isPWA,
      platform: currentPlatform
    });
  }, []);

  return platform;
}

/**
 * Hook to check if safe area insets should be applied (for iOS notch)
 */
export function useSafeArea() {
  const { isIOS, isNative } = usePlatform();
  
  return {
    shouldApplySafeArea: isIOS && isNative,
    safeAreaClass: isIOS && isNative ? 'safe-area-inset' : ''
  };
}

export default usePlatform;

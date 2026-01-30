import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.archiflow.app',
  appName: 'ArchiFlow',
  webDir: 'dist',
  
  // Server configuration
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // For development, uncomment the following:
    // url: 'http://YOUR_LOCAL_IP:5173',
    // cleartext: true
  },
  
  // Plugin configurations
  plugins: {
    // Splash Screen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#F7F5F2',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    
    // Status Bar
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#984E39'
    },
    
    // Keyboard
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    
    // Push Notifications (for future use)
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    
    // Local Notifications
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#984E39'
    }
  },
  
  // Android specific configurations
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true // Set to false in production
  },
  
  // iOS specific configurations
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scrollEnabled: true
  }
};

export default config;

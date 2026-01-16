import { Capacitor } from '@capacitor/core';

// Check if running on mobile
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform();
};

// Get platform
export const getPlatform = () => {
  if (typeof window === 'undefined') return 'web';
  return Capacitor.getPlatform(); // 'ios', 'android', or 'web'
};

// Haptic feedback (lazy loaded)
export const hapticImpact = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  if (isMobile()) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      const styleMap = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: styleMap[style] });
    } catch (error) {
      console.log('Haptics not available:', error);
    }
  }
};

// Share content
export const shareContent = async (title: string, text: string, url?: string) => {
  if (isMobile()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title,
        text,
        url,
        dialogTitle: 'Share with friends',
      });
    } catch (error) {
      console.log('Share not available:', error);
    }
  } else {
    // Fallback for web
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        console.log('Web share not available:', error);
      }
    }
  }
};

// Set status bar (iOS)
export const setStatusBar = async (style: 'light' | 'dark' = 'dark') => {
  if (isMobile() && getPlatform() === 'ios') {
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ 
        style: style === 'dark' ? Style.Dark : Style.Light 
      });
    } catch (error) {
      console.log('StatusBar not available:', error);
    }
  }
};

// Check if app is installed (for deep linking)
export const isAppInstalled = () => {
  return isMobile();
};

// Get app version
export const getAppVersion = async () => {
  if (isMobile()) {
    try {
      const { App } = await import('@capacitor/app');
      const info = await App.getInfo();
      return info.version;
    } catch (error) {
      console.log('App info not available:', error);
      return '1.0.0';
    }
  }
  return '1.0.0';
};

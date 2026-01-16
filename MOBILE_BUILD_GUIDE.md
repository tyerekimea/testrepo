# Mobile Build Guide - Definition Detective

## Overview

This guide will help you build native iOS and Android apps for Definition Detective using Capacitor.

---

## Prerequisites

### For Both Platforms
- Node.js 18+ installed
- Git installed
- Your app code ready

### For Android
- Android Studio installed
- Java JDK 17+ installed
- Android SDK installed

### For iOS (Mac only)
- macOS computer
- Xcode 14+ installed
- CocoaPods installed
- Apple Developer account ($99/year)

---

## Step 1: Install Capacitor Dependencies

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npm install @capacitor/app @capacitor/splash-screen @capacitor/status-bar
npm install @capacitor/keyboard @capacitor/haptics @capacitor/share
```

---

## Step 2: Update Capacitor Configuration

Update `capacitor.config.json`:

```json
{
  "appId": "com.definitiondetective.app",
  "appName": "Definition Detective",
  "webDir": "out",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#673AB7",
      "showSpinner": false
    },
    "StatusBar": {
      "style": "dark",
      "backgroundColor": "#673AB7"
    },
    "Keyboard": {
      "resize": "body",
      "style": "dark"
    }
  }
}
```

---

## Step 3: Update Next.js Configuration

Update `next.config.ts` for static export:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export', // Enable static export
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true, // Better for mobile
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*.firebase.studio",
        "localhost:9003",
        "*.app.github.dev",
        "*.github.dev",
      ],
    },
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
```

---

## Step 4: Build the Web App

```bash
# Build the Next.js app for production
npm run build

# This creates the 'out' directory with static files
```

---

## Step 5: Add Mobile Platforms

### Add Android
```bash
npx cap add android
```

### Add iOS (Mac only)
```bash
npx cap add ios
```

---

## Step 6: Sync Web Assets to Mobile

```bash
# Copy web assets to native projects
npx cap sync

# Or sync specific platform
npx cap sync android
npx cap sync ios
```

---

## Step 7: Build for Android

### Open in Android Studio
```bash
npx cap open android
```

### In Android Studio:

1. **Wait for Gradle sync** to complete
2. **Select device/emulator** from dropdown
3. **Click Run** (green play button)

### Build APK (Debug)
1. Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
2. APK will be in `android/app/build/outputs/apk/debug/`

### Build AAB (Release - for Play Store)
1. Go to **Build** > **Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Create or select keystore
4. Choose **release** build variant
5. AAB will be in `android/app/build/outputs/bundle/release/`

---

## Step 8: Build for iOS (Mac only)

### Open in Xcode
```bash
npx cap open ios
```

### In Xcode:

1. **Select your team** in Signing & Capabilities
2. **Select device/simulator** from dropdown
3. **Click Run** (play button)

### Build for TestFlight/App Store
1. Select **Any iOS Device** as target
2. Go to **Product** > **Archive**
3. Once archived, click **Distribute App**
4. Follow wizard to upload to App Store Connect

---

## Step 9: Configure App Icons and Splash Screens

### Generate Icons

Use a tool like https://icon.kitchen/ or create manually:

**Android:**
- Place icons in `android/app/src/main/res/mipmap-*/`
- Sizes: 48x48, 72x72, 96x96, 144x144, 192x192

**iOS:**
- Place icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Sizes: 20x20 to 1024x1024 (various scales)

### Generate Splash Screens

**Android:**
- Place in `android/app/src/main/res/drawable/`
- Create `splash.png` (2732x2732px recommended)

**iOS:**
- Place in `ios/App/App/Assets.xcassets/Splash.imageset/`
- Create `splash.png` (2732x2732px recommended)

---

## Step 10: Configure Permissions

### Android Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Internet permission for API calls -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- Network state for connectivity checks -->
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Vibration for haptic feedback -->
    <uses-permission android:name="android.permission.VIBRATE" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        <!-- Activities here -->
    </application>
</manifest>
```

### iOS Permissions

Edit `ios/App/App/Info.plist` if needed:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access for profile pictures</string>
```

---

## Step 11: Add Mobile-Specific Features

### Create Mobile Utilities

Create `src/lib/mobile.ts`:

```typescript
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';

// Check if running on mobile
export const isMobile = () => {
  return Capacitor.isNativePlatform();
};

// Get platform
export const getPlatform = () => {
  return Capacitor.getPlatform(); // 'ios', 'android', or 'web'
};

// Haptic feedback
export const hapticImpact = async (style: ImpactStyle = ImpactStyle.Medium) => {
  if (isMobile()) {
    await Haptics.impact({ style });
  }
};

// Share content
export const shareContent = async (title: string, text: string, url?: string) => {
  if (isMobile()) {
    await Share.share({
      title,
      text,
      url,
      dialogTitle: 'Share with friends',
    });
  } else {
    // Fallback for web
    if (navigator.share) {
      await navigator.share({ title, text, url });
    }
  }
};

// Set status bar
export const setStatusBar = async (style: Style = Style.Dark) => {
  if (isMobile() && getPlatform() === 'ios') {
    await StatusBar.setStyle({ style });
  }
};
```

### Update Game Component

Add haptic feedback to `src/app/page.tsx`:

```typescript
import { hapticImpact } from '@/lib/mobile';
import { ImpactStyle } from '@capacitor/haptics';

// In handleGuess function
const handleGuess = useCallback((letter: string) => {
  // ... existing code ...
  
  if (wordData?.word.toLowerCase().includes(lowerLetter)) {
    setGuessedLetters(prev => ({ ...prev, correct: [...prev.correct, lowerLetter] }));
    playSound('correct');
    hapticImpact(ImpactStyle.Light); // Add haptic feedback
  } else {
    setGuessedLetters(prev => ({ ...prev, incorrect: [...prev.incorrect, lowerLetter] }));
    playSound('incorrect');
    hapticImpact(ImpactStyle.Heavy); // Add haptic feedback
  }
}, [wordData, gameState, guessedLetters, playSound, revealedByHint]);
```

---

## Step 12: Test on Real Devices

### Android Testing

**Via USB:**
1. Enable Developer Options on Android device
2. Enable USB Debugging
3. Connect device via USB
4. Run from Android Studio

**Via APK:**
1. Build debug APK
2. Transfer to device
3. Install and test

### iOS Testing

**Via Xcode:**
1. Connect iPhone via USB
2. Select device in Xcode
3. Click Run

**Via TestFlight:**
1. Archive and upload to App Store Connect
2. Add testers in TestFlight
3. Testers install via TestFlight app

---

## Step 13: Optimize for Mobile

### Update Package.json Scripts

Add mobile build scripts:

```json
{
  "scripts": {
    "dev": "next dev --port 9003 --hostname 0.0.0.0",
    "build": "next build",
    "build:mobile": "next build && npx cap sync",
    "android": "npx cap open android",
    "ios": "npx cap open ios",
    "sync": "npx cap sync",
    "sync:android": "npx cap sync android",
    "sync:ios": "npx cap sync ios"
  }
}
```

### Mobile-Specific CSS

Add to `src/app/globals.css`:

```css
/* Mobile-specific styles */
@media (max-width: 768px) {
  /* Prevent zoom on input focus */
  input, select, textarea {
    font-size: 16px !important;
  }
  
  /* Safe area for notched devices */
  .safe-area-top {
    padding-top: env(safe-area-inset-top);
  }
  
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
}

/* iOS specific */
@supports (-webkit-touch-callout: none) {
  /* iOS styles */
  body {
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
}
```

---

## Step 14: App Store Preparation

### Android - Google Play Store

**Requirements:**
- App Bundle (AAB) file
- App icon (512x512px)
- Feature graphic (1024x500px)
- Screenshots (phone and tablet)
- Privacy policy URL
- App description
- Google Play Developer account ($25 one-time)

**Steps:**
1. Create app in Google Play Console
2. Upload AAB file
3. Add store listing details
4. Set pricing (free or paid)
5. Submit for review

### iOS - Apple App Store

**Requirements:**
- IPA file (from Xcode archive)
- App icon (1024x1024px)
- Screenshots (various iPhone sizes)
- Privacy policy URL
- App description
- Apple Developer account ($99/year)

**Steps:**
1. Create app in App Store Connect
2. Upload build via Xcode
3. Add app information
4. Add screenshots
5. Submit for review

---

## Step 15: Update for Mobile Payments

### Paystack Mobile SDK

For better mobile experience, consider using Paystack's mobile SDKs:

**Android:**
```gradle
// In android/app/build.gradle
dependencies {
    implementation 'co.paystack.android:paystack:3.1.3'
}
```

**iOS:**
```ruby
# In ios/App/Podfile
pod 'Paystack'
```

Or continue using the web-based payment flow (works on mobile too).

---

## Troubleshooting

### Common Issues

**Build fails on Android:**
- Check Java version: `java -version` (should be 17+)
- Update Gradle: Edit `android/build.gradle`
- Clear cache: `cd android && ./gradlew clean`

**Build fails on iOS:**
- Update CocoaPods: `pod repo update`
- Clean build: Xcode > Product > Clean Build Folder
- Check signing: Verify team and certificates

**App crashes on launch:**
- Check logs: `npx cap run android -l` or Xcode console
- Verify all plugins are installed
- Check for missing permissions

**White screen on mobile:**
- Verify `output: 'export'` in next.config.ts
- Check that `out` directory exists after build
- Run `npx cap sync` after building

---

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Build web app
npm run build

# Sync to mobile
npx cap sync

# Open in IDE
npx cap open android
npx cap open ios

# Run on device
npx cap run android
npx cap run ios

# Update plugins
npm update @capacitor/core @capacitor/cli
npx cap sync
```

---

## App Store Optimization (ASO)

### Keywords
- Word puzzle game
- Vocabulary game
- Definition game
- Word detective
- Educational game
- Brain training
- Word guessing game

### Description Template

**Short Description:**
Test your vocabulary! Guess words from their definitions in this addictive word puzzle game.

**Full Description:**
Definition Detective is the ultimate word puzzle game that challenges your vocabulary and deduction skills!

🎯 HOW TO PLAY
- Read the definition
- Guess the word letter by letter
- Use hints when you're stuck
- Progress through difficulty levels

✨ FEATURES
- Unlimited word puzzles
- AI-powered hints
- Multiple difficulty levels
- Track your progress
- Compete on leaderboards
- No ads (Premium)

🏆 PERFECT FOR
- Word game enthusiasts
- Students improving vocabulary
- Anyone who loves puzzles
- Brain training

Download now and become a Definition Detective!

---

## Performance Optimization

### Reduce App Size

1. **Enable ProGuard (Android):**
```gradle
// In android/app/build.gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

2. **Optimize Images:**
- Use WebP format
- Compress images
- Use appropriate sizes

3. **Code Splitting:**
- Already handled by Next.js
- Lazy load components

---

## Monetization on Mobile

### In-App Purchases (IAP)

Consider implementing native IAP for better conversion:

**Android:**
- Google Play Billing Library
- Better than web payments on Android

**iOS:**
- StoreKit
- Required for iOS apps (Apple's 30% cut)

**Or continue with Paystack:**
- Works on mobile browsers
- No app store fees
- Easier implementation

---

## Analytics and Monitoring

### Recommended Tools

1. **Firebase Analytics** (Free)
2. **Crashlytics** (Crash reporting)
3. **Google Analytics** (User behavior)
4. **Sentry** (Error tracking)

### Add Firebase

```bash
npm install @capacitor-firebase/analytics
npx cap sync
```

---

## Next Steps

1. ✅ Install Capacitor dependencies
2. ✅ Update configuration files
3. ✅ Build web app
4. ✅ Add mobile platforms
5. ✅ Test on emulators
6. ✅ Test on real devices
7. ✅ Prepare store assets
8. ✅ Submit to app stores

---

## Support Resources

- **Capacitor Docs:** https://capacitorjs.com/docs
- **Android Studio:** https://developer.android.com/studio
- **Xcode:** https://developer.apple.com/xcode/
- **Google Play Console:** https://play.google.com/console
- **App Store Connect:** https://appstoreconnect.apple.com/

---

**Ready to build your mobile app!** 📱

Start with Step 1 and work through the guide. You'll have native iOS and Android apps within a few hours!

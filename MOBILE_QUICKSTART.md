# Mobile Build - Quick Start Guide

## 🚀 Build Your Mobile App in 30 Minutes

This quick guide will get you from web app to mobile app fast!

---

## Prerequisites

### For Android
- ✅ Android Studio installed
- ✅ Java JDK 17+ installed

### For iOS (Mac only)
- ✅ macOS computer
- ✅ Xcode 14+ installed
- ✅ CocoaPods installed

---

## Quick Setup (5 Commands)

```bash
# 1. Install Capacitor dependencies
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/app @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard @capacitor/haptics @capacitor/share

# 2. Build the web app
npm run build

# 3. Add Android platform
npx cap add android

# 4. Add iOS platform (Mac only)
npx cap add ios

# 5. Sync web assets to mobile
npx cap sync
```

---

## Build for Android

### Option 1: Quick Test (Debug APK)

```bash
# Open in Android Studio
npm run android

# In Android Studio:
# 1. Wait for Gradle sync
# 2. Click Run (green play button)
# 3. App installs on emulator/device
```

### Option 2: Release Build (Play Store)

```bash
# Open Android Studio
npm run android

# In Android Studio:
# 1. Build > Generate Signed Bundle / APK
# 2. Select "Android App Bundle"
# 3. Create/select keystore
# 4. Choose "release" variant
# 5. AAB file ready for Play Store!
```

---

## Build for iOS (Mac Only)

### Option 1: Quick Test

```bash
# Open in Xcode
npm run ios

# In Xcode:
# 1. Select your team (Signing & Capabilities)
# 2. Select device/simulator
# 3. Click Run (play button)
```

### Option 2: Release Build (App Store)

```bash
# Open Xcode
npm run ios

# In Xcode:
# 1. Select "Any iOS Device"
# 2. Product > Archive
# 3. Distribute App
# 4. Upload to App Store Connect
```

---

## Update After Code Changes

```bash
# 1. Rebuild web app
npm run build

# 2. Sync to mobile
npm run sync

# 3. Reopen in IDE
npm run android  # or npm run ios
```

---

## Common Issues & Fixes

### Issue: "webDir not found"
**Fix:**
```bash
npm run build  # Make sure 'out' directory exists
```

### Issue: Android build fails
**Fix:**
```bash
cd android
./gradlew clean
cd ..
npm run sync:android
```

### Issue: iOS build fails
**Fix:**
```bash
cd ios/App
pod repo update
pod install
cd ../..
npm run sync:ios
```

### Issue: White screen on mobile
**Fix:**
1. Uncomment these lines in `next.config.ts`:
```typescript
output: 'export',
images: { unoptimized: true },
trailingSlash: true,
```
2. Rebuild: `npm run build && npm run sync`

---

## App Store Submission

### Android - Google Play Store

**What you need:**
- AAB file (from Android Studio)
- App icon (512x512px)
- Screenshots
- Privacy policy URL
- $25 one-time fee

**Steps:**
1. Create app at https://play.google.com/console
2. Upload AAB
3. Add store listing
4. Submit for review

### iOS - Apple App Store

**What you need:**
- IPA file (from Xcode)
- App icon (1024x1024px)
- Screenshots
- Privacy policy URL
- $99/year fee

**Steps:**
1. Create app at https://appstoreconnect.apple.com
2. Upload build via Xcode
3. Add app information
4. Submit for review

---

## Testing Checklist

Before submitting to stores:

- [ ] App launches successfully
- [ ] All features work offline (if applicable)
- [ ] Payments work (test mode)
- [ ] No crashes or errors
- [ ] Proper app icon shows
- [ ] Splash screen displays
- [ ] Keyboard works properly
- [ ] Back button works (Android)
- [ ] Permissions requested properly
- [ ] Links open correctly
- [ ] Share functionality works

---

## App Size Optimization

### Reduce APK/AAB Size

1. **Enable ProGuard:**
```gradle
// In android/app/build.gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
    }
}
```

2. **Optimize images:**
- Use WebP format
- Compress images
- Remove unused assets

3. **Expected sizes:**
- Android APK: 15-30 MB
- Android AAB: 10-20 MB
- iOS IPA: 20-40 MB

---

## Mobile-Specific Features

### Add Haptic Feedback

```typescript
import { hapticImpact } from '@/lib/mobile';

// Light tap
hapticImpact('light');

// Medium tap
hapticImpact('medium');

// Heavy tap
hapticImpact('heavy');
```

### Add Share Functionality

```typescript
import { shareContent } from '@/lib/mobile';

await shareContent(
  'Definition Detective',
  'Check out this awesome word game!',
  'https://definitiondetective.com'
);
```

### Check if Mobile

```typescript
import { isMobile, getPlatform } from '@/lib/mobile';

if (isMobile()) {
  console.log('Running on mobile');
  console.log('Platform:', getPlatform()); // 'ios' or 'android'
}
```

---

## Performance Tips

### 1. Optimize Images
```typescript
// Use Next.js Image with unoptimized flag
<Image 
  src="/icon.png" 
  alt="Icon"
  width={100}
  height={100}
  unoptimized
/>
```

### 2. Lazy Load Components
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>
});
```

### 3. Reduce Bundle Size
- Remove unused dependencies
- Use tree-shaking
- Code splitting (automatic with Next.js)

---

## Monetization on Mobile

### Option 1: Continue with Paystack (Easiest)
- Works in mobile browsers
- No app store fees
- Already implemented ✅

### Option 2: Native In-App Purchases
- Google Play Billing (Android)
- StoreKit (iOS)
- App stores take 15-30% cut
- More complex implementation

**Recommendation:** Start with Paystack, add IAP later if needed.

---

## Analytics & Monitoring

### Add Firebase Analytics

```bash
npm install @capacitor-firebase/analytics
npx cap sync
```

### Track Events

```typescript
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';

// Track game completed
await FirebaseAnalytics.logEvent({
  name: 'game_completed',
  params: {
    level: 5,
    score: 100,
  },
});
```

---

## Next Steps

### Week 1: Build & Test
- [ ] Install dependencies
- [ ] Build for Android
- [ ] Test on emulator
- [ ] Test on real device

### Week 2: Polish & Prepare
- [ ] Add app icons
- [ ] Add splash screens
- [ ] Test all features
- [ ] Create screenshots

### Week 3: Submit
- [ ] Create Play Store listing
- [ ] Submit to Google Play
- [ ] Create App Store listing (if iOS)
- [ ] Submit to Apple (if iOS)

### Week 4: Launch
- [ ] App approved
- [ ] Publish to stores
- [ ] Market your app
- [ ] Monitor reviews

---

## Support & Resources

### Documentation
- **Full Guide:** MOBILE_BUILD_GUIDE.md
- **Capacitor Docs:** https://capacitorjs.com/docs
- **Android Docs:** https://developer.android.com
- **iOS Docs:** https://developer.apple.com

### Tools
- **Android Studio:** https://developer.android.com/studio
- **Xcode:** https://developer.apple.com/xcode/
- **Icon Generator:** https://icon.kitchen/
- **Screenshot Tool:** https://www.screely.com/

### Communities
- **Capacitor Discord:** https://discord.gg/UPYYRhtyzp
- **Stack Overflow:** Tag with `capacitor`
- **GitHub Issues:** https://github.com/ionic-team/capacitor

---

## Quick Commands Reference

```bash
# Development
npm run dev                 # Start web dev server
npm run build              # Build web app
npm run build:mobile       # Build and sync to mobile

# Mobile platforms
npm run android            # Open Android Studio
npm run ios                # Open Xcode
npm run sync               # Sync web to mobile
npm run sync:android       # Sync to Android only
npm run sync:ios           # Sync to iOS only

# Testing
npm test                   # Run tests
npm run lint               # Lint code
npm run typecheck          # Check TypeScript
```

---

## Pricing for App Stores

### Google Play Store
- **Developer Account:** $25 (one-time)
- **App Submission:** Free
- **Review Time:** 1-3 days
- **Commission:** 15-30% on IAP

### Apple App Store
- **Developer Account:** $99/year
- **App Submission:** Free
- **Review Time:** 1-7 days
- **Commission:** 15-30% on IAP

---

## Success Metrics

### Target Downloads (Year 1)
- Month 1: 100-500 downloads
- Month 6: 1,000-5,000 downloads
- Month 12: 10,000-50,000 downloads

### Target Revenue (Year 1)
- Month 1: ₦50,000 (~$60)
- Month 6: ₦500,000 (~$625)
- Month 12: ₦2,000,000 (~$2,500)

---

## 🎉 You're Ready!

Everything is set up for mobile:

✅ Capacitor configured  
✅ Mobile utilities created  
✅ Build scripts added  
✅ Complete guide available  

**Start building now:**
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npm run build
npx cap add android
npm run android
```

Your mobile app will be ready in 30 minutes! 📱🚀

---

**Last Updated:** 2026-01-01  
**Status:** Ready to Build  
**Estimated Time:** 30 minutes to first build

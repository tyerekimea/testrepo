# Firebase Error Fix

## Issue
You encountered this error:
```
Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)
```

## Root Cause
The Firebase configuration in `src/firebase/config.ts` had hardcoded placeholder values:
```javascript
apiKey: "API_KEY",
projectId: "PROJECT_ID",
// etc...
```

These placeholders were being used instead of actual Firebase credentials.

## Solution Applied

### 1. Updated Firebase Configuration
Modified `src/firebase/config.ts` to:
- Read from environment variables (`NEXT_PUBLIC_FIREBASE_*`)
- Support JSON config format (`FIREBASE_CONFIG`)
- Provide helpful warnings when not configured
- Allow the app to work without Firebase

### 2. Created Setup Documentation
- Added comprehensive `FIREBASE_SETUP.md` guide
- Updated `.env.example` with Firebase options
- Updated README with troubleshooting section

## Two Ways to Use the App

### Option A: Play Without Firebase (Quick Start)
The game's core functionality works without Firebase:
- ✅ Word generation
- ✅ Gameplay mechanics
- ✅ Hints (AI-powered)
- ✅ Visual clues
- ❌ User accounts
- ❌ Score persistence
- ❌ Leaderboards

**Just ignore the Firebase errors in the console and play!**

### Option B: Full Features with Firebase
To enable user accounts, scores, and leaderboards:

1. **Create a Firebase project** at https://console.firebase.google.com/

2. **Get your Firebase config** from Project Settings

3. **Add to `.env.local`:**
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

4. **Restart the dev server:**
   ```bash
   npm run dev
   ```

For detailed setup instructions, see **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**

## Current Status

✅ **Fixed:** Firebase configuration now reads from environment variables  
✅ **Fixed:** App works without Firebase (core gameplay)  
✅ **Added:** Comprehensive setup documentation  
✅ **Added:** Clear error messages and warnings  

## What You Can Do Now

### Play Immediately (No Firebase)
Just use the app as-is. The Firebase errors won't affect gameplay.

### Set Up Firebase Later
When you're ready for full features:
1. Follow the guide in `FIREBASE_SETUP.md`
2. Configure your `.env.local`
3. Restart the server
4. Enjoy user accounts, scores, and leaderboards!

---

**Branch:** fix/firebase-configuration (merged to main)  
**Status:** ✅ Complete  
**Date:** 2026-01-01

# Firebase Setup Guide

## Overview

Definition Detective uses Firebase for:
- **Authentication** - User login/signup
- **Firestore** - User profiles, scores, and leaderboards
- **Cloud Functions** - Server-side operations

## Quick Start (Play Without Firebase)

The game's core functionality (word generation, gameplay) works without Firebase. However, you won't have:
- User accounts
- Score persistence
- Leaderboards
- Hint purchases

To play without Firebase, just ignore the Firebase errors in the console.

---

## Full Setup (With Firebase Features)

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "definition-detective")
4. Follow the setup wizard

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method
4. (Optional) Enable other providers (Google, Facebook, etc.)

### Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (for development)
4. Select a location close to your users

### Step 4: Get Your Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname
5. Copy the `firebaseConfig` object

### Step 5: Configure Your App

#### Option A: Using Individual Environment Variables (Recommended)

Edit your `.env.local` file:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### Option B: Using JSON Config (For Firebase App Hosting)

```bash
FIREBASE_CONFIG={"projectId":"your-project-id","apiKey":"AIzaSyXXX...","authDomain":"your-project-id.firebaseapp.com","storageBucket":"your-project-id.appspot.com","messagingSenderId":"123456789012","appId":"1:123456789012:web:abcdef123456"}
```

### Step 6: Set Up Firestore Security Rules

In Firebase Console, go to **Firestore Database** > **Rules** and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - users can read all, but only write their own
    match /userProfiles/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Leaderboard - read-only for all users
    match /leaderboard/{entry} {
      allow read: if true;
      allow write: if false; // Only server can write
    }
  }
}
```

Click **Publish** to save the rules.

### Step 7: Initialize Firestore Collections

The app will automatically create user profiles when users sign up. However, you can manually create the collections:

1. Go to **Firestore Database**
2. Click "Start collection"
3. Collection ID: `userProfiles`
4. Add a test document (optional)

### Step 8: Restart Your App

```bash
npm run dev
```

---

## Firestore Data Structure

### User Profiles Collection: `userProfiles`

```javascript
{
  id: "user-uid",
  username: "PlayerName",
  email: "user@example.com",
  totalScore: 0,
  highestLevel: 1,
  rank: "Rookie Detective",
  hints: 5,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Leaderboard Collection: `leaderboard`

```javascript
{
  userId: "user-uid",
  username: "PlayerName",
  score: 1000,
  rank: "Master Detective",
  updatedAt: Timestamp
}
```

---

## Troubleshooting

### Error: "Firebase: Error (auth/api-key-not-valid)"

**Cause:** Firebase API key is not configured or invalid.

**Solution:**
1. Check that `NEXT_PUBLIC_FIREBASE_API_KEY` is set in `.env.local`
2. Verify the API key is correct in Firebase Console
3. Make sure the API key has no extra spaces or quotes
4. Restart your dev server after changing `.env.local`

### Error: "Firebase: Error (auth/project-not-found)"

**Cause:** Project ID is incorrect or not set.

**Solution:**
1. Check `NEXT_PUBLIC_FIREBASE_PROJECT_ID` in `.env.local`
2. Verify it matches your Firebase project ID in the console

### Error: "Missing or insufficient permissions"

**Cause:** Firestore security rules are too restrictive.

**Solution:**
1. Go to Firestore Database > Rules
2. For development, you can temporarily use:
   ```javascript
   allow read, write: if true;
   ```
3. Remember to set proper rules before production!

### Firebase Features Not Working

**Cause:** Environment variables not properly loaded.

**Solution:**
1. Ensure all `NEXT_PUBLIC_FIREBASE_*` variables are set
2. Restart your development server
3. Clear browser cache and reload
4. Check browser console for specific error messages

---

## Testing Firebase Setup

### Test Authentication

1. Go to `/signup` in your app
2. Create a test account
3. Check Firebase Console > Authentication to see the new user

### Test Firestore

1. Play the game and earn some points
2. Go to Firebase Console > Firestore Database
3. Check `userProfiles` collection for your user data

### Test Leaderboard

1. Create multiple test accounts
2. Play games with each account
3. Go to `/leaderboard` to see rankings

---

## Production Deployment

### Security Checklist

- [ ] Update Firestore security rules (remove test mode)
- [ ] Enable App Check for additional security
- [ ] Set up Firebase Authentication email templates
- [ ] Configure authorized domains in Firebase Console
- [ ] Review and limit API key restrictions
- [ ] Set up Firebase billing alerts
- [ ] Enable Firebase Analytics (optional)

### Environment Variables for Production

Make sure to set all Firebase environment variables in your production environment:
- Vercel: Project Settings > Environment Variables
- Netlify: Site Settings > Build & Deploy > Environment
- Firebase Hosting: Use `firebase.json` and App Hosting config

---

## Optional: Firebase Admin SDK (Server-Side)

For server-side operations (like hint deduction), the app uses Firebase Admin SDK.

Set this environment variable for server-side operations:

```bash
# For local development
FIREBASE_CONFIG={"projectId":"your-project-id"}

# For production (Firebase App Hosting)
# This is automatically set by Firebase
```

---

## Cost Considerations

Firebase has a generous free tier:
- **Authentication**: 50,000 monthly active users (free)
- **Firestore**: 50,000 reads, 20,000 writes per day (free)
- **Cloud Functions**: 2M invocations per month (free)

For a small to medium game, you'll likely stay within the free tier.

Monitor usage in Firebase Console > Usage and billing.

---

## Need Help?

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Support](https://firebase.google.com/support)

---

**Last Updated:** 2026-01-01

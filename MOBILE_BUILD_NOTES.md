# Mobile Build - Important Notes

## ⚠️ Static Export Limitation

Next.js static export (`output: 'export'`) **does not support API routes**. This affects:

- `/api/genkit/[[...path]]` - Genkit AI routes
- `/api/paystack/*` - Payment routes

---

## 🔧 Solutions

### Option 1: Hybrid Approach (Recommended)

Keep the web version with API routes, build mobile separately:

**For Web (with API routes):**
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // NO static export
  experimental: {
    serverActions: {
      allowedOrigins: [...],
    },
  },
};
```

**For Mobile (static export):**
```bash
# Create separate config
cp next.config.ts next.config.mobile.ts

# Edit next.config.mobile.ts to enable static export
# Build with: next build -c next.config.mobile.ts
```

### Option 2: Use External API (Best for Production)

Deploy API routes separately:

1. **Deploy web app** to Vercel/Netlify (with API routes)
2. **Build mobile app** pointing to deployed API
3. **Update mobile app** to use `https://yourdomain.com/api/*`

**Update mobile config:**
```typescript
// src/lib/config.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.origin) ||
  'https://yourdomain.com';
```

### Option 3: Remove AI Features for Mobile (Quick Fix)

For a quick mobile build without AI features:

1. **Comment out AI imports** in pages
2. **Disable hint generation** (use static hints)
3. **Build mobile** with static export

---

## 🚀 Quick Mobile Build (Without AI)

### Step 1: Disable AI Features

Create `src/lib/mobile-config.ts`:

```typescript
export const MOBILE_BUILD = true;

// Use static word list instead of AI generation
export const USE_STATIC_WORDS = true;

// Disable AI hints
export const ENABLE_AI_HINTS = false;
```

### Step 2: Update Game Logic

In `src/app/page.tsx`:

```typescript
import { MOBILE_BUILD, USE_STATIC_WORDS } from '@/lib/mobile-config';
import { wordList } from '@/lib/game-data';

const startNewGame = useCallback(async (currentLevel: number) => {
  if (USE_STATIC_WORDS) {
    // Use static word list
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    setWordData(randomWord);
  } else {
    // Use AI generation (web only)
    const result = await generateWord({ difficulty });
    setWordData(result);
  }
}, []);
```

### Step 3: Build

```bash
npm run build
npx cap sync
```

---

## 📱 Recommended Approach for Production

### Architecture

```
┌─────────────────┐
│   Web App       │
│  (Vercel/       │
│   Netlify)      │
│                 │
│  - Full features│
│  - API routes   │
│  - AI generation│
└────────┬────────┘
         │
         │ API calls
         │
┌────────▼────────┐
│  Mobile App     │
│  (iOS/Android)  │
│                 │
│  - Static build │
│  - Calls web API│
│  - Full features│
└─────────────────┘
```

### Implementation

1. **Deploy web app** with all features
2. **Configure mobile** to use web API:

```typescript
// src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://definitiondetective.com';

export async function generateWord(difficulty: string) {
  const response = await fetch(`${API_URL}/api/generate-word`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty }),
  });
  return response.json();
}
```

3. **Build mobile** with static export
4. **Mobile app** calls your web API for AI features

---

## 🎯 Quick Decision Guide

### Choose Option 1 (Hybrid) if:
- ✅ You want to test mobile quickly
- ✅ You're okay with limited features on mobile
- ✅ You want simplest setup

### Choose Option 2 (External API) if:
- ✅ You want full features on mobile
- ✅ You're deploying to production
- ✅ You want best architecture

### Choose Option 3 (No AI) if:
- ✅ You want fastest mobile build
- ✅ AI features aren't critical
- ✅ You're just testing mobile

---

## 🔨 Quick Fix for Now

To build mobile immediately:

```bash
# 1. Temporarily disable static export
# Edit next.config.ts - comment out:
# output: 'export',

# 2. Or use static words only
# The game will work with the static word list in game-data.ts

# 3. Build
npm run build

# 4. Sync
npx cap sync android
```

---

## 📝 TODO for Production Mobile

- [ ] Deploy web app to Vercel/Netlify
- [ ] Get production URL
- [ ] Update mobile to use production API
- [ ] Test all features on mobile
- [ ] Build release APK/AAB
- [ ] Submit to Play Store

---

## 💡 Alternative: Progressive Web App (PWA)

Instead of native mobile, consider PWA:

**Pros:**
- ✅ No app store approval needed
- ✅ Works on all platforms
- ✅ Easier updates
- ✅ Full API route support
- ✅ Can be "installed" on mobile

**Cons:**
- ❌ Not in app stores
- ❌ Limited native features
- ❌ Less discoverable

**To enable PWA:**
```bash
npm install next-pwa
# Configure in next.config.ts
```

---

## 🎓 Learning

This is a common challenge with Next.js mobile builds:
- **Static export** = No server-side code
- **API routes** = Server-side code
- **Solution** = Separate API or use external backend

Most production apps use Option 2 (External API).

---

## 📞 Need Help?

Check these resources:
- Next.js Static Export: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
- Capacitor with Next.js: https://capacitorjs.com/docs/guides/nextjs
- API Routes Alternative: https://nextjs.org/docs/pages/building-your-application/routing/api-routes

---

**Recommendation:** Deploy your web app first, then build mobile pointing to it. This gives you the best of both worlds!

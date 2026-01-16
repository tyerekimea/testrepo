# Quick Start Guide - Definition Detective

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure AI Provider

**Option A: Use OpenAI (Recommended)**
1. Get API key from https://platform.openai.com/api-keys
2. Add to `.env.local`:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

**Option B: Use Gemini Only**
- Already configured! Just use the existing `GEMINI_API_KEY`

**Option C: Use Both (Best)**
- Add both keys to `.env.local`
- OpenAI will be primary, Gemini will be fallback

### Step 3: Start the Server
```bash
npm run dev
```

Visit: http://localhost:9003

## 🧪 Test Your Setup

```bash
npm run test:openai
```

You should see:
```
✅ Word Generation: Success!
✅ Hint Generation: Success!
```

## 📋 Environment Variables

### Required
```env
# At least one of these is required:
OPENAI_API_KEY=sk-your-key-here
# OR
GEMINI_API_KEY=your-gemini-key-here
```

### Optional
```env
# Firebase (for user features)
FIREBASE_CONFIG={"projectId":"..."}

# Paystack (for payments)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_...
```

## 🎮 Features

- ✅ AI-powered word generation
- ✅ Smart hint system
- ✅ Progressive difficulty
- ✅ Score tracking
- ✅ User authentication
- ✅ Leaderboard
- ✅ In-app purchases

## 🤖 AI Providers

### OpenAI (Primary)
- **Model:** GPT-4o-mini
- **Cost:** ~$5/month for 1000 games/day
- **Quality:** Excellent
- **Speed:** Very fast

### Google Gemini (Fallback)
- **Model:** Gemini 2.0 Flash
- **Cost:** ~$0.50/month for 1000 games/day
- **Quality:** Good
- **Speed:** Fast

## 📚 Documentation

- `OPENAI_SETUP.md` - Detailed OpenAI setup
- `OPENAI_IMPLEMENTATION_COMPLETE.md` - Implementation details
- `ALL_FIXES_SUMMARY.md` - All bug fixes
- `BUILD_ERROR_FIX.md` - Build issues resolved

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run test:openai      # Test AI integration

# Mobile
npm run build:mobile     # Build mobile app
npm run sync:android     # Sync Android
npm run sync:ios         # Sync iOS

# Testing
npm test                 # Run tests
npm run typecheck        # Check TypeScript
```

## 🐛 Troubleshooting

### Game not loading?
1. Check server is running: `npm run dev`
2. Check console for errors
3. Verify API keys in `.env.local`

### AI not working?
1. Run: `npm run test:openai`
2. Check API keys are valid
3. Check server logs

### Build errors?
1. Delete `.next` folder
2. Run: `npm run build`
3. Check for TypeScript errors

## 📞 Support

Check the documentation files for detailed help:
- Setup issues → `OPENAI_SETUP.md`
- Build errors → `BUILD_ERROR_FIX.md`
- Game bugs → `ALL_FIXES_SUMMARY.md`

## ✅ Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] API key added to `.env.local`
- [ ] Server starts (`npm run dev`)
- [ ] Tests pass (`npm run test:openai`)
- [ ] Game loads in browser
- [ ] Word generation works
- [ ] Hints work

## 🎉 You're Ready!

Once all checklist items are complete, your Definition Detective game is ready to play!

Visit: http://localhost:9003

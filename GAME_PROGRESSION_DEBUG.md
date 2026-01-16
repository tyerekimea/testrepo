# Game Progression Debugging Guide

## Issue Reported
Game fails to load the next puzzle after a correct guess.

## What Should Happen

1. Player guesses all letters correctly
2. Game state changes to "won"
3. Win sound plays
4. Score increases
5. "You solved it!" message shows
6. After 3 seconds, new game starts automatically
7. New word appears with fresh keyboard

## Debugging Steps

### Check Browser Console

Open your browser's developer console (F12) and look for these log messages:

**When you win:**
```
[startNewGame] Starting new game at level: X
[startNewGame] Attempt 1 to generate word...
[startNewGame] Generated word: [word]
[startNewGame] Setting new word data: [word]
[startNewGame] Game loading complete
```

### Common Issues and Solutions

#### Issue 1: No Console Logs After Winning
**Symptom:** Game shows "You solved it!" but nothing happens after 3 seconds

**Possible Causes:**
- JavaScript error preventing timeout from executing
- Component unmounted before timeout fires

**Check:**
- Look for any red errors in console
- Check if you navigated away from the page

#### Issue 2: "Connection Error" Toast
**Symptom:** Error message appears saying "Could not generate a new word"

**Possible Causes:**
- Google AI API key invalid or missing
- API rate limit exceeded
- Network connection issue
- Model not available

**Solutions:**
1. Check `.env.local` has valid `GOOGLE_GENAI_API_KEY`
2. Verify API key at https://makersuite.google.com/app/apikey
3. Check network tab for failed requests
4. Try refreshing the page

#### Issue 3: Word Generation Fails
**Symptom:** Console shows "Failed to generate word" errors

**Check Console For:**
```
[startNewGame] Failed to generate word: [error details]
```

**Common Errors:**
- `404 Not Found` - Model name incorrect
- `403 Forbidden` - API key invalid or no permissions
- `429 Too Many Requests` - Rate limit exceeded
- `UNKNOWN` - Network or configuration issue

**Solutions:**
1. Verify model names in code match available models
2. Check API key has Generative AI API enabled
3. Wait a few minutes if rate limited
4. Check internet connection

#### Issue 4: Same Word Appears Again
**Symptom:** After winning, the same word appears

**This is expected behavior if:**
- Word generation failed 3 times
- All generated words matched the previous word (rare)

**Check Console For:**
```
[startNewGame] Word matches previous, trying again...
```

#### Issue 5: Game Stuck on "Loading your next case..."
**Symptom:** Loading message never goes away

**Possible Causes:**
- Word generation hanging
- Promise never resolving
- Network timeout

**Solutions:**
1. Refresh the page
2. Check network tab for stuck requests
3. Verify API key is working

### Manual Testing Steps

1. **Start a new game**
   - Refresh the page
   - Open browser console (F12)
   - Clear console

2. **Play until you win**
   - Guess letters to complete a word
   - Watch console for logs

3. **Observe the 3-second delay**
   - "You solved it!" message should appear
   - Wait 3 seconds
   - Watch console for `[startNewGame]` logs

4. **Check for new word**
   - New definition should appear
   - Keyboard should reset (all keys enabled)
   - Letter display should show underscores

### Expected Console Output (Success)

```
[startNewGame] Starting new game at level: 2
[startNewGame] Attempt 1 to generate word...
[generateWordFlow] trying model candidate: googleai/gemini-1.5-flash-latest
[generateWordFlow] model worked: googleai/gemini-1.5-flash-latest
[startNewGame] Generated word: mystery
[startNewGame] Setting new word data: mystery
[startNewGame] Game loading complete
```

### Expected Console Output (Failure)

```
[startNewGame] Starting new game at level: 2
[startNewGame] Attempt 1 to generate word...
[generateWordFlow] trying model candidate: googleai/gemini-1.5-flash-latest
Error [GenkitError]: UNKNOWN: Error fetching from https://...
[startNewGame] Failed to generate word: Error: ...
[startNewGame] No word data available, game cannot continue
[startNewGame] Game loading complete
```

## Quick Fixes

### Fix 1: Restart the Server
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Fix 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Fix 3: Check API Key
```bash
# View your .env.local
cat .env.local | grep GOOGLE_GENAI_API_KEY
```

Should show:
```
GOOGLE_GENAI_API_KEY=AIzaSy...
```

### Fix 4: Test API Key Manually
Visit: https://makersuite.google.com/app/apikey
- Verify your key is listed
- Check it has "Generative Language API" enabled

## Reporting Issues

If the problem persists, please provide:

1. **Console logs** - Copy all `[startNewGame]` messages
2. **Network tab** - Check for failed API requests
3. **Error messages** - Any red errors in console
4. **Steps to reproduce** - What you did before the issue
5. **Browser info** - Chrome/Firefox/Safari version

## Current Status

✅ Added detailed logging for debugging  
✅ Improved error messages  
✅ Better error handling for word generation  
✅ Firebase errors won't block gameplay  

The game should now provide clear feedback about what's happening during progression.

---

**Last Updated:** 2026-01-01

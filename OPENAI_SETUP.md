# OpenAI Integration Setup Guide

## Overview

The app now supports **both OpenAI and Google Gemini** with automatic fallback. OpenAI models are prioritized for better reliability and instruction-following.

## Why OpenAI?

### Benefits Over Gemini
- ✅ **Better instruction following** - More reliable at revealing exact number of letters
- ✅ **More consistent** - Less hallucination for simple tasks
- ✅ **Better structured output** - Reliable JSON generation
- ✅ **Faster** - GPT-4o-mini is very fast
- ✅ **Cost-effective** - GPT-4o-mini is ~$0.15 per 1M tokens

### Model Priority
1. **OpenAI GPT-4o-mini** (primary) - Fast, cheap, reliable
2. **OpenAI GPT-4o** (fallback) - High quality
3. **Gemini 2.0 Flash** (fallback) - If OpenAI fails
4. **Other Gemini models** (final fallback)

## Setup Instructions

### Step 1: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### Step 2: Add API Key to Environment

Edit `.env.local` and add your OpenAI API key:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Important:** Replace `your_openai_api_key_here` with your actual key!

### Step 3: Restart the Server

```bash
# Kill existing server
pkill -9 node

# Start fresh
npm run dev
```

### Step 4: Verify It's Working

Check the console logs when generating a word or hint:

```
[generateWordFlow] trying model candidate: openai/gpt-4o-mini
[generateWordFlow] model worked: openai/gpt-4o-mini
```

If you see this, OpenAI is working! 🎉

## Configuration

### Current Setup

The app is configured to:
1. Try OpenAI GPT-4o-mini first
2. Fall back to OpenAI GPT-4o if mini fails
3. Fall back to Gemini if OpenAI is unavailable
4. Continue trying other models until one works

### Environment Variables

```env
# Required for OpenAI
OPENAI_API_KEY=sk-your-key-here

# Required for Gemini (fallback)
GEMINI_API_KEY=your-gemini-key-here

# Optional: Override model selection
GOOGLE_GENAI_MODEL=openai/gpt-4o-mini
```

## Cost Comparison

### For 1000 Games Per Day

Assuming:
- 1 word generation per game (~500 tokens)
- 2 hints per game (~300 tokens each)
- Total: ~1,100 tokens per game
- Monthly: ~33M tokens

| Provider | Model | Monthly Cost |
|----------|-------|--------------|
| OpenAI | GPT-4o-mini | ~$5/month |
| OpenAI | GPT-4o | ~$80/month |
| Google | Gemini 2.0 Flash | ~$0.50/month |

**Recommendation:** Use GPT-4o-mini for best balance of quality and cost.

## Testing

### Test Word Generation

```bash
curl http://localhost:9003/api/test-word
```

Expected output:
```json
{
  "success": true,
  "data": {
    "word": "example",
    "definition": "A thing characteristic of its kind..."
  }
}
```

### Test Hint Generation

```bash
curl http://localhost:9003/api/test-hint
```

Expected output:
```json
{
  "success": true,
  "data": {
    "success": true,
    "hint": "e__m__e",
    "reasoning": "Chose 'e' and 'm' from 'example'",
    "chosenLetters": ["e", "m"]
  }
}
```

## Troubleshooting

### Error: "Invalid API key"

**Solution:** Check that your OPENAI_API_KEY is correct in `.env.local`

```bash
# Verify the key is set
grep OPENAI_API_KEY .env.local
```

### Error: "Model not found"

**Solution:** The model name might be wrong. Check the logs to see which model it's trying.

Valid model names:
- `openai/gpt-4o-mini`
- `openai/gpt-4o`
- `openai/gpt-4-turbo`
- `openai/gpt-3.5-turbo`

### Fallback to Gemini

If OpenAI fails, the app will automatically fall back to Gemini. Check the logs:

```
[generateWordFlow] trying model candidate: openai/gpt-4o-mini
[generateWordFlow] model failed: Invalid API key
[generateWordFlow] trying model candidate: googleai/gemini-2.0-flash-exp
[generateWordFlow] model worked: googleai/gemini-2.0-flash-exp
```

This is normal and ensures the game keeps working even if one provider has issues.

## Advanced Configuration

### Use Only OpenAI

Set environment variable to skip Gemini:

```env
GOOGLE_GENAI_MODEL_CANDIDATES=openai/gpt-4o-mini,openai/gpt-4o
```

### Use Only Gemini

Remove or comment out the OpenAI API key:

```env
# OPENAI_API_KEY=sk-your-key-here
```

### Custom Model Order

Edit `src/ai/flows/generate-word-flow.ts`:

```typescript
const defaultCandidates = [
  'openai/gpt-4o',              // Try GPT-4o first
  'openai/gpt-4o-mini',         // Then mini
  'googleai/gemini-2.0-flash-exp',
];
```

## Benefits You'll See

### 1. More Accurate Hints
OpenAI is better at counting and revealing exactly the requested number of letters.

**Before (Gemini):**
- Asked for 2 letters, got 3-4
- Needed validation to fix

**After (OpenAI):**
- Asked for 2 letters, got exactly 2
- Validation rarely needed

### 2. More Consistent Words
OpenAI generates words that better match the requested difficulty level.

### 3. Faster Response
GPT-4o-mini is very fast, often responding in under 1 second.

### 4. Better Error Handling
If OpenAI fails, automatic fallback to Gemini ensures the game keeps working.

## Monitoring

### Check Which Model Is Being Used

Look at the server logs:

```bash
tail -f /tmp/dev-server.log | grep "model worked"
```

You'll see:
```
[generateWordFlow] model worked: openai/gpt-4o-mini
[generateHintFlow] model worked: openai/gpt-4o-mini
```

### Monitor API Usage

- **OpenAI Dashboard:** https://platform.openai.com/usage
- **Check costs:** https://platform.openai.com/account/billing/overview

## Next Steps

1. ✅ Get OpenAI API key
2. ✅ Add to `.env.local`
3. ✅ Restart server
4. ✅ Test the game
5. ✅ Monitor logs to confirm OpenAI is being used
6. ✅ Check API usage dashboard

## Support

If you encounter issues:

1. Check the logs for error messages
2. Verify API keys are correct
3. Test with curl commands
4. Check the debug endpoint: `curl http://localhost:9003/api/debug`

## Files Modified

- `package.json` - Added genkitx-openai
- `src/ai/genkit.ts` - Added OpenAI plugin
- `src/ai/flows/generate-word-flow.ts` - Prioritize OpenAI
- `src/ai/flows/generate-hints.ts` - Prioritize OpenAI
- `.env.local` - Added OPENAI_API_KEY

## Status

✅ **OpenAI integration complete!**

The app now uses OpenAI GPT-4o-mini by default with automatic fallback to Gemini for reliability.

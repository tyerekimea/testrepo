# Hint Error Fix - "Could not refresh access token"

## Problem
Users were getting this error when requesting hints:
```
Hint Error
2 UNKNOWN: Getting metadata from plugin failed with error: 
Could not refresh access token: Request failed with status code 500
```

## Root Cause
Two issues were identified:

### 1. Version Mismatch
The `@genkit-ai/google-genai` package was at version `1.24.0` while other genkit packages were at `1.27.0`. This version mismatch caused authentication issues.

### 2. Wrong Environment Variable
The code was using `GOOGLE_GENAI_API_KEY`, but the Genkit Google AI plugin expects `GEMINI_API_KEY` as the environment variable name.

## Solution

### Step 1: Update Package Version
```bash
npm install @genkit-ai/google-genai@^1.27.0
```

This ensures all genkit packages are on the same version:
- `@genkit-ai/ai@1.27.0`
- `@genkit-ai/core@1.27.0`
- `@genkit-ai/google-genai@1.27.0` ✅ (was 1.24.0)
- `@genkit-ai/next@1.27.0`
- `genkit@1.27.0`

### Step 2: Add Correct Environment Variable
Added `GEMINI_API_KEY` to `.env.local`:
```env
GEMINI_API_KEY=AIzaSyB0eOC2aIfTz90nbeg5ggR5D9uKmciaX7k
```

Kept `GOOGLE_GENAI_API_KEY` for backward compatibility with existing code.

### Step 3: Update Genkit Configuration
Changed `src/ai/genkit.ts` to let the plugin automatically use the environment variable:

**Before:**
```typescript
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY!,
    }),
  ],
});
```

**After:**
```typescript
export const ai = genkit({
  plugins: [
    // googleAI() will automatically use GEMINI_API_KEY from environment
    googleAI(),
  ],
});
```

## Verification

### Test 1: Hint Generation
```bash
curl https://9003--019b7974-ae88-7542-b1af-4fb0c2ebd935.eu-central-1-01.gitpod.dev/api/test-hint
```

**Result:** ✅ Success
```json
{
  "success": true,
  "data": {
    "success": true,
    "hint": "e__m__e",
    "reasoning": "The word is 'example'. The forbidden letters are 'xyz'. I need to choose 2 unique letters from the word, excluding the forbidden letters. The available letters are 'e', 'a', 'm', 'p', 'l'. I chose 'e' and 'm'.",
    "chosenLetters": ["e", "m"]
  }
}
```

### Test 2: Word Generation
```bash
curl https://9003--019b7974-ae88-7542-b1af-4fb0c2ebd935.eu-central-1-01.gitpod.dev/api/test-word
```

**Result:** ✅ Success
```json
{
  "success": true,
  "data": {
    "word": "happy",
    "definition": "Feeling or showing pleasure or contentment."
  }
}
```

## Key Learnings

1. **Environment Variable Names Matter**: Genkit plugins have specific environment variable names they expect. Always check the official documentation.

2. **Version Compatibility**: Keep all packages in the same ecosystem at the same version to avoid compatibility issues.

3. **Plugin Auto-Configuration**: Modern Genkit plugins can automatically read environment variables, so explicit configuration is often unnecessary.

4. **Error Messages Can Be Misleading**: "Could not refresh access token" suggested OAuth issues, but it was actually about API key configuration.

## Documentation Reference

From the [Genkit Google AI Plugin Documentation](https://firebase.google.com/docs/genkit/plugins/google-genai):

> ### Authentication
> 
> Requires a Gemini API Key, which you can get from Google AI Studio. You can provide this key in several ways:
> 
> 1. **Environment variables**: Set `GEMINI_API_KEY`
> 2. **Plugin configuration**: Pass `apiKey` when initializing the plugin
> 3. **Per-request**: Override the API key for specific requests in the config

## Files Modified

- `package.json` - Updated `@genkit-ai/google-genai` to `^1.27.0`
- `.env.local` - Added `GEMINI_API_KEY` environment variable
- `src/ai/genkit.ts` - Removed explicit apiKey parameter

## Status

✅ **FIXED** - Both word generation and hint generation are now working correctly.

The game should now work without authentication errors!

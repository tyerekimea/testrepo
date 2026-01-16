# Model Name Fix - Quick Update

## Issue
After the initial fix, the app was still getting 404 errors because the Google Generative AI API requires the `-latest` suffix for Gemini 1.5 models.

## Error Message
```
[404 Not Found] models/gemini-1.5-flash is not found for API version v1beta
```

## Root Cause
The model names needed to include the `-latest` suffix to work with the current API version.

## Fix Applied

### Updated Model Names

**Before:**
```javascript
const defaultCandidates = [
  'googleai/gemini-1.5-flash',
  'googleai/gemini-1.5-pro',
  'googleai/gemini-pro'
];
```

**After:**
```javascript
const defaultCandidates = [
  'googleai/gemini-1.5-flash-latest',  // Primary - fast & efficient
  'googleai/gemini-1.5-pro-latest',    // Secondary - more capable
  'googleai/gemini-2.0-flash-exp',     // Experimental - latest features
  'googleai/gemini-pro'                // Fallback - stable
];
```

## Files Changed
- `src/ai/flows/generate-word-flow.ts`
- `src/ai/flows/generate-image-description-flow.ts`
- `.env.example`

## Status
✅ **Fixed and merged into main**

## Testing
Restart your dev server to pick up the changes:
```bash
npm run dev
```

The app should now successfully generate words using the correct model names.

---

**Date:** 2026-01-01  
**Branch:** fix/correct-model-names (merged)  
**Commit:** 7f64c24

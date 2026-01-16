# Word Themes & No-Repeat Implementation Plan

## Overview
Implement themed word generation for premium users and ensure words are never repeated for any user.

## Features

### 1. No Word Repetition
- Track all words a user has seen
- Never show the same word twice to the same user
- Store in Firestore user profile

### 2. Word Themes (Premium Only)
**Educational & Academic:**
- Science Safari: Biology, space, ecosystems
- History Quest: Ancient civilizations, historical figures
- Geo Genius: Countries, capitals, landmarks

**Current Theme:**
- General vocabulary (default for all users)

### 3. Premium Feature Gate
- Free users: Current theme only
- Premium users: Can select any theme

## Implementation Steps

### Phase 1: Database Schema
- Add `usedWords` array to user profile
- Add `selectedTheme` field to user profile
- Add `isPremium` field to user profile

### Phase 2: Word Generation
- Update AI prompt to include theme context
- Check used words before returning
- Retry if word was already used

### Phase 3: UI Components
- Theme selector dropdown (premium only)
- Show lock icon for free users
- Upgrade prompt for theme selection

### Phase 4: Testing
- Test word uniqueness
- Test theme generation
- Test premium gate

## Database Structure

```typescript
interface UserProfile {
  userId: string;
  usedWords: string[];  // Array of words user has seen
  selectedTheme: string; // 'current' | 'science-safari' | 'history-quest' | 'geo-genius'
  isPremium: boolean;
  score: number;
  level: number;
  hints: number;
}
```

## AI Prompt Updates

```typescript
// Theme contexts
const themeContexts = {
  'current': 'General vocabulary',
  'science-safari': 'Biological sciences, space, ecosystems, scientific terms',
  'history-quest': 'Ancient civilizations (Egypt, Rome), historical figures, artifacts',
  'geo-genius': 'Countries, capitals, landmarks, geographical terms'
};
```

## Files to Modify
1. `src/lib/game-data.ts` - Add theme types
2. `src/ai/flows/generate-word-flow.ts` - Add theme context
3. `src/lib/actions.ts` - Check used words
4. `src/app/page.tsx` - Add theme selector UI
5. `src/components/theme-selector.tsx` - New component

## Status
- [ ] Phase 1: Database Schema
- [ ] Phase 2: Word Generation
- [ ] Phase 3: UI Components
- [ ] Phase 4: Testing

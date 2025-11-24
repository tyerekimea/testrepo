
// src/ai/genkit.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],

  // ❌ Do NOT set a "default model" here.
  // All flows should specify their own model.
});

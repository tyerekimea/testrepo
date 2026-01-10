import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    // googleAI() will automatically use GEMINI_API_KEY from environment
    googleAI(),
  ],
});

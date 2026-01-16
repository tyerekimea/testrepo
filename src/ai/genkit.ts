import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import openAI from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    // googleAI() will automatically use GEMINI_API_KEY from environment
    googleAI(),
    // openAI() will automatically use OPENAI_API_KEY from environment
    openAI(),
  ],
});

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta', // ✅ Use v1beta for preview models like TTS
    }),
  ],
  model: 'googleai/gemini-1.5-flash', // ✅ Modern, supported model
});

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1', // ✅ Force Genkit to use the stable v1 API
    }),
  ],
  model: 'googleai/gemini-2.5-flash', // ✅ Modern, supported model
});

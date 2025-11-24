'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import {
  GenerateHintInput,
  GenerateHintOutput,
  GenerateHintInputSchema,
  GenerateHintOutputSchema,
} from '@/ai/schemas/hint';

export async function generateHint(
  input: GenerateHintInput
): Promise<GenerateHintOutput> {
  return generateHintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHintPrompt',
  input: { schema: GenerateHintInputSchema },
  output: { schema: GenerateHintOutputSchema },

  // ✅ Updated model
  model: googleAI.models['gemini-1.5-flash'],

  prompt: `You are an AI assistant for a word puzzle game...
(unchanged prompt text)
`,
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

const generateHintFlow = ai.defineFlow(
  {
    name: 'generateHintFlow',
    inputSchema: GenerateHintInputSchema,
    outputSchema: GenerateHintOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    if (!response.output) throw new Error('Failed to generate hint.');
    return response.output;
  }
);

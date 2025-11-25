'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import {
  GenerateWordInput,
  GenerateWordOutput,
  GenerateWordInputSchema,
  GenerateWordOutputSchema,
} from '@/ai/schemas/word';

export async function generateWord(
  input: GenerateWordInput
): Promise<GenerateWordOutput> {
  return generateWordFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWordPrompt',
  input: { schema: GenerateWordInputSchema },
  output: { schema: GenerateWordOutputSchema },

  // STABLE v1 model (explicit 'models/' prefix)
  model: googleAI.model('models/gemini-1.5-pro'),

  // Only v1-compatible generation fields (no responseMimeType)
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 256,
    topP: 0.95,
  },

  prompt: `You are an expert lexicographer and puzzle master for a word game.

Your task is to generate a single word and its corresponding definition based on the requested difficulty level. The word should be challenging but fair for the given level.

Difficulty: {{{difficulty}}}

The definition should be clear, concise, and in a dictionary style. Avoid overly obscure words unless the difficulty is 'hard'.

Return a JSON object matching the required schema exactly.`,
});

const generateWordFlow = ai.defineFlow(
  {
    name: 'generateWordFlow',
    inputSchema: GenerateWordInputSchema,
    outputSchema: GenerateWordOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    const output = response.output;
    if (!output) {
      throw new Error('Failed to generate word from AI.');
    }
    return output;
  }
);

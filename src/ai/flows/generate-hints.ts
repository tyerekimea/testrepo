'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import {
  GenerateHintInput,
  GenerateHintOutput,
  GenerateHintInputSchema,
  GenerateHintOutputSchema,
} from '@/ai/schemas/hint';

export async function generateHint(input: GenerateHintInput): Promise<GenerateHintOutput> {
  return generateHintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHintPrompt',
  input: { schema: GenerateHintInputSchema },
  output: { schema: GenerateHintOutputSchema },

  // STABLE v1 model
  model: googleAI.model('models/gemini-1.5-pro'),

  generationConfig: {
    temperature: 0.6,
    maxOutputTokens: 150,
    topP: 0.9,
  },

  prompt: `You are an AI assistant for a word puzzle game. Your task is to provide a "smart hint".
The user gives you:
- Secret Word: "{{word}}"
- Incorrect Guesses: "{{incorrectGuesses}}"
- Letters to Reveal: {{lettersToReveal}}

Rules:
1) Output JSON matching the schema exactly.
2) Reveal exactly {{lettersToReveal}} letters in the hint string, represented as letters; all unrevealed letters must be underscores "_".
3) Do NOT reveal letters that are present in "{{incorrectGuesses}}". Choose other letters to reveal.

Return the JSON object now.`,
});

const generateHintFlow = ai.defineFlow(
  {
    name: 'generateHintFlow',
    inputSchema: GenerateHintInputSchema,
    outputSchema: GenerateHintOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    const output = response.output;
    if (!output) {
      throw new Error('Failed to generate hint from AI.');
    }
    return output;
  }
);

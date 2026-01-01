'use server';

import { ai } from '@/ai/genkit';
import {
  GenerateImageDescriptionInput,
  GenerateImageDescriptionOutput,
  GenerateImageDescriptionInputSchema,
  GenerateImageDescriptionOutputSchema,
} from '@/ai/schemas/image-description';

export async function generateImageDescription(
  input: GenerateImageDescriptionInput
): Promise<GenerateImageDescriptionOutput> {
  return generateImageDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImageDescriptionPrompt',
  input: { schema: GenerateImageDescriptionInputSchema },
  output: { schema: GenerateImageDescriptionOutputSchema, format: 'json' },
  prompt: `You are an expert visual designer for a game where players guess words from images.

Your task is to create a vivid, descriptive prompt that can be used to generate an image representing the word: "{{word}}".

The description should:
1. Be visual and detailed.
2. NOT contain the word "{{word}}" itself.
3. Focus on the physical appearance, setting, or metaphorical representation of the word.

Generate the JSON response with a single field "description".`,
});

export const generateImageDescriptionFlow = ai.defineFlow(
  {
    name: 'generateImageDescriptionFlow',
    inputSchema: GenerateImageDescriptionInputSchema,
    outputSchema: GenerateImageDescriptionOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY?.trim();
    if (!apiKey || apiKey.startsWith('your_')) {
      throw new Error('Server configuration error: Invalid Google API key.');
    }

    // Try multiple model candidates
    const candidates = [
      'googleai/gemini-1.5-flash-latest',
      'googleai/gemini-1.5-pro-latest',
      'googleai/gemini-2.0-flash-exp',
      'googleai/gemini-pro'
    ];

    let lastErr: any = null;
    for (const candidate of candidates) {
      try {
        const { output } = await prompt(input, { model: candidate });
        if (!output) {
          lastErr = new Error('AI returned no output.');
          continue;
        }
        return output;
      } catch (err: any) {
        lastErr = err;
        const msg = err?.originalMessage ?? err?.message ?? String(err);
        const notFound = /not found/i.test(msg) || /NOT_FOUND/.test(msg);
        if (notFound) {
          continue;
        }
        throw new Error(`AI model request failed for model "${candidate}": ${msg}`);
      }
    }

    const tried = candidates.join(', ');
    const finalMsg = lastErr?.originalMessage ?? lastErr?.message ?? String(lastErr ?? 'no response');
    throw new Error(
      `AI model request failed — tried models: [${tried}]. Last error: ${finalMsg}`
    );
  }
);
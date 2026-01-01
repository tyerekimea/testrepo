'use server';

import { ai } from '../genkit';
import {
  type GenerateWordInput,
  type GenerateWordOutput,
  GenerateWordInputSchema,
  GenerateWordOutputSchema,
} from '../schemas/word';

export async function generateWord(
  input: GenerateWordInput
): Promise<GenerateWordOutput> {
  return generateWordFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWordPrompt',
  input: { schema: GenerateWordInputSchema },
  output: { schema: GenerateWordOutputSchema },
  prompt: `You are an expert lexicographer and puzzle master for a word game.

Your task is to generate a single word and its corresponding definition based on the requested difficulty level.

Difficulty: {{{difficulty}}}

The definition should be clear, concise, and dictionary-style.
Avoid overly obscure words unless the difficulty is "hard".`,
});

const generateWordFlow = ai.defineFlow(
  {
    name: 'generateWordFlow',
    inputSchema: GenerateWordInputSchema,
    outputSchema: GenerateWordOutputSchema,
  },
  async input => {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY?.trim();
    if (!apiKey || apiKey.startsWith('your_')) {
      throw new Error('Server configuration error: Invalid Google API key.');
    }

    // Build prioritized candidate list:
    // 1) explicit `GOOGLE_GENAI_MODEL`
    // 2) comma-separated `GOOGLE_GENAI_MODEL_CANDIDATES`
    // 3) sensible defaults (try common model ids)
    const explicit = process.env.GOOGLE_GENAI_MODEL?.trim();
    const listFromEnv = (process.env.GOOGLE_GENAI_MODEL_CANDIDATES || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const defaultCandidates = [
      'googleai/gemini-1.5-flash-latest',
      'googleai/gemini-1.5-pro-latest',
      'googleai/gemini-2.0-flash-exp',
      'googleai/gemini-pro'
    ];
    const candidates = [
      ...(explicit ? [explicit] : []),
      ...listFromEnv,
      ...defaultCandidates,
    ];

    let lastErr: any = null;
    for (const candidate of candidates) {
      try {
        console.debug('[generateWordFlow] trying model candidate:', candidate);
        const { output } = await prompt(input, { model: candidate });
        if (!output) {
          lastErr = new Error('AI returned no output.');
          continue;
        }
        console.debug('[generateWordFlow] model worked:', candidate);
        return output;
      } catch (err: any) {
        // If model not found, keep trying other candidates; otherwise surface the error.
        const msg = err?.originalMessage ?? err?.message ?? String(err);
        lastErr = err;
        const notFound = /not found/i.test(msg) || /NOT_FOUND/.test(msg);
        if (notFound) {
          console.warn(`[generateWordFlow] model not found: ${candidate} — trying next`);
          continue;
        }
        throw new Error(`AI model request failed for model "${candidate}": ${msg}`);
      }
    }

    // If we reach here, none of the candidates worked.
    const tried = candidates.join(', ');
    const finalMsg = lastErr?.originalMessage ?? lastErr?.message ?? String(lastErr ?? 'no response');
    throw new Error(
      `AI model request failed — tried models: [${tried}]. Last error: ${finalMsg}`
    );
  }
);

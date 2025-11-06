'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * Input Schema — defines what the model receives.
 */
const SmartHintInputSchema = z.object({
  word: z.string().describe('The word to provide a hint for.'),
  incorrectGuesses: z.string().describe('The letters the player has already guessed incorrectly.'),
  lettersToReveal: z.number().describe('The number of letters to reveal in the hint.'),
});
export type SmartHintInput = z.infer<typeof SmartHintInputSchema>;

/**
 * Output Schema — defines what the model returns.
 */
const SmartHintOutputSchema = z.object({
  hint: z.string().describe('The smart hint, with revealed letters and underscores for the rest.'),
});
export type SmartHintOutput = z.infer<typeof SmartHintOutputSchema>;

/**
 * The AI prompt — guides Gemini on what to produce.
 */
const smartHintPrompt = ai.definePrompt({
  name: 'smartHintPrompt',
  input: { schema: SmartHintInputSchema },
  output: { schema: SmartHintOutputSchema },
  prompt: `
You are an AI assistant that helps players with smart word puzzle hints.

Given:
- Word: "{{{word}}}"
- Incorrect guesses: "{{{incorrectGuesses}}}"
- Number of letters to reveal: "{{{lettersToReveal}}}"

Rules:
1. Reveal only the specified number of letters.
2. Do not reveal letters that were guessed incorrectly.
3. Replace unrevealed letters with underscores.
4. Return your response **ONLY** in valid JSON format, e.g.:

{
  "hint": "e_a__p_e"
}

Now, generate the hint:
`,
});

/**
 * The flow — defines how the AI is called and what it returns.
 */
const smartHintFlow = ai.defineFlow(
  {
    name: 'smartHintFlow',
    inputSchema: SmartHintInputSchema,
    outputSchema: SmartHintOutputSchema,
  },
  async (input) => {
    try {
      const response = await smartHintPrompt(input);

      // 🧩 Safely handle both structured and plain text responses
      let hintText = '';
      if (typeof response.output === 'string') {
        try {
          const parsed = JSON.parse(response.output);
          hintText = parsed.hint ?? '';
        } catch {
          hintText = response.output;
        }
      } else if (response.output?.hint) {
        hintText = response.output.hint;
      }

      return { hint: hintText.trim() };
    } catch (error) {
      console.error('❌ Smart hint flow failed:', error);
      return { hint: 'Sorry, no hint available right now.' };
    }
  }
);

/**
 * Export a direct callable helper for your app logic.
 */
export async function getSmartHint(input: SmartHintInput): Promise<SmartHintOutput> {
  return smartHintFlow(input);
}

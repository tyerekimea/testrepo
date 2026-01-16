
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
  // Convert excludeWords array to comma-separated string for the prompt
  const processedInput = {
    ...input,
    excludeWordsString: input.excludeWords?.join(', ') || '',
  };
  return generateWordFlow(processedInput as any);
}

const prompt = ai.definePrompt({
  name: 'generateWordPrompt',
  input: { schema: GenerateWordInputSchema },
  output: { schema: GenerateWordOutputSchema, format: 'json' },
  prompt: `You are an expert lexicographer and puzzle master for a word game.

Your task is to generate a single word and its corresponding definition based on the requested difficulty level and theme.

Difficulty: {{{difficulty}}}
Theme: {{{theme}}}

Theme Guidelines:
- current: General vocabulary EXCLUDING science, history, and geography topics. Focus on: everyday objects, emotions, actions, abstract concepts, arts, literature, business, technology, food, sports, entertainment, and general knowledge. DO NOT use scientific terms, historical terms, or geographical terms.
- science-safari: Biological sciences, space exploration, ecosystems, scientific terminology, natural phenomena, and scientific discoveries
- history-quest: Ancient civilizations (Egypt, Rome, Greece, Mesopotamia), historical figures, historical events, artifacts, and historical terminology
- geo-genius: Countries, capitals, cities, landmarks, geographical features, continents, oceans, and geographical terminology

{{#if excludeWordsString}}
IMPORTANT: Do NOT use any of these words (user has already seen them): {{{excludeWordsString}}}
{{/if}}

Difficulty Guidelines:
- For "easy": Use common words (5-7 letters) that most people know
- For "medium": Use moderately challenging words (7-10 letters)
- For "hard": Use advanced vocabulary words (10+ letters)

Requirements:
- The word MUST relate to the theme specified above
- The definition should be clear, concise, and dictionary-style
- Ensure the word is appropriate for the difficulty level
- Use only single words (no spaces, no hyphens)

Return a JSON object with:
- word: the target word (lowercase, no spaces, single word only)
- definition: a clear, concise definition`,
});

const generateWordFlow = ai.defineFlow(
  {
    name: 'generateWordFlow',
    inputSchema: GenerateWordInputSchema,
    outputSchema: GenerateWordOutputSchema,
  },
  async input => {
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
      // OpenAI models - best for word generation
      'openai/gpt-4o-mini',                 // Fast, cheap, reliable
      'openai/gpt-4o',                      // High quality
      // Gemini models - fallback
      'googleai/gemini-2.0-flash-exp',      // Working! (Experimental)
      'googleai/gemini-1.5-flash',          // Try without -latest
      'googleai/gemini-1.5-pro',            // Try without -latest
      'googleai/gemini-pro'                 // Stable fallback
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
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Model request timed out after 30 seconds')), 30000);
        });
        
        const promptPromise = prompt(input, { model: candidate });
        const { output } = await Promise.race([promptPromise, timeoutPromise]) as any;
        
        if (!output) {
          lastErr = new Error('AI returned no output.');
          continue;
        }
        console.debug('[generateWordFlow] model worked:', candidate);
        return output;
      } catch (err: any) {
        const msg = err?.originalMessage ?? err?.message ?? String(err);
        lastErr = err;
        
        // Check for common errors that should trigger fallback
        const notFound = /not found/i.test(msg) || /NOT_FOUND/.test(msg);
        const authError = /401|Incorrect API key|Invalid API key|authentication/i.test(msg);
        const rateLimitError = /429|rate limit|quota/i.test(msg);
        
        if (notFound || authError || rateLimitError) {
          console.warn(`[generateWordFlow] model "${candidate}" failed: ${msg} — trying next`);
          continue;
        }
        
        // For other errors, also try next model (more resilient)
        console.warn(`[generateWordFlow] model "${candidate}" error: ${msg} — trying next`);
        continue;
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

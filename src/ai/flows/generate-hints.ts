
'use server';

import { ai } from '@/ai/genkit';
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
  output: { schema: GenerateHintOutputSchema, format: 'json' },
  prompt: `You are a hint generator for a word puzzle game.

WORD: "{{word}}"
WORD LENGTH: {{wordLength}} characters
FORBIDDEN LETTERS: "{{incorrectGuesses}}"
UNIQUE LETTERS TO REVEAL: {{lettersToReveal}}

CRITICAL RULES:
1. Choose EXACTLY {{lettersToReveal}} UNIQUE letter(s) from the word (not {{incorrectGuesses}})
2. When you reveal a letter, show ALL its occurrences
3. Replace all other positions with "_"
4. The hint MUST be EXACTLY {{wordLength}} characters long

ALGORITHM:
1. List all unique letters in "{{word}}" that are NOT in "{{incorrectGuesses}}"
2. Select EXACTLY {{lettersToReveal}} letters from that list
3. For each of the {{wordLength}} positions in "{{word}}":
   - If word[i] is in your selected letters: hint[i] = word[i]
   - Otherwise: hint[i] = "_"
4. Verify: hint.length === {{wordLength}} and unique_letters_in_hint === {{lettersToReveal}}

EXAMPLE:
Word: "example", Length: 7, Forbidden: "xyz", Reveal: 2
Available: [e, a, m, p, l]
Select: [e, a]
Position 0: 'e' → in selection → 'e'
Position 1: 'x' → not in selection → '_'
Position 2: 'a' → in selection → 'a'
Position 3: 'm' → not in selection → '_'
Position 4: 'p' → not in selection → '_'
Position 5: 'l' → not in selection → '_'
Position 6: 'e' → in selection → 'e'
Result: "e_a___e" (length 7, unique letters: 2) ✓

NOW SOLVE:
Word: "{{word}}"
Length: {{wordLength}}
Forbidden: "{{incorrectGuesses}}"
Reveal: {{lettersToReveal}}

Return JSON:
- reasoning: explain which {{lettersToReveal}} letters you chose
- chosenLetters: array of EXACTLY {{lettersToReveal}} letters
- hint: string of EXACTLY {{wordLength}} characters`,
});

const generateHintFlow = ai.defineFlow(
  {
    name: 'generateHintFlow',
    inputSchema: GenerateHintInputSchema,
    outputSchema: GenerateHintOutputSchema,
  },
  async input => {
    // Try multiple model candidates
    const defaultCandidates = [
      // OpenAI models - best for precise instructions
      'openai/gpt-4o-mini',                 // Fast, cheap, reliable
      'openai/gpt-4o',                      // High quality
      // Gemini models - fallback
      'googleai/gemini-2.0-flash-exp',      // Working! (Experimental)
      'googleai/gemini-1.5-flash',          // Try without -latest
      'googleai/gemini-1.5-pro',            // Try without -latest
      'googleai/gemini-pro'                 // Stable fallback
    ];

    let lastErr: any = null;
    for (const candidate of defaultCandidates) {
      try {
        console.debug('[generateHintFlow] trying model candidate:', candidate);
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Model request timed out after 60 seconds')), 60000);
        });
        
        const promptPromise = prompt(input, { model: candidate });
        const { output } = await Promise.race([promptPromise, timeoutPromise]) as any;
        
        if (!output) {
          lastErr = new Error('AI returned no output.');
          continue;
        }
        console.debug('[generateHintFlow] model worked:', candidate);
        
        // Validate and fix the output
        const validatedOutput = validateAndFixHint(input, output);
        return validatedOutput;
      } catch (err: any) {
        lastErr = err;
        const msg = err?.originalMessage ?? err?.message ?? String(err);
        
        // Check for common errors that should trigger fallback
        const notFound = /not found/i.test(msg) || /NOT_FOUND/.test(msg);
        const authError = /401|Incorrect API key|Invalid API key|authentication/i.test(msg);
        const rateLimitError = /429|rate limit|quota/i.test(msg);
        
        if (notFound || authError || rateLimitError) {
          console.warn(`[generateHintFlow] model "${candidate}" failed: ${msg} — trying next`);
          continue;
        }
        
        // For other errors, also try next model (more resilient)
        console.warn(`[generateHintFlow] model "${candidate}" error: ${msg} — trying next`);
        continue;
      }
    }

    // If we get here, all models failed
    const tried = defaultCandidates.join(', ');
    const finalMsg = lastErr?.originalMessage ?? lastErr?.message ?? String(lastErr ?? 'no response');
    throw new Error(
      `AI hint generation failed — tried models: [${tried}]. Last error: ${finalMsg}`
    );
  }
);

// Validation function to ensure the hint follows the rules
function validateAndFixHint(
  input: GenerateHintInput,
  output: GenerateHintOutput
): GenerateHintOutput {
  const { word, wordLength, incorrectGuesses, lettersToReveal } = input;
  let { hint, reasoning, chosenLetters } = output;

  // Fix 1: Ensure hint length matches word length
  if (hint.length !== wordLength) {
    console.warn(`[validateHint] Hint length mismatch: ${hint.length} !== ${wordLength}. Fixing...`);
    hint = hint.slice(0, wordLength).padEnd(wordLength, '_');
  }

  // Fix 2: Ensure only chosen letters are revealed
  if (chosenLetters && chosenLetters.length > 0) {
    const chosenSet = new Set(chosenLetters.map(l => l.toLowerCase()));
    const fixedHint = word.split('').map((char) => {
      const lowerChar = char.toLowerCase();
      if (chosenSet.has(lowerChar)) {
        return char;
      }
      return '_';
    }).join('');
    
    if (fixedHint !== hint) {
      console.warn(`[validateHint] Fixed hint to match chosen letters. Before: "${hint}", After: "${fixedHint}"`);
      hint = fixedHint;
    }
  }

  // Fix 3: Ensure we're not revealing forbidden letters
  const forbiddenSet = new Set(incorrectGuesses.toLowerCase().split(''));
  const revealedLetters = new Set(
    hint.split('').filter(c => c !== '_').map(c => c.toLowerCase())
  );
  
  const hasForbidden = Array.from(revealedLetters).some(l => forbiddenSet.has(l));
  if (hasForbidden) {
    console.warn(`[validateHint] Hint contains forbidden letters. Regenerating...`);
    // Remove forbidden letters from hint
    hint = word.split('').map((char, i) => {
      if (hint[i] !== '_' && !forbiddenSet.has(char.toLowerCase())) {
        return char;
      }
      return '_';
    }).join('');
  }

  // Fix 4: Ensure correct number of unique letters
  const uniqueRevealed = new Set(hint.split('').filter(c => c !== '_').map(c => c.toLowerCase()));
  if (uniqueRevealed.size !== lettersToReveal) {
    console.warn(`[validateHint] Wrong number of unique letters: ${uniqueRevealed.size} !== ${lettersToReveal}`);
    // This is harder to fix automatically, but we'll log it
  }

  return {
    hint,
    reasoning,
    chosenLetters,
  };
}

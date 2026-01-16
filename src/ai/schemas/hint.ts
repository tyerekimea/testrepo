import { z } from 'zod';

export const GenerateHintInputSchema = z.object({
  word: z.string().describe('The secret word for the puzzle.'),
  wordLength: z.number().describe('The length of the secret word.'),
  incorrectGuesses: z.string().describe('A string of letters the user has already guessed incorrectly.'),
  lettersToReveal: z.number().describe('The number of unique letters to reveal in the hint.'),
});
export type GenerateHintInput = z.infer<typeof GenerateHintInputSchema>;

export const GenerateHintOutputSchema = z.object({
  reasoning: z.string().describe('Step-by-step reasoning: which letters you chose and why'),
  chosenLetters: z.array(z.string()).describe('Array of the unique letters you chose to reveal'),
  hint: z.string().describe('The partially revealed word, using underscores for unrevealed letters.'),
});
export type GenerateHintOutput = z.infer<typeof GenerateHintOutputSchema>;

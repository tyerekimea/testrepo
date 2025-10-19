'use server';

/**
 * @fileOverview Definition Detective puzzle content generation.
 *
 * - generatePuzzleContent - A function that generates puzzle content including the word, definition, first letter hint, and category hint.
 * - PuzzleContentInput - The input type for the generatePuzzleContent function.
 * - PuzzleContentOutput - The return type for the generatePuzzleContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PuzzleContentInputSchema = z.object({
  difficulty: z
    .number()
    .describe("The difficulty level of the puzzle. A lower number means an easier word. For difficulty levels below 10, the words should be common, everyday words that are easy to guess."),
});
export type PuzzleContentInput = z.infer<typeof PuzzleContentInputSchema>;

const PuzzleContentOutputSchema = z.object({
  word: z.string().describe('The word to be guessed in the puzzle.'),
  definition: z.string().describe('The definition of the word.'),
  firstLetterHint: z.string().describe('The first letter of the word.'),
  categoryHint: z.string().describe('A category that the word belongs to.'),
});
export type PuzzleContentOutput = z.infer<typeof PuzzleContentOutputSchema>;

export async function generatePuzzleContent(
  input: PuzzleContentInput
): Promise<PuzzleContentOutput> {
  return generatePuzzleContentFlow(input);
}

const puzzleContentPrompt = ai.definePrompt({
  name: 'puzzleContentPrompt',
  input: {schema: PuzzleContentInputSchema},
  output: {schema: PuzzleContentOutputSchema},
  prompt: `You are a puzzle creator for a word puzzle game called Definition Detective.

  The game generates a word and its corresponding definition for the player to guess.

  The difficulty is: {{{difficulty}}}.

  For difficulty levels below 10, you MUST generate common, everyday words that are easy for a player to guess. As the difficulty number increases, the words should become progressively more challenging.

  Based on this difficulty, generate a word and definition, along with hints, that is appropriate for this difficulty level.

  Provide the first letter of the word as the firstLetterHint.

  Provide a category that the word belongs to as the categoryHint.  This should NOT be too obvious, but also not too obscure.

  Ensure the word and definition are related.
  `,
});

const generatePuzzleContentFlow = ai.defineFlow(
  {
    name: 'generatePuzzleContentFlow',
    inputSchema: PuzzleContentInputSchema,
    outputSchema: PuzzleContentOutputSchema,
  },
  async input => {
    const {output} = await puzzleContentPrompt(input);
    return output!;
  }
);

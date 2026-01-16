import { z } from 'zod';

export const GenerateWordInputSchema = z.object({
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The difficulty level for the word to be generated.'),
  theme: z
    .enum(['current', 'science-safari', 'history-quest', 'geo-genius'])
    .optional()
    .describe('The theme for word generation. Defaults to "current" (general vocabulary).'),
  excludeWords: z
    .array(z.string())
    .optional()
    .describe('Array of words to exclude (words the user has already seen).'),
});
export type GenerateWordInput = z.infer<typeof GenerateWordInputSchema>;

export const GenerateWordOutputSchema = z.object({
  word: z.string().describe('The generated word.'),
  definition: z.string().describe('The definition of the generated word.'),
});
export type GenerateWordOutput = z.infer<typeof GenerateWordOutputSchema>;

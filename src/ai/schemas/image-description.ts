import { z } from 'zod';

export const GenerateImageDescriptionInputSchema = z.object({
  word: z.string().describe('The word to generate an image description for'),
});

export const GenerateImageDescriptionOutputSchema = z.object({
  description: z.string().describe('A detailed visual description of the word, suitable for image generation'),
});

export type GenerateImageDescriptionInput = z.infer<typeof GenerateImageDescriptionInputSchema>;
export type GenerateImageDescriptionOutput = z.infer<typeof GenerateImageDescriptionOutputSchema>;
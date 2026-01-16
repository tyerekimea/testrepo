'use server';
/**
 * @fileOverview Generates game sound effects using Text-to-Speech.
 *
 * - getGameSound - A function that generates a sound effect.
 * - GameSoundInput - The input type for the getGameSound function.
 * - GameSoundOutput - The return type for the getGameSound function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GameSoundInputSchema = z
  .string()
  .describe(
    'The text to convert to a sound effect (e.g., "ding", "buzz", "level up").'
  );
export type GameSoundInput = z.infer<typeof GameSoundInputSchema>;

const GameSoundOutputSchema = z.object({
  soundDataUri: z.string().describe('The generated sound as a base64 data URI.'),
});
export type GameSoundOutput = z.infer<typeof GameSoundOutputSchema>;

export async function getGameSound(
  input: GameSoundInput
): Promise<GameSoundOutput> {
  return gameSoundFlow(input);
}

const gameSoundFlow = ai.defineFlow(
  {
    name: 'gameSoundFlow',
    inputSchema: GameSoundInputSchema,
    outputSchema: GameSoundOutputSchema,
  },
  async query => {
    try {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {voiceName: 'Algenib'},
            },
          },
        },
        prompt: query,
      });
      if (!media) {
        throw new Error('no media returned');
      }
      return {
        soundDataUri: media.url,
      };
    } catch (error) {
      console.error('Error generating game sound:', error);
      throw new Error(
        `Failed to generate game sound: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
);

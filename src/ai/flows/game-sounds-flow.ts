'use server';
/**
 * Generates game sound effects using Gemini TTS.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';

const GameSoundInputSchema = z
  .string()
  .describe('A text-like sound name such as "ding", "buzz", "level up".');

export type GameSoundInput = z.infer<typeof GameSoundInputSchema>;

const GameSoundOutputSchema = z.object({
  soundDataUri: z.string().describe('The generated sound as a base64 WAV.'),
});

export type GameSoundOutput = z.infer<typeof GameSoundOutputSchema>;

export async function getGameSound(
  input: GameSoundInput
): Promise<GameSoundOutput> {
  return gameSoundFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];

    writer.on('error', reject);
    writer.on('data', d => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

const gameSoundFlow = ai.defineFlow(
  {
    name: 'gameSoundFlow',
    inputSchema: GameSoundInputSchema,
    outputSchema: GameSoundOutputSchema,
  },
  async query => {
    const { media } = await ai.generate({
      model: googleAI.models['gemini-1.5-flash-tts'], // ✅ Updated TTS model
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: query,
    });

    if (!media) throw new Error('No audio returned from model.');

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);

    return {
      soundDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);

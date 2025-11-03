import { createApiHandler } from '@genkit-ai/next';

export const { GET, POST } = createApiHandler({
  onInit: async () => {
    // Dynamically import flows only when the API is initialized.
    // This prevents them from being bundled into other server/client components
    // during the Next.js build process, which was causing the error.
    await import('@/ai/flows/smart-word-hints');
    await import('@/ai/flows/game-sounds-flow');
  },
});

import handleRoute from '@genkit-ai/next';
import { action } from '@genkit-ai/core';
import { z } from 'zod';
import { ai } from '@/lib/genkit';

// Define an action
const myAction = action(
  {
    name: 'myAction',
    actionType: 'custom',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (input) => {
    return await ai.runSomething(input);
  }
);

export const GET = handleRoute(myAction);
export const POST = handleRoute(myAction);

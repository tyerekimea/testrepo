// from test-flow.ts (inside src/) 

import { generateWord } from './ai/flows/generate-word-flow';
async function test() {
  const result = await generateWord({ difficulty: 'medium' });
  console.log(result);
}

test();

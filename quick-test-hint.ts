import { config } from 'dotenv';
config({ path: '.env.local' });

import './src/ai/genkit';
import { generateHint } from './src/ai/flows/generate-hints';

async function quickTestHint() {
  console.log('🧪 Quick Test - Hint Generation\n');
  
  try {
    console.log('Generating hint for "example"...');
    const start = Date.now();
    
    const result = await generateHint({ 
      word: 'example',
      wordLength: 7,
      incorrectGuesses: 'xyz',
      lettersToReveal: 2
    });
    
    const duration = Date.now() - start;
    
    console.log(`✅ Success! (${duration}ms)`);
    console.log(`Hint: "${result.hint}"`);
    
    if (result.reasoning) {
      console.log(`Reasoning: ${result.reasoning}`);
    }
    
    if (result.chosenLetters) {
      console.log(`Chosen: [${result.chosenLetters.join(', ')}]`);
    }
    
    // Validate
    const unique = new Set(result.hint.split('').filter(c => c !== '_'));
    console.log(`\nValidation:`);
    console.log(`  Length: ${result.hint.length} (expected: 7) ${result.hint.length === 7 ? '✅' : '❌'}`);
    console.log(`  Unique letters: ${unique.size} (expected: 2) ${unique.size === 2 ? '✅' : '❌'}`);
    
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}`);
    console.error(error);
  }
}

quickTestHint();

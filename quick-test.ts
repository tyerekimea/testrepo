import { config } from 'dotenv';
config({ path: '.env.local' });

import './src/ai/genkit';
import { generateWord } from './src/ai/flows/generate-word-flow';

async function quickTest() {
  console.log('🧪 Quick Test - Word Generation\n');
  
  try {
    console.log('Generating word...');
    const start = Date.now();
    
    const result = await generateWord({ 
      difficulty: 'easy',
      theme: 'current'
    });
    
    const duration = Date.now() - start;
    
    console.log(`✅ Success! (${duration}ms)`);
    console.log(`Word: "${result.word}"`);
    console.log(`Definition: "${result.definition}"`);
    
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}`);
    console.error(error);
  }
}

quickTest();

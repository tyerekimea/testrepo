import { config } from 'dotenv';

// Load .env.local file
config({ path: '.env.local' });

import './src/ai/genkit';
import { generateWord } from './src/ai/flows/generate-word-flow';
import { useHintAction } from './src/lib/actions';

async function testOpenAI() {
  console.log('🧪 Testing OpenAI Integration\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`   OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`   Gemini API Key: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log('');
  
  // Test 1: Word Generation
  console.log('📝 Test 1: Word Generation');
  try {
    const result = await generateWord({ difficulty: 'easy' });
    console.log(`   ✅ Success!`);
    console.log(`   Word: "${result.word}"`);
    console.log(`   Definition: "${result.definition}"`);
    console.log('');
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    console.log('');
  }
  
  // Test 2: Hint Generation
  console.log('💡 Test 2: Hint Generation');
  try {
    const result = await useHintAction({
      word: 'example',
      wordLength: 7,
      incorrectGuesses: 'xyz',
      lettersToReveal: 2,
      isFree: true
    });
    
    if (result.success && result.hint) {
      console.log(`   ✅ Success!`);
      console.log(`   Hint: "${result.hint}"`);
      
      const resultData = result as any;
      if (resultData.reasoning) {
        console.log(`   Reasoning: ${resultData.reasoning}`);
      }
      if (resultData.chosenLetters) {
        console.log(`   Chosen Letters: [${resultData.chosenLetters.join(', ')}]`);
      }
      
      // Validate
      const uniqueLetters = new Set(result.hint.split('').filter(c => c !== '_').map(c => c.toLowerCase()));
      console.log(`   Validation: ${uniqueLetters.size} unique letters revealed (expected: 2) ${uniqueLetters.size === 2 ? '✅' : '❌'}`);
    } else {
      console.log(`   ❌ Failed: ${result.message}`);
    }
    console.log('');
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    console.log('');
  }
  
  console.log('✨ Test complete!\n');
  
  // Instructions
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('⚠️  OpenAI API key not configured!');
    console.log('');
    console.log('To use OpenAI:');
    console.log('1. Get your API key from: https://platform.openai.com/api-keys');
    console.log('2. Add to .env.local: OPENAI_API_KEY=sk-your-key-here');
    console.log('3. Restart the server');
    console.log('');
    console.log('The app will use Gemini as fallback until OpenAI is configured.');
    console.log('');
  }
}

testOpenAI().catch(console.error);

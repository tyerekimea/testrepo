
import { config } from 'dotenv';

// Load .env.local file
config({ path: '.env.local' });

import './src/ai/genkit';
import { useHintAction } from './src/lib/actions';

async function testSmartHint() {
  console.log('🧪 Testing Smart Hint Generation...\n');
  
  const testCases = [
    {
      word: 'example',
      incorrectGuesses: 'xyz',
      lettersToReveal: 2,
      description: 'Reveal 2 letters from "example", avoiding x,y,z'
    },
    {
      word: 'serendipity',
      incorrectGuesses: 'abc',
      lettersToReveal: 3,
      description: 'Reveal 3 letters from "serendipity", avoiding a,b,c'
    },
    {
      word: 'test',
      incorrectGuesses: 't',
      lettersToReveal: 1,
      description: 'Reveal 1 letter from "test", avoiding t'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.description}`);
    console.log(`   Word: "${testCase.word}"`);
    console.log(`   Incorrect guesses: "${testCase.incorrectGuesses}"`);
    console.log(`   Letters to reveal: ${testCase.lettersToReveal}`);
    
    try {
      const result = await useHintAction({
        word: testCase.word,
        wordLength: testCase.word.length,
        incorrectGuesses: testCase.incorrectGuesses,
        lettersToReveal: testCase.lettersToReveal,
        isFree: true
      });

      if (result.success && result.hint) {
        const resultData = result as any;
        console.log(`   ✅ Result: "${result.hint}"`);
        if (resultData.reasoning) {
          console.log(`   💭 Reasoning: ${resultData.reasoning}`);
        }
        if (resultData.chosenLetters) {
          console.log(`   🎯 Chosen letters: [${resultData.chosenLetters.join(', ')}]`);
        }
        
        // Validate the hint
        const revealedLetters = new Set(result.hint.split('').filter(c => c !== '_').map(c => c.toLowerCase()));
        const uniqueRevealedCount = revealedLetters.size;
        const totalRevealedCount = result.hint.split('').filter(c => c !== '_').length;
        const hasIncorrectGuesses = testCase.incorrectGuesses.split('').some(letter => 
          result.hint.toLowerCase().includes(letter.toLowerCase())
        );
        
        console.log(`   📊 Validation:`);
        console.log(`      - Unique letters revealed: ${uniqueRevealedCount} (expected: ${testCase.lettersToReveal}) ${uniqueRevealedCount === testCase.lettersToReveal ? '✅' : '❌'}`);
        console.log(`      - Total positions revealed: ${totalRevealedCount}`);
        console.log(`      - Revealed letters: ${Array.from(revealedLetters).join(', ')}`);
        console.log(`      - Contains incorrect guesses: ${hasIncorrectGuesses ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);
        console.log(`      - Hint length matches word: ${result.hint.length === testCase.word.length ? '✅' : '❌'}`);
      } else {
        console.log(`   ❌ Failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n✨ Test complete!\n');
}

testSmartHint().catch(console.error);

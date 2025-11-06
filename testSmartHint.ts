import { getSmartHint } from '@/ai/flows/smart-word-hints';

async function testSmartHint() {
  const result = await getSmartHint({
    word: 'example',
    incorrectGuesses: 'xyz',
    lettersToReveal: 2,
  });

  console.log('🧠 Smart Hint Output:', result);
}

testSmartHint().catch(console.error);

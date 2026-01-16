import { NextResponse } from 'next/server';
import { useHintAction } from '@/lib/actions';

export async function GET() {
  try {
    console.log('[test-hint] Starting hint generation test...');
    const result = await useHintAction({
      word: 'example',
      wordLength: 7,
      incorrectGuesses: 'xyz',
      lettersToReveal: 2,
      isFree: true
    });
    console.log('[test-hint] Success:', result);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[test-hint] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

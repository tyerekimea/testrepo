import { NextResponse } from 'next/server';
import { generateWord } from '@/ai/flows/generate-word-flow';

export async function GET() {
  try {
    console.log('[test-word] Starting word generation test...');
    const result = await generateWord({ difficulty: 'easy' });
    console.log('[test-word] Success:', result);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[test-word] Error:', error);
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

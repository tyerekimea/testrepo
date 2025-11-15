
import { ai } from '@/ai/genkit';
import { NextRequest, NextResponse } from 'next/server';
import '@/ai/flows/game-sounds-flow';
import '@/ai/flows/generate-word-flow';

export async function POST(request: NextRequest) {
  try {
    const { flowId, input } = await request.json();

    if (!flowId) {
      return NextResponse.json({ error: 'Missing `flowId` parameter.' }, { status: 400 });
    }

    const flow = ai.lookup(flowId);
    if (!flow) {
        return NextResponse.json({ error: `Flow '${flowId}' not found.` }, { status: 404 });
    }

    const result = await ai.run(flow, input ?? {});
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('🔥 Error running Genkit flow:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

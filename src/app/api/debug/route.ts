import { NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasGoogleGenAIKey: !!process.env.GOOGLE_GENAI_API_KEY,
    geminiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
    googleGenAIKeyLength: process.env.GOOGLE_GENAI_API_KEY?.length || 0,
    nodeEnv: process.env.NODE_ENV,
  };
  
  return NextResponse.json(envCheck);
}

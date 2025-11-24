import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { NextRequest } from "next/server";
import { GENKIT_CLIENT_HEADER } from "genkit/next";
import { run } from "@genkit-ai/next";

import "@/ai/flows/game-sounds-flow";
import "@/ai/flows/generate-word-flow";
import "@/ai/flows/generate-hints";

genkit({
  plugins: [googleAI()],
});

export async function POST(req: NextRequest) {
  const isGenkitClient = req.headers.has(GENKIT_CLIENT_HEADER);
  return await run(req.json(), {
    isGenkitClient,
  });
}

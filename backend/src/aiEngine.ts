import { request } from "undici";

export interface AiEngineResponse {
  text: string;
  [key: string]: unknown;
}

export async function callAiEngine(query: string): Promise<AiEngineResponse> {
  const baseUrl = process.env.AI_ENGINE_URL;

  if (!baseUrl) {
    // Fallback stub if no engine configured
    return { text: `You said: ${query}` };
  }

  const url = `${baseUrl.replace(/\/$/, "")}/query`;
  const res = await request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query })
  });

  if (res.statusCode >= 400) {
    const body = await res.body.text();
    throw new Error(`AI engine error ${res.statusCode}: ${body}`);
  }

  const dataText = await res.body.text();
  let data: any;
  try {
    data = JSON.parse(dataText);
  } catch (e) {
    throw new Error(`AI engine returned non-JSON response: ${String(e)}: ${dataText.slice(0, 200)}`);
  }

  if (!data || typeof data.text !== "string") {
    throw new Error(`AI engine response missing 'text' attribute`);
  }

  return data as AiEngineResponse;
}
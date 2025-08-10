import { request } from "undici";

export interface TranscribeOptions {
  modelId?: string;
  hfToken?: string;
  language?: string;
  contentType?: string;
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  options: TranscribeOptions = {}
): Promise<string> {
  const modelId = options.modelId || process.env.HF_ASR_MODEL || "distil-whisper/distil-small.en";
  const hfToken = options.hfToken || process.env.HUGGINGFACE_API_TOKEN || "";

  const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(modelId)}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": options.contentType || "audio/wav"
  };
  if (hfToken) headers["Authorization"] = `Bearer ${hfToken}`;

  const res = await request(url, {
    method: "POST",
    headers,
    body: audioBuffer
  });

  if (res.statusCode >= 400) {
    const errText = await res.body.text();
    throw new Error(`HF ASR error ${res.statusCode}: ${errText}`);
  }

  const text = await res.body.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Unexpected HF ASR response: ${text.slice(0, 200)}`);
  }

  if (typeof json === "string") return json;
  if (json && typeof json.text === "string") return json.text;
  if (Array.isArray(json) && json.length && json[0].text) return json[0].text;

  throw new Error(`Could not parse ASR text from response: ${text.slice(0, 200)}`);
}
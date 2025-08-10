import { request } from "undici";

export interface TtsOptions {
  modelId?: string;
  hfToken?: string;
  format?: "wav" | "mp3" | "flac";
}

export async function synthesizeSpeech(
  text: string,
  options: TtsOptions = {}
): Promise<{ audio: Buffer; contentType: string }> {
  const modelId = options.modelId || process.env.HF_TTS_MODEL || "espnet/kan-bayashi_ljspeech_vits";
  const hfToken = options.hfToken || process.env.HUGGINGFACE_API_TOKEN || "";
  const format = options.format || "wav";

  const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(modelId)}`;

  const accept = format === "mp3" ? "audio/mpeg" : format === "flac" ? "audio/flac" : "audio/wav";

  const headers: Record<string, string> = {
    Accept: accept,
    "Content-Type": "application/json"
  };
  if (hfToken) headers["Authorization"] = `Bearer ${hfToken}`;

  const res = await request(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ inputs: text })
  });

  if (res.statusCode >= 400) {
    const errText = await res.body.text();
    throw new Error(`HF TTS error ${res.statusCode}: ${errText}`);
  }

  const arrayBuf = await res.body.arrayBuffer();
  const audio = Buffer.from(arrayBuf);
  return { audio, contentType: accept };
}
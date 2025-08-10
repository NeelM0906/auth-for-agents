import "dotenv/config";
import express from "express";
import multer from "multer";
import { transcribeAudio } from "./providers/hfAsr.js";
import { synthesizeSpeech } from "./providers/hfTts.js";
import { callAiEngine } from "./aiEngine.js";
import { request } from "undici";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/speech/query", upload.single("audio"), async (req, res) => {
  try {
    let audioBuffer: Buffer | null = null;
    let contentType: string | undefined;

    if (req.file && req.file.buffer) {
      audioBuffer = req.file.buffer as Buffer;
      contentType = req.file.mimetype || undefined;
    } else if (typeof req.body?.audio_url === "string" && req.body.audio_url) {
      const fetchRes = await request(req.body.audio_url);
      if (fetchRes.statusCode >= 400) {
        const errText = await fetchRes.body.text();
        return res.status(400).json({ error: `Failed to fetch audio_url: ${fetchRes.statusCode} ${errText}` });
      }
      const arr = await fetchRes.body.arrayBuffer();
      audioBuffer = Buffer.from(arr);
      const rawHeader = (fetchRes.headers as any)["content-type"] as string | string[] | undefined;
      if (Array.isArray(rawHeader)) {
        contentType = rawHeader[0];
      } else if (typeof rawHeader === "string") {
        contentType = rawHeader;
      }
    }

    if (!audioBuffer) {
      return res.status(400).json({ error: "Missing audio file under 'audio' field or 'audio_url'" });
    }

    const transcript = await transcribeAudio(audioBuffer, { contentType });

    const engine = await callAiEngine(transcript);
    const engineText = engine.text;

    const { audio, contentType: synthesizedContentType } = await synthesizeSpeech(engineText);

    const wantsJson = req.headers["accept"]?.includes("application/json");
    const responseKind = (req.query["response"] || "audio").toString();

    if (wantsJson || responseKind === "json") {
      const base64 = audio.toString("base64");
      return res.json({ transcript, engineText, audioBase64: base64, contentType: synthesizedContentType });
    }

    res.setHeader("Content-Type", synthesizedContentType);
    res.setHeader("X-Transcript", encodeURIComponent(transcript).slice(0, 8_000));
    res.setHeader("X-Engine-Text", encodeURIComponent(engineText).slice(0, 8_000));
    res.send(audio);
  } catch (err: any) {
    const message = err?.message || "Unknown error";
    res.status(500).json({ error: message });
  }
});

const port = Number(process.env.PORT || 5050);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Speech backend listening on http://localhost:${port}`);
});
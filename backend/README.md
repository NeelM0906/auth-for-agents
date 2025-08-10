## Speech Backend

A minimal speech pipeline that:

- Accepts user audio (file upload or URL)
- Transcribes via Hugging Face Inference API (free tier)
- Routes the transcript to your `@AI_engine` via HTTP
- Speaks back the engine's `text` using Hugging Face TTS

### Endpoints

- POST `/api/speech/query`
  - multipart/form-data with `audio` (file), or JSON/form field `audio_url`
  - Query `response=json` to get JSON; otherwise returns audio (default WAV)
  - Response (JSON): `{ transcript, engineText, audioBase64, contentType }`
  - Response (audio): content-type audio, headers `X-Transcript`, `X-Engine-Text`

### Environment

- `PORT` (default 5050)
- `HUGGINGFACE_API_TOKEN` (required for stable usage)
- `HF_ASR_MODEL` (default `distil-whisper/distil-small.en`)
- `HF_TTS_MODEL` (default `espnet/kan-bayashi_ljspeech_vits`)
- `AI_ENGINE_URL` (optional; if omitted, a stub echoes back `You said: ...`)

### Development

```bash
cd backend
npm i
npm run dev
# POST audio to http://localhost:5050/api/speech/query
```

Example cURL (audio -> audio):

```bash
curl -s -X POST \
  -F "audio=@sample.wav" \
  http://localhost:5050/api/speech/query \
  --output reply.wav -D -
```

Example cURL (audio -> JSON):

```bash
curl -s -X POST \
  -H 'Accept: application/json' \
  -F "audio=@sample.wav" \
  'http://localhost:5050/api/speech/query?response=json' | jq .
```

### Notes

- Free models are used via the Hugging Face Inference API. Bring a free token for better limits.
- Your `@AI_engine` should expose `POST /query` returning `{ text: string, ... }`.
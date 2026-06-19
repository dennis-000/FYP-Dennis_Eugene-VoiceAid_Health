---
title: VoiceAid Health Backend
emoji: 🎙️
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: true
app_port: 7860
---

# VoiceAid Health — Speech AI Backend

This is the backend server for **VoiceAid Health**, an Augmentative and Alternative Communication (AAC) and Speech-Language Therapy app for Ghanaian patients with speech impairments (dysarthria, aphasia, apraxia).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/asr/transcribe` | Speech-to-text (Twi/Ga/English) |
| WS | `/asr/stream` | Live streaming transcription |
| POST | `/tts/synthesize` | Text-to-speech (Twi/English) |

## Models Used
- **Twi/Akan ASR**: `dennis-9/whisper-small_Akan_finetuned_v2` (custom fine-tuned)
- **English ASR**: `openai/whisper-small`
- **TTS**: `facebook/mms-tts-aka` (Twi) / `facebook/mms-tts-eng` (English)

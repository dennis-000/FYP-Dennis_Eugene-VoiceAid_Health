# Dataset Directory

This folder contains all data for fine-tuning and evaluating the VoiceAid Health custom Akan/Twi ASR model.

## Structure

```
dataset/
├── transcriptions/         ← Upload your CSV or Excel file here
│   └── transcriptions.csv  ← Maps audio filenames to text transcriptions
│
├── audio_samples/          ← Put a small sample of .wav files here (for testing/evaluation)
│   └── (5-10 sample .wav files for quick testing)
│
└── evaluation/             ← Auto-generated eval results will be saved here
    └── wer_results.json    ← Word Error Rate results
```

## Full Dataset (8,084 .wav files)
**Do NOT put all 8,084 files here.** They are too large for GitHub.
Upload them to **Google Drive** and link them in your Colab notebook instead.

## Transcriptions CSV Format

Your CSV/Excel file should have these columns:

| Column | Description | Example |
|--------|-------------|---------|
| `file_name` | Audio filename (without path) | `audio_001.wav` |
| `transcription` | What was said (in Twi/Akan) | `Ɛte sɛn` |
| `duration_seconds` | Audio length in seconds | `3.2` |
| `speaker_id` | Speaker ID (optional) | `SPK_001` |

## Notes
- Keep audio at **16kHz, mono channel** (required by Whisper)
- Transcriptions should be **clean Twi/Akan text** (no code-switching unless intentional)
- For fine-tuning on Colab, audio files should be on **Google Drive**

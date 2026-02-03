from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.asr import asr_service
import soundfile as sf
import io
import numpy as np

router = APIRouter()

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("en") # Default to English
):
    """
    Receives an audio file (WAV/MP3/M4A) and language ('en' or 'tw').
    Converts it to a numpy array, and transcribes it using the appropriate model.
    """
    try:
        # Read file content
        content = await file.read()
        
        # Decode audio using soundfile representing as float32
        # soundfile.read returns (data, samplerate)
        # We assume the file is valid audio. Robust validation would be added here.
        audio_data, samplerate = sf.read(io.BytesIO(content))
        
        # Ensure mono channel
        if len(audio_data.shape) > 1:
            audio_data = audio_data.mean(axis=1)

        # Whisper requires 16000 Hz. If different, we'd need resampling.
        # For MVP, we assume client sends appropriate format or handle minimal mismatch risks
        # TODO: Add explicit resampling via librosa if samplerate != 16000
        
        result = asr_service.transcribe(audio_data, language=language, sampling_rate=samplerate)
        
        return {
            "text": result["text"],
            "language": language,
            "model": result["model"]
        }

    except Exception as e:
        print(f"ASR Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

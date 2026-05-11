from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.tts import tts_service

router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    language: str = "tw"

@router.post("/synthesize")
async def synthesize_text_post(request: TTSRequest):
    """
    Receives text and language, and returns synthesized audio (WAV).
    """
    return await process_tts(request.text, request.language)

@router.get("/synthesize")
async def synthesize_text_get(text: str, language: str = "tw"):
    """
    GET version for easy playback in Swagger UI and standard browsers.
    Type your text here and click execute to play!
    """
    return await process_tts(text, language)

async def process_tts(text: str, language: str):
    try:
        audio_io, sampling_rate = tts_service.synthesize(text, language)
        
        if audio_io is None:
             raise HTTPException(status_code=400, detail="Language not supported or generation failed")

        return StreamingResponse(audio_io, media_type="audio/wav")

    except Exception as e:
        print(f"TTS Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {str(e)}")

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from app.services.tts import tts_service

router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    language: str = "tw"

@router.post("/synthesize")
async def synthesize_text(request: TTSRequest):
    """
    Receives text and language, and returns synthesized audio (WAV).
    """
    try:
        audio_io, sampling_rate = tts_service.synthesize(request.text, request.language)
        
        if audio_io is None:
             raise HTTPException(status_code=400, detail="Language not supported or generation failed")

        return Response(content=audio_io.read(), media_type="audio/wav")

    except Exception as e:
        print(f"TTS Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {str(e)}")

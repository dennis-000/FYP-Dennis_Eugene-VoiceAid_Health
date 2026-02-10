from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.transcription_db import transcription_db

router = APIRouter()

class TranscriptionSaveRequest(BaseModel):
    user_id: str
    text: str
    language: str = "en"
    audio_format: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    duration: Optional[int] = None
    # For now we don't accept raw audio file upload here, 
    # client should upload to storage then send URL if needed.
    # OR we could accept base64. But let's start with text + metadata.
    audio_url: Optional[str] = None

@router.post("/save")
async def save_transcription(request: TranscriptionSaveRequest):
    """
    Saves a completed transcription session to the database.
    """
    try:
        if not request.user_id or not request.text:
             raise HTTPException(status_code=400, detail="Missing user_id or text")
             
        result = await transcription_db.save_transcription(
            user_id=request.user_id,
            text=request.text,
            language=request.language,
            metadata=request.metadata,
            audio_url=request.audio_url,
            duration=request.duration
        )
        
        if result:
            return {"status": "success", "data": result}
        else:
            raise HTTPException(status_code=500, detail="Failed to save to database")
            
    except Exception as e:
        print(f"[API] Error saving transcription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

from datetime import datetime
from uuid import uuid4
from typing import Optional, Dict, Any
from app.core.supabase import get_supabase

class TranscriptionDBService:
    def __init__(self):
        self.supabase = get_supabase()
        self.table_name = "transcriptions"

    async def save_transcription(self, 
                               user_id: str, 
                               text: str, 
                               language: str, 
                               metadata: Dict[str, Any] = None,
                               audio_url: Optional[str] = None,
                               duration: Optional[int] = None) -> Dict[str, Any]:
        """
        Saves a transcription record to the database.
        """
        try:
            data = {
                "user_id": user_id,
                "text": text,
                "language": language,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            if metadata:
                if "confidence" in metadata:
                    data["confidence_score"] = metadata["confidence"]
                if "model" in metadata:
                    data["model_used"] = metadata["model"]
                if "is_live" in metadata:
                    data["is_live_mode"] = metadata["is_live"]
                    
            if audio_url:
                data["audio_url"] = audio_url
            
            if duration:
                data["duration_seconds"] = duration

            # Insert into Supabase
            result = self.supabase.table(self.table_name).insert(data).execute()
            
            if result.data and len(result.data) > 0:
                print(f"[DB] Saved transcription: {result.data[0]['id']}")
                return result.data[0]
            return None
            
        except Exception as e:
            print(f"[DB] Error saving transcription: {str(e)}")
            # Don't raise, just log. We don't want to break the app if DB fails.
            return None

# Singleton
transcription_db = TranscriptionDBService()

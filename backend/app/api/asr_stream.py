"""
WebSocket endpoint for live/streaming transcription
Receives audio chunks and returns partial transcriptions in real-time
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.asr import asr_service
from app.services.audio_chunker import audio_chunker
import json
import base64
import numpy as np

router = APIRouter()

@router.websocket("/stream")
async def stream_transcription(websocket: WebSocket):
    """
    WebSocket endpoint for live transcription
    
    Client sends:
    {
        "audio": "base64_encoded_audio_chunk",
        "language": "en" | "tw",
        "chunk_id": 0
    }
    
    Server responds:
    {
        "text": "partial transcription",
        "chunk_id": 0,
        "confidence": 0.95,
        "is_final": false
    }
    """
    await websocket.accept()
    print("[WebSocket] Client connected for live transcription")
    
    try:
        while True:
            # Receive audio chunk from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            audio_b64 = message.get("audio")
            language = message.get("language", "en")
            chunk_id = message.get("chunk_id", 0)
            
            if not audio_b64:
                await websocket.send_json({
                    "error": "No audio data provided",
                    "chunk_id": chunk_id
                })
                continue
            
            try:
                # Decode base64 audio
                audio_bytes = base64.b64decode(audio_b64)
                
                # Decode audio to numpy array
                audio_data, sample_rate = audio_chunker.decode_audio_bytes(audio_bytes)
                
                # Transcribe chunk
                result = asr_service.transcribe(
                    audio_data, 
                    language=language, 
                    sampling_rate=sample_rate
                )
                
                # Send partial result back to client
                response = {
                    "text": result["text"],
                    "chunk_id": chunk_id,
                    "model": result["model"],
                    "is_final": False,  # Partial result
                    "language": language
                }
                
                try:
                    await websocket.send_json(response)
                    print(f"[WebSocket] ✅ Sent transcription for chunk {chunk_id}: {result['text'][:50]}...")
                except RuntimeError:
                    print(f"[WebSocket] ⚠️ Cannot send chunk {chunk_id}, connection closed")
                
            except Exception as e:
                print(f"[WebSocket] Error processing chunk {chunk_id}: {str(e)}")
                try:
                    # Try to send error to client, but ignore if closed
                    await websocket.send_json({
                        "error": f"Transcription failed: {str(e)}",
                        "chunk_id": chunk_id
                    })
                except:
                    pass
                
    except WebSocketDisconnect:
        print("[WebSocket] Client disconnected")
    except Exception as e:
        print(f"[WebSocket] Unexpected error: {str(e)}")
        try:
            await websocket.close()
        except:
            pass


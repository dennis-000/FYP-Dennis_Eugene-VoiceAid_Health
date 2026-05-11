from fastapi import APIRouter, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect
from app.services.asr import asr_service
import tempfile
import os
import io
from pydub import AudioSegment
import numpy as np
import time

router = APIRouter()

@router.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket, language: str = "en"):
    """
    WebSocket endpoint for ULTRA-LOW LATENCY live transcription.
    Receives raw audio bytes, processes them completely in-memory,
    and returns the transcribed text instantly.
    """
    await websocket.accept()
    print(f"[WebSocket] Client connected for live ASR. Language: {language}")
    
    try:
        while True:
            # 1. Receive audio chunk (bytes) from Frontend
            audio_bytes = await websocket.receive_bytes()
            start_time = time.time()
            
            # 2. In-Memory conversion (No disk saving overhead!)
            audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
            audio = audio.set_channels(1)  # Mono
            audio = audio.set_frame_rate(16000)  # 16kHz
            
            # Convert to numpy array safely
            samples = np.array(audio.get_array_of_samples())
            
            if audio.sample_width == 2:  # 16-bit
                audio_data = samples.astype(np.float32) / 32768.0
            elif audio.sample_width == 4:  # 32-bit
                audio_data = samples.astype(np.float32) / 2147483648.0
            else:
                audio_data = samples.astype(np.float32)
                
            # 3. Transcribe Instantly
            result = asr_service.transcribe(audio_data, language=language, sampling_rate=16000)
            
            latency = round(time.time() - start_time, 2)
            print(f"[WS] Chunk Transcribed in {latency}s: {result['text']}")
            
            # 4. Send back to Frontend
            await websocket.send_json({
                "text": result["text"],
                "language": language,
                "latency_sec": latency
            })
            
    except WebSocketDisconnect:
        print("[WebSocket] Client disconnected.")
    except Exception as e:
        print(f"[WebSocket] Error: {str(e)}")
        import traceback
        traceback.print_exc()

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("en") # Default to English
):
    """
    Standard REST endpoint for file uploading (Older method).
    """
    tmp_input = None
    tmp_wav = None
    
    try:
        # Read file content
        content = await file.read()
        
        # Get file extension
        file_ext = os.path.splitext(file.filename)[1] if file.filename else '.m4a'
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            tmp_file.write(content)
            tmp_input = tmp_file.name
        
        # Convert to WAV using pydub
        print(f"[ASR] Converting {file_ext} to WAV...")
        audio = AudioSegment.from_file(tmp_input)
        
        audio = audio.set_channels(1)
        audio = audio.set_frame_rate(16000)
        
        tmp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav').name
        audio.export(tmp_wav, format='wav')
        
        samples = np.array(audio.get_array_of_samples())
        if audio.sample_width == 2:
            audio_data = samples.astype(np.float32) / 32768.0
        elif audio.sample_width == 4:
            audio_data = samples.astype(np.float32) / 2147483648.0
        else:
            audio_data = samples.astype(np.float32)
        
        samplerate = 16000
        
        # Transcribe using Whisper model
        result = asr_service.transcribe(audio_data, language=language, sampling_rate=samplerate)
        
        return {
            "text": result["text"],
            "language": language,
            "model": result["model"]
        }

    except Exception as e:
        print(f"ASR Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    
    finally:
        if tmp_input and os.path.exists(tmp_input):
            try: os.unlink(tmp_input)
            except: pass
        if tmp_wav and os.path.exists(tmp_wav):
            try: os.unlink(tmp_wav)
            except: pass

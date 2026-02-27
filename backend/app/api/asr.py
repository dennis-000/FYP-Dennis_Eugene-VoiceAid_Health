from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.asr import asr_service
import tempfile
import os
from pydub import AudioSegment
import numpy as np

router = APIRouter()

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("en") # Default to English
):
    """
    Receives an audio file (WAV/MP3/M4A/MP4) and language ('en' or 'tw').
    Converts it to a numpy array using pydub+ffmpeg, and transcribes using Whisper.
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
        
        # Convert to WAV using pydub (which uses ffmpeg)
        print(f"[ASR] Converting {file_ext} to WAV...")
        audio = AudioSegment.from_file(tmp_input)
        
        # Convert to mono and set sample rate to 16kHz (Whisper requirement)
        audio = audio.set_channels(1)  # Mono
        audio = audio.set_frame_rate(16000)  # 16kHz
        
        # Export as WAV
        tmp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav').name
        audio.export(tmp_wav, format='wav')
        
        # Convert WAV to numpy array
        samples = np.array(audio.get_array_of_samples())
        
        # Normalize to float32 in range [-1.0, 1.0]
        if audio.sample_width == 2:  # 16-bit
            audio_data = samples.astype(np.float32) / 32768.0
        elif audio.sample_width == 4:  # 32-bit
            audio_data = samples.astype(np.float32) / 2147483648.0
        else:
            audio_data = samples.astype(np.float32)
        
        samplerate = 16000
        
        print(f"[ASR] Audio converted: {len(audio_data)} samples at {samplerate}Hz")
        
        # Transcribe using Whisper model
        result = asr_service.transcribe(audio_data, language=language, sampling_rate=samplerate)
        
        return {
            "text": result["text"],
            "language": language,
            "model": result["model"]
        }

    except Exception as e:
        print(f"ASR Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    
    finally:
        # Clean up temporary files
        if tmp_input and os.path.exists(tmp_input):
            try:
                os.unlink(tmp_input)
            except:
                pass
        if tmp_wav and os.path.exists(tmp_wav):
            try:
                os.unlink(tmp_wav)
            except:
                pass

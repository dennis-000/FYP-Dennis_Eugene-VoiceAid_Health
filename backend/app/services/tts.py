"""
TTS Service using Piper Python library for Kasanoma Twi models

High-quality offline Twi speech synthesis using Piper TTS.
Falls back to None (native TTS) if models unavailable or for non-Twi languages.
"""

import io
import json
import wave
from pathlib import Path
from piper import PiperVoice

# Model paths
MODELS_DIR = Path(__file__).parent.parent.parent / "models"
TWI_MODEL_PATH = MODELS_DIR / "kasanoma-twi-medium.onnx"
TWI_CONFIG_PATH = MODELS_DIR / "kasanoma-twi-medium.onnx.json"

class TTSService:
    def __init__(self):
        self.voice = None
        self.models_available = self._check_and_load_models()
        
    def _check_and_load_models(self) -> bool:
        """Check if Piper models are available and load them"""
        if not MODELS_DIR.exists():
            print(f"[TTS] Models directory not found: {MODELS_DIR}")
            return False
            
        if not TWI_MODEL_PATH.exists() or not TWI_CONFIG_PATH.exists():
            print(f"[TTS] Kasanoma Twi models not found in {MODELS_DIR}")
            print(f"[TTS] Download from: https://github.com/michsethowusu/kasanoma/releases")
            return False
        
        try:
            print(f"[TTS] Loading Kasanoma Twi voice model...")
            self.voice = PiperVoice.load(str(TWI_MODEL_PATH), config_path=str(TWI_CONFIG_PATH))
            print(f"[TTS] ✅ Kasanoma Twi voice loaded successfully!")
            return True
        except Exception as e:
            print(f"[TTS] Error loading Piper voice: {str(e)}")
            return False

    def synthesize(self, text: str, language: str = "tw") -> tuple[io.BytesIO, int]:
        """
        Synthesizes text to speech using Piper TTS.
        
        :param text: Text to synthesize
        :param language: Language code ('tw' for Twi)
        :return: Tuple of (wav_bytes_io, sampling_rate) or (None, 0) for fallback
        """
        # Only support Twi for now
        if language != "tw":
            print(f"[TTS] Language {language} not supported. Using native TTS fallback.")
            return None, 0
            
        # Check if models are available
        if not self.models_available or self.voice is None:
            print(f"[TTS] Piper voice not available. Using native TTS fallback.")
            return None, 0
        
        try:
            print(f"[TTS] 🎤 Synthesizing Twi speech: '{text[:60]}...'")
            
            # Synthesize audio using Piper
            audio_bytes = io.BytesIO()
            
            # Piper generates raw PCM audio
            with wave.open(audio_bytes, 'wb') as wav_file:
                # Get voice config for sample rate
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(self.voice.config.sample_rate)
                
                # Synthesize and write audio
                self.voice.synthesize(text, wav_file)
            
            # Reset BytesIO position to beginning
            audio_bytes.seek(0)
            
            print(f"[TTS] ✅ Successfully synthesized {audio_bytes.getbuffer().nbytes} bytes at {self.voice.config.sample_rate}Hz")
            return audio_bytes, self.voice.config.sample_rate
            
        except Exception as e:
            print(f"[TTS] ❌ Piper synthesis error: {str(e)}")
            import traceback
            traceback.print_exc()
            return None, 0

tts_service = TTSService()

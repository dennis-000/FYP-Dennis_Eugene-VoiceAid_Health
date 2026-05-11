"""
TTS Service using Hugging Face's Massively Multilingual Speech (MMS) for Akan
Model: facebook/mms-tts-aka
"""

import io
import torch
import scipy.io.wavfile
from transformers import VitsModel, AutoTokenizer

class TTSService:
    def __init__(self):
        self.model_id = "facebook/mms-tts-aka"
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.tokenizer = None
        self.models_available = self._load_model()
        
    def _load_model(self) -> bool:
        """Load the MMS Akan TTS model from Hugging Face"""
        try:
            print(f"[TTS] Downloading/Loading {self.model_id} on {self.device}...")
            self.model = VitsModel.from_pretrained(self.model_id).to(self.device)
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_id)
            print(f"[TTS] ✅ Akan TTS voice loaded successfully!")
            return True
        except Exception as e:
            print(f"[TTS] ❌ Error loading TTS model: {str(e)}")
            return False

    def synthesize(self, text: str, language: str = "tw") -> tuple[io.BytesIO, int]:
        """
        Synthesizes text to speech using MMS.
        
        :param text: Text to synthesize
        :param language: Language code ('tw' for Twi/Akan)
        :return: Tuple of (wav_bytes_io, sampling_rate) or (None, 0) for fallback
        """
        if language not in ["tw", "aka", "akan"]:
            print(f"[TTS] Language {language} not supported by this model.")
            return None, 0
            
        if not self.models_available or self.model is None:
            print(f"[TTS] Model not available.")
            return None, 0
        
        try:
            print(f"[TTS] 🎤 Synthesizing: '{text[:60]}...'")
            
            # Tokenize text
            inputs = self.tokenizer(text, return_tensors="pt").to(self.device)
            
            # Generate audio waveform
            with torch.no_grad():
                output = self.model(**inputs).waveform
                
            # Convert to numpy array (1D) and scale to 16-bit integer PCM
            import numpy as np
            audio_numpy = output.squeeze().cpu().numpy()
            audio_numpy_int16 = (audio_numpy * 32767.0).astype(np.int16)
            sample_rate = self.model.config.sampling_rate
            
            # Write to BytesIO Buffer
            audio_bytes = io.BytesIO()
            scipy.io.wavfile.write(audio_bytes, sample_rate, audio_numpy_int16)
            
            audio_bytes.seek(0)
            
            print(f"[TTS] ✅ Successfully synthesized audio at {sample_rate}Hz")
            return audio_bytes, sample_rate
            
        except Exception as e:
            print(f"[TTS] ❌ Synthesis error: {str(e)}")
            import traceback
            traceback.print_exc()
            return None, 0

tts_service = TTSService()

import torch
from transformers import VitsModel, AutoTokenizer
import numpy as np
import io
import soundfile as sf

# Model IDs
MODEL_ID_TWI = "michsethowusu/kasanoma"

class TTSService:
    def __init__(self):
        self.models = {}
        self.tokenizers = {}
        self.device = "cuda:0" if torch.cuda.is_available() else "cpu"

    def load_model(self, model_id=MODEL_ID_TWI):
        """Loads a specific TTS model if not already loaded."""
        if model_id in self.models:
            return

        print(f"Loading TTS Model: {model_id} on {self.device}...")

        try:
            model = VitsModel.from_pretrained(model_id).to(self.device)
            tokenizer = AutoTokenizer.from_pretrained(model_id)

            self.models[model_id] = model
            self.tokenizers[model_id] = tokenizer
            
            print(f"TTS Model {model_id} Loaded Successfully!")
        except Exception as e:
            print(f"Error loading TTS model {model_id}: {str(e)}")
            raise e

    def synthesize(self, text: str, language: str = "tw") -> tuple[io.BytesIO, int]:
        """
        Synthesizes text to speech.
        :param text: Text to synthesize.
        :param language: Language code ('tw').
        :return: Tuple of (wav_bytes_io, sampling_rate).
        """
        if language == "tw":
            model_id = MODEL_ID_TWI
        else:
            # Fallback or TODO for English (could use pyttsx3 or another model)
            print(f"Language {language} not fully supported in local TTS yet.")
            return None, 0

        self.load_model(model_id)
        
        model = self.models[model_id]
        tokenizer = self.tokenizers[model_id]

        inputs = tokenizer(text, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            output = model(**inputs).waveform
        
        # Convert to numpy
        waveform = output.cpu().numpy().squeeze()
        sampling_rate = model.config.sampling_rate
        
        # Write to in-memory WAV file
        byte_io = io.BytesIO()
        sf.write(byte_io, waveform, sampling_rate, format='WAV')
        byte_io.seek(0)
        
        return byte_io, sampling_rate

tts_service = TTSService()

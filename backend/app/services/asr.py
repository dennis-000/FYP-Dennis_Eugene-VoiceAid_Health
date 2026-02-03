import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
import numpy as np

# Model IDs
MODEL_ID_EN = "openai/whisper-base"
MODEL_ID_TWI = "GiftMark/akan-whisper-model"

class ASRService:
    def __init__(self):
        self.pipes = {} # Stores loaded pipelines by model_id
        self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
        self.torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

    def load_model(self, model_id=MODEL_ID_EN):
        """Loads a specific model if not already loaded."""
        if model_id in self.pipes:
            return

        print(f"Loading ASR Model: {model_id} on {self.device}...")

        try:
            model = AutoModelForSpeechSeq2Seq.from_pretrained(
                model_id, 
                torch_dtype=self.torch_dtype, 
                low_cpu_mem_usage=True, 
                use_safetensors=True
            )
            model.to(self.device)

            processor = AutoProcessor.from_pretrained(model_id)

            self.pipes[model_id] = pipeline(
                "automatic-speech-recognition",
                model=model,
                tokenizer=processor.tokenizer,
                feature_extractor=processor.feature_extractor,
                max_new_tokens=128,
                chunk_length_s=30,
                batch_size=16,
                torch_dtype=self.torch_dtype,
                device=self.device,
            )
            print(f"ASR Model {model_id} Loaded Successfully!")
        except Exception as e:
            print(f"Error loading model {model_id}: {str(e)}")
            raise e

    def transcribe(self, audio_data: np.ndarray, language: str = "en", sampling_rate: int = 16000) -> dict:
        """
        Transcribes the given audio data.
        :param audio_data: Numpy array of audio samples (float32).
        :param language: Language code ('en' or 'tw').
        :param sampling_rate: Sampling rate of the audio (default 16000).
        :return: Dict containing transcription and metadata.
        """
        # Determine model based on language
        if language == "tw":
            model_id = MODEL_ID_TWI
            task_lang = "akan" # Whisper code for Akan if supported, else None allows auto. 
            # Note: GiftMark model is fine-tuned, might not need explicit lang code if it Overfits to Akan.
            # But standard whisper expects language codes. 'en' works. 'tw' might fall back.
        else:
            model_id = MODEL_ID_EN
            task_lang = "english"

        # Load if needed
        self.load_model(model_id)
        pipe = self.pipes[model_id]
            
        print(f"Processing audio for transcription (Lang: {language}, Model: {model_id})...")
        
        # Determine generation kwargs
        gen_kwargs = {}
        if language == "en":
            gen_kwargs["language"] = "english"
        
        # Run inference
        result = pipe(audio_data, generate_kwargs=gen_kwargs)
        
        if not result or 'text' not in result:
             return {"text": "", "model": model_id}
            
        return {"text": result['text'].strip(), "model": model_id}

# Singleton instance
asr_service = ASRService()

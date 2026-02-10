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
        # Normalize language code
        if language:
            language = language.lower().strip()
            
        is_twi = language in ["tw", "twi", "akan"]
        
        if is_twi:
            model_id = MODEL_ID_TWI
            # For Akan model, we might not pass 'language' if it's specialized, 
            # or pass 'en' if the model was trained to transcribe Twi as English? 
            # Usually, standard Whisper expects a valid ISO code. 
            # 'ak' is the code for Akan. 
            task_lang = "akan" 
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
        elif is_twi:
             # For Akan: Let model detect (it's fine-tuned) or explicitly set
             # The model config has forced_decoder_ids which override this anyway
             # But we can add task-specific hints
             # gen_kwargs["language"] = "akan"  # REMOVED: Invalid Whisper language code
             
             # For speech-impaired: allow longer outputs, handle repetitions
             gen_kwargs["max_new_tokens"] = 256  # Increased from 128 for longer utterances
             gen_kwargs["repetition_penalty"] = 1.2  # Reduce stuttering artifacts
        else:
             # For Auto/Ga/Other: Let Whisper detect language
             # Multilingual mode with auto-detection
             pass
        
        # Run inference
        result = pipe(audio_data, generate_kwargs=gen_kwargs)
        
        if not result or 'text' not in result:
             return {"text": "", "model": model_id, "detectedLanguage": language}
             
        # Add basic language detection result if available (Whisper returns it in chunks usually)
        # But pipeline output is just text.
        transcribed_text = result['text'].strip()
        
        # Post-processing for speech-impaired: remove excessive repetition
        # Example: "k-k-kɔ kɔ" might become "kɔ kɔ" after model, we can further clean
        # But be careful not to remove legitimate repeated words
        
        return {"text": transcribed_text, "model": model_id, "detectedLanguage": language}

# Singleton instance
asr_service = ASRService()

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
        # SPEECH-IMPAIRED OPTIMIZATIONS: Applied to ALL languages
        gen_kwargs = {
            "max_new_tokens": 256,  # Allow longer utterances (speech-impaired may speak slower)
            "repetition_penalty": 1.3,  # Reduce stuttering/repetition artifacts (increased from 1.2)
            "no_repeat_ngram_size": 3,  # Prevent exact 3-word phrase repetitions
            "temperature": 0.6,  # Lower temperature for more focused predictions
        }
        
        if language == "en":
            gen_kwargs["language"] = "english"
        elif is_twi:
             # For Akan: Let model detect (it's fine-tuned) or explicitly set
             # The model config has forced_decoder_ids which override this anyway
             pass
        else:
             # For Auto/Ga/Other: Let Whisper detect language
             # Multilingual mode with auto-detection
             pass
        
        # Run inference
        result = pipe(audio_data, generate_kwargs=gen_kwargs)
        
        if not result or 'text' not in result:
             return {"text": "", "model": model_id, "detectedLanguage": language}
             
        # Get transcribed text
        transcribed_text = result['text'].strip()
        
        # POST-PROCESSING FOR SPEECH-IMPAIRED
        # Remove excessive repetitions (e.g., "I I I want" -> "I want")
        import re
        
        # Remove single-word repetitions (stuttering)
        # Pattern: word repeated 2+ times consecutively
        def remove_stuttering(text):
            # Match word boundaries to avoid breaking compound words
            # Example: "I I I want" -> "I want", "k-k-kɔ" -> "kɔ"
            words = text.split()
            cleaned_words = []
            prev_word = None
            repeat_count = 0
            
            for word in words:
                # Normalize word (remove hyphens, lowercase for comparison)
                normalized = word.lower().replace('-', '')
                
                if normalized == prev_word:
                    repeat_count += 1
                    # Only keep first instance of repeated word
                    continue
                else:
                    cleaned_words.append(word)
                    prev_word = normalized
                    repeat_count = 0
            
            return ' '.join(cleaned_words)
        
        # Apply stuttering removal
        transcribed_text = remove_stuttering(transcribed_text)
        
        # Remove excessive punctuation repetitions (e.g., "..." -> ".")
        transcribed_text = re.sub(r'([.,!?])\1+', r'\1', transcribed_text)
        
        return {"text": transcribed_text, "model": model_id, "detectedLanguage": language}

# Singleton instance
asr_service = ASRService()

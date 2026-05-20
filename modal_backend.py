"""
VoiceAid Health — Modal.dev Backend
Deploy with: modal deploy modal_backend.py
"""

import modal
import io
import re
import json
import base64

# ─── Modal App Definition ────────────────────────────────────────────────────

app = modal.App("voiceaid-health")

# Docker image with all required ML dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi==0.115.0",
        "uvicorn[standard]==0.30.0",
        "transformers==4.45.0",
        "torch==2.4.0",
        "torchaudio==2.4.0",
        "pydub==0.25.1",
        "soundfile==0.12.1",
        "python-multipart==0.0.12",
        "scipy==1.13.0",
        "websockets==12.0",
        "accelerate==0.34.0",
        "librosa==0.10.2",
        "numpy==1.26.4",
    )
    .apt_install("ffmpeg")  # Required by pydub for audio processing
)

# ─── FastAPI App (runs inside Modal container) ────────────────────────────────

@app.function(
    image=image,
    gpu="T4",
    timeout=600,
    scaledown_window=300,
    memory=8192,
)
@modal.asgi_app()
def fastapi_app():
    import torch
    import numpy as np
    import scipy.io.wavfile
    from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect
    from fastapi.responses import StreamingResponse, JSONResponse
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    from starlette.types import ASGIApp, Receive, Scope, Send
    from transformers import (
        AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline,
        VitsModel, AutoTokenizer, AutoModelForCausalLM
    )

    # ── PERMANENT FIX: Patch Whisper _need_fallback ──
    import transformers.models.whisper.generation_whisper as _gw
    _orig = _gw.WhisperGenerationMixin._need_fallback
    def _safe(self, *a, **kw):
        try: return _orig(self, *a, **kw)
        except UnboundLocalError: return False, False
    _gw.WhisperGenerationMixin._need_fallback = _safe
    print("✅ Whisper fallback patched")

    # ── Device Setup ──────────────────────────────────────────────────────────
    GPU_AVAILABLE = torch.cuda.is_available()
    DEVICE        = 'cuda' if GPU_AVAILABLE else 'cpu'
    DTYPE         = torch.float16 if GPU_AVAILABLE else torch.float32
    LLM_ENABLED   = GPU_AVAILABLE
    EN_ASR_MODEL  = 'openai/whisper-medium' if GPU_AVAILABLE else 'openai/whisper-small'

    print(f'[VoiceAid] Backend starting in {"GPU" if GPU_AVAILABLE else "CPU"} mode')

    # ── FastAPI Setup ─────────────────────────────────────────────────────────
    backend = FastAPI(
        title='VoiceAid Health Backend',
        description='Speech AI for speech-impaired patients'
    )

    class WebSocketOriginBypassMiddleware:
        def __init__(self, app: ASGIApp): self.app = app
        async def __call__(self, scope: Scope, receive: Receive, send: Send):
            if scope['type'] == 'websocket':
                headers = [(k, v) for k, v in scope.get('headers', []) if k.lower() != b'origin']
                headers.append((b'origin', b'http://localhost'))
                scope['headers'] = headers
            await self.app(scope, receive, send)

    backend.add_middleware(WebSocketOriginBypassMiddleware)
    backend.add_middleware(
        CORSMiddleware,
        allow_origins=['*'],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    # ── Model Caches ──────────────────────────────────────────────────────────
    asr_pipes  = {}
    tts_models = {}
    llm_model  = None
    llm_tok    = None

    ASR_KWARGS = {
        'max_new_tokens': 128,
        'temperature': 0.0,
        'condition_on_prev_tokens': False,
        'no_speech_threshold': 0.6,
        'repetition_penalty': 1.3,
        'logprob_threshold': None,
    }

    def dysarthric_filter(text: str) -> str:
        text = re.sub(r'\b(.+?)(?:\s+\1\b)+', r'\1', text, flags=re.IGNORECASE)
        text = re.sub(r'(.)\1{2,}', r'\1\1', text)
        return text.strip()

    def load_asr(language='tw'):
        model_id = (
            'dennis-9/whisper-small_Akan_finetuned_v2'
            if language in ['tw', 'twi', 'akan'] else EN_ASR_MODEL
        )
        if model_id in asr_pipes:
            return model_id
        print(f'🔥 Loading ASR ({model_id}) on {DEVICE.upper()}...')
        model = AutoModelForSpeechSeq2Seq.from_pretrained(model_id, torch_dtype=DTYPE).to(DEVICE)
        model.generation_config.logprob_threshold = None  # Fix UnboundLocalError
        try:
            processor = AutoProcessor.from_pretrained(model_id)
        except Exception as e:
            print(f"⚠️ Warning: Failed to load processor for {model_id} due to missing config: {e}")
            print("🚀 Loading base processor from 'openai/whisper-small' as fallback...")
            processor = AutoProcessor.from_pretrained('openai/whisper-small')

        asr_pipes[model_id] = pipeline(
            'automatic-speech-recognition', model=model,
            tokenizer=processor.tokenizer,
            feature_extractor=processor.feature_extractor,
            torch_dtype=DTYPE, device=DEVICE, chunk_length_s=30,
        )
        print(f'✅ ASR Loaded: {model_id}')
        return model_id

    def load_tts(lang_code):
        if lang_code in tts_models:
            return tts_models[lang_code]
        model_id = 'facebook/mms-tts-aka' if lang_code == 'tw' else 'facebook/mms-tts-eng'
        print(f'🌟 Loading TTS ({model_id})...')
        model     = VitsModel.from_pretrained(model_id).to(DEVICE)
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        tts_models[lang_code] = (model, tokenizer)
        return model, tokenizer

    def load_llm():
        nonlocal llm_model, llm_tok
        if llm_model:
            return
        mid = 'Qwen/Qwen2.5-1.5B-Instruct'
        print(f'🧠 Loading LLM ({mid})...')
        llm_tok   = AutoTokenizer.from_pretrained(mid)
        llm_model = AutoModelForCausalLM.from_pretrained(mid, torch_dtype=DTYPE, device_map=DEVICE)
        print('✅ LLM Loaded!')

    # ── Health Routes ─────────────────────────────────────────────────────────

    @backend.get('/')
    async def root():
        return {
            'message': 'VoiceAid Health Backend is Online!',
            'gpu': GPU_AVAILABLE,
            'mode': 'gpu' if GPU_AVAILABLE else 'cpu',
            'llm': LLM_ENABLED
        }

    @backend.get('/health')
    async def health():
        return {'status': 'healthy', 'gpu': GPU_AVAILABLE, 'llm': LLM_ENABLED}

    # ── ASR Routes ────────────────────────────────────────────────────────────

    @backend.post('/asr/transcribe')
    async def transcribe(file: UploadFile = File(...), language: str = Form('tw')):
        from pydub import AudioSegment
        audio = AudioSegment.from_file(io.BytesIO(await file.read()))
        audio = audio.set_channels(1).set_frame_rate(16000)
        samples = np.array(audio.get_array_of_samples()).astype(np.float32) / 32768.0
        model_id = load_asr(language)
        result = asr_pipes[model_id](samples, generate_kwargs=ASR_KWARGS)
        return {'text': dysarthric_filter(result['text']), 'model': model_id, 'language': language}

    @backend.websocket('/asr/stream')
    async def stream_transcription(websocket: WebSocket):
        await websocket.accept()
        print(f'✅ WebSocket connected ({DEVICE.upper()} mode)')
        try:
            while True:
                data     = await websocket.receive_text()
                message  = json.loads(data)
                audio_b64 = message.get('audio')
                language  = message.get('language', 'tw')
                chunk_id  = message.get('chunk_id', 0)
                if not audio_b64:
                    continue

                from pydub import AudioSegment
                audio = (
                    AudioSegment.from_file(io.BytesIO(base64.b64decode(audio_b64)))
                    .set_channels(1).set_frame_rate(16000)
                )
                samples = np.array(audio.get_array_of_samples()).astype(np.float32) / 32768.0
                model_id = load_asr(language)
                result   = asr_pipes[model_id](samples, generate_kwargs=ASR_KWARGS)
                clean    = dysarthric_filter(result['text'])

                if not clean or len(clean.strip()) < 2:
                    print(f'[ASR] ⏭️ Skipping silent chunk {chunk_id}')
                    continue

                await websocket.send_json({
                    'text': clean, 'chunk_id': chunk_id,
                    'model': model_id, 'is_final': False, 'language': language,
                })
        except WebSocketDisconnect:
            print('📴 WebSocket client disconnected.')

    # ── Intent Predictor (LLM) ────────────────────────────────────────────────

    class PredictRequest(BaseModel):
        text: str
        language: str = 'tw'

    @backend.post('/predict/intent')
    async def predict_intent(req: PredictRequest):
        if not LLM_ENABLED:
            return JSONResponse(status_code=501,
                content={'error': 'LLM disabled — GPU not available.'})
        load_llm()
        lang_name = (
            'Akan/Twi' if req.language in ['tw', 'twi', 'akan']
            else 'Ga' if req.language == 'ga' else 'English'
        )
        messages = [
            {'role': 'system', 'content': (
                f'You are a medical AI for a speech-impaired patient. '
                f'Expand their fragmented {lang_name} speech into ONE complete, '
                f'polite sentence in {lang_name}. Output ONLY the sentence.'
            )},
            {'role': 'user', 'content': req.text},
        ]
        text_in = llm_tok.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs  = llm_tok(text_in, return_tensors='pt').to(DEVICE)
        with torch.no_grad():
            out = llm_model.generate(
                **inputs, max_new_tokens=50, temperature=0.3,
                do_sample=True, pad_token_id=llm_tok.eos_token_id
            )
        predicted = llm_tok.decode(
            out[0][inputs.input_ids.shape[1]:], skip_special_tokens=True
        ).strip()
        return {'predicted': predicted, 'language': req.language}

    # ── TTS Route ─────────────────────────────────────────────────────────────

    class TTSRequest(BaseModel):
        text: str
        language: str = 'tw'

    @backend.post('/tts/synthesize')
    @backend.get('/tts/synthesize')
    async def synthesize(request_or_text = '', language: str = 'tw'):
        text = request_or_text.text if hasattr(request_or_text, 'text') else request_or_text
        lang_id = 'tw' if language in ['tw', 'twi', 'akan'] else 'eng'
        model, tokenizer = load_tts(lang_id)
        inputs = tokenizer(text, return_tensors='pt').to(DEVICE)
        with torch.no_grad():
            output = model(**inputs).waveform
        audio_np = output.squeeze().cpu().numpy()
        sr       = model.config.sampling_rate
        audio_np = np.pad(audio_np, (0, int(0.5 * sr)), mode='constant')
        audio_np = (audio_np * 32767.0).astype(np.int16)
        audio_io = io.BytesIO()
        scipy.io.wavfile.write(audio_io, sr, audio_np)
        audio_io.seek(0)
        return StreamingResponse(audio_io, media_type='audio/wav')

    return backend

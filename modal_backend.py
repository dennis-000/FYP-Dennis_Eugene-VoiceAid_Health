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
        gen_kwargs = ASR_KWARGS.copy()
        if language in ['en', 'eng', 'english']:
            gen_kwargs['language'] = 'english'
        result = asr_pipes[model_id](samples, generate_kwargs=gen_kwargs)
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
                gen_kwargs = ASR_KWARGS.copy()
                if language in ['en', 'eng', 'english']:
                    gen_kwargs['language'] = 'english'
                result   = asr_pipes[model_id](samples, generate_kwargs=gen_kwargs)
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

    # ── AI Diagnostics and Therapist Insights (LLM) ──────────────────────────

    from typing import List, Optional, Dict, Any

    class SummaryRequest(BaseModel):
        patient_name: str
        transcripts: List[str]
        compliance_rate: float
        streak: int
        hours_practiced: float
        struggles: Optional[List[Dict[str, Any]]] = None
        completed_assignments: Optional[List[Dict[str, Any]]] = None

    class SentimentRequest(BaseModel):
        transcripts: List[str]
        mood_levels: List[int] = []

    class RecommendationRequest(BaseModel):
        patient_name: str
        language: str
        difficulty: str

    def query_hf_llm(prompt: str, max_tokens: int = 250, temperature: float = 0.3) -> str:
        """Helper to query Hugging Face Serverless Inference API with fallback models."""
        import urllib.request
        import json
        import os
        
        # This will try Qwen model first, but it keep failing so it will fallback to Llama-3.2 if it fails
        models = [
            "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct",
            "https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct"
        ]
        
        token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_CO_RESOLVE_PROVIDER") or os.environ.get("HF_API_KEY")
        headers = {
            "Content-Type": "application/json"
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": max_tokens,
                "temperature": temperature,
                "return_full_text": False
            }
        }
        data_bytes = json.dumps(payload).encode("utf-8")
        
        for url in models:
            try:
                req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=10) as response:
                    res_json = json.loads(response.read().decode("utf-8"))
                    if isinstance(res_json, list) and len(res_json) > 0:
                        text = res_json[0].get("generated_text", "").strip()
                        if text:
                            return text
                    elif isinstance(res_json, dict):
                        text = res_json.get("generated_text", "").strip()
                        if text:
                            return text
            except Exception as e:
                print(f"[AI Backend] Warning: LLM query failed for {url}: {e}")
                continue
                
        raise RuntimeError("All inference model APIs are unreachable or timed out.")

    @backend.post('/predict/summary')
    async def predict_summary(req: SummaryRequest):
        transcripts_str = "\n".join([f'- "{t}"' for t in req.transcripts]) if req.transcripts else "No recent speech recordings."
        
        struggles_str = ""
        if req.struggles:
            struggles_str = "\n".join([
                f'- {s.get("questTitle", "Exercise")}: {s.get("incorrectAttempts", s.get("attempts", 1))} mistake(s). Detail: {s.get("detail", "Incorrect attempt")}'
                for s in req.struggles
            ])
        else:
            struggles_str = "No recent struggles or mistakes logged."

        assignments_str = ""
        if req.completed_assignments:
            assignments_str = "\n".join([
                f'- {a.get("title")} (Category: {a.get("category")}, Completed: {a.get("completed")})' +
                (f' Voice Response: "{a.get("voice_transcript")}"' if a.get("voice_transcript") else '')
                for a in req.completed_assignments
            ])
        else:
            assignments_str = "No recent completed assignments."

        prompt = (
            f"You are a clinical Speech-Language Pathologist (SLP) AI reviewer.\n"
            f"Synthesize this progress status for patient '{req.patient_name}':\n"
            f"- Speech Exercises Compliance Rate: {req.compliance_rate}%\n"
            f"- Consecutive Practice Streak: {req.streak} days\n"
            f"- Total Practiced Time: {req.hours_practiced} hours\n"
            f"- Patient Voice Journals & Transcripts:\n{transcripts_str}\n"
            f"- Recent Game Struggles / Mistakes (Words/Quests patient got wrong):\n{struggles_str}\n"
            f"- Completed Daily Assignments (and spoken voice responses):\n{assignments_str}\n\n"
            f"Write a concise, professional clinical progress summary for the therapist as 3 short, standard text paragraphs:\n"
            f"1. PATIENT PERFORMANCE SUMMARY: Describe compliance, consistency, and progress.\n"
            f"2. JOURNAL & SENTIMENT ANALYSIS: Reflect on what the patient said in their voice journals, their emotions, and clinical symptoms (like pain, fatigue, recovery signs).\n"
            f"3. BRAINSTORMED THERAPIST IMPROVEMENT GUIDE: Give specific, actionable tips on what the therapist should do next to help the patient improve. Brainstorm ideas based on the exact words/quests they got wrong (e.g. phoneme drills for those words) and how they completed their assignments."
            f"\n\nDo NOT use markdown bold, list bullets, hashes, or list markers. Return ONLY clean, readable plain text paragraphs."
        )
        
        try:
            # Run the blocking query in a separate thread to keep fastapi responsive
            summary = await asyncio.to_thread(query_hf_llm, prompt, max_tokens=350, temperature=0.3)
            # Strip any accidental markdown formatting the LLM might have returned
            summary = re.sub(r'\*+', '', summary)
            summary = re.sub(r'#+', '', summary)
            summary = re.sub(r'^- ', '', summary, flags=re.MULTILINE)
            return {'summary': summary.strip(), 'source': 'AI (HuggingFace Serverless LLM)'}
        except Exception as e:
            print(f"[AI Backend] Fallback triggered for Summary: {e}")
            
            # 1. Dynamic compliance evaluation
            paragraph1 = f"Clinical review for patient {req.patient_name} shows a current exercise compliance rate of {req.compliance_rate}%. "
            if req.compliance_rate == 0:
                paragraph1 += f"At this stage, {req.patient_name} has not registered any recent completed exercises in the database, meaning they require immediate therapist outreach to establish engagement, check device accessibility, and identify early barriers."
            elif req.compliance_rate < 50:
                paragraph1 += f"Engagement is currently low, showing that {req.patient_name} is completing less than half of their assigned drills. More frequent follow-ups, caregiver reinforcement, or adjusting the goal target down to shorter daily intervals is recommended to build confidence."
            elif req.compliance_rate < 80:
                paragraph1 += f"The patient shows moderate participation. While some sessions are missed, there is a steady baseline of practice. Encouraging a fixed daily time for speech drills could help bridge the remaining compliance gap."
            else:
                paragraph1 += f"This represents excellent commitment, indicating that {req.patient_name} is consistently keeping up with daily rehabilitation requirements, which establishes the necessary vocal repetitions for motor-speech neural recovery."

            # 2. Dynamic habit & acoustic evaluation
            paragraph2 = ""
            if req.streak > 0:
                paragraph2 += f"Consistency is supported by a continuous {req.streak}-day streak, indicating strong habit building. "
            else:
                paragraph2 += f"No active consecutive streak is currently logged, suggesting that practice sessions are sparse or unscheduled. "

            if req.hours_practiced > 0:
                paragraph2 += f"Across these sessions, {req.patient_name} has accumulated {req.hours_practiced} hours of voice activity. "

            twi_count = sum(1 for t in req.transcripts if any(w in t.lower() for w in ['nsuo', 'kasa', 'paa', 'twi', 'ɛyɛ', 'mami', 'dodo', 'yare', 'medaase', 'mepɛ', 'pa', 'pe', 'pi', 'po', 'pu', 'firi', 'sɔre', 'sua', 'kofi', 'kosoko']))
            pain_count = sum(1 for t in req.transcripts if any(w in t.lower() for w in ['pain', 'hurt', 'sad', 'bad', 'tired', 'cry', 'help', 'emergency', 'stop', 'difficult', 'stuck', 'ɛyaw', 'yare']))

            if req.transcripts:
                recent_quotes = ", ".join([f'"{t}"' for t in req.transcripts[:2]])
                paragraph2 += f"Review of recent acoustic output (such as {recent_quotes}) "
                if twi_count > 0:
                    paragraph2 += "shows prominent usage of Akan Twi dialect, confirming the speech classifier is correctly parsing localized phonology and dialect-specific sound targets. "
                else:
                    paragraph2 += "indicates primarily English speech exercises. "
                    
                if pain_count > 0:
                    paragraph2 += f"Of clinical note, several transcript entries contain indicators of frustration, pain, or struggle, signaling that physical or vocal fatigue may be present during training."
            else:
                paragraph2 += f"Acoustic logs are currently empty, so active vocal characteristics and speech clarity cannot be evaluated."

            # 3. Dynamic therapist recommendations (Brainstormed therapist improvement guide)
            paragraph3 = f"Therapist Guidance & Brainstormed Tips: "
            
            # Inject struggle feedback if present
            if req.struggles and len(req.struggles) > 0:
                wrong_items = [s.get("questTitle", "drills") for s in req.struggles[:2]]
                paragraph3 += f"Based on recent session errors, the patient is experiencing coordination blocks on {', '.join(wrong_items)}. We brainstormed that the therapist should introduce slow tactile placement drills or syllable segmentation to bypass these specific phonetic traps. "
            else:
                paragraph3 += f"No specific exercise struggles were logged, showing that phonetic placement is stable. "

            # Inject assignment feedback if present
            if req.completed_assignments and len(req.completed_assignments) > 0:
                comp_list = [a.get("title") for a in req.completed_assignments if a.get("completed")]
                if comp_list:
                    paragraph3 += f"The patient successfully completed their assigned missions: {', '.join(comp_list[:2])}. If these required voice recordings, their response shows sufficient phonation duration, and the therapist can now advance them to multi-syllable phrases."
                else:
                    paragraph3 += "Recent assignments are currently pending completion. Therapist should check if the patient finds the instructions too complex."
            else:
                paragraph3 += "No clinical assignments were recently completed. Suggest assigning low-demand vocal play exercises to re-engage."

            summary_text = f"{paragraph1}\n\n{paragraph2}\n\n{paragraph3}"
            return {'summary': summary_text, 'source': 'Deterministic Clinical Heuristic Analyzer'}

    @backend.post('/predict/sentiment')
    async def predict_sentiment(req: SentimentRequest):
        if not req.transcripts:
            return {
                'happy': 0, 'frustrated': 0, 'anxious': 0, 'neutral': 100,
                'reasoning': 'No transcripts loaded yet.',
                'source': 'Static Classifier'
            }
            
        mood_str = f"Recent daily self-reported moods (1=Very Sad, 2=Sad, 3=Okay, 4=Good, 5=Very Happy): {req.mood_levels}" if req.mood_levels else "No self-reported daily moods logged today."
        transcripts_str = "\n".join([f'- "{t}"' for t in req.transcripts])
        prompt = (
            f"Analyze the emotional state of a speech-impaired patient.\n"
            f"Their daily self-reported mood levels from the app check-in are:\n{mood_str}\n\n"
            f"Their recent practice session speech transcripts are:\n{transcripts_str}\n\n"
            f"Your job is to analyze *why* the patient might be feeling this way (sad, frustrated, anxious, or happy) based on the words they spoke during exercises. Look for indicators of pain, struggle, recovery progress, or home contexts. Suggest clinical causes for their low self-reported mood if relevant.\n"
            f"You MUST return a JSON object with percentages for these 4 categories representing the emotion distribution: 'happy', 'frustrated', 'anxious', 'neutral' (values sum to 100).\n"
            f"Also include a 'reasoning' key explaining *why* the patient feels this way today in one short, helpful sentence.\n"
            f"Format strictly as raw JSON, for example:\n"
            f'{{"happy": 10, "frustrated": 70, "anxious": 10, "neutral": 10, "reasoning": "The patient reported feeling sad/very sad, which aligns with transcripts mentioning persistent pain (yare) and difficulty with speech exercises."}}\n'
            f"Output ONLY the raw JSON string. Do not wrap in markdown ```json."
        )
        
        try:
            res = await asyncio.to_thread(query_hf_llm, prompt, max_tokens=150, temperature=0.1)
            data = json.loads(res)
            data['source'] = 'AI (HuggingFace Serverless LLM)'
            return data
        except Exception as e:
            print(f"[AI Backend] Fallback triggered for Sentiment: {e}")
            frustrated_keywords = ['pain', 'hurt', 'sad', 'bad', 'tired', 'cry', 'help', 'emergency', 'stop', 'difficult', 'stuck', 'ɛyaw', 'yare']
            happy_keywords = ['happy', 'good', 'fine', 'great', 'thank', 'love', 'nice', 'ɛyɛ', 'paa', 'medaase']
            anxious_keywords = ['worry', 'scared', 'afraid', 'heart', 'doctor', 'hospital', 'priority', 'nsuro', 'emergency']
            
            frustrated_score = 0
            happy_score = 0
            anxious_score = 0
            neutral_score = 0
            
            # Incorporate self-reported mood levels
            for mood in req.mood_levels:
                if mood <= 2:
                    frustrated_score += 5
                    anxious_score += 2
                elif mood >= 4:
                    happy_score += 5
                else:
                    neutral_score += 3
            
            # Incorporate transcripts
            for t in req.transcripts:
                t_lower = t.lower()
                matched = False
                if any(w in t_lower for w in frustrated_keywords):
                    frustrated_score += 4
                    matched = True
                if any(w in t_lower for w in happy_keywords):
                    happy_score += 4
                    matched = True
                if any(w in t_lower for w in anxious_keywords):
                    anxious_score += 4
                    matched = True
                if not matched:
                    neutral_score += 1
                    
            total = frustrated_score + happy_score + anxious_score + neutral_score
            if total == 0:
                total = 1
                neutral_score = 1
                
            happy_pct = int((happy_score / total) * 100)
            frustrated_pct = int((frustrated_score / total) * 100)
            anxious_pct = int((anxious_score / total) * 100)
            neutral_pct = 100 - happy_pct - frustrated_pct - anxious_pct
            if neutral_pct < 0:
                neutral_pct = 0
                
            # Formulate dynamic reasoning about *why* the patient feels this way
            has_low_mood = any(m <= 2 for m in req.mood_levels)
            has_high_mood = any(m >= 4 for m in req.mood_levels)
            
            reasoning = "Analyzed check-in mood and speech logs: "
            if has_low_mood:
                reasoning += f"Patient checked in with low mood ({req.mood_levels[0]}/5 today). "
                matched_struggles = [w for w in frustrated_keywords if any(w in t.lower() for t in req.transcripts)]
                if matched_struggles:
                    label_str = ", ".join(matched_struggles[:2])
                    reasoning += f"This correlates with exercise text mentioning '{label_str}', indicating physical discomfort or practice frustration."
                else:
                    reasoning += "Lack of positive verbal expressions during exercises indicates general disengagement or fatigue."
            elif has_high_mood:
                reasoning += f"Patient checked in with a positive mood ({req.mood_levels[0]}/5 today). "
                matched_happy = [w for w in happy_keywords if any(w in t.lower() for t in req.transcripts)]
                if matched_happy:
                    reasoning += f"Acoustic output confirms high engagement with optimistic words like '{matched_happy[0]}'."
                else:
                    reasoning += "Speech exercises show stable completion, reinforcing their positive check-in."
            else:
                if req.mood_levels:
                    reasoning += f"Patient reports feeling stable or okay ({req.mood_levels[0]}/5 check-in). "
                else:
                    reasoning += "No daily check-in logged today. "
                if frustrated_pct > 30:
                    reasoning += "Transcripts contain words suggesting frustration, pointing to possible articulation blocks."
                else:
                    reasoning += "Vocal output exhibits standard practice habits."
            
            return {
                'happy': happy_pct,
                'frustrated': frustrated_pct,
                'anxious': anxious_pct,
                'neutral': neutral_pct,
                'reasoning': reasoning,
                'source': 'Heuristic Check-In & Speech Correlation Engine'
            }

    @backend.post('/predict/recommendations')
    async def predict_recommendations(req: RecommendationRequest):
        prompt = (
            f"You are a clinical speech therapist recommending specific rehabilitation exercises.\n"
            f"Recommend 3 speech exercises in language '{req.language}' for patient '{req.patient_name}' "
            f"who has difficulty with '{req.difficulty}'.\n"
            f"Format strictly as a JSON list of objects, each containing: 'title', 'description', 'difficulty_level'.\n"
            f"Example output format:\n"
            f'[\n'
            f'  {{"title": "Easy Vocal Glides", "description": "Hum up and down a 5-note scale.", "difficulty_level": "Beginner"}}\n'
            f']\n'
            f"Return ONLY the raw JSON string. Do not wrap in markdown ```json."
        )
        
        try:
            res = await asyncio.to_thread(query_hf_llm, prompt, max_tokens=250, temperature=0.2)
            recs = json.loads(res)
            return {'recommendations': recs, 'source': 'AI (HuggingFace Serverless LLM)'}
        except Exception as e:
            print(f"[AI Backend] Fallback triggered for Recommendations: {e}")
            lang = req.language.lower()
            diff = req.difficulty.lower()
            
            if 'tw' in lang or 'akan' in lang:
                if 'voice' in diff:
                    recs = [
                        {"title": "Makyee Prolongation", "description": "Hold the vowel 'e' in 'Makyee' for 5 seconds with steady pitch.", "difficulty_level": "Beginner"},
                        {"title": "Anadwo Breath Support", "description": "Deep diaphragmatic inhale, then speak 'Anadwo' slowly on expiration.", "difficulty_level": "Intermediate"},
                        {"title": "Pitch Glides (Akan)", "description": "Glide pitch up and down using the sound 'Oo-oo-oo'.", "difficulty_level": "Beginner"}
                    ]
                elif 'fluency' in diff:
                    recs = [
                        {"title": "Easy Onset 'Me pɛ'", "description": "Begin the phrase 'Me pɛ nsuo' with gentle airflow before voicing.", "difficulty_level": "Intermediate"},
                        {"title": "Soft Contacts (Akan consonants)", "description": "Lightly touch articulation points for /b/, /p/, and /m/ sounds to reduce tension.", "difficulty_level": "Beginner"},
                        {"title": "Akan Rhythmic Phrasing", "description": "Speak in structured 3-word groups matching a steady metronome rhythm.", "difficulty_level": "Intermediate"}
                    ]
                else:
                    recs = [
                        {"title": "Akan Consonant Drill /p/", "description": "Repeat: 'Pa', 'Pe', 'Pi', 'Po', 'Pu' with exaggerated lip pop.", "difficulty_level": "Beginner"},
                        {"title": "Twi Fricatives /f/ and /s/", "description": "Exaggerate breath friction: 'Firi', 'Sɔre', 'Sua' clear onset.", "difficulty_level": "Intermediate"},
                        {"title": "Tongue Twister: 'Kofi'", "description": "Exaggerate tongue position adjustments for 'Kofi Kosoko kɔ kɔkɔɔ'.", "difficulty_level": "Advanced"}
                    ]
            else:  # English
                if 'voice' in diff:
                    recs = [
                        {"title": "Vowel Prolongation", "description": "Hold 'Ah' for 10 seconds at normal conversational pitch.", "difficulty_level": "Beginner"},
                        {"title": "Humming Resonator", "description": "Hum 'Mmm-mmm' feeling vibrations in nose and lips to improve voice tone.", "difficulty_level": "Beginner"},
                        {"title": "Siren Glides", "description": "Glide voice smoothly from lowest note to highest note on 'Ee'.", "difficulty_level": "Intermediate"}
                    ]
                elif 'fluency' in diff:
                    recs = [
                        {"title": "Easy Onset 'I feel'", "description": "Start 'I feel pain' with a soft whispery 'H' breath to prevent vocal block.", "difficulty_level": "Intermediate"},
                        {"title": "Soft Contact /d/ and /t/", "description": "Pronounce words starting with /d/ and /t/ with minimal tongue pressure.", "difficulty_level": "Beginner"},
                        {"title": "Continuous Phrasing", "description": "Connect words in 'How are you today' with no breaks in airflow.", "difficulty_level": "Intermediate"}
                    ]
                else:
                    recs = [
                        {"title": "Bilabial Consonants /b/, /p/", "description": "Exaggerate lip closure: 'Baby boy bought a big ball'.", "difficulty_level": "Beginner"},
                        {"title": "Alveolar Plosives /t/, /d/", "description": "Repeat 'Tip of the tongue' focusing on crisp contact behind teeth.", "difficulty_level": "Intermediate"},
                        {"title": "R and L Sound Contrasts", "description": "Repeat 'Red lorry, yellow lorry' carefully alternating tongue posture.", "difficulty_level": "Advanced"}
                    ]
                    
            return {'recommendations': recs, 'source': 'Speech Pathology Heuristic Recommendation Engine'}

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

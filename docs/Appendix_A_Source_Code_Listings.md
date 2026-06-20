# Appendix A: Key Source Code Listings

This appendix provides selected source code listings for the core modules of VoiceAid Health, showing the implementation of speech recognition, synthesis, APIs, database operations, and user screens.

---

## Appendix A.1 – Speech Recognition Module

### A.1.1 – Whisper Transcription Code
*   **Source File**: `hf_space/app.py`
*   **Description**: Receives recorded audio files, resamples the stream to 16kHz mono, checks for silence/noise thresholds, and transcribes the audio using a fine-tuned Whisper model.

```python
@backend.post('/asr/transcribe')
async def transcribe(file: UploadFile = File(...), language: str = Form('tw')):
    from pydub import AudioSegment
    audio = AudioSegment.from_file(io.BytesIO(await file.read()))
    audio = audio.set_channels(1).set_frame_rate(16000)
    samples = np.array(audio.get_array_of_samples()).astype(np.float32) / 32768.0
    
    if is_silent_or_noise(samples):
        print('[ASR] ⏭️ Skipping silent/empty audio file')
        return {'text': '', 'model': 'none', 'language': language}

    model_id = load_asr(language)
    gen_kwargs = ASR_KWARGS.copy()
    if language in ['en', 'eng', 'english']:
        gen_kwargs['language'] = 'english'
    result = await asyncio.to_thread(asr_pipes[model_id], samples, generate_kwargs=gen_kwargs)
    return {'text': dysarthric_filter(result['text']), 'model': model_id, 'language': language}
```

### A.1.2 – Audio Processing & Cleaning Functions
*   **Source Files**: `hf_space/app.py` & `services/audioPreprocessingService.ts`
*   **Description**: Provides a backend regex filter to remove vocal stutters/loops, and client-side Voice Activity Detection (VAD) thresholds.

```python
# Backend Dysarthric Text Cleaning Filter (app.py)
def dysarthric_filter(text: str) -> str:
    if not text:
        return text
    
    # 1. Stuttering prefixes (e.g., "b-b-boy" -> "boy", "m m mother" -> "mother")
    text = re.sub(r'\b(\w)[\s,-]+(?:\1[\s,-]+)*\1(\w+)\b', r'\1\2', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(\w)[\s,-]+\1(\w+)\b', r'\1\2', text, flags=re.IGNORECASE)

    # 2. Remove repeated characters (e.g., 'aaa' -> 'aa')
    text = re.sub(r'(.)\1{2,}', r'\1\1', text)
    
    # 3. Remove consecutive repeated words with punctuation in between (e.g., "My, my..my" -> "My")
    text = re.sub(r'\b(\w+)\b(?:\W+\1\b)+', r'\1', text, flags=re.IGNORECASE)
    
    # 4. Remove consecutive repeated phrases, including optional fillers (e.g., um, uh, ah, ɛnna)
    text = re.sub(r'\b(.+?)(?:[\s,.]+(?:um|uh|ah|like|ɛnna|na)?[\s,.]+\1\b)+', r'\1', text, flags=re.IGNORECASE)
    
    return text.strip()
```

```typescript
// Client-Side Voice Activity Detection (audioPreprocessingService.ts)
export const AudioPreprocessingService = {
    isSpeechDetected: (meteringData: number[]): boolean => {
        if (meteringData.length < 5) return true; // Default to true if insufficient data

        const peak = Math.max(...meteringData);
        const average = meteringData.reduce((a, b) => a + b, 0) / meteringData.length;

        // Lenient threshold specifically tuned for soft-spoken dysarthric speech patterns
        return peak > -32 && average > -45;
    }
};
```

---

## Appendix A.2 – Text-to-Speech Module

### A.2.1 – TTS Generation Code
*   **Source File**: `hf_space/app.py`
*   **Description**: Generates natural speech waveforms for Akan Twi or Ga text queries using Facebook's MMS VITS models.

```python
@backend.post('/tts/synthesize')
async def synthesize_post(req: TTSRequest):
    lang_id = 'tw' if req.language in ['tw', 'twi', 'akan'] else 'eng'
    model, tokenizer = load_tts(lang_id)
    inputs = tokenizer(req.text, return_tensors='pt').to(DEVICE)
    with torch.no_grad():
        output = model(**inputs).waveform
    audio_np = output.squeeze().cpu().numpy()
    sr       = model.config.sampling_rate
    audio_np = np.pad(audio_np, (0, int(0.5 * sr)), mode='constant') # Pad output buffer
    audio_np = (audio_np * 32767.0).astype(np.int16)
    audio_io = io.BytesIO()
    scipy.io.wavfile.write(audio_io, sr, audio_np)
    audio_io.seek(0)
    return StreamingResponse(audio_io, media_type='audio/wav')
```

### A.2.2 – Audio Playback Functions
*   **Source File**: `services/tts/index.ts`
*   **Description**: Handles mobile audio retrieval, temporary directory storage writing, and loudspeaker routing logic.

```typescript
// StyleTTS2 API Speech Fetching & Native Audio Player Management (index.ts)
const response = await fetch(ENDPOINTS.TTS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: safeText, language: langCode })
});

if (!response.ok) throw new Error("API Error");

const blob = await response.blob();
const reader = new FileReader();
reader.readAsDataURL(blob);

reader.onloadend = async () => {
    try {
        const base64data = (reader.result as string).split(',')[1];
        const uri = `${FileSystem.documentDirectory}tts_temp.wav`;

        // Write base64 string to temporary device file
        await FileSystem.writeAsStringAsync(uri, base64data, { encoding: 'base64' });

        // Route output to main speaker
        await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false });

        const player = createAudioPlayer(uri);
        player.setPlaybackRate(rate);
        currentSound = player;

        const subscription = player.addListener('playbackStatusUpdate', (status) => {
            if (status.isLoaded && status.didJustFinish) {
                subscription.remove();
                player.release();
                setTimeout(resolve, 500); // Decaying padding
            }
        });

        player.play();
    } catch (e) {
        // Fallback to local Ghanaian English native speech
        Speech.speak(text, { rate, language: 'en-GH', onDone: () => resolve() });
    }
};
```

---

## Appendix A.3 – Backend API

### A.3.1 – FastAPI Routes Initialization
*   **Source File**: `hf_space/app.py`
*   **Description**: Sets up the FastAPI instances, registers the websockets router, and configures starlette CORS policies.

```python
backend = FastAPI(
    title='VoiceAid Health Backend',
    description='Speech AI for speech-impaired patients — hosted on Hugging Face Spaces'
)
backend.add_middleware(WebSocketOriginBypassMiddleware)
backend.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
```

### A.3.2 – Authentication Verification Listing
*   **Source File**: `admin-dashboard/app/login/page.tsx`
*   **Description**: Validates auth sessions and checks role authorizations on the database.

```typescript
const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) throw authError;

        // Perform clinical network admin checks
        const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

        if (adminError) {
            await supabase.auth.signOut();
            throw new Error('No admin record found.');
        }

        router.push('/');
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
};
```

### A.3.3 – Transcription WebSocket Stream
*   **Source File**: `hf_space/app.py`
*   **Description**: Real-time websocket stream handler that receives base64-encoded audio chunks and processes them through the active Whisper pipeline.

```python
@backend.websocket('/asr/stream')
async def stream_transcription(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data      = await websocket.receive_text()
            message   = json.loads(data)
            audio_b64 = message.get('audio')
            language  = message.get('language', 'tw')
            chunk_id  = message.get('chunk_id', 0)
            if not audio_b64: continue

            from pydub import AudioSegment
            audio = AudioSegment.from_file(io.BytesIO(base64.b64decode(audio_b64))).set_channels(1).set_frame_rate(16000)
            samples  = np.array(audio.get_array_of_samples()).astype(np.float32) / 32768.0
            
            if is_silent_or_noise(samples):
                await websocket.send_json({'text': '', 'chunk_id': chunk_id, 'is_final': False})
                continue

            model_id = load_asr(language)
            gen_kwargs = ASR_KWARGS.copy()
            if language in ['en', 'eng']: gen_kwargs['language'] = 'english'
            
            result = await asyncio.to_thread(asr_pipes[model_id], samples, generate_kwargs=gen_kwargs)
            clean  = dysarthric_filter(result['text'])

            await websocket.send_json({'text': clean, 'chunk_id': chunk_id, 'is_final': False})
    except WebSocketDisconnect:
        print('📴 WebSocket client disconnected.')
```

---

## Appendix A.4 – Database Operations

### A.4.1 – Supabase Connection Setup
*   **Source File**: `lib/supabase.ts`
*   **Description**: Configures connection variables and enables session cache persistence using AsyncStorage.

```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const isNode = typeof window === 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: isNode ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
```

### A.4.2 – Patient Record Management
*   **Source File**: `services/profileService.ts`
*   **Description**: Registers new patient profile records and handles pairing constraints with assigned therapists.

```typescript
export const createPatientProfile = async (
    patientType: 'guest' | 'hospital',
    userId?: string,
    fullName?: string,
    therapistId?: string,
    hospitalId?: string
): Promise<PatientProfile | null> => {
    try {
        const patientCode = generatePatientCode(); // Generates e.g. PAT-9830
        const { data, error } = await supabase
            .from('patient_profiles')
            .insert({
                user_id: userId || null,
                patient_type: patientType,
                therapist_id: therapistId || null,
                full_name: fullName,
                hospital_id: hospitalId,
                patient_code: patientCode,
            })
            .select().single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating patient profile:', error);
        return null;
    }
};
```

### A.4.3 – Assignment and Progress Storage
*   **Source File**: `services/phraseService.ts`
*   **Description**: Inserts custom phrases assigned by clinical therapists into database schemas.

```typescript
export const PhraseService = {
    addPhrase: async (
        patientId: string,
        therapistProfileId: string,
        text: string,
        twiTranslation: string | null,
        icon: string = 'chatbox-ellipses',
        color: string = '#8b5cf6',
        imageUrl: string | null = null
    ): Promise<Phrase | null> => {
        try {
            if (!therapistProfileId) throw new Error('Missing Therapist ID');

            const { data, error } = await supabase
                .from('phrases')
                .insert([{
                    patient_id: patientId,
                    therapist_id: therapistProfileId,
                    text: text.trim(),
                    twi_translation: twiTranslation ? twiTranslation.trim() : null,
                    icon: icon,
                    color: color,
                    image_url: imageUrl,
                }])
                .select().single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('[PhraseService] Error adding phrase:', error);
            return null;
        }
    }
};
```

---

## Appendix A.5 – Frontend Screens

### A.5.1 – Patient Dashboard (Scanning Engine)
*   **Source File**: `components/ui/PatientDashboard.tsx`
*   **Description**: Accessible scanning engine that periodically cycles highlights across dashboard entries using TTS feedback.

```typescript
useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanningMode && !isScanningPaused) {
        announceItem(0); // Speak first item
        
        interval = setInterval(() => {
            if (!isScanningPaused) {
                setScanningIndex((prev) => {
                    const next = (prev + 1) % scannerItems.length;
                    announceItem(next);
                    return next;
                });
            }
        }, 3500);
    } else if (!isScanningMode) {
        setScanningIndex(-1);
    }
    return () => clearInterval(interval);
}, [isScanningMode, isScanningPaused, patientType, language, ttsSpeed, ttsVoice]);

const announceItem = (index: number) => {
    const item = scannerItems[index];
    if (!item) return;
    
    const routeMap: any = {
        'transcript': tr('speakNow'),
        'phraseboard': tr('phraseBoard'),
        'symbol-speak': tr('symbolSpeak'),
        'journal': tr('voiceJournal'),
        'my-assignments': tr('myAssignments'),
        'emergency-sos': tr('emergencySOSTitle')
    };
    
    const speedMapping: any = { slow: 0.8, normal: 1.0, fast: 1.2 };
    
    TTSService.speak(routeMap[item.id], language as any, { 
        speed: speedMapping[ttsSpeed] || 1.0, 
        gender: ttsVoice || 'female'
    }).catch(() => {});
};
```

### A.5.2 – Developer / System Admin Central Patient Diagnostics View
*   **Source File**: `admin-dashboard/app/patients/[id]/page.tsx`
*   **Description**: Pulls patient compliance logs, exercise metrics, and check-in mood scores to feed administrative AI diagnostics monitoring components.

```typescript
const loadPatientData = async () => {
    try {
        const { data: profileData } = await supabase
            .from('patient_profiles')
            .select('*')
            .eq('id', patientId)
            .single();

        setPatient(profileData);
        const uid = profileData.user_id;

        // Perform parallel queries for logs, exercises, journals and self-reported moods
        const [analyticsRes, transcriptionsRes, moodLogsRes, journalsRes] = await Promise.all([
            supabase.from('patient_analytics').select('*')
                .or(`patient_profile_id.eq.${patientId}${uid ? `,user_id.eq.${uid}` : ''}`),
            supabase.from('transcriptions').select('*')
                .or(`patient_profile_id.eq.${patientId}${uid ? `,user_id.eq.${uid}` : ''}`),
            supabase.from('mood_logs').select('mood_level').eq('patient_id', patientId)
                .order('created_at', { ascending: false }).limit(10),
            supabase.from('voice_journals').select('*').eq('patient_id', patientId)
                .order('created_at', { ascending: false })
        ]);

        setAnalytics(analyticsRes.data || []);
        setTranscriptions(transcriptionsRes.data || []);
        setMoodLevels(moodLogsRes.data?.map((m: any) => m.mood_level) || []);
        setJournals(journalsRes.data || []);
        
    } catch (error) {
        console.error('Error loading patient data:', error);
    }
};
```

### A.5.3 – Recording Screen (Voice Journal)
*   **Source File**: `app/journal.tsx`
*   **Description**: Runs audio permissions, setups recording buffers via `expo-audio`, and manages asynchronous speech processing.

```typescript
const startRecording = async () => {
    if (!audioRecorder) return;
    try {
        const { status } = await AudioModule.requestRecordingPermissionsAsync();
        if (status !== 'granted') return;

        recordingStartTime.current = Date.now();
        await AudioPreprocessingService.configureAudioSession();
        await audioRecorder.prepareToRecordAsync({
            ...RecordingPresets.HIGH_QUALITY,
            isMeteringEnabled: true,
        });
        await audioRecorder.record();
        setIsRecording(true);
        setTimer(0);
        timerInterval.current = setInterval(() => setTimer(prev => prev + 1), 1000);
    } catch (err) {
        console.error('[Journal] Start recording error:', err);
    }
};

const stopRecording = async () => {
    if (!audioRecorder || !audioRecorder.isRecording || !patientId) return;

    setIsRecording(false);
    setIsProcessing(true);
    if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
    }

    try {
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        const durationSeconds = (Date.now() - recordingStartTime.current) / 1000;
        if (!uri) throw new Error('No audio URI');

        const asrLang = language === 'twi' ? 'twi' : 'en';
        const result = await ASRService.processAudio(uri, asrLang);
        const transcript = result.text;

        if (transcript && !transcript.startsWith('Backend')) {
            const clarity = 85; 
            await JournalService.saveJournal(patientId, transcript, uri, durationSeconds, clarity);
            loadData(); // refresh lists
        } else {
            Alert.alert('Not understood', 'Please speak clearly.');
        }
    } catch (err) {
        console.error('[Journal] Stop recording error:', err);
    } finally {
        setIsProcessing(false);
    }
};
```

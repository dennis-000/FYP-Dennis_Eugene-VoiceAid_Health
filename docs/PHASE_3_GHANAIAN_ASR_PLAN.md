# Phase 3: Ghanaian Language ASR Implementation Plan

## 🎯 **Project Goal**

Train and deploy custom Whisper models for **Twi** and **Ga** languages to enable speech recognition for Ghanaian speech-impaired patients.

**Status**: 📋 Planning Phase  
**Priority**: HIGH (Phase 3 MVP)  
**Timeline**: 4-6 weeks

---

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────┐
│               React Native App                      │
│            (VoiceAid Health)                        │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│           FastAPI Backend Server                    │
│         (Handles ASR Requests)                      │
│                                                     │
│  ┌─────────────────┐    ┌──────────────────┐      │
│  │  Twi ASR Model  │    │  Ga ASR Model    │      │
│  │  (Hugging Face) │    │  (Hugging Face)  │      │
│  └─────────────────┘    └──────────────────┘      │
│                                                     │
│  ┌─────────────────────────────────────┐          │
│  │   Groq API (English Fallback)       │          │
│  └─────────────────────────────────────┘          │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│           Firebase Firestore                        │
│  (User data, transcriptions, history)               │
└─────────────────────────────────────────────────────┘
```

---

## 📋 **Implementation Phases**

### **Phase 3.1: Data Collection & Preparation** ⏱️ 1 week

#### **Tasks**:
1. **Gather Twi/Ga Audio Data**
   - Source datasets (CommonVoice, Ghana NLP, etc.)
   - Record custom audio samples (if needed)
   - Minimum: 10-20 hours per language

2. **Data Preprocessing**
   - Convert to required format (WAV, 16kHz)
   - Create train/validation/test splits
   - Prepare transcriptions

3. **Data Augmentation**
   - Add background noise (hospital sounds)
   - Speech impediment simulation
   - Volume variations

**Output**: Clean, formatted dataset ready for training

---

### **Phase 3.2: Model Training on Google Colab** ⏱️ 2 weeks

#### **Setup**:
1. **Google Colab Pro** (recommended for GPU access)
   - Tesla T4/A100 GPU
   - High RAM runtime

2. **Hugging Face Account**
   - Create free account
   - Generate API token

#### **Training Process**:

**Step 1: Environment Setup**
```python
# In Google Colab
!pip install transformers datasets torch torchaudio soundfile
!pip install accelerate jiwer evaluate
```

**Step 2: Load Base Whisper Model**
```python
from transformers import WhisperProcessor, WhisperForConditionalGeneration

# Start with Whisper Small (faster) or Medium (more accurate)
model_name = "openai/whisper-small"
processor = WhisperProcessor.from_pretrained(model_name)
model = WhisperForConditionalGeneration.from_pretrained(model_name)
```

**Step 3: Prepare Dataset**
```python
from datasets import load_dataset, Audio

# Load your custom Twi dataset
dataset = load_dataset("audiofolder", data_dir="./twi_audio_data")
dataset = dataset.cast_column("audio", Audio(sampling_rate=16000))

def prepare_dataset(batch):
    audio = batch["audio"]
    
    # Compute input features
    batch["input_features"] = processor(
        audio["array"], 
        sampling_rate=audio["sampling_rate"]
    ).input_features[0]
    
    # Encode transcriptions
    batch["labels"] = processor.tokenizer(batch["transcription"]).input_ids
    
    return batch

dataset = dataset.map(prepare_dataset, remove_columns=dataset.column_names["train"])
```

**Step 4: Fine-tune Model**
```python
from transformers import Seq2SeqTrainingArguments, Seq2SeqTrainer

training_args = Seq2SeqTrainingArguments(
    output_dir="./whisper-twi",
    per_device_train_batch_size=8,
    gradient_accumulation_steps=2,
    learning_rate=1e-5,
    warmup_steps=500,
    max_steps=5000,
    gradient_checkpointing=True,
    fp16=True,
    evaluation_strategy="steps",
    per_device_eval_batch_size=8,
    save_steps=1000,
    eval_steps=1000,
    logging_steps=25,
    report_to=["tensorboard"],
    load_best_model_at_end=True,
    metric_for_best_model="wer",
    greater_is_better=False,
    push_to_hub=True,
)

trainer = Seq2SeqTrainer(
    args=training_args,
    model=model,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],
    tokenizer=processor.feature_extractor,
)

trainer.train()
```

**Step 5: Evaluate Model**
```python
from evaluate import load

wer_metric = load("wer")

def compute_metrics(pred):
    pred_ids = pred.predictions
    label_ids = pred.label_ids
    
    # Decode predictions
    pred_str = processor.batch_decode(pred_ids, skip_special_tokens=True)
    label_str = processor.batch_decode(label_ids, skip_special_tokens=True)
    
    wer = wer_metric.compute(predictions=pred_str, references=label_str)
    
    return {"wer": wer}
```

**Step 6: Push to Hugging Face**
```python
model.push_to_hub("your-username/whisper-twi")
processor.push_to_hub("your-username/whisper-twi")
```

**Repeat for Ga language**

**Expected Results**:
- Word Error Rate (WER): < 25% (good)
- Word Error Rate (WER): < 15% (excellent)

**Output**: 
- `your-username/whisper-twi` on Hugging Face
- `your-username/whisper-ga` on Hugging Face

---

### **Phase 3.3: FastAPI Backend Development** ⏱️ 1 week

#### **Project Structure**:
```
voiceaid-backend/
├── app/
│   ├── main.py              # FastAPI app
│   ├── models/
│   │   ├── asr_model.py     # Model loading
│   │   └── response.py      # Response schemas
│   ├── routers/
│   │   ├── transcribe.py    # ASR endpoints
│   │   └── health.py        # Health check
│   ├── services/
│   │   ├── whisper_service.py
│   │   └── firebase_service.py
│   └── config.py
├── requirements.txt
├── Dockerfile
└── .env
```

#### **Core Implementation**:

**1. main.py**
```python
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import torchaudio
import io

app = FastAPI(title="VoiceAid ASR API")

# CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models on startup
models = {}

@app.on_event("startup")
async def load_models():
    """Load Twi and Ga models from Hugging Face"""
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    models["twi"] = {
        "processor": WhisperProcessor.from_pretrained("your-username/whisper-twi"),
        "model": WhisperForConditionalGeneration.from_pretrained("your-username/whisper-twi").to(device)
    }
    
    models["ga"] = {
        "processor": WhisperProcessor.from_pretrained("your-username/whisper-ga"),
        "model": WhisperForConditionalGeneration.from_pretrained("your-username/whisper-ga").to(device)
    }
    
    print(f"✅ Models loaded on {device}")

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = "twi"
):
    """
    Transcribe audio file in Twi or Ga
    """
    try:
        # Read audio file
        audio_bytes = await file.read()
        audio_tensor, sample_rate = torchaudio.load(io.BytesIO(audio_bytes))
        
        # Resample to 16kHz if needed
        if sample_rate != 16000:
            resampler = torchaudio.transforms.Resample(sample_rate, 16000)
            audio_tensor = resampler(audio_tensor)
        
        # Get appropriate model
        if language not in models:
            raise HTTPException(400, f"Language {language} not supported")
        
        processor = models[language]["processor"]
        model = models[language]["model"]
        
        # Process audio
        input_features = processor(
            audio_tensor.squeeze().numpy(),
            sampling_rate=16000,
            return_tensors="pt"
        ).input_features
        
        # Generate transcription
        device = "cuda" if torch.cuda.is_available() else "cpu"
        input_features = input_features.to(device)
        
        predicted_ids = model.generate(input_features)
        transcription = processor.batch_decode(
            predicted_ids, 
            skip_special_tokens=True
        )[0]
        
        # Calculate confidence (from logits)
        with torch.no_grad():
            outputs = model(input_features, decoder_input_ids=predicted_ids)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)
            confidence = probs.max(dim=-1).values.mean().item()
        
        return {
            "text": transcription,
            "language": language,
            "confidence": confidence,
            "model": f"whisper-{language}"
        }
        
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": list(models.keys()),
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    }
```

**2. requirements.txt**
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
transformers==4.35.0
torch==2.1.0
torchaudio==2.1.0
firebase-admin==6.2.0
python-dotenv==1.0.0
```

**3. Dockerfile**
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY ./app ./app

# Expose port
EXPOSE 8000

# Run server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Output**: 
- Local FastAPI server running
- Ready for deployment

---

### **Phase 3.4: Deployment** ⏱️ 3 days

#### **Option A: Hugging Face Spaces (Easiest)**
```bash
# Create new Space on Hugging Face
# Upload your FastAPI code
# Add Docker configuration
# Hugging Face provides free tier!
```

#### **Option B: Railway/Render (Fast)**
```bash
# Connect GitHub repo
# Railway auto-deploys
# Free tier available
```

#### **Option C: Google Cloud Run (Scalable)**
```bash
# Build Docker image
gcloud builds submit --tag gcr.io/project-id/voiceaid-backend

# Deploy
gcloud run deploy voiceaid-backend \
  --image gcr.io/project-id/voiceaid-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Output**: Public API URL (e.g., `https://voiceaid-backend.railway.app`)

---

### **Phase 3.5: Firebase Integration** ⏱️ 3 days

#### **Setup Firebase**:

**1. Create Firebase Project**
```bash
npm install -g firebase-tools
firebase login
firebase init
```

**2. Firestore Database Structure**:
```
users/
  ├── {userId}/
      ├── profile/
      │   ├── name: string
      │   ├── role: "patient" | "caregiver"
      │   ├── preferredLanguage: "en" | "twi" | "ga"
      │   └── createdAt: timestamp
      │
      ├── transcriptions/
      │   ├── {transcriptionId}/
      │       ├── text: string
      │       ├── language: string
      │       ├── confidence: number
      │       ├── timestamp: timestamp
      │       └── audioUrl: string (optional)
      │
      └── settings/
          ├── theme: string
          ├── fontSize: number
          └── notifications: boolean
```

**3. Firebase Service (Backend)**:
```python
# app/services/firebase_service.py
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

def save_transcription(user_id: str, transcription: dict):
    """Save transcription to Firestore"""
    doc_ref = db.collection("users").document(user_id)\
                .collection("transcriptions").document()
    
    doc_ref.set({
        "text": transcription["text"],
        "language": transcription["language"],
        "confidence": transcription["confidence"],
        "timestamp": datetime.now(),
        "model": transcription.get("model", "unknown")
    })
    
    return doc_ref.id

def get_user_transcriptions(user_id: str, limit: int = 50):
    """Get user's recent transcriptions"""
    docs = db.collection("users").document(user_id)\
            .collection("transcriptions")\
            .order_by("timestamp", direction=firestore.Query.DESCENDING)\
            .limit(limit)\
            .stream()
    
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]
```

**4. React Native Firebase Setup**:
```bash
npm install @react-native-firebase/app @react-native-firebase/firestore
```

```typescript
// services/firebaseService.ts
import firestore from '@react-native-firebase/firestore';

export const saveTranscription = async (
  userId: string,
  transcription: {
    text: string;
    language: string;
    confidence: number;
  }
) => {
  await firestore()
    .collection('users')
    .doc(userId)
    .collection('transcriptions')
    .add({
      ...transcription,
      timestamp: firestore.FieldValue.serverTimestamp(),
    });
};

export const getUserTranscriptions = async (userId: string) => {
  const snapshot = await firestore()
    .collection('users')
    .doc(userId)
    .collection('transcriptions')
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};
```

---

### **Phase 3.6: App Integration** ⏱️ 3 days

#### **Update asrService.ts**:
```typescript
// services/asrService.ts

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://voiceaid-backend.railway.app';

export const ASRService = {
  processAudio: async (uri: string, selectedLang: SupportedLanguage): Promise<ASRResponse> => {
    
    // English → Use Groq (existing)
    if (selectedLang === 'en') {
      return processWithGroq(uri, selectedLang);
    }
    
    // Twi/Ga → Use custom backend
    if (selectedLang === 'twi' || selectedLang === 'ga') {
      return processWithCustomModel(uri, selectedLang);
    }
    
    // Auto → Detect language then route
    if (selectedLang === 'auto') {
      const detected = await detectLanguageFromAudio(uri);
      if (detected === 'en') {
        return processWithGroq(uri, 'en');
      } else {
        return processWithCustomModel(uri, detected);
      }
    }
  }
};

const processWithCustomModel = async (
  uri: string,
  language: 'twi' | 'ga'
): Promise<ASRResponse> => {
  try {
    const formData = new FormData();
    
    // Prepare audio file
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('file', blob, 'recording.webm');
    } else {
      formData.append('file', {
        uri: uri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      } as any);
    }
    
    formData.append('language', language);
    
    // Send to FastAPI backend
    const response = await fetch(`${BACKEND_URL}/transcribe`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return {
      text: data.text,
      detectedLanguage: language,
      confidence: data.confidence,
      languageConfidence: 0.90,
      hasNoiseDetected: false,
    };
    
  } catch (error) {
    console.error('[Custom Model Error]', error);
    throw error;
  }
};
```

---

## 📊 **Success Metrics**

### **Model Performance**:
- **Target WER**: < 20% for both Twi and Ga
- **Inference Speed**: < 3 seconds per audio
- **Accuracy**: > 80% on test set

### **User Experience**:
- **API Response Time**: < 5 seconds
- **Uptime**: > 99%
- **Error Rate**: < 2%

### **Research Impact**:
- **Dataset Contribution**: Publish anonymized dataset
- **Model Release**: Open-source on Hugging Face
- **Paper Publication**: Submit to ACL/LREC

---

## 💰 **Cost Estimates**

### **Development**:
- Google Colab Pro: $10/month (during training)
- Hugging Face: Free tier sufficient
- Firebase: Free tier (< 1GB data)
- Backend Hosting:
  - Railway: Free tier (500 hours/month)
  - OR Hugging Face Spaces: Free

**Total Monthly Cost**: $0-10 during development

### **Production** (after launch):
- Backend: $10-20/month
- Firebase: $0-5/month (Blaze plan)
- Storage: $5/month

**Total**: ~$15-30/month

---

## 📚 **Resources & References**

### **Training Resources**:
1. **Hugging Face Whisper Fine-tuning Guide**:
   https://huggingface.co/blog/fine-tune-whisper

2. **Common Voice Twi Dataset**:
   https://commonvoice.mozilla.org/tw

3. **Ghana NLP Resources**:
   https://ghananlp.org

### **Deployment Guides**:
1. **FastAPI Deployment**:
   https://fastapi.tiangolo.com/deployment/

2. **Hugging Face Spaces**:
   https://huggingface.co/docs/hub/spaces

3. **Firebase Firestore**:
   https://firebase.google.com/docs/firestore

---

## 🎓 **For Your Thesis**

### **Chapter 3: Methodology**:
- Model architecture (Whisper fine-tuning)
- Training process
- Dataset preparation
- Evaluation metrics

### **Chapter 4: Implementation**:
- Backend architecture
- API design
- Database schema
- Mobile integration

### **Chapter 5: Results**:
- Model performance (WER, accuracy)
- User testing results
- Comparison with baseline

---

## ✅ **Next Steps**

1. ✅ **Week 1**: Collect and prepare Twi/Ga datasets
2. ✅ **Week 2**: Train Whisper models on Colab
3. ✅ **Week 3**: Build FastAPI backend
4. ✅ **Week 4**: Deploy to Hugging Face/Railway
5. ✅ **Week 5**: Integrate with React Native app
6. ✅ **Week 6**: User testing and refinement

---

**Ready to start when you are!** 🚀

Would you like me to help you with any specific phase first?

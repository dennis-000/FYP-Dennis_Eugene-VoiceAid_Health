from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="VoiceAid Health Deployment API",
    description="Backend for VoiceAid Health: ASR and TTS for Ghanaian Languages",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the Expo app URL or local IP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import asr, tts
app.include_router(asr.router, prefix="/asr", tags=["ASR"])
app.include_router(tts.router, prefix="/tts", tags=["TTS"])

@app.get("/")
async def root():
    return {"message": "VoiceAid Health Backend is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "services": {"asr": "pending", "tts": "pending"}}

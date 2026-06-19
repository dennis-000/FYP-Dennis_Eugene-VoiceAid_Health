/**
 * BACKEND API CONFIGURATION
 * 
 * USING GOOGLE COLAB BACKEND FOR FAST TRANSCRIPTION
 */

// Google Colab Backend (via Hugging Face)
// export const API_BASE_URL = 'https://qwenlm-qwen2-4-8b-speech.hf.space';
export const API_BASE_URL = 'https://dennis-9-voiceaid-health-backend.hf.space';

// Update endpoints to use the new Colab API surface
export const ENDPOINTS = {
    ASR: `${API_BASE_URL}/asr/transcribe`,
    ASR_STREAM: `${API_BASE_URL}/asr/stream`,
    TTS: `${API_BASE_URL}/tts/synthesize`,
    TRANSCRIPTIONS_SAVE: `${API_BASE_URL}/transcriptions/save`,
};

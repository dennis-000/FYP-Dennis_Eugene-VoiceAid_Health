/**
 * BACKEND API CONFIGURATION
 * 
 * USING GOOGLE COLAB BACKEND FOR FAST TRANSCRIPTION
 */

// Permanent Modal.dev Serverless GPU Backend
export const API_BASE_URL = 'https://dennis-000--voiceaid-health-fastapi-app.modal.run';

// Update endpoints to use the new Colab API surface
export const ENDPOINTS = {
    ASR: `${API_BASE_URL}/asr/transcribe`,
    ASR_STREAM: `${API_BASE_URL}/asr/stream`,
    TTS: `${API_BASE_URL}/tts/synthesize`,
    TRANSCRIPTIONS_SAVE: `${API_BASE_URL}/transcriptions/save`,
};

/**
 * BACKEND API CONFIGURATION
 * 
 * USING GOOGLE COLAB BACKEND FOR FAST TRANSCRIPTION
 */

// Google Colab Backend (via Cloudflare tunnel)
export const API_BASE_URL = 'https://sequences-home-santa-sticker.trycloudflare.com';

// Update endpoints to use the new Colab API surface
export const ENDPOINTS = {
    ASR: `${API_BASE_URL}/asr/transcribe`,
    ASR_STREAM: `${API_BASE_URL}/asr/stream`,
    TTS: `${API_BASE_URL}/tts/synthesize`,
    TRANSCRIPTIONS_SAVE: `${API_BASE_URL}/transcriptions/save`,
};

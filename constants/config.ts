/**
 * BACKEND API CONFIGURATION
 * 
 * USING GOOGLE COLAB GPU BACKEND FOR FAST TRANSCRIPTION
 * This provides 10x faster inference (<1s vs 5-10s on local CPU)
 */


// Google Colab GPU Backend (via ngrok tunnel)
const COLAB_NGROK_URL = "https://reticently-laudable-ali.ngrok-free.dev";

// Local backend (for fallback/testing)
const LOCAL_IP = "192.168.0.125";
const ANDROID_EMULATOR = "10.0.2.2";
const IOS_SIMULATOR = "localhost";

// Use Colab GPU backend for all platforms
export const API_BASE_URL = COLAB_NGROK_URL;

// Fallback to local backend (uncomment to switch back)
// const HOST = Platform.select({
//     android: LOCAL_IP,
//     ios: IOS_SIMULATOR,
//     default: "localhost"
// });
// export const API_BASE_URL = `http://${HOST}:8000`;

export const ENDPOINTS = {
    ASR: `${API_BASE_URL}/asr/transcribe`,
    TTS: `${API_BASE_URL}/tts/synthesize`,
    HEALTH: `${API_BASE_URL}/health`
};

/**
 * BACKEND API CONFIGURATION
 * 
 * Point this to your FastAPI backend.
 * For Android Emulator: http://10.0.2.2:8000
 * For iOS Simulator: http://localhost:8000
 * For Physical Device: Use your computer's local IP (e.g., http://192.168.1.5:8000)
 */

import { Platform } from 'react-native';

const LOCAL_IP = "10.237.234.99"; // Current WiFi IP - updated for physical device
const ANDROID_EMULATOR = "10.0.2.2";
const IOS_SIMULATOR = "localhost";

const HOST = Platform.select({
    android: LOCAL_IP, // Using local IP for physical device
    ios: IOS_SIMULATOR,
    default: "localhost"
});

export const API_BASE_URL = `http://${HOST}:8000`;

export const ENDPOINTS = {
    ASR: `${API_BASE_URL}/asr/transcribe`,
    TTS: `${API_BASE_URL}/tts/synthesize`,
    HEALTH: `${API_BASE_URL}/health`
};

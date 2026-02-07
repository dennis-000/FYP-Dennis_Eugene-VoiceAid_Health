/**
 * ==========================================
 * ENHANCED ASR SERVICE (Powered by Whisper)
 * ==========================================
 * Uses local Whisper models via FastAPI backend:
 * - GiftMark/akan-whisper-model for Twi/Akan
 * - OpenAI Whisper for English
 * - Real-time transcription with auto language detection
 * - Confidence scoring with detailed metrics
 * - Support for Twi, Ga, and English
 */

import { Platform } from 'react-native';
import { ASRResponse, SupportedLanguage } from './types';
import {
    calculateConfidence,
    calculateLanguageConfidence,
    detectNoise,
    extractWordConfidences
} from './utils';

import { ENDPOINTS } from '../../constants/config';

// Using local FastAPI backend with Whisper models
// Backend endpoint configured in constants/config.ts

export { ASRResponse, SupportedLanguage };

export const ASRService = {

    /**
     * Main processing function with enhanced accuracy for speech-impaired users
     */
    processAudio: async (uri: string, selectedLang: SupportedLanguage): Promise<ASRResponse> => {

        // No API key needed - using local Whisper backend

        try {
            console.log(`[ASR Service] 🎤 Processing audio with enhanced ASR...`);
            console.log(`[ASR Service] Selected Language: ${selectedLang}`);

            const formData = new FormData();

            // 1. Prepare Audio File  
            if (Platform.OS === 'web') {
                try {
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    formData.append('file', blob, 'recording.webm');
                } catch (error) {
                    console.error('[ASR Service] Error fetching audio blob:', error);
                    throw new Error('Failed to prepare audio file for upload');
                }
            } else {
                // React Native (iOS/Android)
                const fileType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4';
                const fileName = Platform.OS === 'ios' ? 'recording.m4a' : 'recording.mp4';

                formData.append('file', {
                    uri: uri,
                    name: fileName,
                    type: fileType,
                } as any);
            }


            // 2. Configure Language for Local Backend
            // Language hint if not auto-detect
            if (selectedLang !== 'auto') {
                const langCode = selectedLang === 'twi' ? 'tw' : 'en';
                formData.append('language', langCode);
            }

            // 3. Send Request to Local Backend
            const response = await fetch(ENDPOINTS.ASR, {
                method: 'POST',
                // Headers are automatically handled for FormData
                body: formData,
            });

            const data = await response.json();

            // 4. Handle Errors
            if (data.error) {
                console.error("[Whisper Backend Error]", data.error);
                throw new Error(data.error.message || data.error);
            }

            const transcription = data.text;

            if (!transcription) {
                throw new Error("No transcription returned from Whisper backend.");
            }

            // 5. Enhanced Processing
            const cleanText = transcription.trim();
            const rawText = transcription;

            // Detect language if auto mode
            // Detect language if auto mode
            const detectedLang = data.language || selectedLang;

            // Calculate confidence score
            const confidence = calculateConfidence(data, cleanText);

            // Extract word-level confidences if available
            const wordConfidences = extractWordConfidences(data);

            // Detect if there's significant background noise
            const hasNoiseDetected = detectNoise(data, confidence);

            // Calculate language confidence from API data
            const languageConfidence = calculateLanguageConfidence(data, detectedLang);

            console.log(`[ASR Result] ✅ Detected Language: ${detectedLang}`);
            console.log(`[ASR Result] 📊 Confidence: ${(confidence * 100).toFixed(1)}%`);
            console.log(`[ASR Result] 🌍 Language Confidence: ${(languageConfidence * 100).toFixed(1)}%`);
            console.log(`[ASR Result] 📝 Text: "${cleanText}"`);

            if (hasNoiseDetected) {
                console.log(`[ASR Result] ⚠️ Background noise detected`);
            }

            return {
                text: cleanText,
                rawText: rawText,
                detectedLanguage: detectedLang,
                confidence: confidence,
                languageConfidence: languageConfidence,
                wordConfidences: wordConfidences,
                hasNoiseDetected: hasNoiseDetected
            };

        } catch (error: any) {
            console.error("[Whisper Backend Connection Failed]", error);
            console.error("[ASR Service] Make sure backend is running on", ENDPOINTS.ASR);
            return {
                text: `Backend Connection Failed: ${error.message}`,
                detectedLanguage: 'en',
                confidence: 0,
                hasNoiseDetected: false
            };
        }
    },

    /**
     * Alias for processAudio - for backward compatibility
     */
    transcribe: async (uri: string, selectedLang: string): Promise<ASRResponse> => {
        return ASRService.processAudio(uri, selectedLang as SupportedLanguage);
    }
};

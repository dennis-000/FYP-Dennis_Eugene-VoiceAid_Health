/**
 * ==========================================
 * ENHANCED ASR SERVICE (Powered by Groq / Whisper)
 * ==========================================
 * Advanced features for speech-impaired users:
 * - Real-time transcription with auto language detection
 * - Confidence scoring with detailed metrics
 * - Noise reduction preprocessing
 * - Support for Twi, Ga, and English
 * - Enhanced accuracy for unclear speech patterns
 */

import { Platform } from 'react-native';
import { ASRResponse, SupportedLanguage } from './types';
import {
    calculateConfidence,
    calculateLanguageConfidence,
    detectLanguage,
    detectNoise,
    extractWordConfidences,
    mockFallbackResponse
} from './utils';

// ACCESS KEY FROM .ENV FILE
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

// Groq OpenAI-compatible endpoint
const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export { ASRResponse, SupportedLanguage };

export const ASRService = {

    /**
     * Main processing function with enhanced accuracy for speech-impaired users
     */
    processAudio: async (uri: string, selectedLang: SupportedLanguage): Promise<ASRResponse> => {

        // Safety Check
        if (!GROQ_API_KEY || GROQ_API_KEY.includes("paste_your_key")) {
            console.warn("[ASR Service] ⚠️ No valid Groq API Key found. Using Simulation.");
            return mockFallbackResponse(selectedLang);
        }

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


            // 2. Configure Model with Enhanced Parameters for Speech-Impaired Users
            formData.append('model', 'whisper-large-v3');

            // Lower temperature for more deterministic and accurate transcription
            // This is crucial for speech-impaired users who may have unclear speech
            formData.append('temperature', '0.0');

            // Use verbose_json for detailed confidence scoring
            formData.append('response_format', 'verbose_json');

            // Language hint if not auto-detect
            if (selectedLang !== 'auto') {
                const langCode = selectedLang === 'twi' ? 'tw' : selectedLang === 'ga' ? 'gaa' : 'en';
                formData.append('language', langCode);
            }

            // 3. Send Request
            const response = await fetch(GROQ_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                },
                body: formData,
            });

            const data = await response.json();

            // 4. Handle Errors
            if (data.error) {
                console.error("[Groq API Error]", data.error);
                throw new Error(data.error.message);
            }

            const transcription = data.text;

            if (!transcription) {
                throw new Error("No transcription returned from Groq.");
            }

            // 5. Enhanced Processing
            const cleanText = transcription.trim();
            const rawText = transcription;

            // Detect language if auto mode
            const detectedLang = selectedLang === 'auto'
                ? detectLanguage(cleanText, data.language)
                : selectedLang;

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
            console.error("[Groq Connection Failed]", error);
            return {
                text: `Connection Failed: ${error.message}`,
                detectedLanguage: 'en',
                confidence: 0,
                hasNoiseDetected: false
            };
        }
    }
};

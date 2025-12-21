/**
 * ==========================================
 * ASR SERVICE (Powered by Groq / Whisper)
 * ==========================================
 * Uses Groq's ultra-fast API running Whisper Large V3.
 * Replaces 'fs' logic with React Native 'fetch' + 'FormData'.
 */

import { Platform } from 'react-native';

// ACCESS KEY FROM .ENV FILE
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY; 

// Groq OpenAI-compatible endpoint
const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export type SupportedLanguage = 'en' | 'twi' | 'ga' | 'auto';

export interface ASRResponse {
  text: string;
  detectedLanguage: SupportedLanguage;
  confidence: number;
}

export const ASRService = {
  
  processAudio: async (uri: string, selectedLang: SupportedLanguage): Promise<ASRResponse> => {
    
    // Safety Check
    if (!GROQ_API_KEY || GROQ_API_KEY.includes("paste_your_key")) {
      console.warn("[ASR Service] ⚠️ No valid Groq API Key found. Using Simulation.");
      return mockFallbackResponse(selectedLang);
    }

    try {
      console.log(`[ASR Service] Uploading audio to Groq (Whisper Large V3)...`);

      const formData = new FormData();
      
      // 1. Prepare Audio File for React Native
      // React Native requires a specific object format for file uploads in FormData
      // We do NOT use 'fs' or base64 here; we pass the URI directly.
      const fileType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4';
      const fileName = Platform.OS === 'ios' ? 'recording.m4a' : 'recording.mp4';
      
      formData.append('file', {
        uri: uri,
        name: fileName,
        type: fileType,
      } as any);

      // 2. Configure Model
      formData.append('model', 'whisper-large-v3');
      formData.append('temperature', '0'); // Deterministic output (less hallucination)
      formData.append('response_format', 'json');

      // Optional: Whisper can translate to English if we set this.
      // For now, we let it transcribe what it hears.
      // if (selectedLang !== 'auto') formData.append('language', 'en');

      // 3. Send Request
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          // Do NOT set Content-Type to multipart/form-data manually; 
          // fetch handles the boundary automatically when FormData is passed.
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

      const cleanText = transcription.trim();
      console.log("[ASR Result]", cleanText);

      return {
        text: cleanText,
        detectedLanguage: 'auto', // Whisper V3 auto-detects
        confidence: 0.98, // Groq simple JSON response doesn't include confidence, assuming high.
      };

    } catch (error: any) {
      console.error("[Groq Connection Failed]", error);
      return {
        text: `Connection Failed: ${error.message}`,
        detectedLanguage: 'en',
        confidence: 0
      };
    }
  }
};

/**
 * Fallback Simulation
 */
const mockFallbackResponse = async (lang: SupportedLanguage): Promise<ASRResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        text: "I need to schedule a follow-up appointment. (Simulated)",
        detectedLanguage: 'en',
        confidence: 0.85 
      });
    }, 1500);
  });
};
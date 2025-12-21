import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { writeAsStringAsync, documentDirectory, EncodingType } from 'expo-file-system/legacy';

/**
 * ==========================================
 * TTS SERVICE (Hybrid: Native + API)
 * ==========================================
 * - English: Uses device native TTS (Fast, Offline)
 * - Twi/Ga:  Attempts Ghana NLP API; falls back to Native if no key is provided.
 */

// ACCESS KEY FROM .ENV FILE
const GHANA_NLP_API_KEY = process.env.EXPO_PUBLIC_GHANA_NLP_API_KEY; 
// UPDATED URL based on your request
const GHANA_NLP_URL = "https://translation-api.ghananlp.org/tts/v1/synthesize"; 

const DEFAULT_OPTIONS = {
  pitch: 1.0,
  rate: 0.9, 
};

// Keep track of the current sound object to stop it if needed
let currentSound: Audio.Sound | null = null;

export const TTSService = {
  
  /**
   * Speaks the text using the best available engine.
   */
  speak: async (text: string, language: 'en' | 'twi' | 'ga' = 'en') => {
    // 1. Stop any current audio
    await TTSService.stop();

    // 2. STRATEGY A: Native TTS for English
    if (language === 'en') {
      Speech.speak(text, {
        ...DEFAULT_OPTIONS,
        language: 'en-US',
      });
      return;
    }

    // 3. STRATEGY B: API TTS for Twi / Ga
    // Check if we actually have a key before trying the API
    if (!GHANA_NLP_API_KEY || GHANA_NLP_API_KEY.includes("YOUR_GHANA_NLP_KEY")) {
      console.log("[TTS] No Ghana NLP Key found. Using Native TTS fallback.");
      const fallbackLocale = language === 'twi' ? 'ak-GH' : 'ga-GH'; 
      Speech.speak(text, { ...DEFAULT_OPTIONS, language: fallbackLocale });
      return;
    }

    try {
      console.log(`[TTS] Fetching Ghana NLP audio for ${language}: ${text}`);
      
      // Configure body based on specific language requirements
      const langCode = language === 'twi' ? 'tw' : 'ga';
      const speakerId = language === 'twi' ? 'twi_speaker_4' : 'ga_speaker_1'; // Defaulting Ga speaker

      const response = await fetch(GHANA_NLP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Ocp-Apim-Subscription-Key': GHANA_NLP_API_KEY, 
        },
        body: JSON.stringify({
          text: text,
          language: langCode,
          speaker_id: speakerId
        })
      });

      if (!response.ok) {
        // Log the text error if possible for debugging
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      // The API returns binary audio (blob)
      const blob = await response.blob();
      
      // Convert Blob to Base64 to save it
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        
        // Save to a temporary file
        const uri = `${documentDirectory}tts_temp.mp3`;
        await writeAsStringAsync(uri, base64data, {
          encoding: EncodingType.Base64,
        });

        // Play the file
        const { sound } = await Audio.Sound.createAsync({ uri });
        currentSound = sound;
        await sound.playAsync();
      };

    } catch (error) {
      console.error("[TTS Error]", error);
      
      // FALLBACK: Use Native TTS if API fails (e.g., internet issues)
      const fallbackLocale = language === 'twi' ? 'ak-GH' : 'ga-GH'; 
      Speech.speak(text, { ...DEFAULT_OPTIONS, language: fallbackLocale });
    }
  },

  /**
   * Stop speaking (Native or Audio Player)
   */
  stop: async () => {
    // Stop Native TTS
    Speech.stop();
    
    // Stop API Audio
    if (currentSound) {
      try {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      } catch (e) {
        // Ignore errors if sound is already unloaded
      }
      currentSound = null;
    }
  }
};
import { Audio } from 'expo-av';
import { documentDirectory, EncodingType, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';
import { DEFAULT_OPTIONS, GHANA_NLP_API_KEY, GHANA_NLP_URL, SupportedTTSLanguage } from './config';

/**
 * ==========================================
 * TTS SERVICE (Hybrid: Native + API)
 * ==========================================
 * - English: Uses device native TTS (Fast, Offline)
 * - Twi/Ga:  Attempts Ghana NLP API; falls back to 'en-GH' (Ghanaian English) if API fails.
 */

// Keep track of the current sound object to stop it if needed
let currentSound: Audio.Sound | null = null;

export const TTSService = {

    /**
     * Speaks the text using the best available engine.
     */
    speak: async (text: string, language: SupportedTTSLanguage = 'en') => {
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
            // Fallback to en-GH (Ghana English) which pronounces local words better than en-US
            Speech.speak(text, { ...DEFAULT_OPTIONS, language: 'en-GH' });
            return;
        }

        try {
            console.log(`[TTS] Fetching Ghana NLP audio for ${language}: ${text}`);

            const langCode = language === 'twi' ? 'tw' : 'ga';

            // Note: 'ga_speaker_1' is a guess. If the API returns 500/400, it means this ID is wrong.
            const speakerId = language === 'twi' ? 'twi_speaker_4' : 'ga_speaker_1';

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
                const errorText = await response.text().catch(() => "Unknown error");
                throw new Error(`API Error ${response.status}: ${errorText}`);
            }

            // The API returns binary audio (blob)
            const blob = await response.blob();

            // Convert Blob to Base64 to save it
            const reader = new FileReader();
            reader.readAsDataURL(blob);

            reader.onloadend = async () => {
                try {
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
                } catch (innerError) {
                    console.error("[TTS Playback Error - Falling back to Native]", innerError);
                    Speech.speak(text, { ...DEFAULT_OPTIONS, language: 'en-GH' });
                }
            };

        } catch (error) {
            console.error("[TTS API Error - Falling back to Native]", error);

            // FALLBACK 1: API Request failed
            Speech.speak(text, { ...DEFAULT_OPTIONS, language: 'en-GH' });
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

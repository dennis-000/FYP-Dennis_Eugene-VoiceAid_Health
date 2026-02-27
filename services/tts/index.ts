import { Audio } from 'expo-av';
import { documentDirectory, EncodingType, writeAsStringAsync } from 'expo-file-system';
import * as Speech from 'expo-speech';
import { ENDPOINTS } from '../../constants/config';
import { DEFAULT_OPTIONS, SupportedTTSLanguage } from './config';

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

        // 3. STRATEGY B: Local API TTS for Twi / Ga
        // (Using Kasanoma model served via FastAPI)

        try {
            console.log(`[TTS] Fetching Ghana NLP audio for ${language}: ${text}`);

            // Note: 'ga' might fallback to English in backend if no model yet
            const langCode = language === 'twi' ? 'tw' : 'ga';

            const response = await fetch(ENDPOINTS.TTS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    language: langCode,
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

                    // Save to a temporary file as WAV (matching backend format)
                    const uri = `${documentDirectory}tts_temp.wav`;
                    await writeAsStringAsync(uri, base64data, {
                        encoding: EncodingType.Base64,
                    });

                    console.log(`[TTS] Saved audio to ${uri}, playing...`);

                    // Play the WAV file
                    const { sound } = await Audio.Sound.createAsync(
                        { uri },
                        { shouldPlay: true }
                    );
                    currentSound = sound;

                    // Log when playback completes
                    sound.setOnPlaybackStatusUpdate((status) => {
                        if (status.isLoaded && status.didJustFinish) {
                            console.log('[TTS] Playback completed');
                        }
                    });
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

import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';
import { ENDPOINTS } from '../../constants/config';
import { DEFAULT_OPTIONS, SupportedTTSLanguage } from './config';

import { checkOnlineStatus } from '../../utils/network';

/**
 * ==========================================
 * TTS SERVICE (Hybrid: Native + API)
 * ==========================================
 * - English: Uses device native TTS (Fast, Offline)
 * - Twi/Ga:  Attempts Ghana NLP API; falls back to 'en-GH' (Ghanaian English) if API fails.
 */

// Keep track of the current sound player to stop it if needed
let currentSound: AudioPlayer | null = null;

export const TTSService = {

    /**
     * Speaks the text using the best available engine.
     */
    speak: async (text: string, language: SupportedTTSLanguage = 'en', options?: { rate?: number, speed?: number, gender?: string }): Promise<void> => {
        return new Promise(async (resolve) => {
            // 1. Stop any current audio
            await TTSService.stop();

            // Warning: Modifying rate below 1.0 in expo-av frequently causes buffer clipping 
            // at the tail as the duration calculation desyncs!
            const rate = options?.rate || 1.0;

            // 2. STRATEGY A: Native TTS for English
            if (language === 'en') {
                Speech.speak(text, {
                    ...DEFAULT_OPTIONS,
                    rate,
                    language: 'en-US',
                    onDone: () => resolve(),
                    onError: () => resolve(),
                });
                return;
            }

            // 3. STRATEGY B: Pro-Grade API TTS for Twi / Ga
            // (Using the high-quality YarnGPT2 / StyleTTS2 architecture)
            try {
                const isOnline = await checkOnlineStatus();
                if (!isOnline) {
                    console.log('[TTS] Offline - Bypassing API, falling back to Native en-GH instantly');
                    Speech.speak(text, { ...DEFAULT_OPTIONS, rate, language: 'en-GH', onDone: () => resolve(), onError: () => resolve() });
                    return;
                }
                console.log(`[TTS] Fetching High-Quality Human audio for ${language}: ${text}`);

                // The new StyleTTS2-based models don't suffer from tail-clipping, but we still 
                // sanitize for robustness.
                const safeText = text.trim();
                
                const langCode = language === 'twi' ? 'tw' : 'ga';
                const response = await fetch(ENDPOINTS.TTS, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: safeText,
                        language: langCode
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
                        const uri = `${FileSystem.documentDirectory}tts_temp.wav`;
                        await FileSystem.writeAsStringAsync(uri, base64data, {
                            encoding: 'base64',
                        });

                        console.log(`[TTS] Saved audio to ${uri}, playing...`);

                        // Force audio to play loudly through the main device speaker, NOT the invisible earpiece
                        await setAudioModeAsync({
                            playsInSilentMode: true,
                            shouldPlayInBackground: false,
                        });

                        // Play the WAV file
                        const player = createAudioPlayer(uri);
                        player.shouldCorrectPitch = true;
                        player.setPlaybackRate(rate);
                        currentSound = player;

                        // Log when playback completes
                        const subscription = player.addListener('playbackStatusUpdate', (status) => {
                            if (status.isLoaded && status.didJustFinish) {
                                console.log('[TTS] Playback completed');
                                subscription.remove();
                                player.release();
                                if (currentSound === player) {
                                    currentSound = null;
                                }
                                // Allow 500ms for the audio tail to physically decay through the speaker
                                // This prevents rate-stretched buffers from being preemptively cut by the next queued sound!
                                setTimeout(resolve, 500);
                            }
                        });

                        player.play();
                    } catch (innerError) {
                        console.error("[TTS Playback Error - Falling back to Native]", innerError);
                        Speech.speak(text, { ...DEFAULT_OPTIONS, rate, language: 'en-GH', onDone: () => resolve(), onError: () => resolve() });
                    }
                };

            } catch (error) {
                console.error("[TTS API Error - Falling back to Native]", error);

                // FALLBACK 1: API Request failed
                Speech.speak(text, { ...DEFAULT_OPTIONS, rate, language: 'en-GH', onDone: () => resolve(), onError: () => resolve() });
            }
        });
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
                currentSound.pause();
                currentSound.release();
            } catch (e) {
                // Ignore errors if sound is already unloaded
            }
            currentSound = null;
        }
    }
};

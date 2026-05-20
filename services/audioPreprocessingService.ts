/**
 * ==========================================
 * AUDIO PREPROCESSING SERVICE
 * ==========================================
 * Provides audio enhancement features:
 * - Noise reduction configuration
 * - Audio quality optimization
 * - Recording settings for speech-impaired users
 */

import { Audio } from 'expo-av';

/**
 * Optimized recording options for speech-impaired users
 * These settings prioritize clarity and noise reduction
 */
export const ENHANCED_RECORDING_OPTIONS: Audio.RecordingOptions = {
    android: {
        extension: '.wav',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 256000,
    },
    ios: {
        extension: '.wav',
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 256000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
    },
    web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
    }
};

export interface AudioPreprocessingConfig {
    enableNoiseReduction: boolean;
    enableEchoCancellation: boolean;
    enableAutoGainControl: boolean;
    sampleRate: number;
}

export const AudioPreprocessingService = {

    /**
     * Get optimized recording configuration
     */
    getRecordingConfig: (config?: Partial<AudioPreprocessingConfig>) => {
        const defaultConfig: AudioPreprocessingConfig = {
            enableNoiseReduction: true,
            enableEchoCancellation: true,
            enableAutoGainControl: true,
            sampleRate: 48000,
        };

        const finalConfig = { ...defaultConfig, ...config };

        return {
            ...ENHANCED_RECORDING_OPTIONS,
            // Additional settings can be added here based on platform capabilities
        };
    },

    /**
     * Configure audio session for optimal recording
     */
    configureAudioSession: async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
                // These settings help with noise reduction on iOS
            });

            console.log('[Audio Preprocessing] ✅ Audio session configured for optimal recording');
        } catch (error) {
            console.error('[Audio Preprocessing] ❌ Failed to configure audio session:', error);
        }
    },

    /**
     * Analyze audio quality metrics
     * This can be used to provide feedback to users about recording quality
     */
    analyzeAudioQuality: (meteringData: number[]): {
        averageLevel: number;
        peakLevel: number;
        isTooQuiet: boolean;
        isTooLoud: boolean;
        hasConsistentInput: boolean;
    } => {
        if (meteringData.length === 0) {
            return {
                averageLevel: -160,
                peakLevel: -160,
                isTooQuiet: true,
                isTooLoud: false,
                hasConsistentInput: false,
            };
        }

        const average = meteringData.reduce((a, b) => a + b, 0) / meteringData.length;
        const peak = Math.max(...meteringData);

        // Check if audio is too quiet (threshold: -50 dB)
        const isTooQuiet = average < -50;

        // Check if audio is too loud (threshold: -10 dB, might cause clipping)
        const isTooLoud = peak > -10;

        // Check for consistent input (variance should not be too high)
        const variance = meteringData.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / meteringData.length;
        const hasConsistentInput = variance < 500;

        return {
            averageLevel: average,
            peakLevel: peak,
            isTooQuiet,
            isTooLoud,
            hasConsistentInput,
        };
    },

    /**
     * Get audio quality feedback message
     */
    getAudioQualityFeedback: (meteringData: number[]): string | null => {
        const quality = AudioPreprocessingService.analyzeAudioQuality(meteringData);

        if (quality.isTooQuiet) {
            return "🎤 Audio too quiet - Please speak closer to the microphone";
        }

        if (quality.isTooLoud) {
            return "📢 Audio too loud - Please speak a bit softer";
        }

        if (!quality.hasConsistentInput && meteringData.length > 10) {
            return "⚠️ Inconsistent audio - Please reduce background noise";
        }

        return null; // Audio quality is good
    },

    /**
     * Voice Activity Detection (VAD) Lite
     * Returns true if the sound levels suggest actual speech is occurring
     */
    isSpeechDetected: (meteringData: number[]): boolean => {
        if (meteringData.length < 5) return true; // Not enough data, assume speech to be safe

        // Calculate peak and average
        const peak = Math.max(...meteringData);
        const average = meteringData.reduce((a, b) => a + b, 0) / meteringData.length;

        // SPEECH-IMPAIRED INCLUSIVE THRESHOLD:
        // Model is fine-tuned on dysarthric speech, so we keep this lenient.
        // Dysarthric voices are naturally quieter and more irregular.
        // Peak > -42dB catches quiet/impaired speech while blocking silence (-55dB+).
        // The hallucination blocklist + model's own no_speech_threshold handle noise.
        return peak > -42 && average > -52;
    }
};

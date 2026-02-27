import { ASRResponse, SupportedLanguage } from './types';

// Language detection keywords for Twi and Ga
export const TWI_KEYWORDS = ['medaase', 'mepaakyew', 'ete sen', 'akwaaba', 'maakye'];
export const GA_KEYWORDS = ['oyiwaladonŋ', 'afoowalemo', 'ojekoo', 'misaalɛ'];

/**
 * Detect language from transcription text using keyword matching
 */
export const detectLanguage = (text: string, apiLanguage?: string): SupportedLanguage => {
    const lowerText = text.toLowerCase();

    // First check API-detected language if available
    if (apiLanguage) {
        if (apiLanguage === 'tw' || apiLanguage === 'twi') return 'twi';
        if (apiLanguage === 'gaa' || apiLanguage === 'ga') return 'ga';
        if (apiLanguage === 'en' || apiLanguage.startsWith('en')) return 'en';
    }

    // Fallback to keyword matching
    const twiMatches = TWI_KEYWORDS.filter(keyword => lowerText.includes(keyword)).length;
    const gaMatches = GA_KEYWORDS.filter(keyword => lowerText.includes(keyword)).length;

    if (twiMatches > gaMatches && twiMatches > 0) return 'twi';
    if (gaMatches > twiMatches && gaMatches > 0) return 'ga';

    // Default to English
    return 'en';
};

/**
 * Calculate overall transcription confidence
 */
export const calculateConfidence = (data: any, text: string): number => {
    let confidence = 0.75; // Start with moderate-low default

    // Check if we have word-level data (most reliable)
    if (data.words && Array.isArray(data.words) && data.words.length > 0) {
        const wordConfidences = data.words
            .map((w: any) => w.confidence || w.probability || 0)
            .filter((c: number) => c > 0);

        if (wordConfidences.length > 0) {
            // Use average word confidence as base
            confidence = wordConfidences.reduce((a: number, b: number) => a + b, 0) / wordConfidences.length;
            console.log(`[ASR Debug] Word-level confidence: ${(confidence * 100).toFixed(1)}%`);
        }
    } else if (data.segments && Array.isArray(data.segments) && data.segments.length > 0) {
        // Fall back to segment-level confidence if available
        const segmentConfidences = data.segments
            .map((s: any) => s.avg_logprob ? Math.exp(s.avg_logprob) : 0)
            .filter((c: number) => c > 0);

        if (segmentConfidences.length > 0) {
            confidence = segmentConfidences.reduce((a: number, b: number) => a + b, 0) / segmentConfidences.length;
            console.log(`[ASR Debug] Segment-level confidence: ${(confidence * 100).toFixed(1)}%`);
        }
    }

    // Adjust confidence based on text characteristics
    const wordCount = text.split(/\s+/).length;

    // Very short transcriptions might be less reliable
    if (wordCount === 1) {
        confidence *= 0.90; // 10% penalty for single words
    } else if (wordCount === 2) {
        confidence *= 0.95; // 5% penalty for two words
    } else if (wordCount >= 5) {
        confidence = Math.min(0.98, confidence * 1.02); // Small boost for longer, clearer speech
    }

    // If text has unusual patterns, lower confidence
    if (text.includes('...') || text.includes('[inaudible]') || text.includes('unclear')) {
        confidence *= 0.65; // Significant penalty for unclear markers
    }

    // Clamp between realistic bounds
    return Math.max(0.40, Math.min(0.98, confidence));
};

/**
 * Extract word-level confidence scores
 */
export const extractWordConfidences = (data: any): number[] => {
    if (data.words && Array.isArray(data.words)) {
        return data.words.map((w: any) => w.confidence || w.probability || 0.85);
    }
    return [];
};

/**
 * Calculate language detection confidence
 */
export const calculateLanguageConfidence = (data: any, detectedLang: string): number => {
    // If API explicitly returned language with confidence, use it
    if (data.language) {
        // Whisper API returns language code, high confidence when explicitly detected
        return 0.95;
    }

    // If we have word-level data with good overall confidence, language is likely correct
    if (data.words && Array.isArray(data.words) && data.words.length > 0) {
        const avgWordConfidence = data.words
            .map((w: any) => w.confidence || w.probability || 0)
            .reduce((a: number, b: number) => a + b, 0) / data.words.length;

        // Higher word confidence = higher language confidence
        return Math.max(0.7, Math.min(0.98, avgWordConfidence + 0.05));
    }

    // Fallback based on detected language
    if (detectedLang === 'en') {
        return 0.85; // English is most common, moderate confidence
    } else if (detectedLang === 'twi' || detectedLang === 'ga') {
        return 0.75; // Local languages, slightly lower confidence
    }

    return 0.70; // Default for other cases
};

/**
 * Detect if there's significant background noise
 */
export const detectNoise = (data: any, confidence: number): boolean => {
    // If confidence is very low, likely noise interference
    if (confidence < 0.5) return true;

    // Check for noise indicators in metadata
    if (data.no_speech_prob && data.no_speech_prob > 0.6) return true;

    return false;
};

/**
 * Fallback Simulation with enhanced features
 */
export const mockFallbackResponse = async (lang: SupportedLanguage): Promise<ASRResponse> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const simulatedTexts: Record<string, string> = {
                en: "I need help with my medication schedule",
                twi: "Merehwehwɛ mmoa wɔ me aduro ho",
                ga: "Mihiaa nkpaaloo kɛ aduro",
                auto: "I need to see the doctor today"
            };

            resolve({
                text: `${simulatedTexts[lang] || simulatedTexts.en} (Simulated)`,
                detectedLanguage: lang === 'auto' ? 'en' : lang,
                confidence: 0.85,
                languageConfidence: 0.90,
                hasNoiseDetected: false
            });
        }, 1500);
    });
};

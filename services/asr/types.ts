export type SupportedLanguage = 'en' | 'twi' | 'ga' | 'auto';

export interface ASRResponse {
    text: string;
    detectedLanguage: SupportedLanguage;
    confidence: number;
    // New fields for enhanced features
    rawText?: string; // Original transcription before cleanup
    languageConfidence?: number; // How confident we are about the detected language
    wordConfidences?: number[]; // Per-word confidence scores
    hasNoiseDetected?: boolean; // Whether background noise was detected
}

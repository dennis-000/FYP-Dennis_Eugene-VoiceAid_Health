export const GHANA_NLP_API_KEY = process.env.EXPO_PUBLIC_GHANA_NLP_API_KEY;
export const GHANA_NLP_URL = "https://translation-api.ghananlp.org/tts/v1/synthesize";

export const DEFAULT_OPTIONS = {
    pitch: 1.0,
    rate: 0.9,
};

export type SupportedTTSLanguage = 'en' | 'twi' | 'ga';

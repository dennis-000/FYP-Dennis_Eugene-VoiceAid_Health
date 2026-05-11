/**
 * Prediction Service
 * Provides dual-mode intent prediction for speech-impaired patients:
 * 1. LOCAL (offline): Fuzzy-matches partial speech against curated medical phrases
 * 2. AI (backend): Calls Qwen LLM to expand fragments into complete sentences
 */

import { ENDPOINTS, API_BASE_URL } from '../../constants/config';
import { medicalPhrases } from './medicalPhrases';

export interface Prediction {
    text: string;
    source: 'local' | 'ai';
    confidence: number;
}

/**
 * Normalizes text for comparison: lowercase, remove punctuation, trim.
 */
function normalize(text: string): string {
    return text.toLowerCase().replace(/[.,!?]/g, '').trim();
}

/**
 * Scores how well a phrase matches the partial input.
 * Uses token overlap — counts how many words from the input appear in the phrase.
 */
function scoreMatch(input: string, phrase: string): number {
    const inputTokens = normalize(input).split(/\s+/).filter(Boolean);
    const phraseNorm = normalize(phrase);
    if (inputTokens.length === 0) return 0;

    let matches = 0;
    for (const token of inputTokens) {
        if (phraseNorm.includes(token) && token.length > 1) {
            matches++;
        }
    }
    return matches / inputTokens.length;
}

/**
 * LOCAL PREDICTION: Fuzzy-matches partial speech against curated medical phrases.
 * Works 100% offline. Returns top 3 best matches above a threshold.
 */
export function getLocalPredictions(partialText: string, language: string): Prediction[] {
    if (!partialText || partialText.trim().length < 2) return [];

    const lang = language.toLowerCase().includes('twi') || language === 'tw' 
        ? 'twi' 
        : language.toLowerCase().includes('ga') || language === 'ga'
        ? 'ga'
        : 'en';

    const phrases = medicalPhrases[lang] || medicalPhrases['en'];
    
    const scored = phrases
        .map(phrase => ({
            text: phrase.text,
            source: 'local' as const,
            confidence: scoreMatch(partialText, phrase.text),
        }))
        .filter(p => p.confidence > 0)
        .sort((a, b) => b.confidence - a.confidence);

    return scored.slice(0, 3);
}

/**
 * AI PREDICTION: Calls the backend Qwen LLM to expand a fragment into a full sentence.
 * Falls back gracefully if the backend is unavailable.
 */
export async function getAIPrediction(partialText: string, language: string): Promise<Prediction | null> {
    if (!partialText || partialText.trim().length < 3) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/predict/intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: partialText, language }),
            signal: AbortSignal.timeout(5000), // 5-second timeout so UI doesn't hang
        });

        if (!response.ok) return null;
        
        const data = await response.json();
        if (data.predicted && data.predicted.trim().length > 0) {
            return {
                text: data.predicted.trim(),
                source: 'ai',
                confidence: 1.0,
            };
        }
    } catch {
        // Backend offline or too slow — fail silently, local predictions still work
    }

    return null;
}

/**
 * COMBINED PREDICTION: Gets both local and AI predictions.
 * Local predictions appear immediately. AI prediction replaces or extends the list when ready.
 * Deduplicates results to avoid showing the same phrase twice.
 */
export async function getCombinedPredictions(
    partialText: string,
    language: string,
    onUpdate: (predictions: Prediction[]) => void
): Promise<void> {
    // 1. Show local predictions immediately (no network needed)
    const local = getLocalPredictions(partialText, language);
    if (local.length > 0) {
        onUpdate(local);
    }

    // 2. Fetch AI prediction in background and merge when ready
    try {
        const ai = await getAIPrediction(partialText, language);
        if (ai) {
            // Merge: AI prediction goes first, then top 2 local predictions (deduped)
            const localFiltered = local.filter(p => normalize(p.text) !== normalize(ai.text));
            onUpdate([ai, ...localFiltered].slice(0, 3));
        }
    } catch {
        // Stay with local predictions
    }
}

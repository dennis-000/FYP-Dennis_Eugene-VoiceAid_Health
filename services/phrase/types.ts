export type CategoryId = 'needs' | 'health' | 'emotions' | 'yesno';

export interface Phrase {
    id: string;
    category: CategoryId;

    // LABELS (What is shown on the card)
    label: string;      // English
    labelTwi?: string;  // Twi
    labelGa?: string;   // Ga

    // SPOKEN TEXT (What is sent to TTS)
    text: string;
    textTwi?: string;
    textGa?: string;

    iconName: string;
    color?: string;
    isCustom?: boolean;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const COMMON_ICONS = [
    'heart', 'water', 'fast-food', 'medkit', 'bed', 'snow', 'flame', 'happy', 'sad', 
    'call', 'people', 'home', 'restaurant', 'car', 'bus', 'airplane', 'bicycle', 
    'book', 'musical-notes', 'tv', 'game-controller', 'football', 'basketball', 
    'paw', 'leaf', 'flower', 'sunny', 'moon', 'rainy', 'thunderstorm', 'shirt', 
    'glasses', 'watch', 'camera', 'videocam', 'mic', 'headset', 'laptop', 'phone-portrait',
    'wallet', 'cart', 'gift', 'balloon', 'beer', 'cafe', 'ice-cream', 'pizza', 'apple',
    'bandage', 'fitness', 'body', 'eye', 'ear', 'hand-left', 'hand-right', 'man', 'woman',
    'alarm', 'calendar', 'time', 'chatbubbles', 'chatbox-ellipses', 'mail', 'paper-plane',
    'volume-high', 'volume-mute', 'lock-closed', 'key', 'bulb', 'flash', 'star', 'checkmark-circle',
    'close-circle', 'alert-circle', 'information-circle', 'help-circle', 'thumbs-up', 'thumbs-down'
];

export interface VisionPhraseResult {
    text: string;           // e.g., "Cup of Water"
    twi: string;            // e.g., "Nsuo Kuruwa"
    icon: string;           // must be from Ionicons
    color: string;          // hex color
}

export const VisionService = {

    /**
     * Checks if the API key is configured
     */
    isConfigured: () => {
        return !!GEMINI_API_KEY;
    },

    /**
     * Semantically selects the best icon and color for a custom phrase.
     */
    generateIconForPhrase: async (phrase: string): Promise<{ icon: string, color: string } | null> => {
        if (!GEMINI_API_KEY) {
            console.warn('[VisionService] No Gemini API Key configured.');
            return null;
        }

        const prompt = `
            You are an AI assistant for a speech therapy app. 
            The user wants to add a new phrase: "${phrase}".
            
            Choose the single most appropriate icon from this exact list of valid Ionicons:
            ${COMMON_ICONS.join(', ')}
            
            Also pick a suitable bright hex color code for this concept.
            
            Return ONLY a JSON object exactly matching this format, with no markdown formatting:
            {"icon": "chosen-icon", "color": "#hexcode"}
        `;

        try {
            const response = await fetch(`${GEMINI_API_URL}/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2, // Low temp for more deterministic mapping
                    }
                })
            });

            const data = await response.json();
            
            if (data.error) {
                console.error('[VisionService] API Error:', data.error.message);
                return null;
            }

            let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textResponse) return null;

            // Clean up potential markdown formatting (```json ... ```)
            textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(textResponse);
            
            return {
                icon: result.icon || 'chatbubbles',
                color: result.color || '#8b5cf6'
            };

        } catch (error) {
            console.error('[VisionService] Error generating icon:', error);
            return null;
        }
    },

    /**
     * Analyzes an image (base64) to identify the primary object, 
     * creating a short English phrase, Twi translation, icon, and color.
     */
    identifyObjectFromImage: async (base64Image: string): Promise<VisionPhraseResult | null> => {
        if (!GEMINI_API_KEY) {
            console.warn('[VisionService] No Gemini API Key configured.');
            return null;
        }

        const prompt = `
            You are a highly intelligent Vision AI for a speech therapy AAC app in Ghana. 
            Look at this image. Identify the primary object or action in focus.
            Create a short phrase a patient might use (e.g., "Water bottle", "Television", "I want the remote"). Keep it under 4 words.
            Provide the precise Twi translation for that short phrase.
            
            Choose the best matching icon from this list:
            ${COMMON_ICONS.join(', ')}
            
            Pick an appropriate hex color.
            
            Return ONLY a valid JSON object matching this format, with no markdown:
            {"text": "Short English Phrase", "twi": "Twi Translation", "icon": "chosen-icon", "color": "#hexcode"}
        `;

        try {
            const response = await fetch(`${GEMINI_API_URL}/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: "image/jpeg",
                                    data: base64Image
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.4,
                    }
                })
            });

            const data = await response.json();
            
            if (data.error) {
                console.error('[VisionService] API Error:', data.error.message);
                return null;
            }

            let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textResponse) return null;

            // Clean up potential markdown formatting
            textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(textResponse);
            
            return {
                text: result.text || 'Unknown Object',
                twi: result.twi || 'Unidentified',
                icon: result.icon || 'chatbubbles',
                color: result.color || '#8b5cf6'
            };

        } catch (error) {
            console.error('[VisionService] Error identifying object:', error);
            return null;
        }
    }
};

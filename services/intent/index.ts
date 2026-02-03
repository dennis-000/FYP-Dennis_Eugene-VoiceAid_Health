import { GROQ_API_KEY, GROQ_URL } from './config';
import { SYSTEM_PROMPT } from './prompts';
import { IntentResponse } from './types';

export { IntentResponse };

/**
 * ==========================================
 * INTENT SERVICE (Powered by Groq / Llama 3)
 * ==========================================
 * Analyzes speech using Llama 3 on Groq (Fast & Free tier).
 */

export const IntentService = {

    /**
     * Analyzes text using LLM to predict intent and suggestions.
     */
    predictIntent: async (text: string): Promise<IntentResponse> => {
        // 1. Validation
        if (!text || text.length < 2 || text.includes("W.O.O.B") || text.trim() === ".") {
            return { category: "Waiting...", refinedText: "...", suggestions: [] };
        }

        // 2. Check Key
        if (!GROQ_API_KEY || GROQ_API_KEY.includes("paste_your_key")) {
            console.warn("[Intent Service] ⚠️ No valid Groq API Key found.");
            return simulateIntent(text);
        }

        try {
            // 3. Call Groq API
            const response = await fetch(GROQ_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: `User input: "${text}"` }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            const data = await response.json();

            // 4. Handle API Errors Explicitly
            if (data.error) {
                console.error("[Groq Intent API Error]", data.error);
                return {
                    category: "API Error",
                    refinedText: `Error: ${data.error.message}`,
                    suggestions: ["Retry", "Check Key", "Offline Mode"]
                };
            }

            const content = data.choices?.[0]?.message?.content;
            if (!content) throw new Error("Empty response from Groq");

            const parsed = JSON.parse(content);

            return {
                category: parsed.category || "Prediction",
                refinedText: parsed.refinedText || text,
                suggestions: parsed.suggestions?.slice(0, 3) || ["Yes", "No", "Thanks"]
            };

        } catch (error: any) {
            console.error("[Intent Service Error]", error);
            // DEBUGGING: Return the error so you can see it on screen
            return {
                category: "System Error",
                refinedText: `Failed: ${error.message}`,
                suggestions: ["Try Again"]
            };
        }
    }
};

/**
 * Fallback Logic (Expanded)
 */
const simulateIntent = (text: string): IntentResponse => {
    const lower = text.toLowerCase();

    if (lower.match(/pain|hurt|head|stomach|chest|ache|burn/)) {
        return {
            category: "Pain Management",
            refinedText: "I am in pain.",
            suggestions: ["It hurts a lot", "I need meds", "Call doctor"]
        };
    }
    if (lower.match(/water|thirsty|drink|dry/)) {
        return {
            category: "Basic Needs",
            refinedText: "I need water.",
            suggestions: ["I am thirsty", "Cold water please", "Help me drink"]
        };
    }
    if (lower.match(/food|hungry|eat/)) {
        return {
            category: "Basic Needs",
            refinedText: "I need food.",
            suggestions: ["I am hungry", "When is lunch?", "Soft food please"]
        };
    }
    if (lower.match(/toilet|bathroom|pee|poo|washroom/)) {
        return {
            category: "Bathroom",
            refinedText: "I need the bathroom.",
            suggestions: ["Help me up", "Urgent", "Bedpan please"]
        };
    }

    return {
        category: "General",
        refinedText: text,
        suggestions: ["Yes", "No", "Thank you"]
    };
};

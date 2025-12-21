/**
 * ==========================================
 * INTENT SERVICE (Powered by Groq / Llama 3)
 * ==========================================
 * Analyzes speech using Llama 3 on Groq (Fast & Free tier).
 */

// ACCESS KEY FROM .ENV FILE
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY; 

// Groq OpenAI-compatible chat endpoint
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface IntentResponse {
  category: string;       
  refinedText: string;    
  suggestions: string[];  
}

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
      // UPDATED PROMPT: Specialized for Speech Impairments
      const systemPrompt = `
        You are an expert interpreter for patients with speech disorders (Dysarthria, Apraxia, Aphasia).
        The input text comes from an ASR system and may be broken, phonetic, or contain stammering.
        
        YOUR JOB:
        1. Aggressively PREDICT the intended meaning, even if words are missing.
        2. Reconstruct the "Refined Text" into a clear, first-person sentence ("I need...", "I feel...").
        3. If the input is just a keyword like "Water", assume the intent is "I need water".
        
        EXAMPLES:
        Input: "wa... wa... ter" 
        Result: {"refinedText": "I need some water.", "category": "Needs", "suggestions": ["Cold water", "With a straw", "Not thirsty"]}
        
        Input: "head... hu... bad"
        Result: {"refinedText": "My head hurts badly.", "category": "Pain", "suggestions": ["Call doctor", "I need meds", "Lie down"]}

        Input: "breath... hard"
        Result: {"refinedText": "I am struggling to breathe.", "category": "Emergency", "suggestions": ["Help me", "Sit up", "Inhaler"]}

        Return ONLY valid JSON:
        {
          "category": "String",
          "refinedText": "String",
          "suggestions": ["String", "String", "String"]
        }
      `;

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
            { role: "system", content: systemPrompt },
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
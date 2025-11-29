/**
 * ==========================================
 * INTENT SERVICE
 * ==========================================
 * * Analyzes the transcribed text to determine the patient's need.
 * Used for the "Predicted Intent" bubble in the UI.
 */

export const IntentService = {

  /**
   * Predicts the user's intent based on text.
   * @param text - The transcribed text from ASR
   */
  predictIntent: (text: string): string | null => {
    if (!text) return null;
    
    const lower = text.toLowerCase();

    // TODO: PHASE 3 - REPLACE WITH LLM CALL
    // const response = await fetch('https://api.openai.com/v1/chat/completions', ...);
    // return response.choices[0].message.content;

    // --- RULE-BASED LOGIC (Current MVP) ---
    
    // 1. Scheduling
    if (lower.includes('appointment') || lower.includes('schedule') || lower.includes('book')) {
      return "Schedule Appointment";
    }
    
    if (lower.includes('cancel') || lower.includes('reschedule')) {
      return "Modify Appointment";
    }

    // 2. Medical Alerts
    if (lower.includes('pain') || lower.includes('hurt') || lower.includes('ache') || lower.includes('emergency')) {
      return "Medical Alert / Symptom";
    }

    // 3. Accessibility Requests
    if (lower.includes('slow') || lower.includes('repeat') || lower.includes('didn\'t hear')) {
      return "Communication Adjustment";
    }

    // 4. Daily Needs
    if (lower.includes('water') || lower.includes('toilet') || lower.includes('food')) {
      return "Basic Needs";
    }

    return "General Conversation";
  }
};
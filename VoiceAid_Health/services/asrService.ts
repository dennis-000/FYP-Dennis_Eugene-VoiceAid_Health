/**
 * ==========================================
 * ASR SERVICE (Speech-to-Text)
 * ==========================================
 * * PHASE 1-3: Simulates recognition with timeouts.
 * PHASE 4: Connects to your Python/Flask API for Twi & Ga models.
 */

export type SupportedLanguage = 'en' | 'twi' | 'ga';

export const ASRService = {
  
  /**
   * Starts the microphone and handles audio recording + submission.
   * @param language - The selected language code
   */
  startListening: async (language: SupportedLanguage): Promise<string> => {
    
    // TODO: PHASE 3 - INTEGRATE ENGLISH API
    // 1. Start Audio.Recording (expo-av)
    // 2. Stop Recording
    // 3. Send URI to AssemblyAI / OpenAI Whisper API
    
    // TODO: PHASE 4 - INTEGRATE TWI/GA MODEL
    // const formData = new FormData();
    // formData.append('audio', { uri: recordingUri, name: 'audio.wav', type: 'audio/wav' });
    // const response = await fetch('https://your-api.com/predict', { body: formData, method: 'POST' });
    
    // --- SIMULATION (Current MVP) ---
    console.log(`[ASR Service] Listening for ${language}...`);
    
    return new Promise((resolve, reject) => {
      // Simulate network latency (2 seconds)
      setTimeout(() => {
        // Randomly succeed or fail to simulate real conditions
        const isSuccess = true; 

        if (!isSuccess) {
          reject("No speech detected. Please try again.");
          return;
        }

        // Mock Responses based on selected language
        switch (language) {
          case 'twi':
            resolve("Me ti pae me (My head hurts)");
            break;
          case 'ga':
            resolve("Mitsui n ya (My heart pains)");
            break;
          case 'en':
          default:
            resolve("I need to schedule an appointment for my checkup.");
            break;
        }
      }, 2000);
    });
  }
};
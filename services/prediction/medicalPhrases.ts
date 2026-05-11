/**
 * Curated Medical Phrase Vocabulary
 * Used for offline client-side prediction for speech-impaired patients.
 * Phrases are common in home & hospital settings.
 * 
 * Time-of-day context awareness: phrases tagged with timeContext
 * are prioritized based on the current hour of the day.
 */

export type TimeContext = 'morning' | 'afternoon' | 'evening' | 'night' | 'anytime';

export interface MedicalPhrase {
    text: string;
    category: 'pain' | 'needs' | 'medical' | 'emotional' | 'navigation';
    timeContext?: TimeContext;
}

/**
 * Returns the current time-of-day context based on the device clock.
 */
export function getCurrentTimeContext(): TimeContext {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
}

/**
 * Returns context-aware phrase suggestions based on time of day.
 * Prioritizes time-relevant phrases first, then fills with general phrases.
 */
export function getContextPhrases(language: string, limit: number = 4): MedicalPhrase[] {
    const lang = language.toLowerCase().includes('twi') || language === 'tw'
        ? 'twi'
        : language.toLowerCase().includes('ga') || language === 'ga'
        ? 'ga'
        : 'en';

    const phrases = medicalPhrases[lang] || medicalPhrases['en'];
    const ctx = getCurrentTimeContext();

    // Time-relevant phrases first
    const contextual = phrases.filter(p => p.timeContext === ctx);
    const general = phrases.filter(p => !p.timeContext || p.timeContext === 'anytime');

    // Combine: contextual first, then general (no duplicates)
    const seen = new Set<string>();
    const result: MedicalPhrase[] = [];

    for (const p of [...contextual, ...general]) {
        if (!seen.has(p.text) && result.length < limit) {
            seen.add(p.text);
            result.push(p);
        }
    }
    return result;
}

export const medicalPhrases: Record<string, MedicalPhrase[]> = {
    twi: [
        // Pain & Discomfort
        { text: 'Me yare.', category: 'pain' },
        { text: 'Me ho yɛ me ya.', category: 'pain' },
        { text: 'Me tirim yɛ me ya.', category: 'pain' },
        { text: 'M\'afunu yɛ me ya.', category: 'pain' },
        { text: 'Me sere yɛ me ya.', category: 'pain' },
        { text: 'Me nsa yɛ me ya.', category: 'pain' },
        { text: 'Me kɔn yɛ me ya.', category: 'pain' },
        { text: 'Yei yɛ me ya paa.', category: 'pain' },
        { text: 'Me ho mfata.', category: 'pain' },
        { text: 'Me hyehye.', category: 'pain' },
        { text: 'Me wia.', category: 'pain' },
        // Basic Needs
        { text: 'Mepɛ nsuo.', category: 'needs' },
        { text: 'Mepɛ aduan.', category: 'needs' },
        { text: 'Mepɛ aduan anɔpa.', category: 'needs', timeContext: 'morning' },
        { text: 'Mepɛ anwummerɛ aduan.', category: 'needs', timeContext: 'evening' },
        { text: 'Mepɛ sɛ me da.', category: 'needs', timeContext: 'night' },
        { text: 'Mepɛ sɛ mekɔ tiafi.', category: 'needs' },
        { text: 'Mepɛ sɛ mekɔ.', category: 'needs' },
        { text: 'Boa me.', category: 'needs' },
        { text: 'Mesu.', category: 'needs' },
        // Medical
        { text: 'Mepɛ aduro.', category: 'medical' },
        { text: 'Mepɛ me nɔkwa aduro.', category: 'medical', timeContext: 'morning' },
        { text: 'Mepɛ m\'anwummerɛ aduro.', category: 'medical', timeContext: 'evening' },
        { text: 'Mepɛ dɔkota.', category: 'medical' },
        { text: 'Mepɛ abaa.', category: 'medical' },
        { text: 'Frɛ dɔkota ma me.', category: 'medical' },
        { text: 'Frɛ me maame.', category: 'medical' },
        { text: 'Frɛ me papa.', category: 'medical' },
        { text: 'Me ho yɛ me ya paa, mehia mmoa.', category: 'medical' },
        { text: 'Me ahome a me tumi fa no yɛ ketewa.', category: 'medical' },
        // Emotional
        { text: 'Maakye.', category: 'emotional', timeContext: 'morning' },
        { text: 'Maha.', category: 'emotional', timeContext: 'afternoon' },
        { text: 'Maadwo.', category: 'emotional', timeContext: 'evening' },
        { text: 'Da yie.', category: 'emotional', timeContext: 'night' },
        { text: 'Meda ase.', category: 'emotional' },
        { text: 'Metɛ ase.', category: 'emotional' },
        { text: 'Aane.', category: 'emotional' },
        { text: 'Daabi.', category: 'emotional' },
        { text: 'Mepa wo kyɛw.', category: 'emotional' },
        { text: 'Me kɔ.', category: 'navigation' },
    ],
    ga: [
        // Pain & Discomfort
        { text: 'Mifɛɛ.', category: 'pain' },
        { text: 'Mi gbɛ mi yɛ mi ya.', category: 'pain' },
        { text: 'Mi kpɛ mi ya.', category: 'pain' },
        { text: 'Mi hee abale.', category: 'pain' },
        // Basic Needs
        { text: 'Mi hee nsuo.', category: 'needs' },
        { text: 'Mi tao niyeeni.', category: 'needs' },
        { text: 'Mi tao mla niyeeni.', category: 'needs', timeContext: 'morning' },
        { text: 'Mi tao gbɛkɛ niyeeni.', category: 'needs', timeContext: 'evening' },
        { text: 'Mi tao ma wɔ.', category: 'needs', timeContext: 'night' },
        { text: 'Boa mi.', category: 'needs' },
        { text: 'Mi hee kɔ tiafi.', category: 'needs' },
        // Medical
        { text: 'Mi hee aduro.', category: 'medical' },
        { text: 'Mi tao leebi tsofa.', category: 'medical', timeContext: 'morning' },
        { text: 'Mi tao gbɛkɛ tsofa.', category: 'medical', timeContext: 'evening' },
        { text: 'Mi hee dɔkota.', category: 'medical' },
        { text: 'Frɛ dɔkota ma mi.', category: 'medical' },
        // Emotional
        { text: 'Ojekoo.', category: 'emotional', timeContext: 'morning' },
        { text: 'Oshwiee.', category: 'emotional', timeContext: 'afternoon' },
        { text: 'Onaa.', category: 'emotional', timeContext: 'evening' },
        { text: 'Wɔ ojogbaa.', category: 'emotional', timeContext: 'night' },
        { text: 'Oyiwa.', category: 'emotional' },
        { text: 'Aane.', category: 'emotional' },
        { text: 'Daabi.', category: 'emotional' },
    ],
    en: [
        // Pain & Discomfort (anytime)
        { text: 'I am in pain.', category: 'pain' },
        { text: 'My head hurts.', category: 'pain' },
        { text: 'My stomach hurts.', category: 'pain' },
        { text: 'My chest hurts.', category: 'pain' },
        { text: 'My leg hurts.', category: 'pain' },
        { text: 'My arm hurts.', category: 'pain' },
        { text: 'I feel dizzy.', category: 'pain' },
        { text: 'I cannot breathe well.', category: 'pain' },
        { text: 'I feel sick.', category: 'pain' },
        { text: 'I feel hot.', category: 'pain' },
        { text: 'I feel cold.', category: 'pain' },
        // Basic Needs — time-tagged
        { text: 'I need water.', category: 'needs' },
        { text: 'I need food.', category: 'needs', timeContext: 'morning' },
        { text: 'I need breakfast.', category: 'needs', timeContext: 'morning' },
        { text: 'I need lunch.', category: 'needs', timeContext: 'afternoon' },
        { text: 'I need dinner.', category: 'needs', timeContext: 'evening' },
        { text: 'I need to sleep.', category: 'needs', timeContext: 'night' },
        { text: 'I need to use the bathroom.', category: 'needs' },
        { text: 'Please help me.', category: 'needs' },
        { text: 'I want to go.', category: 'needs' },
        { text: 'Good morning.', category: 'emotional', timeContext: 'morning' },
        { text: 'Good night.', category: 'emotional', timeContext: 'night' },
        // Medical — time-tagged
        { text: 'I need medicine.', category: 'medical' },
        { text: 'I need my morning medication.', category: 'medical', timeContext: 'morning' },
        { text: 'I need my evening medication.', category: 'medical', timeContext: 'evening' },
        { text: 'I need a doctor.', category: 'medical' },
        { text: 'Please call the nurse.', category: 'medical' },
        { text: 'Please call my family.', category: 'medical' },
        { text: 'I am having an emergency.', category: 'medical' },
        // Emotional
        { text: 'Thank you.', category: 'emotional' },
        { text: 'Yes.', category: 'emotional' },
        { text: 'No.', category: 'emotional' },
        { text: 'I understand.', category: 'emotional' },
        { text: 'Please repeat that.', category: 'emotional' },
    ],
};

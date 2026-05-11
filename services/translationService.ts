/**
 * ==========================================
 * TRANSLATION SERVICE
 * ==========================================
 * Multilingual support for English, Akan (Twi), and Ga
 * Using curated translations for better accuracy
 */

export type Language = 'en' | 'twi' | 'ga';

export interface Translations {
    dashboard: {
        welcome: string;
        myPatients: string;
        quickActions: string;
        managementTools: string;
        organization: string;
    };
    actions: {
        speak: string;
        phrases: string;
        history: string;
        routine: string;
        settings: string;
        viewAllPatients: string;
        logout: string;
    };
    language: {
        select: string;
        english: string;
        akan: string;
        ga: string;
    };
    patients: {
        assigned: string;
        noPatients: string;
        viewDetails: string;
    };
    transcript: {
        title: string;
        tapToSpeak: string;
        tapToProcess: string;
        listening: string;
        processing: string;
        tapMicToStart: string;
        speakClearly: string;
        welcomeMessage: string;
        readyToHelp: string;
        startConversation: string;
        batchMode: string;
        liveMode: string;
        tapToStartLive: string;
        tapToStopLive: string;
    };
    common: {
        loading: string;
        error: string;
        success: string;
        cancel: string;
        save: string;
    };
}

const translations: Record<Language, Translations> = {
    en: {
        dashboard: {
            welcome: 'Welcome',
            myPatients: 'My Patients',
            quickActions: 'Quick Actions',
            managementTools: 'Management Tools',
            organization: 'Organization',
        },
        actions: {
            speak: 'Assist Communication',
            phrases: 'Manage Phrases',
            history: 'View History',
            routine: 'Create Routine',
            settings: 'Settings',
            viewAllPatients: 'View All Patients',
            logout: 'Logout',
        },
        language: {
            select: 'Select Language',
            english: 'English',
            akan: 'Akan (Twi)',
            ga: 'Ga',
        },
        patients: {
            assigned: 'assigned',
            noPatients: 'No patients assigned yet',
            viewDetails: 'View Details',
        },
        transcript: {
            title: 'Smart Transcribe',
            tapToSpeak: 'Tap to Speak',
            tapToProcess: 'Tap to Process',
            listening: 'Listening...',
            processing: 'Processing...',
            tapMicToStart: 'Tap microphone to start',
            speakClearly: 'Speak clearly into the microphone',
            welcomeMessage: 'Hello! I\'m ready to help you communicate.',
            readyToHelp: 'Ready to assist',
            startConversation: 'Tap the microphone to start speaking.',
            batchMode: 'Batch',
            liveMode: 'Live',
            tapToStartLive: 'Tap to start live transcription',
            tapToStopLive: 'Tap to stop live transcription',
        },
        common: {
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            cancel: 'Cancel',
            save: 'Save',
        },
    },

    twi: {
        dashboard: {
            welcome: 'Akwaaba',
            myPatients: 'Me Ayarefoɔ',
            quickActions: 'Ntɛm Dwumadie',
            managementTools: 'Nhyehyɛe Nneɛma',
            organization: 'Ahyehyɛde',
        },
        actions: {
            speak: 'Boa Nkitahodie',
            phrases: 'Hwɛ Nsɛmfua',
            history: 'Hwɛ Abakɔsɛm',
            routine: 'Yɛ Nhyehyɛe',
            settings: 'Nhyehyɛe',
            viewAllPatients: 'Hwɛ Ayarefoɔ Nyinaa',
            logout: 'Fi Adi',
        },
        language: {
            select: 'Paw Kasa',
            english: 'Borɔfo Kasa',
            akan: 'Akan (Twi)',
            ga: 'Ga Kasa',
        },
        patients: {
            assigned: 'wɔ hɔ',
            noPatients: 'Ayarefoɔ biara nni hɔ',
            viewDetails: 'Hwɛ Nsɛm',
        },
        transcript: {
            title: 'Nkyerɛaseɛ Nhyehyɛe',
            tapToSpeak: 'Mia na Kasa',
            tapToProcess: 'Mia na Yɛ',
            listening: 'Ɛretie...',
            processing: 'Ɛreyɛ adwuma...',
            tapMicToStart: 'Mia maikrofon no na fi aseɛ',
            speakClearly: 'Kasa pefee wɔ maikrofon no mu',
            welcomeMessage: 'Akwaaba! Mepɛ sɛ meboa wo ma wo ne afoforɔ nkasa.',
            readyToHelp: 'Mepɛ sɛ meboa',
            startConversation: 'Mia maikrofon no na fi ase kasa.',
            batchMode: 'Batch',
            liveMode: 'Live',
            tapToStartLive: 'Mia na fi ase live transcription',
            tapToStopLive: 'Mia na gyae live transcription',
        },
        common: {
            loading: 'Ɛrekyerɛ...',
            error: 'Mfomsoɔ',
            success: 'Ɛyɛɛ Yie',
            cancel: 'Gyae',
            save: 'Kora',
        },
    },

    ga: {
        dashboard: {
            welcome: 'Bɔŋɔ Mli',
            myPatients: 'Mi Yɔɔfɛi',
            quickActions: 'Shɛɛ Kɛ Lɛ',
            managementTools: 'Nitsumɔ Nɛɛ',
            organization: 'Ekome',
        },
        actions: {
            speak: 'Lɛ Kɛ Wiemɔ',
            phrases: 'Kpaa Wiemɔi',
            history: 'Kɛ Abakɔsɛm',
            routine: 'Yɛ Nitsumɔ',
            settings: 'Nitsumɔ',
            viewAllPatients: 'Kɛ Yɔɔfɛi Tsɔɔ',
            logout: 'Tsɔɔ Fɛɛ',
        },
        language: {
            select: 'Paw Gbɛ',
            english: 'Blɔfo Gbɛ',
            akan: 'Akan (Twi)',
            ga: 'Ga Gbɛ',
        },
        patients: {
            assigned: 'lɛ hɔ',
            noPatients: 'Yɔɔfɛ yo kɛ',
            viewDetails: 'Kɛ Nsɛm',
        },
        transcript: {
            title: 'Nkyerɛaseɛ Kɛ',
            tapToSpeak: 'Mia Kɛ Kasa',
            tapToProcess: 'Mia Kɛ Yɛ',
            listening: 'Ɛ lɛ tie...',
            processing: 'Ɛ lɛ yɛ...',
            tapMicToStart: 'Mia maikrofon lɛ fi aseɛ',
            speakClearly: 'Kasa pefee wɔ maikrofon mu',
            welcomeMessage: 'Bɔŋɔ Mli! Mi lɛ pɛ kɛ boa wo ma wo kɛ wiemɔ.',
            readyToHelp: 'Mi lɛ pɛ kɛ boa',
            startConversation: 'Mia maikrofon lɛ fi ase kasa.',
            batchMode: 'Batch',
            liveMode: 'Live',
            tapToStartLive: 'Mia kɛ fi ase live transcription',
            tapToStopLive: 'Mia kɛ gyae live transcription',
        },
        common: {
            loading: 'Ɛ lɛ yɛ...',
            error: 'Mfomsoɔ',
            success: 'Ɛ yɛɛ Yie',
            cancel: 'Kpaa',
            save: 'Kora',
        },
    },
};

/**
 * Get translations for a specific language
 */
export const getTranslationsSync = (language: Language): Translations => {
    return translations[language] || translations.en;
};

/**
 * Get language name in its native form
 */
export const getLanguageName = (language: Language): string => {
    const names = {
        en: 'English',
        twi: 'Twi',
        ga: 'Ga',
    };
    return names[language];
};

/**
 * Get language flag emoji
 */
export const getLanguageFlag = (language: Language): string => {
    const flags = {
        en: '🇬🇧',
        twi: '🇬🇭',
        ga: '🇬🇭',
    };
    return flags[language];
};

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
            welcome: 'Wɔɛjɔɔmɔ',
            myPatients: 'Mi Helatsɛmɛi',
            quickActions: 'Nitsumɔi ni he hiaa',
            managementTools: 'Saamɔ Nitsumɔi',
            organization: 'Ahyehyɛde',
        },
        actions: {
            speak: 'Ye bua wiemɔ',
            phrases: 'Wiemɔ Saji',
            history: 'Abakɔsɛm',
            routine: 'Daa Gbi Nhyehyɛɛ',
            settings: 'Saamɔi',
            viewAllPatients: 'Kwamɔ Helatsɛmɛi Fɛɛ',
            logout: 'Tee Kpo',
        },
        language: {
            select: 'Hala Kasa',
            english: 'Blɔfo Kasa',
            akan: 'Akan (Twi)',
            ga: 'Ga Kasa',
        },
        patients: {
            assigned: 'ni akɛɛ',
            noPatients: 'Helatsɛ ko bɛ hɔ',
            viewDetails: 'Kwamɔ saji amli',
        },
        transcript: {
            title: 'Kasa Nkyerɛaseɛ',
            tapToSpeak: 'Taa ni owie',
            tapToProcess: 'Taa ni afo he',
            listening: 'Miibo toi...',
            processing: 'Miilɛ nitsumɔ...',
            tapMicToStart: 'Taa maikrofon lɛ ni oje shishi',
            speakClearly: 'Wiemɔ pefee wɔ maikrofon mu',
            welcomeMessage: 'Miihaao! Miisumɔ ni maye mi bua bo ni owie.',
            readyToHelp: 'Miisumɔ ni maye mi bua',
            startConversation: 'Taa maikrofon lɛ ni oje wiemɔ shishi.',
            batchMode: 'Batch',
            liveMode: 'Live',
            tapToStartLive: 'Taa kɛ oje live transcription shishi',
            tapToStopLive: 'Taa kɛ okpa live transcription',
        },
        common: {
            loading: 'Miiye nitsumɔ...',
            error: 'Tɔmɔ',
            success: 'Eye omanye',
            cancel: 'Kpa',
            save: 'To',
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { TTSService } from '../../services/tts';
import { AppContext } from '../../app/_layout';
import { useT } from '../../utils/i18n';

const MOOD_OPTIONS = [
    { level: 1, emoji: '😢', label: 'Very Sad', twi: 'Me werɛ ahow paa', color: '#ef4444' },
    { level: 2, emoji: '😕', label: 'Sad', twi: 'Me werɛ ahow', color: '#f97316' },
    { level: 3, emoji: '😐', label: 'Okay', twi: 'Ɛyɛ', color: '#eab308' },
    { level: 4, emoji: '🙂', label: 'Good', twi: 'Meyɛ', color: '#22c55e' },
    { level: 5, emoji: '😊', label: 'Very Happy', twi: 'M\'ani agye paa', color: '#10b981' },
];

interface MoodCheckInProps {
    patientId: string | null;
    colors: any;
    language: string;
    scale?: number;
}

export const MoodCheckIn: React.FC<MoodCheckInProps> = ({ patientId, colors, language, scale = 1 }) => {
    const tr = useT(language as any);
    const [alreadyLogged, setAlreadyLogged] = useState(false);
    const [selectedMood, setSelectedMood] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const hasSpokenRef = React.useRef(false);

    // TTS greeting when card appears for the first time today
    useEffect(() => {
        if (!alreadyLogged && !hasSpokenRef.current) {
            const greeting = tr('dailyMoodGreeting');
            hasSpokenRef.current = true;
            
            // Small delay so the UI renders first
            const timer = setTimeout(() => {
                TTSService.speak(greeting, language as any);
            }, 1000);
            
            return () => clearTimeout(timer);
        }
    }, [alreadyLogged]);

    const todayKey = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const checkIfLoggedToday = async () => {
        const lastDate = await AsyncStorage.getItem('@voiceaid_last_mood_date');
        if (lastDate === todayKey()) {
            setAlreadyLogged(true);
        }
    };

    const handleMoodSelect = async (level: number) => {
        if (!patientId || saving) return;
        setSelectedMood(level);
        setSaving(true);

        const mood = MOOD_OPTIONS.find(m => m.level === level);
        
        // Speak a response
        const responseKey = `moodResp${level}` as any;
        const response = tr(responseKey);
        
        try {
            TTSService.speak(response, language as any);
        } catch {}

        try {
            await supabase.from('mood_logs').insert([{
                patient_id: patientId,
                mood_level: level,
            }]);
            await AsyncStorage.setItem('@voiceaid_last_mood_date', todayKey());
            
            // Collapse after a short delay
            setTimeout(() => {
                setAlreadyLogged(true);
            }, 2500);
        } catch (error) {
            console.error('[MoodCheckIn] Error saving mood:', error);
        } finally {
            setSaving(false);
        }
    };

    // Don't render if already logged today
    if (alreadyLogged) {
        return null;
    }

    return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.greeting, { color: colors.text, fontSize: 18 * scale }]}>
                {tr('dailyMoodGreeting')}
            </Text>
            <Text style={[styles.subtext, { color: colors.subText, fontSize: 13 * scale }]}>
                {tr('dailyMoodSub')}
            </Text>

            <View style={styles.emojiRow}>
                {MOOD_OPTIONS.map((mood) => (
                    <TouchableOpacity
                        key={mood.level}
                        style={[
                            styles.emojiBtn,
                            selectedMood === mood.level && { backgroundColor: (colors.accent || '#FFD700') + '20', borderColor: (colors.accent || '#FFD700'), borderWidth: 2.5 }
                        ]}
                        onPress={() => handleMoodSelect(mood.level)}
                        activeOpacity={0.7}
                        disabled={saving}
                    >
                        <Text style={[styles.emoji, { fontSize: 36 * scale }]}>{mood.emoji}</Text>
                        <Text style={[styles.emojiLabel, { color: colors.subText, fontSize: 10 * scale }]}>
                            {language === 'twi' ? mood.twi.substring(0, 12) : mood.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        marginBottom: 20,
    },
    greeting: {
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    subtext: {
        marginBottom: 16,
    },
    emojiRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 4,
    },
    emojiBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    emoji: {
        marginBottom: 4,
    },
    emojiLabel: {
        fontWeight: '600',
        textAlign: 'center',
    },
});

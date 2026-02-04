import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TTSService } from '../services/tts';
import { AppContext } from './_layout';

// Sample Phrases with Twi translations
const PHRASES = [
    { id: '1', text: 'Hello', twi: 'Agoo', icon: 'hand-left' },
    { id: '2', text: 'Water', twi: 'Nsuo', icon: 'water' },
    { id: '3', text: 'Food', twi: 'Aduane', icon: 'fast-food' },
    { id: '4', text: 'Help', twi: 'Boa me', icon: 'alert-circle' },
    { id: '5', text: 'Toilet', twi: 'Wia', icon: 'male' }, // Simplified
    { id: '6', text: 'Pain', twi: 'Me yare', icon: 'medkit' },
    { id: '7', text: 'Yes', twi: 'Aane', icon: 'checkmark-circle' },
    { id: '8', text: 'No', twi: 'Daabi', icon: 'close-circle' },
];

export default function PhraseboardScreen() {
    const router = useRouter();
    const { colors, language } = useContext(AppContext);
    const [speakingId, setSpeakingId] = useState<string | null>(null);

    const handleSpeak = async (phrase: typeof PHRASES[0]) => {
        setSpeakingId(phrase.id);
        const textToSpeak = language === 'twi' ? phrase.twi : phrase.text;
        const langCode = language === 'twi' ? 'twi' : 'en'; // Using 'twi' to match service expectation

        await TTSService.speak(textToSpeak, langCode as any);
        setSpeakingId(null);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Phraseboard</Text>
            </View>

            <ScrollView contentContainerStyle={styles.grid}>
                {PHRASES.map((phrase) => (
                    <TouchableOpacity
                        key={phrase.id}
                        style={[
                            styles.card,
                            { backgroundColor: colors.card, borderColor: colors.border },
                            speakingId === phrase.id && { borderColor: colors.primary, borderWidth: 2 }
                        ]}
                        onPress={() => handleSpeak(phrase)}
                    >
                        <Ionicons name={phrase.icon as any} size={40} color={colors.primary} />
                        <Text style={[styles.cardText, { color: colors.text }]}>
                            {language === 'twi' ? phrase.twi : phrase.text}
                        </Text>
                        <Text style={[styles.subText, { color: colors.subText }]}>
                            {language === 'twi' ? phrase.text : phrase.twi}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Navigation Footer */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.push('/transcript')} style={styles.navItem}>
                    <Ionicons name="mic" size={24} color={colors.subText} />
                    <Text style={{ color: colors.subText }}>Speak</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="grid" size={24} color={colors.primary} />
                    <Text style={{ color: colors.primary }}>Phrases</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/settings')} style={styles.navItem}>
                    <Ionicons name="settings" size={24} color={colors.subText} />
                    <Text style={{ color: colors.subText }}>Settings</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        gap: 10,
        justifyContent: 'center',
    },
    card: {
        width: '45%',
        aspectRatio: 1,
        borderRadius: 16,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 12,
    },
    subText: {
        fontSize: 14,
        marginTop: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        borderTopWidth: 1,
    },
    navItem: {
        alignItems: 'center',
    }
});

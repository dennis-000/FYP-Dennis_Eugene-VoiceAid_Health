import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TTSService } from '../../services/tts';
import { useT } from '../../utils/i18n';
import { AppContext } from '../../app/_layout';

const TIPS = [
    { emoji: '💨', id: 'tip1' },
    { emoji: '🐢', id: 'tip2' },
    { emoji: '👄', id: 'tip3' },
    { emoji: '🪞', id: 'tip4' },
    { emoji: '💧', id: 'tip5' },
    { emoji: '🧘', id: 'tip6' },
    { emoji: '🎵', id: 'tip7' },
    { emoji: '🌬️', id: 'tip8' },
    { emoji: '📢', id: 'tip9' },
    { emoji: '🏆', id: 'tip10' },
    { emoji: '😴', id: 'tip11' },
    { emoji: '🔁', id: 'tip12' },
    { emoji: '🤝', id: 'tip13' },
    { emoji: '🌅', id: 'tip14' },
];

interface DailyTipProps {
    colors: any;
    language: string;
    scale?: number;
}

export const DailyTip: React.FC<DailyTipProps> = ({ colors, language, scale = 1 }) => {
    const [tip, setTip] = useState(TIPS[0]);
    const tr = useT(language as any);

    useEffect(() => {
        pickTodaysTip();
    }, []);

    const pickTodaysTip = async () => {
        // Use the day-of-year as a seed to pick a consistent tip for today
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now as any) - (start as any);
        const dayOfYear = Math.floor(diff / 86400000);
        const index = dayOfYear % TIPS.length;
        setTip(TIPS[index]);
    };

    const { ttsSpeed, ttsVoice } = useContext(AppContext);

    const speakTip = () => {
        const speedMapping: any = { slow: 0.8, normal: 1.0, fast: 1.2 };
        const phrase = tr('dailyTipPrefix') + tr(tip.id as any);
        TTSService.speak(phrase, language as any, { 
            speed: speedMapping[ttsSpeed], 
            gender: ttsVoice 
        });
    };

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={speakTip}
            activeOpacity={0.8}
        >
            <View style={styles.topRow}>
                <View style={[styles.emojiContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={styles.emoji}>{tip.emoji}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.label, { color: colors.primary, fontSize: 11 * scale }]}>
                        {tr('dailyTipLabel')}
                    </Text>
                    <Text style={[styles.tipText, { color: colors.text, fontSize: 14 * scale }]}>
                        {tr(tip.id as any)}
                    </Text>
                </View>
            </View>
            <Text style={[styles.tapHint, { color: colors.subText, fontSize: 11 * scale }]}>
                🔊 {tr('tapHearTip')}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        marginBottom: 20,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    emojiContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: { fontSize: 26 },
    label: {
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
    },
    tipText: {
        fontWeight: '500',
        lineHeight: 20,
    },
    tapHint: {
        textAlign: 'right',
        fontStyle: 'italic',
    },
});

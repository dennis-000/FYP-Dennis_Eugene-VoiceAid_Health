import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import React, { useContext, useState, useEffect } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TTSService } from '../services/tts';
import { AppContext } from './_layout';
import { useT } from '../utils/i18n';

interface QuickPhrase {
    id: string;
    category: string;
    text: string;
    twi: string;
    ga: string;
    icon: string;
    color: string;
}

const QUICK_PHRASES: QuickPhrase[] = [
    // ── Basic Needs ─────────────────────────
    { id: 'q1',  category: 'Basic Needs', text: 'I am thirsty.',         twi: 'Mesu nsuo.',          ga: 'M\'afi ny\u0254\u014b.',       icon: 'water',        color: '#0ea5e9' },
    { id: 'q2',  category: 'Basic Needs', text: 'I am hungry.',          twi: 'Mekasa aduane.',      ga: 'M\'akasa nyemi.',    icon: 'fast-food',    color: '#f59e0b' },
    { id: 'q3',  category: 'Basic Needs', text: 'I need the toilet.',    twi: 'Mehia wia.',           ga: 'Mehia atswa.',      icon: 'male',         color: '#8b5cf6' },
    { id: 'q4',  category: 'Basic Needs', text: 'I am tired.',           twi: 'Mew\u0254.',              ga: 'Mew\u0254.',            icon: 'bed',          color: '#6366f1' },
    { id: 'q5',  category: 'Basic Needs', text: 'I am cold.',            twi: 'Aw\u0254 de me.',         ga: 'M\'ap\u025bt\u025b.',        icon: 'snow',         color: '#06b6d4' },
    { id: 'q6',  category: 'Basic Needs', text: 'I am hot.',             twi: 'Ehyew de me.',        ga: 'Eke de mi.',        icon: 'flame',        color: '#f97316' },
    { id: 'q7',  category: 'Basic Needs', text: 'I need a blanket.',     twi: 'Mehia ntama.',        ga: 'Mehia ntama.',      icon: 'shirt',        color: '#64748b' },
    { id: 'q8',  category: 'Basic Needs', text: 'I need my phone.',      twi: 'Mehia me fon.',       ga: 'Mehia me fon.',     icon: 'phone-portrait', color: '#3b82f6' },

    // ── Medical ─────────────────────────────
    { id: 'q9',  category: 'Medical',     text: 'I have pain.',          twi: 'Me yare.',            ga: 'M\'obuu.',          icon: 'medkit',       color: '#ef4444' },
    { id: 'q10', category: 'Medical',     text: 'My head hurts.',        twi: 'Me ti yare.',         ga: 'M\'elo obuu.',      icon: 'sad',          color: '#dc2626' },
    { id: 'q11', category: 'Medical',     text: 'I feel dizzy.',         twi: 'Me ti repin.',        ga: 'M\'ep\u025bni.',        icon: 'warning',      color: '#d97706' },
    { id: 'q12', category: 'Medical',     text: 'I feel sick.',          twi: 'Me ho ny\u025b.',          ga: 'M\'ab\u0254.',          icon: 'thermometer', color: '#b91c1c' },
    { id: 'q13', category: 'Medical',     text: 'I need medicine.',      twi: 'Mehia adura.',        ga: 'Mehia adura.',      icon: 'flask',        color: '#0d9488' },
    { id: 'q14', category: 'Medical',     text: 'Please call the nurse.',twi: 'Mepa w\'aky\u025bw fr\u025b oky\u025bfa.', ga: 'Paai fr\u025b boa.', icon: 'call',   color: '#7c3aed' },
    { id: 'q15', category: 'Medical',     text: 'Please call the doctor.',twi: 'Fr\u025b d\u0254kota.',      ga: 'Fr\u025b d\u0254k\u0254ta.',   icon: 'medkit',      color: '#10b981' },
    { id: 'q16', category: 'Medical',     text: 'I cannot breathe well.',twi: 'Me h\u0254m amma me.',  ga: 'M\'ah\u0254m a a mi.', icon: 'warning',      color: '#ef4444' },

    // ── Emotions ────────────────────────────
    { id: 'q17', category: 'Emotions',   text: 'I am happy.',           twi: 'Me ani gye.',         ga: 'M\'obiaa.',         icon: 'happy',        color: '#22c55e' },
    { id: 'q18', category: 'Emotions',   text: 'I am sad.',             twi: 'Me wereh\u0254.',         ga: 'M\'ak\u0254.',          icon: 'sad',          color: '#64748b' },
    { id: 'q19', category: 'Emotions',   text: 'I am scared.',          twi: 'Mehu hu.',            ga: 'M\'agb\u025b.',         icon: 'alert-circle', color: '#f59e0b' },
    { id: 'q20', category: 'Emotions',   text: 'I am frustrated.',      twi: 'Me bo fu.',           ga: 'M\'abii.',          icon: 'sad-outline',  color: '#dc2626' },
    { id: 'q21', category: 'Emotions',   text: 'I feel okay.',          twi: 'Me ho y\u025b.',           ga: 'M\'oy\u025b.',           icon: 'thumbs-up',    color: '#3b82f6' },
    { id: 'q22', category: 'Emotions',   text: 'I want to rest.',       twi: 'Mehia ahome.',        ga: 'Mehia hee.',        icon: 'moon',         color: '#6366f1' },

    // ── Social ──────────────────────────────
    { id: 'q23', category: 'Social',     text: 'Hello!',                twi: 'Agoo!',               ga: 'Ojekoo!',           icon: 'hand-left',    color: '#3b82f6' },
    { id: 'q24', category: 'Social',     text: 'Thank you.',            twi: 'Medaase.',            ga: 'Oyiwala.',          icon: 'heart',        color: '#ec4899' },
    { id: 'q25', category: 'Social',     text: 'Please.',               twi: 'Mepa w\'aky\u025bw.',     ga: 'Paai.',             icon: 'hand-right',   color: '#8b5cf6' },
    { id: 'q26', category: 'Social',     text: 'Yes.',                  twi: 'Aane.',               ga: 'H\u025b\u025b.',           icon: 'checkmark-circle', color: '#22c55e' },
    { id: 'q27', category: 'Social',     text: 'No.',                   twi: 'Daabi.',              ga: 'Daabi.',            icon: 'close-circle', color: '#ef4444' },
    { id: 'q28', category: 'Social',     text: 'I do not understand.',  twi: 'Mente aseɛ.',          ga: 'Ent\u025b asm.',        icon: 'help-circle',  color: '#d97706' },
    { id: 'q29', category: 'Social',     text: 'Wait please.',          twi: 'Tw\u025bn kakra.',         ga: 'Tw\u025bn kakra.',      icon: 'pause-circle', color: '#64748b' },
    { id: 'q30', category: 'Social',     text: 'I need help.',          twi: 'Mehia mmoa.',         ga: 'Mehia boa.',        icon: 'alert-circle', color: '#dc2626' },
];

const CATEGORIES = ['All', 'Basic Needs', 'Medical', 'Emotions', 'Social'];

export default function QuickPhrasesScreen() {
    const router = useRouter();
    const { colors, language, ttsSpeed, ttsVoice } = useContext(AppContext);
    const tr = useT(language as any);
    const [activeCategory, setActiveCategory] = useState('All');
    const [spokenId, setSpokenId] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            TTSService.stop().catch(() => {});
        };
    }, []);

    const filtered = activeCategory === 'All'
        ? QUICK_PHRASES
        : QUICK_PHRASES.filter(p => p.category === activeCategory);

    const getLabel = (p: QuickPhrase): string => {
        if (language === 'twi' && p.twi) return p.twi;
        if (language === 'ga' && p.ga) return p.ga;
        return p.text;
    };

    const handleSpeak = async (p: QuickPhrase) => {
        setSpokenId(p.id);
        try {
            const speedMapping = { slow: 0.8, normal: 1.0, fast: 1.2 };
            await TTSService.speak(getLabel(p), language as any, { speed: speedMapping[ttsSpeed], gender: ttsVoice });
        } catch {}
        setTimeout(() => setSpokenId(null), 2500);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {tr('quickPhrasesTitle')}
                    </Text>
                    <Text style={[styles.headerSub, { color: colors.subText }]}>
                        {tr('quickPhrasesSubtitle')}
                    </Text>
                </View>
            </View>

            {/* Category tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ maxHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.border }}
                contentContainerStyle={styles.tabRow}
            >
                {CATEGORIES.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => setActiveCategory(cat)}
                        style={[
                            styles.tab,
                            activeCategory === cat && { borderBottomColor: colors.primary, borderBottomWidth: 3 }
                        ]}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeCategory === cat ? colors.primary : colors.subText },
                            activeCategory === cat && { fontWeight: '700' }
                        ]}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Phrases */}
            <ScrollView contentContainerStyle={styles.listContent}>
                {filtered.map(p => {
                    const isSpeaking = spokenId === p.id;
                    return (
                        <TouchableOpacity
                            key={p.id}
                            style={[
                                styles.row,
                                {
                                    backgroundColor: isSpeaking ? p.color + '15' : colors.card,
                                    borderColor: isSpeaking ? p.color : colors.border,
                                }
                            ]}
                            onPress={() => handleSpeak(p)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconBox, { backgroundColor: p.color + '20' }]}>
                                <Ionicons name={p.icon as any} size={28} color={p.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.phraseText, { color: colors.text }]}>
                                    {getLabel(p)}
                                </Text>
                                {language !== 'en' && (
                                    <Text style={[styles.phraseEn, { color: colors.subText }]}>
                                        {p.text}
                                    </Text>
                                )}
                            </View>
                            {isSpeaking && (
                                <Text style={{ fontSize: 20 }}>🔊</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    headerSub: { fontSize: 13 },
    tabRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 8,
    },
    tab: {
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    tabText: { fontSize: 14 },
    listContent: {
        padding: 16,
        gap: 10,
        paddingBottom: 60,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1.5,
        padding: 14,
        gap: 14,
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    phraseText: {
        fontSize: 17,
        fontWeight: '700',
        lineHeight: 22,
    },
    phraseEn: {
        fontSize: 13,
        marginTop: 2,
    },
});

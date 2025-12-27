import { Activity, Calendar, LayoutGrid, Mic, Settings } from 'lucide-react-native';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { homeStyles as styles } from '../../styles/index.styles';
import BigButton from '../BigButton';

interface CaregiverDashboardProps {
    router: any;
    t: any;
    colors: any;
    language: string;
    setLanguage: (lang: any) => void;
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({ router, t, colors, language, setLanguage }) => {
    return (
        <>
            {/* Language Selection - Manual Control for Caregivers */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t.activeLang}</Text>
                <View style={styles.langRow}>
                    {['en', 'twi', 'ga'].map((lang) => (
                        <TouchableOpacity
                            key={lang}
                            onPress={() => setLanguage(lang as any)}
                            style={[
                                styles.langBadge,
                                {
                                    backgroundColor: language === lang ? colors.primary : 'transparent',
                                    borderColor: colors.primary
                                }
                            ]}
                        >
                            <Text style={{
                                color: language === lang ? '#FFF' : colors.text,
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                            }}>
                                {lang}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Primary Action - Assisted Communication */}
            <BigButton
                icon={Mic}
                label="Assist Communication"
                fullWidth
                onPress={() => router.push('/transcript')}
            />

            {/* Management Tools Grid */}
            <View style={styles.grid}>
                <BigButton
                    icon={LayoutGrid}
                    label="Manage Phrases"
                    onPress={() => router.push('/phraseboard')}
                />

                <BigButton
                    icon={Calendar}
                    label="Create Routine"
                    onPress={() => router.push('/routine')}
                />

                <BigButton
                    icon={Activity}
                    label="View History"
                    onPress={() => {
                        // Will implement history screen later
                        Alert.alert('Coming Soon', 'Communication history feature will be available in the next update.');
                    }}
                />

                <BigButton
                    icon={Settings}
                    label="Full Settings"
                    onPress={() => router.push('/settings')}
                />
            </View>

            {/* System Status */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 20 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Activity size={20} color={colors.success} />
                    <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 10, marginBottom: 0 }]}>
                        {t.systemReady}
                    </Text>
                </View>
                <Text style={{ color: colors.subText, marginTop: 5 }}>
                    All management tools available
                </Text>
            </View>
        </>
    );
};

import { Activity, Calendar, LayoutGrid, Mic, Settings } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { homeStyles as styles } from '../../styles/index.styles';
import BigButton from '../BigButton';

interface PatientDashboardProps {
    router: any;
    t: any;
    colors: any;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ router, t, colors }) => {
    return (
        <>
            {/* PrimaryAction - Speech Communication */}
            <BigButton
                icon={Mic}
                label={t.speakNow}
                fullWidth
                onPress={() => router.push('/transcript')}
            />

            {/* Secondary Actions Grid */}
            <View style={styles.grid}>
                <BigButton
                    icon={LayoutGrid}
                    label={t.phraseBoard}
                    onPress={() => router.push('/phraseboard')}
                />

                <BigButton
                    icon={Calendar}
                    label="My Reminders"
                    onPress={() => router.push('/routine')}
                />
            </View>

            {/* Settings Button */}
            <TouchableOpacity
                style={[
                    styles.settingsLink,
                    { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => router.push('/settings')}
            >
                <Settings size={20} color={colors.primary} />
                <Text style={[styles.settingsText, { color: colors.text }]}>
                    Settings
                </Text>
            </TouchableOpacity>

            {/* Language Auto-Detected (No manual selection for patients) */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 20 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Activity size={20} color={colors.success} />
                    <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 10, marginBottom: 0 }]}>
                        {t.systemReady}
                    </Text>
                </View>
                <Text style={{ color: colors.subText, marginTop: 5 }}>
                    Language auto-detection enabled
                </Text>
            </View>
        </>
    );
};

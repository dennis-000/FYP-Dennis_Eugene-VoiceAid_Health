import { useRouter } from 'expo-router';
import { Activity, Calendar, LayoutGrid, Mic, Settings, Users } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { homeStyles as styles } from '../../styles/index.styles';
import BigButton from '../BigButton';

interface CaregiverDashboardProps {
    router: ReturnType<typeof useRouter>;
    t: any;
    colors: any;
    language: string;
    setLanguage: (lang: 'en' | 'twi' | 'ga') => void;
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({ router, t, colors, language, setLanguage }) => {
    const { therapistProfile } = useAuth();
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
                            activeOpacity={0.7}
                        >
                            <Text style={{
                                color: language === lang ? '#FFF' : colors.text,
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
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

            {/* My Patients Section */}
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.primary, borderColor: colors.primary, marginTop: 20 }]}
                onPress={() => router.push('/my-patients')}
                activeOpacity={0.8}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 12 }}>
                            <Users size={28} color="#FFFFFF" />
                        </View>
                        <View>
                            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', letterSpacing: 0.3 }}>
                                My Patients
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 2 }}>
                                {therapistProfile?.assigned_patients?.length || 0} assigned
                            </Text>
                        </View>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>→</Text>
                    </View>
                </View>
            </TouchableOpacity>

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
                        router.push('/history');
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

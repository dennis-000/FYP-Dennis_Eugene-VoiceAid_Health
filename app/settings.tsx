import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  Info,
  LogOut,
  Moon,
  Sun,
  Type,
  User,
  Volume2,
  Accessibility,
  Languages,
  Trash2,
  FileDown,
  Activity
} from 'lucide-react-native';
import React, { useContext, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsRow } from '../components/SettingsRow';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { settingsStyles as styles } from '../styles/settings.styles';
import { AppContext } from './_layout';

/**
 * ==========================================
 * LOCAL COMPONENTS
 * ==========================================
 */
const Header = ({ title, onBack }: { title: string, onBack: () => void }) => {
  const { colors } = useContext(AppContext);
  return (
    <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ArrowLeft size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
};

const SectionTitle = ({ title, color }: { title: string, color: string }) => (
  <Text style={[styles.sectionTitle, { color }]}>{title.toUpperCase()}</Text>
);

/**
 * ==========================================
 * SETTINGS SCREEN
 * ==========================================
 */
export default function SettingsScreen() {
  const router = useRouter();
  
  const { 
    colors, 
    themeMode, 
    toggleTheme, 
    language, 
    setLanguage,
    largeText,
    setLargeText,
    reduceMotion,
    setReduceMotion,
    ttsSpeed,
    setTtsSpeed
  } = useContext(AppContext);

  const { role, setRole, patientType } = useRole();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will return to the welcome screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.removeItem('@voiceaid_role');
              await AsyncStorage.removeItem('@voiceaid_patient_type');
              router.replace('/welcome');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const cycleLanguage = () => {
    setLanguage(language === 'en' ? 'twi' : 'en');
  };

  const cycleTtsSpeed = () => {
    if (ttsSpeed === 'normal') setTtsSpeed('slow');
    else if (ttsSpeed === 'slow') setTtsSpeed('fast');
    else setTtsSpeed('normal');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Settings" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ACCESSIBILITY SECTION (Global) */}
        <SectionTitle title="Accessibility & Display" color={colors.subText} />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon={themeMode === 'high-contrast' ? Moon : Sun}
            iconColor={themeMode === 'high-contrast' ? "#60A5FA" : "#D97706"}
            iconBg={themeMode === 'high-contrast' ? '#1E293B' : '#FEF3C7'}
            title="Dark Mode"
            subtitle={themeMode === 'high-contrast' ? 'On' : 'Off'}
            switchValue={themeMode === 'high-contrast'}
            onSwitchChange={toggleTheme}
            activeTrackColor={colors.primary}
            titleColor={colors.text}
            subtitleColor={colors.subText}
            largeText={largeText}
          />
          <SettingsRow
            icon={Type}
            iconColor="#2563EB"
            iconBg="#DBEAFE"
            title="Large Text Display"
            subtitle="Increases font scaling globally"
            switchValue={largeText}
            onSwitchChange={setLargeText}
            activeTrackColor={colors.primary}
            showBorderTop
            borderColor={colors.border}
            titleColor={colors.text}
            subtitleColor={colors.subText}
            largeText={largeText}
          />
          <SettingsRow
            icon={Accessibility}
            iconColor="#8B5CF6"
            iconBg="#EDE9FE"
            title="Reduce Motion"
            subtitle="Limits UI animations and transitions"
            switchValue={reduceMotion}
            onSwitchChange={setReduceMotion}
            activeTrackColor={colors.primary}
            showBorderTop
            borderColor={colors.border}
            titleColor={colors.text}
            subtitleColor={colors.subText}
            largeText={largeText}
          />
        </View>

        {/* LANGUAGE SECTION (Global) */}
        <SectionTitle title="Language & Region" color={colors.subText} />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon={Languages}
            iconColor="#EC4899"
            iconBg="#FCE7F3"
            title="App Language"
            subtitle={language === 'twi' ? 'Twi (Akan)' : 'English'}
            onPress={cycleLanguage}
            rightElement={<ChevronRight size={20} color={colors.subText} />}
            titleColor={colors.text}
            subtitleColor={colors.subText}
            largeText={largeText}
          />
        </View>

        {/* PATIENT ONLY SETTINGS */}
        {role === 'patient' && (
          <>
            <SectionTitle title="Voice Assistant Preferences" color={colors.subText} />
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingsRow
                icon={Volume2}
                iconColor="#0EA5E9"
                iconBg="#E0F2FE"
                title="Voice Speaking Speed"
                subtitle={`Current: ${ttsSpeed.charAt(0).toUpperCase() + ttsSpeed.slice(1)}`}
                onPress={cycleTtsSpeed}
                rightElement={<ChevronRight size={20} color={colors.subText} />}
                titleColor={colors.text}
                subtitleColor={colors.subText}
                largeText={largeText}
              />
            </View>

            <SectionTitle title="Privacy & Data" color={colors.subText} />
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingsRow
                icon={Trash2}
                iconColor="#EF4444"
                iconBg="#FEE2E2"
                title="Clear Transcription History"
                subtitle="Delete all your personal communication logs"
                onPress={() => Alert.alert('Coming Soon', 'History wipe API pending.')}
                rightElement={<ChevronRight size={20} color={colors.subText} />}
                titleColor={colors.text}
                subtitleColor={colors.subText}
                largeText={largeText}
              />
            </View>
          </>
        )}

        {/* CAREGIVER/THERAPIST ONLY SETTINGS */}
        {role === 'caregiver' && (
          <>
            <SectionTitle title="Clinical Management" color={colors.subText} />
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingsRow
                icon={Activity}
                iconColor="#10B981"
                iconBg="#D1FAE5"
                title="Default Fluency Target (WPM)"
                subtitle="Currently set to: 120 WPM"
                onPress={() => Alert.alert('Target Config', 'Change default WPM target for new patients.')}
                rightElement={<ChevronRight size={20} color={colors.subText} />}
                titleColor={colors.text}
                subtitleColor={colors.subText}
                largeText={largeText}
              />
              <SettingsRow
                icon={ClipboardList}
                iconColor={colors.primary}
                iconBg="#E0E7FF"
                title="Global Audit Logs"
                subtitle="View system-wide clinical event logs"
                onPress={() => router.push("/history")}
                rightElement={<ChevronRight size={20} color={colors.subText} />}
                showBorderTop
                borderColor={colors.border}
                titleColor={colors.text}
                subtitleColor={colors.subText}
                largeText={largeText}
              />
            </View>

            <SectionTitle title="Data & Compliance" color={colors.subText} />
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingsRow
                icon={FileDown}
                iconColor="#F59E0B"
                iconBg="#FEF3C7"
                title="Export Patient Data (CSV)"
                subtitle="Download fluency logs for compliance"
                onPress={() => Alert.alert('Export', 'Preparing CSV download...')}
                rightElement={<ChevronRight size={20} color={colors.subText} />}
                titleColor={colors.text}
                subtitleColor={colors.subText}
                largeText={largeText}
              />
            </View>
          </>
        )}

        {/* USER ACCOUNT SECTION */}
        <SectionTitle title="Account" color={colors.subText} />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon={role === 'patient' ? User : HeartPulse}
            iconColor={role === 'patient' ? "#2563EB" : "#059669"}
            iconBg={role === 'patient' ? '#DBEAFE' : '#D1FAE5'}
            title="Profile details"
            subtitle={`Role: ${role === 'patient' ? 'Patient' : 'Therapist'}`}
            onPress={() => Alert.alert('Profile', 'Edit profile details coming soon.')}
            rightElement={<ChevronRight size={20} color={colors.subText} />}
            titleColor={colors.text}
            subtitleColor={colors.subText}
            largeText={largeText}
          />
          <SettingsRow
            icon={LogOut}
            iconColor="#EF4444"
            iconBg="#FEE2E2"
            title="Log Out"
            subtitle="Return to welcome screen"
            onPress={handleLogout}
            rightElement={<ChevronRight size={20} color={colors.subText} />}
            showBorderTop
            borderColor={colors.border}
            titleColor={colors.text}
            subtitleColor={colors.subText}
            largeText={largeText}
          />
        </View>

        {/* APP INFO */}
        <View style={{ alignItems: 'center', marginVertical: 30 }}>
          <Info size={24} color={colors.subText} style={{ marginBottom: 8 }} />
          <Text style={{ color: colors.subText, fontSize: 13 }}>VoiceAid MVP v1.0.0</Text>
          <Text style={{ color: colors.subText, fontSize: 12, marginTop: 4 }}>Speech Therapy & Augmentative Communication</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

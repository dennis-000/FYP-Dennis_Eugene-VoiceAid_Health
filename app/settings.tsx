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
  UserCog
} from 'lucide-react-native';
import React, { useContext, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
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
  const { colors, themeMode, toggleTheme } = useContext(AppContext);
  const { role, setRole, patientType } = useRole();
  const { signOut } = useAuth();

  // Local state
  const [caregiverMode, setCaregiverMode] = useState(false);
  const [largeText, setLargeText] = useState(true);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will return to the welcome screen.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear authentication
              await signOut();

              // Clear role from AsyncStorage
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.removeItem('@voiceaid_role');
              await AsyncStorage.removeItem('@voiceaid_patient_type');

              // Navigate to welcome screen
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


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Settings" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ACCESSIBILITY SECTION */}
        <SectionTitle title="Accessibility" color={colors.subText} />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>

          {/* Theme Toggle */}
          <SettingsRow
            icon={themeMode === 'high-contrast' ? Sun : Moon}
            iconColor={themeMode === 'high-contrast' ? "#FFD700" : "#D97706"}
            iconBg={themeMode === 'high-contrast' ? '#333' : '#FEF3C7'}
            title="High Contrast"
            subtitle={themeMode === 'high-contrast' ? 'On' : 'Off'}
            switchValue={themeMode === 'high-contrast'}
            onSwitchChange={toggleTheme}
            activeTrackColor={colors.primary}
            titleColor={colors.text}
            subtitleColor={colors.subText}
          />

          {/* Large Text Toggle */}
          <SettingsRow
            icon={Type}
            iconColor="#2563EB"
            iconBg="#DBEAFE"
            title="Large Text"
            subtitle="For better readability"
            switchValue={largeText}
            onSwitchChange={setLargeText}
            activeTrackColor={colors.primary}
            showBorderTop
            borderColor={colors.border}
            titleColor={colors.text}
            subtitleColor={colors.subText}
          />
        </View>

        {/* USER ROLE SECTION */}
        <SectionTitle title="User Role" color={colors.subText} />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>

          {/* Current Role Display */}
          <SettingsRow
            icon={role === 'patient' ? User : HeartPulse}
            iconColor={role === 'patient' ? "#2563EB" : "#059669"}
            iconBg={role === 'patient' ? '#DBEAFE' : '#D1FAE5'}
            title="Current Role"
            subtitle={role === 'patient' ? 'Patient' : 'Caregiver / Healthcare Worker'}
            titleColor={colors.text}
            subtitleColor={colors.subText}
          />

          {/* Info about changing roles */}
          <View style={{ padding: 16, paddingTop: 8 }}>
            <Text style={[{ fontSize: 13, color: colors.subText, lineHeight: 18 }]}>
              To change your role, please logout and select a different option from the welcome screen.
            </Text>
          </View>
        </View>

        {/* CAREGIVER CONTROLS */}
        <SectionTitle title="Caregiver Mode" color={colors.subText} />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>

          <SettingsRow
            icon={UserCog}
            iconColor="#059669"
            iconBg="#D1FAE5"
            title="Caregiver Access"
            subtitle="Enable editing and logs."
            switchValue={caregiverMode}
            onSwitchChange={setCaregiverMode}
            activeTrackColor={colors.success}
            titleColor={colors.text}
            subtitleColor={colors.subText}
          />

          {caregiverMode && (
            <SettingsRow
              icon={ClipboardList}
              iconColor={colors.primary}
              iconBg="#E0E7FF"
              title="View Patient Logs"
              onPress={() => router.push("/history")}
              rightElement={<ChevronRight size={20} color={colors.subText} />}
              showBorderTop
              borderColor={colors.border}
              titleColor={colors.text}
              subtitleColor={colors.subText}
            />
          )}

        </View>

        {/* LOGOUT SECTION */}
        <SectionTitle title="Account" color={colors.subText} />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon={LogOut}
            iconColor="#EF4444"
            iconBg="#FEE2E2"
            title="Logout"
            subtitle="Return to welcome screen"
            onPress={handleLogout}
            rightElement={<ChevronRight size={20} color={colors.subText} />}
            titleColor={colors.text}
            subtitleColor={colors.subText}
          />
        </View>

        {/* APP INFO */}
        <SectionTitle title="About" color={colors.subText} />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon={Info}
            iconColor="#4B5563"
            iconBg="#F3F4F6"
            title="Version 1.0.0 (MVP)"
            titleColor={colors.text}
            subtitleColor={colors.subText}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}


import React, { useContext, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Sun, 
  Moon, 
  Type, 
  UserCog, 
  Info 
} from 'lucide-react-native';
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
  
  // Local state for non-global settings (placeholders)
  const [caregiverMode, setCaregiverMode] = useState(false);
  const [largeText, setLargeText] = useState(true); // Default to true for accessibility focus

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Settings" onBack={() => router.back()} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* ACCESSIBILITY SECTION */}
        <SectionTitle title="Accessibility" color={colors.subText} />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          
          {/* Theme Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: themeMode === 'light' ? '#FEF3C7' : '#333' }]}>
                {themeMode === 'high-contrast' ? (
                    <Sun size={20} color="#FFD700" />
                  ) : (
                    <Moon size={20} color="#D97706" />
                  )}
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>High Contrast</Text>
                <Text style={[styles.settingSub, { color: colors.subText }]}>
                  {themeMode === 'high-contrast' ? 'On' : 'Off'}
                </Text>
              </View>
            </View>
            <Switch 
              value={themeMode === 'high-contrast'} 
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={themeMode === 'high-contrast' ? '#fff' : '#f4f3f4'}
            />
          </View>
          
          {/* Large Text Toggle (Visual Only for now) */}
          <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
             <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                <Type size={20} color="#2563EB" />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Large Text</Text>
                <Text style={[styles.settingSub, { color: colors.subText }]}>For better readability</Text>
              </View>
            </View>
            <Switch 
              value={largeText} 
              onValueChange={setLargeText}
              trackColor={{ false: '#767577', true: colors.primary }}
            /> 
          </View>
        </View>

        {/* CAREGIVER CONTROLS */}
        <SectionTitle title="Caregiver Mode" color={colors.subText} />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
               <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
                <UserCog size={20} color="#059669" />
               </View>
               <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Edit Medical Routines</Text>
                <Text style={[styles.settingSub, { color: colors.subText }]}>
                  Allow changes to daily tasks and medication schedules.
                </Text>
               </View>
            </View>
            <Switch 
              value={caregiverMode} 
              onValueChange={setCaregiverMode}
              trackColor={{ false: '#767577', true: colors.success }}
            /> 
          </View>
        </View>

        {/* APP INFO */}
        <SectionTitle title="About" color={colors.subText} />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
           <View style={styles.settingRow}>
             <View style={styles.rowLeft}>
               <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
                <Info size={20} color="#4B5563" />
               </View>
               <Text style={[styles.settingLabel, { color: colors.text }]}>Version 1.0.0 (MVP)</Text>
             </View>
           </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    borderBottomWidth: 1 
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  scrollContent: { padding: 20 },
  
  // Section Styles
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    marginBottom: 8, 
    marginLeft: 4,
    marginTop: 10,
    letterSpacing: 1 
  },
  section: { 
    borderRadius: 12, 
    borderWidth: 1, 
    marginBottom: 20,
    overflow: 'hidden'
  },
  
  // Row Styles
  settingRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16 
  },
  rowLeft: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  settingLabel: { 
    fontSize: 16, 
    fontWeight: '500' 
  },
  settingSub: {
    fontSize: 13,
    marginTop: 2
  }
});
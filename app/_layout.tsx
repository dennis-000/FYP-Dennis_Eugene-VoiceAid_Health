import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { createContext, useCallback, useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AnimatedSplashScreen from '../components/AnimatedSplashScreen';
import { THEMES, ThemeMode } from '../constants/theme';
import { AuthProvider } from '../contexts/AuthContext';
import { RoleProvider, UserRole } from '../contexts/RoleContext';

// Keep the native splash screen visible while we load resources
SplashScreen.preventAutoHideAsync();

// Context Definition
export const AppContext = createContext<{
  themeMode: ThemeMode;
  toggleTheme: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  colors: typeof THEMES['light'];
  userRole: UserRole;
  largeText: boolean;
  setLargeText: (val: boolean) => void;
  ttsSpeed: 'slow' | 'normal' | 'fast';
  setTtsSpeed: (val: 'slow' | 'normal' | 'fast') => void;
  reduceMotion: boolean;
  setReduceMotion: (val: boolean) => void;
}>({} as any);

// Wrapper Layout
export default function RootLayout() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [language, setLanguage] = useState<string>('en');
  const [largeText, setLargeText] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'high-contrast' : 'light');
  };

  const colors = THEMES[themeMode];

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <AuthProvider>
      <RoleProvider>
        <AppContext.Provider value={{ 
          themeMode, toggleTheme, language, setLanguage, colors, userRole: 'caregiver',
          largeText, setLargeText, ttsSpeed, setTtsSpeed, reduceMotion, setReduceMotion
        }}>
          <SafeAreaProvider onLayout={onLayoutRootView}>
            <StatusBar
              barStyle={themeMode === 'high-contrast' ? 'light-content' : 'dark-content'}
              backgroundColor={colors.bg}
            />
            <View style={{ flex: 1, backgroundColor: colors.bg }}>
              <AppNavigation />
            </View>
          </SafeAreaProvider>
        </AppContext.Provider>
      </RoleProvider>
    </AuthProvider>
  );
}

function AppNavigation() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="patient-setup" />
        <Stack.Screen name="home" />
        <Stack.Screen name="login" />
        <Stack.Screen name="transcript" />
        <Stack.Screen name="phraseboard" />
        <Stack.Screen name="journal" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="history" />
        <Stack.Screen name="hospital-connect" />
        <Stack.Screen name="my-patients" />
        <Stack.Screen name="patient-detail" />
        <Stack.Screen name="my-assignments" />
        <Stack.Screen name="patient-history" />
      </Stack>

      {showSplash && (
        <AnimatedSplashScreen
          onAnimationFinish={() => setShowSplash(false)}
        />
      )}
    </>
  );
}



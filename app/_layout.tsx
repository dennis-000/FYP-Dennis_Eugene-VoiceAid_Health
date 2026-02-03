import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { createContext, useCallback, useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AnimatedSplashScreen from '../components/AnimatedSplashScreen';
import { THEMES, ThemeMode } from '../constants/theme';
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
}>({} as any);

export default function RootLayout() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [language, setLanguage] = useState<string>('en');
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true); // Custom splash state
  const [userRole, setUserRole] = useState<UserRole>(null);

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'high-contrast' : 'light');
  };

  const colors = THEMES[themeMode];

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need here
        // await Font.loadAsync(Entypo.font);

        // Artificial delay to ensure the native splash doesn't flicker
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application it's ready to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Hook to hide the NATIVE splash screen once the view is laid out
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <RoleProvider>
      <AppContext.Provider value={{ themeMode, toggleTheme, language, setLanguage, colors, userRole }}>
        <SafeAreaProvider onLayout={onLayoutRootView}>
          <StatusBar
            barStyle={themeMode === 'high-contrast' ? 'light-content' : 'dark-content'}
            backgroundColor={colors.bg}
          />

          {/* Navigation Stack - This separates the Layout from the Screens (Home, etc) */}
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <Stack
              screenOptions={{
                headerShown: false, // We use custom headers in screens
                contentStyle: { backgroundColor: colors.bg },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="welcome" />
              <Stack.Screen name="index" />
              <Stack.Screen name="transcript" />
              <Stack.Screen name="phraseboard" />
              <Stack.Screen name="routine" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="history" />
            </Stack>
          </View>

          {/* Custom Splash Overlay */}
          {showSplash && (
            <AnimatedSplashScreen
              onAnimationFinish={() => setShowSplash(false)}
            />
          )}

        </SafeAreaProvider>
      </AppContext.Provider>
    </RoleProvider>
  );
}

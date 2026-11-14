
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNav from '@/components/bottom-nav';
import MiniReproductorAudioguia from '@/components/MiniReproductorAudioguia';

import { ThemeProvider, useThemeContext } from '@/contexts/ThemeContext';
import { AudioProvider } from '@/servicios/AudioProvider';
import { CatalogoProvider } from '@/servicios/CatalogoProvider';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function LayoutContenido() {
  const { theme, colors } = useThemeContext();

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={['bottom']}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: colors.background,
              },
            }}
          />

          <MiniReproductorAudioguia />
          <BottomNav />
        </View>
      </SafeAreaView>
    </>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <AudioProvider>
        <CatalogoProvider>
          <LayoutContenido />
        </CatalogoProvider>
      </AudioProvider>
    </ThemeProvider>
  );
}
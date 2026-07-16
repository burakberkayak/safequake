import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useAppTheme } from '../theme/ThemeProvider';
import { RootTabNavigator } from '../navigation/RootTabNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Kompozisyon kökü. Redux store ve i18n provider'ları ilerleyen adımlarda
 * (auth, ayarlar/dil feature'ları eklendikçe) buraya eklenecek.
 */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider initialMode="system">
            <NavigationRoot />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * React Navigation'ın kendi tema sistemini (renk şeması, header vb.)
 * SafeQuake'in ThemeProvider'ı ile senkron tutan köprü bileşen.
 */
const NavigationRoot: React.FC = () => {
  const { isDark, colors } = useAppTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.onSurface,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootTabNavigator />
    </NavigationContainer>
  );
};

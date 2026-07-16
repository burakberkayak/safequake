import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider, useAppTheme } from '../theme/ThemeProvider';
import { RootTabNavigator } from '../navigation/RootTabNavigator';
import { AuthNavigator } from '../features/auth/navigation/AuthNavigator';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useNotificationWatcher } from '../features/notifications/hooks/useNotificationWatcher';
import { store, persistor } from '../store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

import { useEffect } from 'react';

import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setUser, setLoading } from '../store/slices/authSlice';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

/**
 * Kompozisyon kökü. Redux store ve i18n provider'ları buraya enjekte edildi.
 */
export default function App() {
  console.log('[DEBUG] App: Rendering root Providers and PersistGate...');
  return (
    <Provider store={store}>
      <PersistGate 
        loading={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
            <ActivityIndicator size="large" color="#2E7D32" />
          </View>
        } 
        persistor={persistor}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
              <ThemeProviderWrapper />
            </QueryClientProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
}

const ThemeProviderWrapper: React.FC = () => {
  const themeMode = useAppSelector((state) => state.settings.themeMode);
  console.log('[DEBUG] ThemeProviderWrapper: themeMode is:', themeMode);
  return (
    <ThemeProvider initialMode={themeMode}>
      <NavigationRoot />
    </ThemeProvider>
  );
};

/**
 * React Navigation'ın kendi tema sistemini (renk şeması, header vb.)
 * SafeQuake'in ThemeProvider'ı ile senkron tutan köprü bileşen.
 */
const NavigationRoot: React.FC = () => {
  const { isDark, colors } = useAppTheme();
  const { user, loading } = useAuth();
  const dispatch = useAppDispatch();

  console.log('[DEBUG] NavigationRoot: auth loading state is:', loading, '| user:', user ? user.email : 'null');

  // Run the session subscriber effect exactly ONCE here at the root level!
  useEffect(() => {
    dispatch(setLoading(true));

    // Safety timeout: if auth state is not resolved in 4 seconds, force stop loading
    const safetyTimeout = setTimeout(() => {
      console.warn('Firebase Auth took too long to respond. Bypassing loading screen.');
      dispatch(setUser(null));
    }, 4000);

    if (!isFirebaseConfigured) {
      const timer = setTimeout(() => {
        clearTimeout(safetyTimeout);
        dispatch(setUser(null));
      }, 100);
      return () => {
        clearTimeout(timer);
        clearTimeout(safetyTimeout);
      };
    }

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
        clearTimeout(safetyTimeout);
        if (firebaseUser) {
          dispatch(setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            phoneNumber: firebaseUser.phoneNumber,
          }));
        } else {
          dispatch(setUser(null));
        }
      });
    } catch (err) {
      console.error('onAuthStateChanged error:', err);
      clearTimeout(safetyTimeout);
      dispatch(setUser(null));
    }

    return () => {
      unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [dispatch]);

  // Start background notification watcher
  useNotificationWatcher();

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

  if (loading && !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {user ? <RootTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import * as Notifications from 'expo-notifications';
import { LogBox, useColorScheme } from 'react-native';

// Store imports
import { useAuthStore } from './src/store/authStore';
import { useThemeStore } from './src/store/themeStore';
import { useOfflineStore } from './src/store/offlineStore';

// Navigation imports
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';

// Component imports
import LoadingScreen from './src/components/common/LoadingScreen';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import NetworkStatus from './src/components/common/NetworkStatus';
import UpdateAvailable from './src/components/common/UpdateAvailable';

// Service imports
import NotificationService from './src/services/NotificationService';
import AnalyticsService from './src/services/AnalyticsService';
import OfflineService from './src/services/OfflineService';

// Utils
import { initializeApp } from './src/utils/initialization';
import { CustomLightTheme, CustomDarkTheme } from './src/themes/navigationThemes';
import { PaperLightTheme, PaperDarkTheme } from './src/themes/paperThemes';

// Ignore specific warnings for development
LogBox.ignoreLogs([
  'Warning: AsyncStorage has been extracted from react-native core',
  'Setting a timer for a long period of time',
  'VirtualizedLists should never be nested',
]);

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  
  const systemColorScheme = useColorScheme();
  const { user, isLoading: authLoading, initializeAuth } = useAuthStore();
  const { theme, initializeTheme } = useThemeStore();
  const { initializeOfflineMode } = useOfflineStore();

  // Determine effective theme
  const effectiveTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = effectiveTheme === 'dark';

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize core services
        await initializeApp();

        // Load custom fonts
        await Font.loadAsync({
          'InterRegular': require('./assets/fonts/Inter-Regular.ttf'),
          'InterMedium': require('./assets/fonts/Inter-Medium.ttf'),
          'InterSemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
          'InterBold': require('./assets/fonts/Inter-Bold.ttf'),
          'PoppinsRegular': require('./assets/fonts/Poppins-Regular.ttf'),
          'PoppinsMedium': require('./assets/fonts/Poppins-Medium.ttf'),
          'PoppinsSemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
          'PoppinsBold': require('./assets/fonts/Poppins-Bold.ttf'),
        });

        // Initialize stores
        await Promise.all([
          initializeAuth(),
          initializeTheme(),
          initializeOfflineMode(),
        ]);

        // Initialize services
        await Promise.all([
          NotificationService.initialize(),
          AnalyticsService.initialize(),
          OfflineService.initialize(),
        ]);

        // Check onboarding status
        const onboardingComplete = await checkOnboardingStatus();
        setHasCompletedOnboarding(onboardingComplete);

      } catch (e) {
        console.warn('App initialization failed:', e);
        AnalyticsService.track('app_initialization_failed', { error: e.message });
      } finally {
        setIsAppReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  const checkOnboardingStatus = async (): Promise<boolean> => {
    // Implementation would check AsyncStorage for onboarding completion
    return true; // For now, assume onboarding is complete
  };

  if (!isAppReady || authLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <PaperProvider theme={isDark ? PaperDarkTheme : PaperLightTheme}>
              <NavigationContainer theme={isDark ? CustomDarkTheme : CustomLightTheme}>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  {!hasCompletedOnboarding ? (
                    <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
                  ) : user ? (
                    <Stack.Screen name="Main" component={MainNavigator} />
                  ) : (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                  )}
                </Stack.Navigator>
                
                {/* Global Components */}
                <NetworkStatus />
                <UpdateAvailable />
                <Toast />
                
                {/* Status Bar */}
                <StatusBar 
                  style={isDark ? 'light' : 'dark'} 
                  backgroundColor={isDark ? '#000000' : '#ffffff'}
                  translucent={false}
                />
              </NavigationContainer>
            </PaperProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// App State Management
export const AppStateManager = {
  // Background/Foreground handling
  handleAppStateChange: (nextAppState: string) => {
    if (nextAppState === 'active') {
      AnalyticsService.track('app_foreground');
      OfflineService.syncWhenOnline();
    } else if (nextAppState === 'background') {
      AnalyticsService.track('app_background');
      OfflineService.saveCurrentState();
    }
  },

  // Deep link handling
  handleDeepLink: (url: string) => {
    AnalyticsService.track('deep_link_opened', { url });
    // Handle deep link navigation
  },

  // Push notification handling
  handleNotificationReceived: (notification: any) => {
    AnalyticsService.track('notification_received', {
      type: notification.request.content.data?.type,
    });
  },

  // Memory warning handling
  handleMemoryWarning: () => {
    AnalyticsService.track('memory_warning');
    queryClient.getQueryCache().clear();
  },
};
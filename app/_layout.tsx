import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useUserStore } from '@/store/useUserStore';
import { useStreakStore } from '@/store/useStreakStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useLLMCacheStore } from '@/store/useLLMCacheStore';
import { useCustomWorkoutStore } from '@/store/useCustomWorkoutStore';
import { useBodyWeightStore } from '@/store/useBodyWeightStore';
import { setNotificationHandler } from '@/services/notifications/notificationService';
import { applyNotificationSettings } from '@/services/notifications/scheduleNotifications';
import { useAuthStore } from '@/store/useAuthStore';

SplashScreen.preventAutoHideAsync();
setNotificationHandler();

export default function RootLayout() {
  const hydrateUser = useUserStore((s) => s.hydrate);
  const hydrateStreak = useStreakStore((s) => s.hydrate);
  const hydrateWorkout = useWorkoutStore((s) => s.hydrate);
  const hydrateNutrition = useNutritionStore((s) => s.hydrate);
  const hydrateCache = useLLMCacheStore((s) => s.hydrate);
  const hydrateCustomWorkouts = useCustomWorkoutStore((s) => s.hydrate);
  const hydrateBodyWeight = useBodyWeightStore((s) => s.hydrate);
  const checkStreak = useStreakStore((s) => s.checkStreak);
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
    hydrateUser().then(() => {
      SplashScreen.hideAsync();
      const profile = useUserStore.getState().profile;
      if (profile?.notificationsEnabled) {
        applyNotificationSettings(profile).catch(() => {});
      }
    });
    hydrateStreak();
    hydrateWorkout();
    hydrateNutrition();
    hydrateCache();
    hydrateCustomWorkouts();
    hydrateBodyWeight();
    checkStreak();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout/[id]" />
        <Stack.Screen name="workout/summary" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="weekly-review" />
        <Stack.Screen name="workout/build" />
        <Stack.Screen name="workout/history" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GestureHandlerRootView>
  );
}

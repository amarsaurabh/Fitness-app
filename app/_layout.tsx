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
import { setNotificationHandler } from '@/services/notifications/notificationService';

SplashScreen.preventAutoHideAsync();
setNotificationHandler();

export default function RootLayout() {
  const hydrateUser = useUserStore((s) => s.hydrate);
  const hydrateStreak = useStreakStore((s) => s.hydrate);
  const hydrateWorkout = useWorkoutStore((s) => s.hydrate);
  const hydrateNutrition = useNutritionStore((s) => s.hydrate);
  const hydrateCache = useLLMCacheStore((s) => s.hydrate);
  const checkStreak = useStreakStore((s) => s.checkStreak);

  useEffect(() => {
    hydrateUser().then(() => SplashScreen.hideAsync());
    hydrateStreak();
    hydrateWorkout();
    hydrateNutrition();
    hydrateCache();
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
        <Stack.Screen name="+not-found" />
      </Stack>
    </GestureHandlerRootView>
  );
}

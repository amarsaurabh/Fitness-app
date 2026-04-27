import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useUserStore } from '@/store/useUserStore';

export default function Index() {
  const profile = useUserStore((s) => s.profile);
  const hydrated = useUserStore((s) => s.hydrated);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-navy">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  if (profile?.onboardingComplete) {
    return <Redirect href="/(tabs)/today" />;
  }

  return <Redirect href="/onboarding" />;
}

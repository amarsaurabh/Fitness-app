import { Redirect } from 'expo-router';

// Placeholder until useUserStore is wired up in Phase 1
const onboardingComplete = false;

export default function Index() {
  if (onboardingComplete) {
    return <Redirect href="/(tabs)/home" />;
  }
  return <Redirect href="/onboarding" />;
}

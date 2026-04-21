import { Tabs } from 'expo-router';

// Placeholder — full tab bar with icons added in Phase 3
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="library" options={{ title: 'Workouts' }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrition' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="motivation" options={{ title: 'Motivation' }} />
    </Tabs>
  );
}

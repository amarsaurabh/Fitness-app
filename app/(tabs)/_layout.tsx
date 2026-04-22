import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  home: { active: 'home', inactive: 'home-outline' },
  library: { active: 'barbell', inactive: 'barbell-outline' },
  nutrition: { active: 'nutrition', inactive: 'nutrition-outline' },
  progress: { active: 'bar-chart', inactive: 'bar-chart-outline' },
  motivation: { active: 'sunny', inactive: 'sunny-outline' },
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const cfg = ICONS[route.name];
          const name = focused ? cfg?.active : cfg?.inactive;
          return name ? <Ionicons name={name} size={size - 2} color={color} /> : null;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="library" options={{ title: 'Workouts' }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrition' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="motivation" options={{ title: 'Motivation' }} />
    </Tabs>
  );
}

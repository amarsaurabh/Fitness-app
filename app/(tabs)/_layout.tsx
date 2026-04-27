import { View, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Sidebar from '@/components/navigation/Sidebar';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useStreakStore } from '@/store/useStreakStore';
import { computeBlock } from '@/store/useProgressionStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  today:      { active: 'sunny',     inactive: 'sunny-outline' },
  library:    { active: 'barbell',   inactive: 'barbell-outline' },
  nutrition:  { active: 'nutrition', inactive: 'nutrition-outline' },
  progress:   { active: 'bar-chart', inactive: 'bar-chart-outline' },
};

const DESKTOP_BREAKPOINT = 768;

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  const sessions = useWorkoutStore((s) => s.sessions);
  const streak = useStreakStore((s) => s.streak);
  const block = computeBlock(sessions.length, streak.longest);

  const nutritionUnlocked = block >= 2;
  const progressUnlocked = block >= 3;

  return (
    <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
      {isDesktop && <Sidebar block={block} />}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: isDesktop
              ? { display: 'none' }
              : {
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
          <Tabs.Screen name="today"      options={{ title: 'Today' }} />
          <Tabs.Screen name="library"    options={{ title: 'Workouts' }} />
          <Tabs.Screen name="nutrition"  options={{ title: 'Nutrition', href: nutritionUnlocked ? undefined : null }} />
          <Tabs.Screen name="progress"   options={{ title: 'Progress',  href: progressUnlocked  ? undefined : null }} />
          {/* Legacy routes — hidden, redirect to today */}
          <Tabs.Screen name="home"       options={{ href: null }} />
          <Tabs.Screen name="motivation" options={{ href: null }} />
        </Tabs>
      </View>
    </View>
  );
}

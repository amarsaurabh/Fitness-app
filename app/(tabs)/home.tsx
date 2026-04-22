import { useState } from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/useUserStore';
import { useStreakStore } from '@/store/useStreakStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { StreakWidget } from '@/components/home/StreakWidget';
import { ProteinRing } from '@/components/home/ProteinRing';
import { WorkoutCard } from '@/components/home/WorkoutCard';
import { BenchmarkBadge } from '@/components/home/BenchmarkBadge';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function shortDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export default function HomeScreen() {
  const profile = useUserStore((s) => s.profile);
  const checkStreak = useStreakStore((s) => s.checkStreak);
  const resetDailyLogIfNewDay = useNutritionStore((s) => s.resetDailyLogIfNewDay);

  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    checkStreak();
    resetDailyLogIfNewDay();
    setTimeout(() => setRefreshing(false), 500);
  }

  const firstName = profile?.name?.trim().split(' ')[0] ?? 'there';

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f97316"
          />
        }
      >
        {/* Header */}
        <View className="pt-4 pb-6">
          <Text className="text-slate-400 text-sm">{shortDate()}</Text>
          <Text className="text-white text-2xl font-bold mt-1">
            {greeting()}, {firstName} 👋
          </Text>
        </View>

        <StreakWidget />
        <ProteinRing />
        <WorkoutCard />
        <BenchmarkBadge />
      </ScrollView>
    </SafeAreaView>
  );
}

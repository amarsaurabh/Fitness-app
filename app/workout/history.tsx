import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import type { WorkoutSession } from '@/types/models';

function isoWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
  const week = Math.ceil((dayOfYear + jan4.getDay()) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function weekLabel(weekKey: string): string {
  const [year, wStr] = weekKey.split('-W');
  const week = parseInt(wStr, 10);
  const jan4 = new Date(parseInt(year, 10), 0, 4);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function SessionRow({ session }: { session: WorkoutSession }) {
  return (
    <View className="bg-brand-navy rounded-2xl p-4 mb-2">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-white font-semibold text-sm" numberOfLines={1}>
            {session.workoutName}
          </Text>
          <Text className="text-slate-500 text-xs mt-0.5">{shortDate(session.date)}</Text>
        </View>
        <View className="items-end">
          <Text className="text-brand-orange text-xs font-bold">{session.durationMin} min</Text>
          <Text className="text-slate-500 text-xs mt-0.5">{session.caloriesBurned} kcal</Text>
        </View>
      </View>
      {session.isOneMineMode && (
        <View className="mt-2 flex-row">
          <View className="bg-orange-500/20 rounded-md px-2 py-0.5">
            <Text className="text-orange-300 text-xs font-semibold">⚡ Streak Saver</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default function WorkoutHistoryScreen() {
  const sessions = useWorkoutStore((s) => s.sessions);
  const completed = sessions.filter((s) => s.completed);

  const grouped = completed.reduce<Record<string, WorkoutSession[]>>((acc, s) => {
    const key = isoWeek(s.date);
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  const weekKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      <View className="flex-row items-center px-5 pt-4 pb-3 gap-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color="#94a3b8" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Workout History</Text>
      </View>

      {completed.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-4">🏋️</Text>
          <Text className="text-white text-lg font-bold text-center">No workouts yet</Text>
          <Text className="text-slate-400 text-sm text-center mt-2">
            Complete your first workout to see your history here.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {weekKeys.map((key) => {
            const weekSessions = grouped[key].sort((a, b) => b.date.localeCompare(a.date));
            const weekMin = weekSessions.reduce((a, s) => a + s.durationMin, 0);
            const weekKcal = weekSessions.reduce((a, s) => a + s.caloriesBurned, 0);
            return (
              <View key={key} className="mb-5">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
                    {weekLabel(key)}
                  </Text>
                  <Text className="text-slate-500 text-xs">
                    {weekSessions.length} workout{weekSessions.length !== 1 ? 's' : ''} · {weekMin} min · {weekKcal} kcal
                  </Text>
                </View>
                <View className="bg-brand-slate rounded-3xl p-3">
                  {weekSessions.map((s) => (
                    <SessionRow key={s.id} session={s} />
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

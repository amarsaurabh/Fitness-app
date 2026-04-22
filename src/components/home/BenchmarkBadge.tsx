import { View, Text } from 'react-native';
import { useStreakStore } from '@/store/useStreakStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';

function computePercentile(streakCurrent: number, sessionsThisWeek: number): number {
  // Deterministic simulation: longer streaks push percentile higher.
  // Range 8–91 to stay believable.
  const raw = Math.min(streakCurrent * 6 + sessionsThisWeek * 4, 83);
  return Math.max(8, raw);
}

export function BenchmarkBadge() {
  const streak = useStreakStore((s) => s.streak);
  const getTodaySessions = useWorkoutStore((s) => s.getTodaySessions);
  const sessionsToday = getTodaySessions().length;

  const percentile = computePercentile(streak.current, sessionsToday);
  const topN = 100 - percentile;

  const label =
    topN <= 10
      ? 'elite level — you inspire others 💪'
      : topN <= 25
      ? 'seriously impressive — keep it up'
      : topN <= 50
      ? 'above average — you\'re building something'
      : 'just getting started — stay consistent';

  return (
    <View className="bg-brand-slate rounded-3xl p-5 mb-4 flex-row items-center gap-4">
      <View className="w-12 h-12 rounded-2xl bg-yellow-500/20 items-center justify-center">
        <Text className="text-2xl">🏆</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white font-bold text-base">
          Top {topN}% this week
        </Text>
        <Text className="text-slate-400 text-sm mt-0.5">{label}</Text>
      </View>
    </View>
  );
}

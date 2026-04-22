import { View, Text } from 'react-native';
import { useStreakStore } from '@/store/useStreakStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';

export function StreakWidget() {
  const streak = useStreakStore((s) => s.streak);
  const hasTodaySession = useWorkoutStore((s) => s.hasTodaySession);
  const workedOutToday = hasTodaySession();
  const hasInsurance = streak.streakInsuranceCount > 0;
  const isAtRisk = streak.current > 0 && !workedOutToday;

  return (
    <View className="bg-brand-slate rounded-3xl p-5 mb-4">
      <View className="flex-row items-center justify-between">
        <View>
          <View className="flex-row items-end gap-2">
            <Text className="text-5xl">🔥</Text>
            <Text className="text-white text-6xl font-bold leading-none pb-1">
              {streak.current}
            </Text>
          </View>
          <Text className="text-slate-400 text-sm mt-2">
            day streak{streak.longest > 0 ? `  ·  best: ${streak.longest}` : ''}
          </Text>
        </View>

        <View className="items-end gap-2">
          {workedOutToday && (
            <View className="bg-green-500/20 rounded-xl px-3 py-1.5">
              <Text className="text-green-400 text-xs font-bold">✓ Done today</Text>
            </View>
          )}
          {!workedOutToday && hasInsurance && (
            <View className="bg-blue-500/20 rounded-xl px-3 py-1.5">
              <Text className="text-blue-300 text-xs font-bold">🛡️ Protected</Text>
            </View>
          )}
          {isAtRisk && !hasInsurance && (
            <View className="bg-orange-500/20 rounded-xl px-3 py-1.5">
              <Text className="text-orange-400 text-xs font-bold">⚠️ At risk</Text>
            </View>
          )}
        </View>
      </View>

      {isAtRisk && (
        <Text className="text-slate-400 text-xs mt-3 leading-5">
          {hasInsurance
            ? 'Your streak is protected — but try to work out today!'
            : 'Work out today to keep your streak alive!'}
        </Text>
      )}
    </View>
  );
}

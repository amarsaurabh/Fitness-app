import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useStreakStore } from '@/store/useStreakStore';

export default function WorkoutSummaryScreen() {
  const sessions = useWorkoutStore((s) => s.sessions);
  const recordWorkout = useStreakStore((s) => s.recordWorkout);
  const streak = useStreakStore((s) => s.streak);
  const session = sessions[0];

  const streakRecorded = useRef(false);

  useEffect(() => {
    if (session && !streakRecorded.current) {
      recordWorkout();
      streakRecorded.current = true;
    }
  }, []);

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-brand-navy items-center justify-center px-6">
        <Text className="text-white text-lg">No session data</Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/home')}
          className="mt-6"
        >
          <Text className="text-brand-orange">Back to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const streakIsNew = streak.current > 0;

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Hero */}
        <View className="items-center pt-12 pb-8">
          <Text className="text-7xl mb-4">🎉</Text>
          <Text className="text-white text-3xl font-bold">Workout Complete!</Text>
          <Text className="text-slate-400 text-base mt-2">{session.workoutName}</Text>
        </View>

        {/* Stats row */}
        <View className="flex-row gap-3 mb-5">
          <StatBox value={String(session.durationMin)} label="minutes" />
          <StatBox value={String(session.caloriesBurned)} label="kcal" />
          <StatBox value={String(session.exercisesCompleted.length)} label="exercises" />
        </View>

        {/* Streak update */}
        {streakIsNew && (
          <View className="bg-brand-slate rounded-2xl p-4 flex-row items-center gap-4 mb-5">
            <View className="w-12 h-12 bg-orange-500/20 rounded-2xl items-center justify-center">
              <Text className="text-2xl">🔥</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">
                {streak.current} day streak!
              </Text>
              <Text className="text-slate-400 text-sm mt-0.5">
                {streak.current === streak.longest
                  ? 'New personal best 🏆'
                  : 'Keep it going tomorrow'}
              </Text>
            </View>
          </View>
        )}

        {/* Protein nudge */}
        <View className="bg-brand-slate rounded-2xl p-4 flex-row items-center gap-4 mb-5">
          <View className="w-12 h-12 bg-green-500/20 rounded-2xl items-center justify-center">
            <Text className="text-2xl">🥗</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold">Log your protein</Text>
            <Text className="text-slate-400 text-sm mt-0.5">
              Recovery starts with what you eat
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/nutrition')}
            className="bg-brand-orange rounded-xl px-3 py-1.5"
          >
            <Text className="text-white text-xs font-bold">Log</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="px-5 pb-8 pt-3">
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/home')}
          className="bg-brand-orange rounded-2xl py-4 items-center"
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-base">Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 bg-brand-slate rounded-2xl py-4 items-center">
      <Text className="text-white text-2xl font-bold">{value}</Text>
      <Text className="text-slate-400 text-xs mt-1">{label}</Text>
    </View>
  );
}

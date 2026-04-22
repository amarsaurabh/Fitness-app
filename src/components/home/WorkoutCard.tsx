import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '@/store/useUserStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { WORKOUTS } from '@/data/workouts';
import type { Difficulty, Goal, Workout } from '@/types/models';

const GOAL_TAGS: Record<Goal, string[]> = {
  lose_weight: ['cardio', 'fat-burn'],
  build_muscle: ['strength', 'full-body'],
  stay_active: ['full-body', 'cardio'],
  stress_relief: ['mobility', 'core'],
};

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  beginner: 'text-green-400',
  intermediate: 'text-brand-orange',
  advanced: 'text-red-400',
};

function getRecommended(goal: Goal, bias: -1 | 0 | 1): Workout {
  const homeWorkouts = WORKOUTS.filter((w) => w.type === 'home');
  const targetDiff: Difficulty =
    bias === 1 ? 'advanced' : bias === -1 ? 'beginner' : 'intermediate';

  let pool = homeWorkouts.filter((w) => w.difficulty === targetDiff);
  if (pool.length === 0) pool = homeWorkouts;

  const preferredTags = GOAL_TAGS[goal] ?? [];
  const goalMatches = pool.filter((w) =>
    w.tags.some((t) => preferredTags.includes(t)),
  );
  return goalMatches[0] ?? pool[0];
}

export function WorkoutCard() {
  const profile = useUserStore((s) => s.profile);
  const hasTodaySession = useWorkoutStore((s) => s.hasTodaySession);
  const getTodaySessions = useWorkoutStore((s) => s.getTodaySessions);

  const workedOutToday = hasTodaySession();

  if (workedOutToday) {
    const sessions = getTodaySessions();
    const totalCal = sessions.reduce((acc, s) => acc + s.caloriesBurned, 0);
    const totalMin = sessions.reduce((acc, s) => acc + s.durationMin, 0);

    return (
      <View className="bg-brand-slate rounded-3xl p-5 mb-4">
        <Text className="text-white text-xl font-bold mb-1">Done for the day! 🎉</Text>
        <Text className="text-slate-400 text-sm mb-5">
          {sessions.length} workout{sessions.length > 1 ? 's' : ''} · {totalMin} min · ~{totalCal} kcal
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/library')}
          className="border border-brand-orange rounded-2xl px-4 py-3 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-brand-orange font-semibold text-sm">Browse more workouts</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const workout = getRecommended(
    profile?.goal ?? 'stay_active',
    profile?.difficultyBias ?? 0,
  );

  return (
    <View className="bg-brand-slate rounded-3xl p-5 mb-4">
      <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">
        Today's pick
      </Text>

      <Text className="text-white text-2xl font-bold mb-2">{workout.name}</Text>

      <View className="flex-row gap-4 mb-5">
        <Text className="text-slate-400 text-sm">🏠 Home</Text>
        <Text className="text-slate-400 text-sm">⏱ {workout.durationMin} min</Text>
        <Text className="text-slate-400 text-sm">🔥 ~{workout.estimatedCalories} kcal</Text>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className={`text-sm font-semibold ${DIFFICULTY_COLOR[workout.difficulty]}`}>
          {DIFFICULTY_LABEL[workout.difficulty]}
        </Text>
        <TouchableOpacity
          onPress={() => router.push(`/workout/${workout.id}` as any)}
          className="bg-brand-orange rounded-2xl px-6 py-3"
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-base">Start Workout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

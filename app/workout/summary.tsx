import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useStreakStore } from '@/store/useStreakStore';
import { useUserStore } from '@/store/useUserStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { getCulturalFoods } from '@/data/culturalFoods';
import { computeNewDifficultyBias } from '@/utils/adaptiveDifficulty';
import { MIN_SESSION_DURATION_SEC } from '@/utils/constants';
import SaveProgressModal from '@/components/auth/SaveProgressModal';

const DIFFICULTY_FEEDBACK: Record<-1 | 0 | 1, { emoji: string; title: string; body: string }> = {
  [-1]: {
    emoji: '📉',
    title: 'Workouts dialled back',
    body: "We noticed some sessions were tough — workouts are now a bit easier.",
  },
  [0]: {
    emoji: '⚖️',
    title: 'Back to standard difficulty',
    body: "You're finding your stride — workouts reset to default difficulty.",
  },
  [1]: {
    emoji: '🚀',
    title: 'Levelled up!',
    body: "You've been crushing it — workouts are now more challenging.",
  },
};

export default function WorkoutSummaryScreen() {
  const sessions = useWorkoutStore((s) => s.sessions);
  const recordWorkout = useStreakStore((s) => s.recordWorkout);
  const streak = useStreakStore((s) => s.streak);
  const session = sessions[0];

  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const streakRecorded = useRef(false);
  const [difficultyChanged, setDifficultyChanged] = useState<-1 | 0 | 1 | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const sessionLongEnough = session ? session.durationMin * 60 >= MIN_SESSION_DURATION_SEC : false;

  useEffect(() => {
    if (session && !streakRecorded.current && sessionLongEnough) {
      recordWorkout();
      streakRecorded.current = true;

      const profile = useUserStore.getState().profile;
      const allSessions = useWorkoutStore.getState().sessions;
      if (profile) {
        const newBias = computeNewDifficultyBias(allSessions, profile.difficultyBias);
        if (newBias !== profile.difficultyBias) {
          useUserStore.getState().updateProfile({ difficultyBias: newBias });
          setDifficultyChanged(newBias);
        }
      }

      if (useAuthStore.getState().isAnonymous) {
        setShowSaveModal(true);
      }
    }
  }, []);

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-brand-navy items-center justify-center px-6">
        <Text className="text-white text-lg">No session data</Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/today')}
          className="mt-6"
        >
          <Text className="text-brand-orange">Back to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const streakIsNew = streak.current > 0 && sessionLongEnough;
  const fb = difficultyChanged !== null ? DIFFICULTY_FEEDBACK[difficultyChanged] : null;

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

        {/* Too-short warning */}
        {!sessionLongEnough && (
          <View className="bg-brand-slate rounded-2xl p-4 flex-row items-center gap-4 mb-5">
            <View className="w-12 h-12 bg-slate-500/20 rounded-2xl items-center justify-center">
              <Text className="text-2xl">⏱</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">Session too short</Text>
              <Text className="text-slate-400 text-sm mt-0.5">
                Sessions under 1 minute don't count towards your streak.
              </Text>
            </View>
          </View>
        )}

        {/* Streak saver badge */}
        {session.isOneMineMode && sessionLongEnough && (
          <View className="bg-brand-slate rounded-2xl p-4 flex-row items-center gap-4 mb-5">
            <View className="w-12 h-12 bg-orange-500/20 rounded-2xl items-center justify-center">
              <Text className="text-2xl">⚡</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">Streak saved!</Text>
              <Text className="text-slate-400 text-sm mt-0.5">
                1-minute session — streak protected for today.
              </Text>
            </View>
          </View>
        )}

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

        {/* Adaptive difficulty feedback */}
        {fb && (
          <View className="bg-brand-slate rounded-2xl p-4 flex-row items-center gap-4 mb-5">
            <View className="w-12 h-12 bg-blue-500/20 rounded-2xl items-center justify-center">
              <Text className="text-2xl">{fb.emoji}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">{fb.title}</Text>
              <Text className="text-slate-400 text-sm mt-0.5">{fb.body}</Text>
            </View>
          </View>
        )}

        {/* Post-workout nutrition card */}
        <PostWorkoutNutritionCard caloriesBurned={session.caloriesBurned} />
      </ScrollView>

      {/* Bottom CTA */}
      <View className="px-5 pb-8 pt-3">
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/today')}
          className="bg-brand-orange rounded-2xl py-4 items-center"
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-base">Back to Home</Text>
        </TouchableOpacity>
      </View>

      <SaveProgressModal
        visible={showSaveModal}
        onDismiss={() => setShowSaveModal(false)}
      />
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

function PostWorkoutNutritionCard({ caloriesBurned }: { caloriesBurned: number }) {
  const profile = useUserStore((s) => s.profile);
  const logProtein = useNutritionStore((s) => s.logProtein);
  const logCalories = useNutritionStore((s) => s.logCalories);
  const dailyProteinGoal = useUserStore((s) => s.dailyProteinGoal);
  const todayProteinG = useNutritionStore((s) => s.todayProteinG);
  const [loggedFoods, setLoggedFoods] = useState<Set<string>>(new Set());

  const remaining = Math.max(dailyProteinGoal() - todayProteinG(), 0);
  const foods = getCulturalFoods(profile?.foodCulture ?? 'global').slice(0, 3);

  function handleLog(food: { name: string; proteinPer100g: number; kcalPer100g: number; servingG: number }) {
    const proteinG = Math.round((food.proteinPer100g * food.servingG) / 100);
    const kcal = Math.round((food.kcalPer100g * food.servingG) / 100);
    logProtein(proteinG);
    logCalories(kcal);
    setLoggedFoods((prev) => new Set([...prev, food.name]));
  }

  return (
    <View className="bg-brand-slate rounded-2xl p-4 mb-5">
      <View className="flex-row items-center gap-3 mb-3">
        <View className="w-10 h-10 bg-green-500/20 rounded-xl items-center justify-center">
          <Text className="text-xl">🥗</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-base">Refuel now</Text>
          <Text className="text-slate-400 text-xs mt-0.5">
            {caloriesBurned > 0 ? `You burned ~${caloriesBurned} kcal · ` : ''}
            {remaining > 0 ? `${remaining}g protein left today` : 'Protein goal reached! 🎉'}
          </Text>
        </View>
      </View>

      <View className="gap-2">
        {foods.map((food) => {
          const proteinG = Math.round((food.proteinPer100g * food.servingG) / 100);
          const kcal = Math.round((food.kcalPer100g * food.servingG) / 100);
          const logged = loggedFoods.has(food.name);
          return (
            <TouchableOpacity
              key={food.name}
              onPress={() => !logged && handleLog(food)}
              activeOpacity={0.8}
              className={`flex-row items-center justify-between rounded-xl px-3 py-2.5 ${
                logged ? 'bg-green-500/15 border border-green-500/30' : 'bg-brand-navy'
              }`}
            >
              <View className="flex-1">
                <Text className="text-white text-sm font-semibold" numberOfLines={1}>{food.name}</Text>
                <Text className="text-slate-500 text-xs mt-0.5">{proteinG}g protein · {kcal} kcal</Text>
              </View>
              {logged ? (
                <Text className="text-green-400 text-xs font-bold ml-3">✓ Logged</Text>
              ) : (
                <View className="bg-brand-orange rounded-lg px-2.5 py-1 ml-3">
                  <Text className="text-white text-xs font-bold">Log</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={() => router.replace('/(tabs)/nutrition')}
        className="mt-3 items-center"
      >
        <Text className="text-brand-orange text-xs font-semibold">See all food options →</Text>
      </TouchableOpacity>
    </View>
  );
}

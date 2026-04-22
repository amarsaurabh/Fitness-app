import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWorkoutById } from '@/data/workouts';
import { getExerciseById } from '@/data/exercises';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useUserStore } from '@/store/useUserStore';
import { useCustomWorkoutStore } from '@/store/useCustomWorkoutStore';
import { estimateCalories } from '@/utils/calories';
import type { Exercise } from '@/types/models';

const REST_DURATION = 30; // seconds between exercises

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ActiveWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customWorkouts = useCustomWorkoutStore((s) => s.workouts);
  const workout = getWorkoutById(id ?? '') ?? customWorkouts.find((w) => w.id === id);
  const exercises = (workout?.exerciseIds.map(getExerciseById).filter(Boolean) as Exercise[]) ?? [];

  const profile = useUserStore((s) => s.profile);
  const startSession = useWorkoutStore((s) => s.startSession);
  const completeSession = useWorkoutStore((s) => s.completeSession);
  const abandonSession = useWorkoutStore((s) => s.abandonSession);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [restCountdown, setRestCountdown] = useState<number | null>(null);
  const sessionStarted = useRef(false);

  // Start session once
  useEffect(() => {
    if (workout && !sessionStarted.current) {
      const isStreakSaver = workout.tags?.includes('streak-saver') ?? false;
      startSession(workout.id, workout.name, isStreakSaver);
      sessionStarted.current = true;
    }
  }, []);

  // Session elapsed timer (runs through rest periods — rest counts as workout time)
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Exercise countdown
  useEffect(() => {
    if (!timerRunning || countdown === null) return;
    if (countdown <= 0) {
      advanceOrFinish();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, timerRunning]);

  // Rest timer
  useEffect(() => {
    if (restCountdown === null) return;
    if (restCountdown <= 0) {
      setRestCountdown(null);
      setCurrentIdx((i) => i + 1);
      return;
    }
    const t = setTimeout(() => setRestCountdown((c) => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [restCountdown]);

  if (!workout || exercises.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-brand-navy items-center justify-center px-6">
        <Text className="text-white text-lg font-semibold">Workout not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-6">
          <Text className="text-brand-orange">← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const ex = exercises[currentIdx];
  const nextEx = exercises[currentIdx + 1];
  const isTimed = ex.durationSec !== undefined;
  const isLast = currentIdx === exercises.length - 1;
  const progress = completedIds.length / exercises.length;

  function calcCalories(): number {
    const weightKg = profile?.weightKg ?? 70;
    return exercises.reduce((acc, e) => {
      const durMin = e.durationSec
        ? (e.durationSec * (e.defaultSets ?? 1)) / 60
        : ((e.defaultReps ?? 10) * (e.defaultSets ?? 3) * 3) / 60;
      return acc + estimateCalories(e.met, weightKg, durMin);
    }, 0);
  }

  function advanceOrFinish() {
    setTimerRunning(false);
    setCountdown(null);
    const next = [...completedIds, ex.id];
    setCompletedIds(next);

    if (isLast) {
      completeSession(Math.round(calcCalories()));
      router.replace('/workout/summary');
    } else {
      setRestCountdown(REST_DURATION);
    }
  }

  function handleSkip() {
    setTimerRunning(false);
    setCountdown(null);
    if (!isLast) {
      setCurrentIdx((i) => i + 1);
    } else {
      completeSession(Math.round(calcCalories()));
      router.replace('/workout/summary');
    }
  }

  function handleAbandon() {
    Alert.alert('Abandon workout?', 'Your progress won't be saved.', [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'Abandon',
        style: 'destructive',
        onPress: () => {
          abandonSession();
          router.back();
        },
      },
    ]);
  }

  // ── Rest screen ────────────────────────────────────────────────────────────
  if (restCountdown !== null) {
    const restPct = 1 - restCountdown / REST_DURATION;
    return (
      <SafeAreaView className="flex-1 bg-brand-navy items-center justify-center px-8">
        <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-6">
          Rest
        </Text>

        {/* Countdown */}
        <Text
          className="text-white font-bold tabular-nums mb-1"
          style={{ fontSize: 96, lineHeight: 104 }}
        >
          {restCountdown}
        </Text>
        <Text className="text-slate-500 text-base mb-8">seconds</Text>

        {/* Rest progress bar */}
        <View className="w-full h-1.5 bg-brand-slate rounded-full mb-10 overflow-hidden">
          <View
            className="h-full bg-brand-orange rounded-full"
            style={{ width: `${restPct * 100}%` }}
          />
        </View>

        {/* Next exercise preview */}
        {nextEx && (
          <View className="bg-brand-slate rounded-2xl p-4 w-full mb-8">
            <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">
              Up next
            </Text>
            <Text className="text-white font-bold text-lg">{nextEx.name}</Text>
            <Text className="text-brand-orange text-sm mt-0.5">
              {nextEx.durationSec !== undefined
                ? `${nextEx.durationSec}s × ${nextEx.defaultSets ?? 1} set`
                : `${nextEx.defaultReps} reps × ${nextEx.defaultSets ?? 3} sets`}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => {
            setRestCountdown(null);
            setCurrentIdx((i) => i + 1);
          }}
          className="bg-brand-orange rounded-2xl px-10 py-4"
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-base">Skip Rest →</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Active exercise screen ─────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      {/* Header */}
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <TouchableOpacity onPress={handleAbandon} hitSlop={12}>
          <Text className="text-slate-400 text-xl">✕</Text>
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white font-bold text-sm">{workout.name}</Text>
          <Text className="text-slate-500 text-xs mt-0.5">{fmt(elapsed)}</Text>
        </View>
        <Text className="text-slate-400 text-sm font-semibold">
          {currentIdx + 1} / {exercises.length}
        </Text>
      </View>

      {/* Progress bar */}
      <View className="mx-5 h-1.5 bg-brand-slate rounded-full mb-6 overflow-hidden">
        <View
          className="h-full bg-brand-orange rounded-full"
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Exercise card */}
        <View className="bg-brand-slate rounded-3xl p-6 mb-4">
          {/* Muscle tags */}
          <View className="flex-row flex-wrap gap-2 mb-4">
            {ex.muscleGroups.map((mg) => (
              <View key={mg} className="bg-brand-navy rounded-lg px-2.5 py-1">
                <Text className="text-slate-400 text-xs capitalize">{mg}</Text>
              </View>
            ))}
          </View>

          <Text className="text-white text-3xl font-bold mb-2">{ex.name}</Text>

          <Text className="text-brand-orange text-base font-semibold mb-5">
            {isTimed
              ? `${ex.durationSec}s × ${ex.defaultSets ?? 1} set${(ex.defaultSets ?? 1) > 1 ? 's' : ''}`
              : `${ex.defaultReps} reps × ${ex.defaultSets ?? 3} sets`}
          </Text>

          <Text className="text-slate-300 text-sm leading-6">{ex.instructions}</Text>
        </View>

        {/* Countdown display for timed exercises */}
        {isTimed && countdown !== null && (
          <View className="bg-brand-slate rounded-3xl p-6 mb-4 items-center">
            <Text className="text-white text-7xl font-bold tabular-nums">{countdown}</Text>
            <Text className="text-slate-400 text-sm mt-2">seconds remaining</Text>
            <View className="mt-3 w-full h-1.5 bg-brand-navy rounded-full overflow-hidden">
              <View
                className="h-full bg-brand-orange rounded-full"
                style={{
                  width: `${(1 - countdown / (ex.durationSec ?? 1)) * 100}%`,
                }}
              />
            </View>
          </View>
        )}

        <View className="h-4" />
      </ScrollView>

      {/* Bottom CTAs */}
      <View className="px-5 pb-6 pt-2 gap-3">
        {isTimed && countdown === null && (
          <TouchableOpacity
            onPress={() => {
              setCountdown(ex.durationSec!);
              setTimerRunning(true);
            }}
            className="bg-brand-orange rounded-2xl py-4 items-center"
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base">Start Timer</Text>
          </TouchableOpacity>
        )}

        {isTimed && timerRunning && (
          <TouchableOpacity
            onPress={() => setCountdown(0)}
            className="bg-brand-orange rounded-2xl py-4 items-center"
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base">Done Early ✓</Text>
          </TouchableOpacity>
        )}

        {!isTimed && (
          <TouchableOpacity
            onPress={advanceOrFinish}
            className="bg-brand-orange rounded-2xl py-4 items-center"
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base">
              {isLast ? 'Finish Workout 🎉' : 'Done — Next →'}
            </Text>
          </TouchableOpacity>
        )}

        {(!isLast || isTimed) && (
          <TouchableOpacity onPress={handleSkip} className="py-2 items-center">
            <Text className="text-slate-500 text-sm">
              {isLast ? 'Skip & finish' : 'Skip exercise'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

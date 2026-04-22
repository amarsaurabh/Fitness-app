import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EXERCISES } from '@/data/exercises';
import { useCustomWorkoutStore } from '@/store/useCustomWorkoutStore';
import { estimateCalories } from '@/utils/calories';
import type { Difficulty, Exercise, Workout } from '@/types/models';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function exerciseDurMin(ex: Exercise): number {
  if (ex.durationSec) return (ex.durationSec * (ex.defaultSets ?? 1)) / 60;
  return ((ex.defaultReps ?? 10) * (ex.defaultSets ?? 3) * 3) / 60;
}

function buildWorkoutStats(exercises: Exercise[]): { kcal: number; durationMin: number } {
  const kcal = Math.round(
    exercises.reduce((a, ex) => a + estimateCalories(ex.met, 70, exerciseDurMin(ex)), 0),
  );
  const exerciseMin = exercises.reduce((a, ex) => a + exerciseDurMin(ex), 0);
  const restMin = Math.max(exercises.length - 1, 0) * 0.5;
  return { kcal, durationMin: Math.round(exerciseMin + restMin) };
}

function deriveTags(exercises: Exercise[]): string[] {
  const counts: Record<string, number> = {};
  exercises.forEach((ex) =>
    ex.muscleGroups.forEach((mg) => {
      counts[mg] = (counts[mg] ?? 0) + 1;
    }),
  );
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag]) => tag);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const DIFF_OPTS: { value: Difficulty; label: string; color: string }[] = [
  { value: 'beginner', label: 'Beginner', color: '#22c55e' },
  { value: 'intermediate', label: 'Intermediate', color: '#f97316' },
  { value: 'advanced', label: 'Advanced', color: '#ef4444' },
];

function ExerciseRow({
  ex,
  selected,
  onToggle,
}: {
  ex: Exercise;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      className="flex-row items-center bg-brand-slate rounded-2xl p-4 mb-2"
    >
      <View className="flex-1 mr-3">
        <Text className="text-white font-semibold text-sm">{ex.name}</Text>
        <Text className="text-slate-400 text-xs mt-0.5">
          {ex.muscleGroups.slice(0, 2).join(' · ')}
        </Text>
        <Text className="text-slate-500 text-xs mt-0.5">
          {ex.durationSec ? `${ex.durationSec}s` : `${ex.defaultReps} reps`}
          {' × '}
          {ex.defaultSets} sets
        </Text>
      </View>
      <View
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: selected ? '#f97316' : '#1e293b' }}
      >
        <Text className="text-white font-bold text-sm">{selected ? '✓' : '+'}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BuildWorkoutScreen() {
  const saveWorkout = useCustomWorkoutStore((s) => s.saveWorkout);

  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredExercises = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return EXERCISES;
    return EXERCISES.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        ex.muscleGroups.some((mg) => mg.includes(q)),
    );
  }, [search]);

  const selectedExercises = selectedIds
    .map((id) => EXERCISES.find((ex) => ex.id === id))
    .filter(Boolean) as Exercise[];

  const stats = buildWorkoutStats(selectedExercises);

  function toggleExercise(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Give your workout a name before saving.');
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert('No exercises', 'Add at least one exercise to save.');
      return;
    }

    const workout: Workout = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      type: 'home',
      exerciseIds: selectedIds,
      estimatedCalories: stats.kcal,
      durationMin: Math.max(stats.durationMin, 1),
      difficulty,
      tags: deriveTags(selectedExercises),
      isCustom: true,
    };

    saveWorkout(workout);
    router.back();
  }

  const canSave = name.trim().length > 0 && selectedIds.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color="#94a3b8" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Build Workout</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          hitSlop={12}
        >
          <Text
            className="font-bold text-base"
            style={{ color: canSave ? '#f97316' : '#334155' }}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name input */}
        <View className="bg-brand-slate rounded-2xl px-4 py-3 mb-4">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Workout name…"
            placeholderTextColor="#475569"
            className="text-white text-base font-semibold"
            returnKeyType="done"
            maxLength={40}
          />
        </View>

        {/* Difficulty */}
        <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">
          Difficulty
        </Text>
        <View className="flex-row gap-2 mb-5">
          {DIFF_OPTS.map((opt) => {
            const active = difficulty === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setDifficulty(opt.value)}
                activeOpacity={0.8}
                className="flex-1 rounded-xl py-2.5 items-center"
                style={{
                  backgroundColor: active ? opt.color + '33' : '#1e293b',
                  borderWidth: active ? 1.5 : 0,
                  borderColor: active ? opt.color : 'transparent',
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: active ? opt.color : '#64748b' }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected summary bar */}
        {selectedIds.length > 0 && (
          <View className="bg-orange-500/10 border border-orange-500/30 rounded-2xl px-4 py-3 mb-4 flex-row items-center justify-between">
            <Text className="text-brand-orange font-semibold text-sm">
              {selectedIds.length} exercise{selectedIds.length !== 1 ? 's' : ''} selected
            </Text>
            <Text className="text-slate-400 text-xs">
              ~{stats.durationMin} min · {stats.kcal} kcal
            </Text>
          </View>
        )}

        {/* Exercise search */}
        <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">
          Exercises
        </Text>
        <View className="flex-row items-center bg-brand-slate rounded-xl px-3 py-2.5 mb-3 gap-2">
          <Ionicons name="search" size={16} color="#475569" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or muscle…"
            placeholderTextColor="#475569"
            className="flex-1 text-white text-sm"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#475569" />
            </TouchableOpacity>
          )}
        </View>

        {/* Exercise list */}
        {filteredExercises.length === 0 ? (
          <Text className="text-slate-500 text-sm text-center py-8">No exercises match</Text>
        ) : (
          filteredExercises.map((ex) => (
            <ExerciseRow
              key={ex.id}
              ex={ex}
              selected={selectedIds.includes(ex.id)}
              onToggle={() => toggleExercise(ex.id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

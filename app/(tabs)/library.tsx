import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WORKOUTS } from '@/data/workouts';
import { useCustomWorkoutStore } from '@/store/useCustomWorkoutStore';
import type { Difficulty, WorkoutType, Workout } from '@/types/models';

type TypeFilter = 'all' | WorkoutType;
type DiffFilter = 'all' | Difficulty;

const TYPE_OPTS: { label: string; value: TypeFilter }[] = [
  { label: 'All', value: 'all' },
  { label: '🏠 Home', value: 'home' },
  { label: '✈️ Travel', value: 'travel' },
  { label: '🏋️ Gym', value: 'gym' },
];

const DIFF_OPTS: { label: string; value: DiffFilter }[] = [
  { label: 'Any level', value: 'all' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const DIFF_COLOR: Record<Difficulty, string> = {
  beginner: '#22c55e',
  intermediate: '#f97316',
  advanced: '#ef4444',
};

const TYPE_EMOJI: Record<WorkoutType, string> = {
  home: '🏠',
  travel: '✈️',
  gym: '🏋️',
};

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`px-4 py-2 rounded-xl border mr-2 ${
        active ? 'bg-brand-orange border-brand-orange' : 'bg-brand-slate border-brand-slate'
      }`}
    >
      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-400'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function WorkoutRow({ workout, onDelete }: { workout: Workout; onDelete?: () => void }) {
  const diffColor = DIFF_COLOR[workout.difficulty];
  return (
    <TouchableOpacity
      onPress={() => router.push(`/workout/${workout.id}` as any)}
      activeOpacity={0.8}
      className="bg-brand-slate rounded-2xl p-4 mb-3"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-2 mb-0.5">
            <Text className="text-white text-base font-bold">{workout.name}</Text>
            {workout.isCustom && (
              <View className="bg-blue-500/20 rounded-md px-1.5 py-0.5">
                <Text className="text-blue-300 text-xs font-semibold">Custom</Text>
              </View>
            )}
          </View>
          <View className="flex-row flex-wrap gap-x-3 mt-1">
            {!workout.isCustom && (
              <Text className="text-slate-400 text-xs">
                {TYPE_EMOJI[workout.type]} {workout.type}
              </Text>
            )}
            <Text className="text-slate-400 text-xs">⏱ {workout.durationMin} min</Text>
            <Text className="text-slate-400 text-xs">🔥 ~{workout.estimatedCalories} kcal</Text>
            <Text className="text-slate-400 text-xs">💪 {workout.exerciseIds.length} exercises</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View
            style={{ backgroundColor: diffColor + '28' }}
            className="rounded-lg px-2.5 py-1"
          >
            <Text style={{ color: diffColor }} className="text-xs font-bold capitalize">
              {workout.difficulty}
            </Text>
          </View>
          {onDelete && (
            <TouchableOpacity onPress={onDelete} hitSlop={8}>
              <Ionicons name="trash-outline" size={16} color="#475569" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="flex-row flex-wrap gap-1.5 mt-0.5">
        {workout.tags.slice(0, 4).map((tag) => (
          <View key={tag} className="bg-brand-navy rounded-md px-2 py-0.5">
            <Text className="text-slate-500 text-xs capitalize">{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

export default function LibraryScreen() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [diffFilter, setDiffFilter] = useState<DiffFilter>('all');
  const customWorkouts = useCustomWorkoutStore((s) => s.workouts);
  const deleteWorkout = useCustomWorkoutStore((s) => s.deleteWorkout);

  const filtered = useMemo(
    () =>
      WORKOUTS.filter((w) => {
        if (typeFilter !== 'all' && w.type !== typeFilter) return false;
        if (diffFilter !== 'all' && w.difficulty !== diffFilter) return false;
        return true;
      }),
    [typeFilter, diffFilter],
  );

  function confirmDelete(id: string, name: string) {
    Alert.alert(`Delete "${name}"?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteWorkout(id) },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      {/* Header */}
      <View className="px-5 pt-4 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-2xl font-bold">Workouts</Text>
          <Text className="text-slate-400 text-sm mt-0.5">{filtered.length} workouts</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/workout/build' as any)}
          activeOpacity={0.8}
          className="flex-row items-center gap-1.5 bg-brand-orange rounded-xl px-3 py-2"
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text className="text-white text-sm font-bold">Create</Text>
        </TouchableOpacity>
      </View>

      {/* Type filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
      >
        {TYPE_OPTS.map((o) => (
          <FilterChip
            key={o.value}
            label={o.label}
            active={typeFilter === o.value}
            onPress={() => setTypeFilter(o.value)}
          />
        ))}
      </ScrollView>

      {/* Difficulty filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
      >
        {DIFF_OPTS.map((o) => (
          <FilterChip
            key={o.value}
            label={o.label}
            active={diffFilter === o.value}
            onPress={() => setDiffFilter(o.value)}
          />
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Custom workouts section */}
        {customWorkouts.length > 0 && (
          <>
            <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">
              Your workouts
            </Text>
            {customWorkouts.map((w) => (
              <WorkoutRow
                key={w.id}
                workout={w}
                onDelete={() => confirmDelete(w.id, w.name)}
              />
            ))}
            <View className="h-px bg-brand-slate mb-4" />
            <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">
              All workouts
            </Text>
          </>
        )}

        {filtered.length === 0 ? (
          <View className="items-center pt-10">
            <Text className="text-slate-400 text-base">No workouts match these filters</Text>
            <TouchableOpacity
              onPress={() => { setTypeFilter('all'); setDiffFilter('all'); }}
              className="mt-4"
            >
              <Text className="text-brand-orange text-sm">Clear filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((w) => <WorkoutRow key={w.id} workout={w} />)
        )}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

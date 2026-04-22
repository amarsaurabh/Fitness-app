import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WORKOUTS } from '@/data/workouts';
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

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
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

function WorkoutRow({ workout }: { workout: Workout }) {
  const diffColor = DIFF_COLOR[workout.difficulty];
  return (
    <TouchableOpacity
      onPress={() => router.push(`/workout/${workout.id}` as any)}
      activeOpacity={0.8}
      className="bg-brand-slate rounded-2xl p-4 mb-3"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text className="text-white text-base font-bold">{workout.name}</Text>
          <View className="flex-row flex-wrap gap-x-3 mt-1.5">
            <Text className="text-slate-400 text-xs">
              {TYPE_EMOJI[workout.type]} {workout.type}
            </Text>
            <Text className="text-slate-400 text-xs">⏱ {workout.durationMin} min</Text>
            <Text className="text-slate-400 text-xs">🔥 ~{workout.estimatedCalories} kcal</Text>
            <Text className="text-slate-400 text-xs">
              💪 {workout.exerciseIds.length} exercises
            </Text>
          </View>
        </View>
        <View
          style={{ backgroundColor: diffColor + '28' }}
          className="rounded-lg px-2.5 py-1 shrink-0"
        >
          <Text style={{ color: diffColor }} className="text-xs font-bold capitalize">
            {workout.difficulty}
          </Text>
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

  const filtered = useMemo(
    () =>
      WORKOUTS.filter((w) => {
        if (typeFilter !== 'all' && w.type !== typeFilter) return false;
        if (diffFilter !== 'all' && w.difficulty !== diffFilter) return false;
        return true;
      }),
    [typeFilter, diffFilter],
  );

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      {/* Header */}
      <View className="px-5 pt-4 pb-4">
        <Text className="text-white text-2xl font-bold">Workouts</Text>
        <Text className="text-slate-400 text-sm mt-1">{filtered.length} workouts</Text>
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
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View className="items-center pt-16">
            <Text className="text-slate-400 text-base">No workouts match these filters</Text>
            <TouchableOpacity
              onPress={() => {
                setTypeFilter('all');
                setDiffFilter('all');
              }}
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

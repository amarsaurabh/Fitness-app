import { View, Text, StyleSheet } from 'react-native';
import { SelectableCard } from '@/components/ui/Card';
import type { Goal } from '@/types/models';

interface GoalOption {
  value: Goal;
  label: string;
  description: string;
  emoji: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    value: 'lose_weight',
    label: 'Lose Weight',
    description: 'Burn fat with cardio and calorie-focused workouts',
    emoji: '🔥',
  },
  {
    value: 'build_muscle',
    label: 'Build Muscle',
    description: 'Strength training with progressive overload',
    emoji: '💪',
  },
  {
    value: 'stay_active',
    label: 'Stay Active',
    description: 'Maintain fitness with balanced daily movement',
    emoji: '⚡',
  },
  {
    value: 'stress_relief',
    label: 'Stress Relief',
    description: 'Calm the mind with movement and mobility',
    emoji: '🧘',
  },
];

interface GoalPickerProps {
  selected: Goal | null;
  onSelect: (goal: Goal) => void;
}

export function GoalPicker({ selected, onSelect }: GoalPickerProps) {
  return (
    <View style={styles.grid}>
      {GOAL_OPTIONS.map((opt) => (
        <SelectableCard
          key={opt.value}
          selected={selected === opt.value}
          onPress={() => onSelect(opt.value)}
          style={styles.card}
        >
          <Text style={styles.emoji}>{opt.emoji}</Text>
          <Text style={styles.label}>{opt.label}</Text>
          <Text style={styles.description}>{opt.description}</Text>
        </SelectableCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    position: 'absolute',
    bottom: 10,
    left: 62,
    right: 16,
  },
});

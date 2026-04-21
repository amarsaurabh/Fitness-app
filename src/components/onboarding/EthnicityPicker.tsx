import { View, Text, StyleSheet } from 'react-native';
import { SelectableCard } from '@/components/ui/Card';
import type { FoodCulture } from '@/types/models';
import { FOOD_CULTURE_LABELS, FOOD_CULTURE_EMOJI } from '@/data/culturalFoods';

const CULTURES = Object.keys(FOOD_CULTURE_LABELS) as FoodCulture[];

interface EthnicityPickerProps {
  selected: FoodCulture | null;
  onSelect: (culture: FoodCulture) => void;
}

export function EthnicityPicker({ selected, onSelect }: EthnicityPickerProps) {
  return (
    <View style={styles.grid}>
      {CULTURES.map((culture) => (
        <SelectableCard
          key={culture}
          selected={selected === culture}
          onPress={() => onSelect(culture)}
          style={styles.card}
        >
          <Text style={styles.emoji}>{FOOD_CULTURE_EMOJI[culture]}</Text>
          <Text style={[styles.label, selected === culture && styles.labelSelected]}>
            {FOOD_CULTURE_LABELS[culture]}
          </Text>
        </SelectableCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flexShrink: 1,
  },
  labelSelected: {
    color: '#F97316',
  },
});

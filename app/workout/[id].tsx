import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

// Placeholder — full implementation in Phase 4
export default function ActiveWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 items-center justify-center bg-brand-navy">
      <Text className="text-white text-xl font-semibold">Workout: {id}</Text>
      <Text className="text-slate-400 mt-2">Coming in Phase 4</Text>
    </View>
  );
}

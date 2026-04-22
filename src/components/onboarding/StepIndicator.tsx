import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

interface StepIndicatorProps {
  total: number;
  current: number; // 0-indexed
}

export function StepIndicator({ total, current }: StepIndicatorProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <Dot key={i} active={i === current} done={i < current} />
      ))}
    </View>
  );
}

function Dot({ active, done }: { active: boolean; done: boolean }) {
  const width = useRef(new Animated.Value(done || active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(width, {
      toValue: active ? 1 : done ? 0.5 : 0,
      useNativeDriver: false,
      friction: 6,
    }).start();
  }, [active, done]);

  const dotWidth = width.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [8, 8, 24],
  });

  const bg = active ? '#F97316' : done ? '#FDBA74' : '#E5E7EB';

  return (
    <Animated.View
      style={[styles.dot, { width: dotWidth, backgroundColor: bg }]}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

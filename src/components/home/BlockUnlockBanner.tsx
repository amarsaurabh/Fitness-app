import { View, Text, TouchableOpacity } from 'react-native';
import type { Block } from '@/store/useProgressionStore';

const UNLOCK_COPY: Partial<Record<Block, { emoji: string; title: string; body: string }>> = {
  2: { emoji: '🥗', title: 'Nutrition tracking unlocked!', body: 'Track your protein to fuel your progress.' },
  3: { emoji: '📊', title: 'Progress tracking unlocked!', body: "You've got enough data — see your trends." },
  4: { emoji: '🏗️', title: 'Custom workouts unlocked!', body: 'Build your own routines from the library.' },
  5: { emoji: '🏆', title: 'Full optimization unlocked!', body: "You've built the habit. Now let's fine-tune it." },
};

interface Props {
  block: Block;
  onDismiss(): void;
}

export default function BlockUnlockBanner({ block, onDismiss }: Props) {
  const copy = UNLOCK_COPY[block];
  if (!copy) return null;

  return (
    <View style={{
      backgroundColor: 'rgba(249, 115, 22, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(249, 115, 22, 0.3)',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    }}>
      <Text style={{ fontSize: 24 }}>{copy.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#f97316', fontWeight: '700', fontSize: 15 }}>{copy.title}</Text>
        <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 3 }}>{copy.body}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={10}>
        <Text style={{ color: '#475569', fontSize: 22, lineHeight: 24 }}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

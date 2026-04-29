import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import type { Block } from '@/store/useProgressionStore';

const DISCOVERY: Partial<Record<Block, {
  emoji: string;
  title: string;
  body: string;
  cta: string;
  route: string;
}>> = {
  2: {
    emoji: '🥗',
    title: "You're building momentum",
    body: "3 workouts in — nutrition is the next piece. Track your protein and see the full picture.",
    cta: 'Explore nutrition →',
    route: '/(tabs)/nutrition',
  },
  3: {
    emoji: '📊',
    title: 'Your data is taking shape',
    body: "10 sessions logged — you have real trends now. See how your training is evolving.",
    cta: 'See your progress →',
    route: '/(tabs)/progress',
  },
  4: {
    emoji: '🏗️',
    title: 'Ready to build your own?',
    body: "20 sessions in — you know what works for you. Create your own workout routines.",
    cta: 'Build a workout →',
    route: '/(tabs)/library',
  },
};

interface Props {
  block: Block;
  onDismiss(): void;
}

export default function FeatureDiscoveryCard({ block, onDismiss }: Props) {
  const card = DISCOVERY[block];
  if (!card) return null;

  return (
    <View style={{
      backgroundColor: 'rgba(148, 163, 184, 0.08)',
      borderWidth: 1,
      borderColor: '#334155',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    }}>
      <Text style={{ fontSize: 22, marginTop: 1 }}>{card.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#e2e8f0', fontWeight: '600', fontSize: 14, marginBottom: 3 }}>
          {card.title}
        </Text>
        <Text style={{ color: '#64748b', fontSize: 13, lineHeight: 18, marginBottom: 10 }}>
          {card.body}
        </Text>
        <TouchableOpacity onPress={() => { onDismiss(); router.push(card.route as any); }}>
          <Text style={{ color: '#f97316', fontSize: 13, fontWeight: '600' }}>{card.cta}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={10}>
        <Text style={{ color: '#334155', fontSize: 20, lineHeight: 22 }}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

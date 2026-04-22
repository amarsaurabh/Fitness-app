import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useUserStore } from '@/store/useUserStore';

const SIZE = 116;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProteinRing() {
  const todayProteinG = useNutritionStore((s) => s.todayProteinG);
  const dailyProteinGoal = useUserStore((s) => s.dailyProteinGoal);

  const logged = todayProteinG();
  const goal = dailyProteinGoal();
  const progress = Math.min(goal > 0 ? logged / goal : 0, 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const ringColor =
    progress >= 0.8 ? '#22c55e' : progress >= 0.4 ? '#f97316' : '#ef4444';

  const pct = Math.round(progress * 100);

  return (
    <View className="bg-brand-slate rounded-3xl p-5 mb-4">
      <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">
        Protein today
      </Text>

      <View className="flex-row items-center gap-6">
        {/* SVG ring */}
        <View style={{ width: SIZE, height: SIZE }}>
          <Svg width={SIZE} height={SIZE}>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke="#334155"
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={ringColor}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${SIZE / 2}, ${SIZE / 2}`}
            />
          </Svg>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text className="text-white text-xl font-bold">{Math.round(logged)}g</Text>
            <Text className="text-slate-500 text-xs">of {goal}g</Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-1">
          <Text className="text-white text-3xl font-bold">{pct}%</Text>
          <Text className="text-slate-400 text-sm mt-1">of daily goal</Text>
          <View className="mt-3 h-px bg-brand-navy" />
          <Text className="text-slate-400 text-xs mt-3">
            {goal - Math.round(logged) > 0
              ? `${goal - Math.round(logged)}g to go`
              : 'Goal reached! 🎉'}
          </Text>
        </View>
      </View>
    </View>
  );
}

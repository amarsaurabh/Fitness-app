import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { SelectableCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUserStore } from '@/store/useUserStore';
import type { ActivityLevel } from '@/types/models';

interface ActivityOption {
  value: ActivityLevel;
  emoji: string;
  label: string;
  description: string;
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    value: 'sedentary',
    emoji: '🪑',
    label: 'Mostly sedentary',
    description: 'Desk job, little to no exercise',
  },
  {
    value: 'light',
    emoji: '🚶',
    label: 'Lightly active',
    description: 'Walk sometimes, light exercise 1–3×/week',
  },
  {
    value: 'moderate',
    emoji: '🏃',
    label: 'Moderately active',
    description: 'Exercise 3–5×/week',
  },
  {
    value: 'very_active',
    emoji: '⚡',
    label: 'Very active',
    description: 'Hard training 6–7×/week or physical job',
  },
];

export default function OnboardingStep4() {
  const { profile, updateProfile } = useUserStore();
  const [selected, setSelected] = useState<ActivityLevel | null>(
    profile?.activityLevel ?? null,
  );

  async function handleContinue() {
    await updateProfile({ activityLevel: selected! });
    router.push('/onboarding/notifications');
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      <View className="px-6 pt-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Text className="text-slate-400 text-base">← Back</Text>
        </TouchableOpacity>
        <StepIndicator total={5} current={3} />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-3xl font-bold mt-8 mb-2">
          How active are you?
        </Text>
        <Text className="text-slate-400 text-base mb-8">
          Honest answers give better calorie and protein targets.
        </Text>

        <View className="gap-3">
          {ACTIVITY_OPTIONS.map((opt) => (
            <SelectableCard
              key={opt.value}
              selected={selected === opt.value}
              onPress={() => setSelected(opt.value)}
              style={{ backgroundColor: '#1e293b', borderColor: selected === opt.value ? '#f97316' : '#334155' }}
            >
              <View className="flex-row items-center gap-4">
                <Text className="text-3xl">{opt.emoji}</Text>
                <View className="flex-1">
                  <Text
                    className={`text-base font-bold ${selected === opt.value ? 'text-brand-orange' : 'text-white'}`}
                  >
                    {opt.label}
                  </Text>
                  <Text className="text-slate-400 text-sm mt-0.5">
                    {opt.description}
                  </Text>
                </View>
              </View>
            </SelectableCard>
          ))}
        </View>

        <View className="h-8" />
      </ScrollView>

      <View className="px-6 pb-6 pt-4">
        <Button
          label="Continue"
          size="lg"
          disabled={selected === null}
          onPress={handleContinue}
          style={{ width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
}

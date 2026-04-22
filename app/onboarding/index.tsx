import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { GoalPicker } from '@/components/onboarding/GoalPicker';
import { Button } from '@/components/ui/Button';
import { useUserStore, buildNewProfile } from '@/store/useUserStore';
import type { Goal } from '@/types/models';

export default function OnboardingStep1() {
  const setProfile = useUserStore((s) => s.setProfile);
  const existing = useUserStore((s) => s.profile);

  const [name, setName] = useState(existing?.name ?? '');
  const [goal, setGoal] = useState<Goal | null>(existing?.goal ?? null);

  const canContinue = name.trim().length > 0 && goal !== null;

  async function handleContinue() {
    const profile = buildNewProfile(existing?.id ?? String(Date.now()), {
      ...(existing ?? {}),
      name: name.trim(),
      goal: goal!,
    });
    await setProfile(profile);
    router.push('/onboarding/body');
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="px-6 pt-6 pb-4">
          <StepIndicator total={5} current={0} />
        </View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-white text-3xl font-bold mt-8 mb-2">
            What's your name?
          </Text>
          <Text className="text-slate-400 text-base mb-8">
            We'll personalise everything for you.
          </Text>

          <TextInput
            className="bg-brand-slate text-white text-xl font-semibold rounded-2xl px-5 py-4 mb-10"
            placeholder="Your name"
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
          />

          <Text className="text-white text-2xl font-bold mb-2">
            What's your goal?
          </Text>
          <Text className="text-slate-400 text-sm mb-6">
            This shapes your workouts and nutrition targets.
          </Text>

          <GoalPicker selected={goal} onSelect={setGoal} />

          <View className="h-8" />
        </ScrollView>

        <View className="px-6 pb-6 pt-4">
          <Button
            label="Continue"
            size="lg"
            disabled={!canContinue}
            onPress={handleContinue}
            style={{ width: '100%' }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

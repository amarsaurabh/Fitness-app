import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { EthnicityPicker } from '@/components/onboarding/EthnicityPicker';
import { Button } from '@/components/ui/Button';
import { useUserStore } from '@/store/useUserStore';
import type { FoodCulture } from '@/types/models';

export default function OnboardingStep3() {
  const { profile, updateProfile } = useUserStore();
  const [selected, setSelected] = useState<FoodCulture | null>(
    profile?.foodCulture ?? null,
  );

  async function handleContinue(culture: FoodCulture) {
    await updateProfile({ foodCulture: culture });
    router.push('/onboarding/activity');
  }

  async function handleSkip() {
    await updateProfile({ foodCulture: 'global' });
    router.push('/onboarding/activity');
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      <View className="px-6 pt-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Text className="text-slate-400 text-base">← Back</Text>
        </TouchableOpacity>
        <StepIndicator total={5} current={2} />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-3xl font-bold mt-8 mb-2">
          Your food culture
        </Text>
        <Text className="text-slate-400 text-base mb-2">
          We suggest protein-rich meals from your cuisine — not just chicken and broccoli.
        </Text>
        <TouchableOpacity onPress={handleSkip} className="mb-8">
          <Text className="text-brand-orange text-sm">Skip — I'll set this later</Text>
        </TouchableOpacity>

        <EthnicityPicker selected={selected} onSelect={setSelected} />

        <View className="h-8" />
      </ScrollView>

      <View className="px-6 pb-6 pt-4">
        <Button
          label="Continue"
          size="lg"
          disabled={selected === null}
          onPress={() => selected && handleContinue(selected)}
          style={{ width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
}

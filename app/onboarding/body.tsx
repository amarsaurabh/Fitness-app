import { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { Button } from '@/components/ui/Button';
import { useUserStore } from '@/store/useUserStore';

type WeightUnit = 'kg' | 'lbs';
type HeightUnit = 'cm' | 'ft';

export default function OnboardingStep2() {
  const { profile, updateProfile } = useUserStore();

  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');

  // Display values (may be in lbs/ft depending on unit)
  const [weightDisplay, setWeightDisplay] = useState(
    profile?.weightKg ? String(profile.weightKg) : '',
  );
  const [heightCmDisplay, setHeightCmDisplay] = useState(
    profile?.heightCm ? String(profile.heightCm) : '',
  );
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');

  function getWeightKg(): number {
    const val = parseFloat(weightDisplay);
    if (isNaN(val)) return 0;
    return weightUnit === 'kg' ? val : val / 2.20462;
  }

  function getHeightCm(): number {
    if (heightUnit === 'cm') {
      const val = parseFloat(heightCmDisplay);
      return isNaN(val) ? 0 : val;
    }
    const ft = parseFloat(heightFt) || 0;
    const inches = parseFloat(heightIn) || 0;
    return (ft * 12 + inches) * 2.54;
  }

  const canContinue = getWeightKg() > 0 && getHeightCm() > 0;

  async function handleContinue() {
    await updateProfile({
      weightKg: Math.round(getWeightKg() * 10) / 10,
      heightCm: Math.round(getHeightCm()),
    });
    router.push('/onboarding/ethnicity');
  }

  function toggleWeightUnit() {
    if (weightUnit === 'kg') {
      const kg = parseFloat(weightDisplay);
      setWeightDisplay(isNaN(kg) ? '' : String(Math.round(kg * 2.20462)));
      setWeightUnit('lbs');
    } else {
      const lbs = parseFloat(weightDisplay);
      setWeightDisplay(isNaN(lbs) ? '' : String(Math.round(lbs / 2.20462)));
      setWeightUnit('kg');
    }
  }

  function toggleHeightUnit() {
    if (heightUnit === 'cm') {
      const cm = parseFloat(heightCmDisplay);
      if (!isNaN(cm)) {
        const totalInches = cm / 2.54;
        setHeightFt(String(Math.floor(totalInches / 12)));
        setHeightIn(String(Math.round(totalInches % 12)));
      }
      setHeightUnit('ft');
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inches = parseFloat(heightIn) || 0;
      setHeightCmDisplay(String(Math.round((ft * 12 + inches) * 2.54)));
      setHeightUnit('cm');
    }
  }

  return (
    <OnboardingShell>
      <View className="px-6 pt-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Text className="text-slate-400 text-base">← Back</Text>
        </TouchableOpacity>
        <StepIndicator total={5} current={1} />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-3xl font-bold mt-8 mb-2">
          Tell us about your body
        </Text>
        <Text className="text-slate-400 text-base mb-10">
          Used to calculate calories burned and your protein target.
        </Text>

        {/* Weight */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-lg font-semibold">Weight</Text>
            <UnitToggle
              options={['kg', 'lbs']}
              selected={weightUnit}
              onToggle={toggleWeightUnit}
            />
          </View>
          <TextInput
            className="bg-brand-slate text-white text-2xl font-bold rounded-2xl px-5 py-4"
            placeholder={weightUnit === 'kg' ? '70' : '154'}
            placeholderTextColor="#64748b"
            value={weightDisplay}
            onChangeText={setWeightDisplay}
            keyboardType="numeric"
          />
        </View>

        {/* Height */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-lg font-semibold">Height</Text>
            <UnitToggle
              options={['cm', 'ft']}
              selected={heightUnit}
              onToggle={toggleHeightUnit}
            />
          </View>

          {heightUnit === 'cm' ? (
            <TextInput
              className="bg-brand-slate text-white text-2xl font-bold rounded-2xl px-5 py-4"
              placeholder="170"
              placeholderTextColor="#64748b"
              value={heightCmDisplay}
              onChangeText={setHeightCmDisplay}
              keyboardType="numeric"
            />
          ) : (
            <View className="flex-row gap-3">
              <TextInput
                className="bg-brand-slate text-white text-2xl font-bold rounded-2xl px-5 py-4 flex-1"
                placeholder="5 ft"
                placeholderTextColor="#64748b"
                value={heightFt}
                onChangeText={setHeightFt}
                keyboardType="numeric"
              />
              <TextInput
                className="bg-brand-slate text-white text-2xl font-bold rounded-2xl px-5 py-4 flex-1"
                placeholder="7 in"
                placeholderTextColor="#64748b"
                value={heightIn}
                onChangeText={setHeightIn}
                keyboardType="numeric"
              />
            </View>
          )}
        </View>

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
    </OnboardingShell>
  );
}

function UnitToggle({
  options,
  selected,
  onToggle,
}: {
  options: [string, string];
  selected: string;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      className="flex-row bg-brand-slate rounded-xl overflow-hidden"
    >
      {options.map((opt) => (
        <View
          key={opt}
          className={`px-4 py-1.5 ${selected === opt ? 'bg-brand-orange' : ''}`}
        >
          <Text
            className={`text-sm font-semibold ${selected === opt ? 'text-white' : 'text-slate-400'}`}
          >
            {opt}
          </Text>
        </View>
      ))}
    </TouchableOpacity>
  );
}

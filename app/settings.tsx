import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/useUserStore';
import type { Goal, ActivityLevel, FoodCulture } from '@/types/models';
import { FOOD_CULTURE_LABELS, FOOD_CULTURE_EMOJI } from '@/data/culturalFoods';
import { applyNotificationSettings } from '@/services/notifications/scheduleNotifications';

const GOAL_OPTIONS: { value: Goal; label: string; emoji: string }[] = [
  { value: 'lose_weight', label: 'Lose weight', emoji: '🎯' },
  { value: 'build_muscle', label: 'Build muscle', emoji: '💪' },
  { value: 'stay_active', label: 'Stay active', emoji: '⚡' },
  { value: 'stress_relief', label: 'Stress relief', emoji: '🧘' },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
  { value: 'light', label: 'Light', desc: '1–3 days/week' },
  { value: 'moderate', label: 'Moderate', desc: '3–5 days/week' },
  { value: 'very_active', label: 'Very active', desc: '6–7 days/week' },
];

const CULTURE_OPTIONS: FoodCulture[] = [
  'south-asian', 'east-asian', 'latin', 'west-african',
  'mediterranean', 'middle-eastern', 'european', 'global',
];

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest px-1 mt-6 mb-2">
      {title}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View className="bg-brand-slate rounded-2xl overflow-hidden">{children}</View>;
}

function Row({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3.5 ${last ? '' : 'border-b border-brand-navy'}`}
    >
      <Text className="text-slate-300 text-sm">{label}</Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const dailyProteinGoal = useUserStore((s) => s.dailyProteinGoal);
  const dailyCalorieGoal = useUserStore((s) => s.dailyCalorieGoal);

  const [name, setName] = useState(profile?.name ?? '');
  const [weight, setWeight] = useState(String(profile?.weightKg ?? 70));
  const [height, setHeight] = useState(String(profile?.heightCm ?? 170));
  const [reminderTime, setReminderTime] = useState(profile?.proteinReminderTime ?? '13:00');

  if (!profile) return null;

  function save(partial: Parameters<typeof updateProfile>[0]) {
    updateProfile(partial);
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      {/* Header */}
      <View className="flex-row items-center px-5 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#94a3b8" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Settings</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Profile ── */}
        <SectionHeader title="Profile" />
        <Card>
          <Row label="Name">
            <TextInput
              value={name}
              onChangeText={setName}
              onBlur={() => name.trim() && save({ name: name.trim() })}
              className="text-white text-sm text-right flex-1 ml-4"
              placeholderTextColor="#475569"
              placeholder="Your name"
              returnKeyType="done"
            />
          </Row>
          <Row label="Weight (kg)">
            <TextInput
              value={weight}
              onChangeText={setWeight}
              onBlur={() => {
                const n = parseFloat(weight);
                if (!isNaN(n) && n > 0) save({ weightKg: n });
              }}
              className="text-white text-sm text-right w-20"
              keyboardType="decimal-pad"
              placeholderTextColor="#475569"
              placeholder="70"
            />
          </Row>
          <Row label="Height (cm)" last>
            <TextInput
              value={height}
              onChangeText={setHeight}
              onBlur={() => {
                const n = parseFloat(height);
                if (!isNaN(n) && n > 0) save({ heightCm: n });
              }}
              className="text-white text-sm text-right w-20"
              keyboardType="decimal-pad"
              placeholderTextColor="#475569"
              placeholder="170"
            />
          </Row>
        </Card>

        {/* ── Fitness goal ── */}
        <SectionHeader title="Fitness goal" />
        <View className="flex-row flex-wrap gap-2">
          {GOAL_OPTIONS.map((opt) => {
            const active = profile.goal === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => save({ goal: opt.value })}
                activeOpacity={0.8}
                className={`flex-row items-center gap-2 px-4 py-3 rounded-2xl ${
                  active ? 'bg-brand-orange' : 'bg-brand-slate'
                }`}
              >
                <Text className="text-lg">{opt.emoji}</Text>
                <Text
                  className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-300'}`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Activity level ── */}
        <SectionHeader title="Activity level" />
        <View className="gap-2">
          {ACTIVITY_OPTIONS.map((opt) => {
            const active = profile.activityLevel === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => save({ activityLevel: opt.value })}
                activeOpacity={0.8}
                className={`flex-row items-center justify-between px-4 py-3.5 rounded-2xl ${
                  active
                    ? 'bg-orange-500/20 border border-orange-500/40'
                    : 'bg-brand-slate'
                }`}
              >
                <View>
                  <Text
                    className={`text-sm font-semibold ${active ? 'text-brand-orange' : 'text-white'}`}
                  >
                    {opt.label}
                  </Text>
                  <Text className="text-slate-400 text-xs mt-0.5">{opt.desc}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={20} color="#f97316" />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Food culture ── */}
        <SectionHeader title="Food culture" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 4 }}
        >
          {CULTURE_OPTIONS.map((c) => {
            const active = profile.foodCulture === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => save({ foodCulture: c })}
                activeOpacity={0.8}
                className={`px-4 py-3 rounded-2xl items-center min-w-20 ${
                  active ? 'bg-brand-orange' : 'bg-brand-slate'
                }`}
              >
                <Text className="text-xl mb-1">{FOOD_CULTURE_EMOJI[c]}</Text>
                <Text
                  className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-300'}`}
                >
                  {FOOD_CULTURE_LABELS[c]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Notifications ── */}
        <SectionHeader title="Notifications" />
        <Card>
          <Row label="Protein reminders">
            <Switch
              value={profile.notificationsEnabled}
              onValueChange={(v) => {
                save({ notificationsEnabled: v });
                applyNotificationSettings({ ...profile, notificationsEnabled: v }).catch(() => {});
              }}
              trackColor={{ false: '#1e293b', true: '#f97316' }}
              thumbColor="#fff"
            />
          </Row>
          <Row label="Reminder time (HH:MM)" last>
            <TextInput
              value={reminderTime}
              onChangeText={setReminderTime}
              onBlur={() => {
                if (/^\d{2}:\d{2}$/.test(reminderTime)) {
                  save({ proteinReminderTime: reminderTime });
                  if (profile.notificationsEnabled) {
                    applyNotificationSettings({
                      ...profile,
                      proteinReminderTime: reminderTime,
                    }).catch(() => {});
                  }
                }
              }}
              className="text-white text-sm text-right w-20"
              placeholderTextColor="#475569"
              placeholder="13:00"
              keyboardType="numbers-and-punctuation"
              returnKeyType="done"
            />
          </Row>
        </Card>

        {/* ── Calculated targets ── */}
        <SectionHeader title="Calculated targets" />
        <Card>
          <Row label="Daily protein goal">
            <Text className="text-brand-orange font-bold text-sm">{dailyProteinGoal()}g</Text>
          </Row>
          <Row label="Estimated daily calories" last>
            <Text className="text-brand-orange font-bold text-sm">
              {dailyCalorieGoal()} kcal
            </Text>
          </Row>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

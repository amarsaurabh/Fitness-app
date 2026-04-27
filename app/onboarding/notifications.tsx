import { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { Button } from '@/components/ui/Button';
import { useUserStore } from '@/store/useUserStore';
import {
  requestPermissions,
  scheduleNotification,
  NOTIF_IDS,
} from '@/services/notifications/notificationService';

const REMINDER_TIMES = ['08:00', '12:00', '13:00', '18:00', '20:00'];

export default function OnboardingStep5() {
  const { profile, updateProfile, completeOnboarding } = useUserStore();
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('13:00');
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    setLoading(true);
    try {
      let granted = false;
      if (notifEnabled) {
        granted = await requestPermissions();
        if (!granted) {
          Alert.alert(
            'Notifications blocked',
            "You can enable them later in your phone's settings. We'll still show in-app reminders.",
          );
        }
      }

      await updateProfile({
        notificationsEnabled: notifEnabled && granted,
        proteinReminderTime: reminderTime,
      });

      if (notifEnabled && granted) {
        const [hours, minutes] = reminderTime.split(':').map(Number);
        await scheduleNotification(
          NOTIF_IDS.PROTEIN_DAILY,
          "Don't forget your protein 💪",
          `Check today's meal suggestions in the app.`,
          {
            type: 'calendar' as const,
            repeats: true,
            hour: hours,
            minute: minutes,
          },
        );
      }

      await completeOnboarding();
      router.replace('/(tabs)/today');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      <View className="px-6 pt-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Text className="text-slate-400 text-base">← Back</Text>
        </TouchableOpacity>
        <StepIndicator total={5} current={4} />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-4xl mt-8 mb-4">🔔</Text>
        <Text className="text-white text-3xl font-bold mb-2">
          Never miss a session
        </Text>
        <Text className="text-slate-400 text-base mb-10">
          A streak reminder at 11:30pm if you haven't worked out, plus a daily
          protein nudge at your chosen time.
        </Text>

        {/* Notification toggle */}
        <View className="bg-brand-slate rounded-2xl px-5 py-4 flex-row items-center justify-between mb-6">
          <View className="flex-1 mr-4">
            <Text className="text-white text-base font-semibold">
              Enable reminders
            </Text>
            <Text className="text-slate-400 text-sm mt-1">
              No spam — just streak protection and one protein nudge daily
            </Text>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={setNotifEnabled}
            trackColor={{ false: '#334155', true: '#f97316' }}
            thumbColor="#fff"
          />
        </View>

        {/* Time picker */}
        {notifEnabled && (
          <View className="mb-8">
            <Text className="text-white text-base font-semibold mb-3">
              Protein reminder time
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {REMINDER_TIMES.map((time) => (
                <TouchableOpacity
                  key={time}
                  onPress={() => setReminderTime(time)}
                  className={`px-5 py-3 rounded-xl border-2 ${
                    reminderTime === time
                      ? 'bg-brand-orange border-brand-orange'
                      : 'bg-brand-slate border-brand-slate'
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      reminderTime === time ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* What they get preview */}
        <View className="bg-brand-slate rounded-2xl p-5 mb-8">
          <Text className="text-white font-semibold mb-3">You'll get:</Text>
          {[
            { icon: '🔥', text: 'Streak last-chance alert at 11:30pm' },
            { icon: '🥗', text: `Protein reminder at ${reminderTime}` },
            { icon: '📊', text: 'Weekly review every Sunday evening' },
          ].map(({ icon, text }) => (
            <View key={text} className="flex-row items-center gap-3 mb-2">
              <Text className="text-lg">{icon}</Text>
              <Text className="text-slate-300 text-sm">{text}</Text>
            </View>
          ))}
        </View>

        <View className="h-8" />
      </ScrollView>

      <View className="px-6 pb-6 pt-4 gap-3">
        <Button
          label="Let's go 🚀"
          size="lg"
          loading={loading}
          onPress={handleFinish}
          style={{ width: '100%' }}
        />
        {!notifEnabled && (
          <Button
            label="Skip notifications"
            variant="ghost"
            size="md"
            onPress={handleFinish}
            style={{ width: '100%' }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

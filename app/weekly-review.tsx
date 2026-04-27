import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useStreakStore } from '@/store/useStreakStore';
import { useUserStore } from '@/store/useUserStore';
import { useLLMCacheStore } from '@/store/useLLMCacheStore';
import type { WorkoutSession, Goal } from '@/types/models';
import { GROQ_DAILY_CALL_LIMIT, TTL_WEEKLY_REVIEW } from '@/utils/constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function weekMondayDate(): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  return monday.toISOString().split('T')[0];
}

function thisWeekDates(): string[] {
  const start = new Date(weekMondayDate() + 'T12:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function formatWeekLabel(mondayStr: string): string {
  const d = new Date(mondayStr + 'T12:00:00');
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const fmt = (dt: Date) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(d)} – ${fmt(end)}`;
}

interface WeekStats {
  sessions: number;
  totalMin: number;
  totalKcal: number;
  avgDurationMin: number;
  activeDays: number;
  weekOf: string;
}

function computeWeekStats(allSessions: WorkoutSession[]): WeekStats {
  const dates = thisWeekDates();
  const weekSessions = allSessions.filter((s) => s.completed && dates.includes(s.date));
  const weekOf = weekMondayDate();

  if (weekSessions.length === 0) {
    return { sessions: 0, totalMin: 0, totalKcal: 0, avgDurationMin: 0, activeDays: 0, weekOf };
  }

  const totalMin = weekSessions.reduce((a, s) => a + s.durationMin, 0);
  const totalKcal = weekSessions.reduce((a, s) => a + s.caloriesBurned, 0);
  const activeDays = new Set(weekSessions.map((s) => s.date)).size;

  return {
    sessions: weekSessions.length,
    totalMin,
    totalKcal,
    avgDurationMin: Math.round(totalMin / weekSessions.length),
    activeDays,
    weekOf,
  };
}

const GOAL_LABELS: Record<Goal, string> = {
  lose_weight: 'losing weight',
  build_muscle: 'building muscle',
  stay_active: 'staying active',
  stress_relief: 'stress relief',
};

const FALLBACK_REVIEW: Record<Goal, string> = {
  lose_weight:
    `**A solid week for your weight loss journey!** Every session compounds — the habit matters more than any single workout.\n\n**Next week, focus on:**\n- Keep sessions above 30 minutes to maximise fat-burning\n- Log protein after every workout — muscle retention is key when cutting\n- Schedule each workout the night before to remove decision fatigue`,
  build_muscle:
    `**Great work putting in the reps this week!** Consistent weekly sessions are the driver of real muscle growth.\n\n**Next week, focus on:**\n- Progressive overload — aim to beat last week's reps on at least one exercise\n- Hit your protein target every day, not just workout days\n- Prioritise 7–8 hours of sleep — that's when muscles grow`,
  stay_active:
    `**Another active week — well done!** Staying in motion is one of the best things you can do for your long-term health.\n\n**Next week, focus on:**\n- Mix workout types to challenge different muscle groups\n- Add a short walk on rest days to stay in the habit\n- Celebrate your consistency — you're building a lifestyle`,
  stress_relief:
    `**You're using movement as medicine — smart!** Physical activity genuinely reduces cortisol and lifts mood.\n\n**Next week, focus on:**\n- Add breathing or cool-down stretches at the end of each session\n- Keep rest days gently active — a 15-minute walk counts\n- Notice how you feel after workouts — that mood lift reinforces the habit`,
};

async function fetchWeeklyReview(
  name: string,
  goal: Goal,
  stats: WeekStats,
  streakCurrent: number,
  apiKey: string,
): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are an encouraging fitness coach writing a brief weekly review. Be warm, specific, and actionable. Use **bold** for section headers.',
        },
        {
          role: 'user',
          content: `Write a weekly fitness review for ${name}.
Goal: ${GOAL_LABELS[goal]}
Week of: ${stats.weekOf}
Workouts completed: ${stats.sessions}
Active days: ${stats.activeDays}/7
Total minutes: ${stats.totalMin}
Calories burned: ${stats.totalKcal}
Average session: ${stats.avgDurationMin} min
Current streak: ${streakCurrent} days

Write 3 sentences acknowledging their week, then list exactly 3 specific action points for next week.
Use **bold** for the opening sentence header and for "Next week, focus on:". Keep it under 120 words.`,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatTile({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View className="flex-1 bg-brand-navy rounded-2xl py-4 items-center">
      <Text className="text-xl mb-1">{icon}</Text>
      <Text className="text-white text-xl font-bold">{value}</Text>
      <Text className="text-slate-500 text-xs mt-0.5 text-center" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function parseReviewText(text: string): React.ReactNode[] {
  return text.split('\n\n').map((para, i) => {
    const parts = para.split(/(\*\*[^*]+\*\*)/g);
    return (
      <Text key={i} className="text-slate-300 text-sm leading-6 mb-3">
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <Text key={j} className="text-white font-bold">
              {part.slice(2, -2)}
            </Text>
          ) : (
            part
          ),
        )}
      </Text>
    );
  });
}

function EmptyWeekCard() {
  return (
    <View className="bg-brand-slate rounded-3xl p-6 items-center">
      <Text className="text-4xl mb-3">📅</Text>
      <Text className="text-white font-bold text-base mb-2">No workouts yet this week</Text>
      <Text className="text-slate-400 text-sm text-center leading-5">
        Complete at least one workout this week and come back for your personalised review.
      </Text>
      <TouchableOpacity
        onPress={() => router.replace('/(tabs)/today')}
        className="mt-4 bg-brand-orange rounded-xl px-5 py-2.5"
        activeOpacity={0.85}
      >
        <Text className="text-white font-bold text-sm">Start a workout</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WeeklyReviewScreen() {
  const sessions = useWorkoutStore((s) => s.sessions);
  const streak = useStreakStore((s) => s.streak);
  const profile = useUserStore((s) => s.profile);
  const { get: cacheGet, set: cacheSet, isGroqBudgetAvailable, incrementGroqCalls } =
    useLLMCacheStore();

  const stats = computeWeekStats(sessions);
  const now = new Date();
  const cacheKey = `weekly-review:${now.getFullYear()}:${getISOWeek(now)}`;

  const [review, setReview] = useState<string | null>(cacheGet(cacheKey));
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [fromFallback, setFromFallback] = useState(false);

  const goal: Goal = profile?.goal ?? 'stay_active';

  useEffect(() => {
    const cached = cacheGet(cacheKey);
    if (cached) {
      setReview(cached);
      setFromCache(true);
      return;
    }
    if (stats.sessions === 0) return;
    generateReview();
  }, []);

  async function generateReview() {
    setLoading(true);
    setFromCache(false);
    setFromFallback(false);

    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (!apiKey || !isGroqBudgetAvailable(GROQ_DAILY_CALL_LIMIT)) {
      setReview(FALLBACK_REVIEW[goal]);
      setFromFallback(true);
      setLoading(false);
      return;
    }

    try {
      const text = await fetchWeeklyReview(
        profile?.name?.split(' ')[0] ?? 'there',
        goal,
        stats,
        streak.current,
        apiKey,
      );
      incrementGroqCalls();
      cacheSet(cacheKey, text, TTL_WEEKLY_REVIEW);
      setReview(text);
    } catch {
      setReview(FALLBACK_REVIEW[goal]);
      setFromFallback(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      {/* Header */}
      <View className="flex-row items-center px-5 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#94a3b8" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-xl font-bold">Weekly review</Text>
          <Text className="text-slate-500 text-xs mt-0.5">{formatWeekLabel(stats.weekOf)}</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats row */}
        <View className="pt-4 pb-5">
          <View className="flex-row gap-2 mb-2">
            <StatTile icon="💪" value={String(stats.sessions)} label="workouts" />
            <StatTile icon="📅" value={`${stats.activeDays}/7`} label="active days" />
            <StatTile icon="⏱" value={`${stats.totalMin}`} label="minutes" />
            <StatTile icon="🔥" value={String(stats.totalKcal)} label="kcal" />
          </View>
        </View>

        {/* Review card */}
        {stats.sessions === 0 ? (
          <EmptyWeekCard />
        ) : (
          <View className="bg-brand-slate rounded-3xl p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-base font-bold">Your week in review</Text>
              <View className="flex-row gap-2 items-center">
                {fromCache && (
                  <View className="bg-blue-500/20 rounded-lg px-2 py-0.5">
                    <Text className="text-blue-300 text-xs">cached</Text>
                  </View>
                )}
                {fromFallback && (
                  <View className="bg-slate-500/30 rounded-lg px-2 py-0.5">
                    <Text className="text-slate-400 text-xs">offline</Text>
                  </View>
                )}
              </View>
            </View>

            {loading ? (
              <View className="items-center py-8">
                <ActivityIndicator color="#f97316" size="large" />
                <Text className="text-slate-400 text-sm mt-3">Generating your review…</Text>
              </View>
            ) : review ? (
              <>
                {parseReviewText(review)}
                {!fromCache && (
                  <TouchableOpacity
                    onPress={generateReview}
                    disabled={!isGroqBudgetAvailable(GROQ_DAILY_CALL_LIMIT)}
                    className="mt-2 flex-row items-center gap-1.5"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh" size={14} color="#64748b" />
                    <Text className="text-slate-500 text-xs">Regenerate</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : null}
          </View>
        )}

        {/* Streak snapshot */}
        {streak.current > 0 && (
          <View className="bg-brand-slate rounded-3xl p-5 mt-4 flex-row items-center gap-4">
            <View className="w-12 h-12 bg-orange-500/20 rounded-2xl items-center justify-center">
              <Text className="text-2xl">🔥</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold">
                {streak.current} day streak
              </Text>
              <Text className="text-slate-400 text-sm mt-0.5">
                {streak.current === streak.longest ? 'Personal best 🏆' : `Best ever: ${streak.longest} days`}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

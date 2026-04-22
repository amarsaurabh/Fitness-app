import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useStreakStore } from '@/store/useStreakStore';
import { useUserStore } from '@/store/useUserStore';
import type { WorkoutSession, Streak, PatternInsight } from '@/types/models';

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function dateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function last28Dates(): string[] {
  return Array.from({ length: 28 }, (_, i) => dateString(27 - i));
}

function last7Dates(): string[] {
  return Array.from({ length: 7 }, (_, i) => dateString(6 - i));
}

function dayLabel(dateStr: string): string {
  return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][new Date(dateStr + 'T12:00:00').getDay()];
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function workoutTypeFromId(id: string): 'home' | 'travel' | 'gym' | null {
  if (id.startsWith('home-')) return 'home';
  if (id.startsWith('travel-')) return 'travel';
  if (id.startsWith('gym-')) return 'gym';
  return null;
}

// ─── Stat derivations ─────────────────────────────────────────────────────────

interface DayStat {
  date: string;
  calories: number;
  durationMin: number;
  hasWorkout: boolean;
}

function buildDayStats(sessions: WorkoutSession[], dates: string[]): DayStat[] {
  return dates.map((date) => {
    const daySessions = sessions.filter((s) => s.date === date && s.completed);
    return {
      date,
      calories: daySessions.reduce((a, s) => a + s.caloriesBurned, 0),
      durationMin: daySessions.reduce((a, s) => a + s.durationMin, 0),
      hasWorkout: daySessions.length > 0,
    };
  });
}

function computeInsights(sessions: WorkoutSession[]): PatternInsight[] {
  if (sessions.length === 0) return [];
  const insights: PatternInsight[] = [];

  // Average session duration
  const avg = Math.round(sessions.reduce((a, s) => a + s.durationMin, 0) / sessions.length);
  insights.push({ type: 'duration_trend', icon: '⏱', message: `Average session: ${avg} min` });

  // 28-day consistency
  const dates28 = last28Dates();
  const workoutDates = new Set(sessions.filter((s) => s.completed).map((s) => s.date));
  const activeDays = dates28.filter((d) => workoutDates.has(d)).length;
  insights.push({
    type: 'completion_rate',
    icon: '📊',
    message: `${activeDays} workout days in the last 28 days (${Math.round((activeDays / 28) * 100)}%)`,
  });

  // Most-skipped day of week
  const skipsByDay: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  dates28.forEach((d) => {
    if (!workoutDates.has(d)) skipsByDay[new Date(d + 'T12:00:00').getDay()]++;
  });
  const mostSkipped = (Object.entries(skipsByDay) as [string, number][]).reduce((a, b) =>
    b[1] > a[1] ? b : a,
  );
  const DAY_NAMES = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
  if (Number(mostSkipped[1]) > 0) {
    insights.push({
      type: 'skip_day',
      icon: '📅',
      message: `You most often skip ${DAY_NAMES[Number(mostSkipped[0])]}`,
    });
  }

  // Favourite workout type
  const typeCounts: Record<string, number> = {};
  sessions.forEach((s) => {
    const t = workoutTypeFromId(s.workoutId);
    if (t) typeCounts[t] = (typeCounts[t] ?? 0) + 1;
  });
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
  if (topType) {
    const emoji = topType[0] === 'home' ? '🏠' : topType[0] === 'travel' ? '✈️' : '🏋️';
    insights.push({
      type: 'preferred_type',
      icon: emoji,
      message: `Favourite environment: ${topType[0]} workouts (${topType[1]} sessions)`,
    });
  }

  // Total burn
  const totalCal = sessions.reduce((a, s) => a + s.caloriesBurned, 0);
  if (totalCal > 0) {
    insights.push({
      type: 'streak_stability',
      icon: '🔥',
      message: `${totalCal.toLocaleString()} kcal burned across all sessions`,
    });
  }

  return insights;
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <View className="flex-1 bg-brand-slate rounded-2xl p-4">
      <Text className="text-2xl mb-2">{icon}</Text>
      <Text className="text-white text-2xl font-bold">{value}</Text>
      <Text className="text-slate-400 text-xs mt-1">{label}</Text>
    </View>
  );
}

function ActivityCalendar({ sessions }: { sessions: WorkoutSession[] }) {
  const today = dateString(0);
  const dates = last28Dates();
  const workoutDates = new Set(sessions.filter((s) => s.completed).map((s) => s.date));
  const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Determine what day of week the first date falls on so the grid aligns
  const firstDayOfWeek = new Date(dates[0] + 'T12:00:00').getDay();

  // Build rows of 7 starting from Sunday alignment
  const rows: (string | null)[][] = [];
  let row: (string | null)[] = Array(firstDayOfWeek).fill(null);
  dates.forEach((d) => {
    row.push(d);
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  });
  if (row.length > 0) {
    while (row.length < 7) row.push(null);
    rows.push(row);
  }

  return (
    <View className="bg-brand-slate rounded-3xl p-5 mb-4">
      <Text className="text-white text-base font-bold mb-4">Activity — last 28 days</Text>

      {/* Day labels */}
      <View className="flex-row mb-2">
        {DAY_LABELS.map((l) => (
          <View key={l} className="flex-1 items-center">
            <Text className="text-slate-500 text-xs">{l}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {rows.map((row, ri) => (
        <View key={ri} className="flex-row mb-2">
          {row.map((d, ci) => {
            if (!d) return <View key={ci} className="flex-1 mx-0.5" />;
            const active = workoutDates.has(d);
            const isToday = d === today;
            return (
              <View key={ci} className="flex-1 items-center mx-0.5">
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: active ? '#22c55e' : '#0f172a',
                    borderWidth: isToday ? 2 : 0,
                    borderColor: isToday ? '#f97316' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {active && <Text style={{ fontSize: 10 }}>✓</Text>}
                </View>
              </View>
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View className="flex-row gap-4 mt-3 justify-end">
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded-full bg-green-500" />
          <Text className="text-slate-400 text-xs">Workout</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View
            style={{
              width: 12, height: 12, borderRadius: 6,
              borderWidth: 2, borderColor: '#f97316',
            }}
          />
          <Text className="text-slate-400 text-xs">Today</Text>
        </View>
      </View>
    </View>
  );
}

type ChartMode = 'calories' | 'duration';

function WeeklyChart({ sessions }: { sessions: WorkoutSession[] }) {
  const [mode, setMode] = useState<ChartMode>('calories');
  const stats = buildDayStats(sessions, last7Dates());
  const values = stats.map((s) => (mode === 'calories' ? s.calories : s.durationMin));
  const maxVal = Math.max(...values, 1);

  return (
    <View className="bg-brand-slate rounded-3xl p-5 mb-4">
      {/* Header + toggle */}
      <View className="flex-row items-center justify-between mb-5">
        <Text className="text-white text-base font-bold">Last 7 days</Text>
        <View className="flex-row bg-brand-navy rounded-xl overflow-hidden">
          {(['calories', 'duration'] as ChartMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              className={`px-3 py-1.5 ${mode === m ? 'bg-brand-orange' : ''}`}
              activeOpacity={0.8}
            >
              <Text
                className={`text-xs font-semibold ${mode === m ? 'text-white' : 'text-slate-400'}`}
              >
                {m === 'calories' ? 'Calories' : 'Minutes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bars */}
      <View className="flex-row items-end gap-1.5" style={{ height: 100 }}>
        {stats.map((s) => {
          const val = mode === 'calories' ? s.calories : s.durationMin;
          const barH = maxVal > 0 ? Math.max((val / maxVal) * 88, val > 0 ? 6 : 0) : 0;
          const isToday = s.date === dateString(0);
          return (
            <View key={s.date} className="flex-1 items-center justify-end">
              {val > 0 && (
                <Text className="text-slate-500 text-xs mb-1">{val}</Text>
              )}
              <View
                style={{
                  width: '100%',
                  height: barH,
                  borderRadius: 4,
                  backgroundColor: isToday ? '#f97316' : s.hasWorkout ? '#22c55e' : '#1e293b',
                }}
              />
              <Text className="text-slate-500 text-xs mt-1.5">{dayLabel(s.date)}</Text>
            </View>
          );
        })}
      </View>

      <Text className="text-slate-500 text-xs mt-3 text-right">
        {mode === 'calories' ? 'kcal per day' : 'minutes per day'}
      </Text>
    </View>
  );
}

function InsightsSection({ sessions, streak }: { sessions: WorkoutSession[]; streak: Streak }) {
  const insights = computeInsights(sessions);

  if (insights.length === 0) {
    return (
      <View className="bg-brand-slate rounded-3xl p-5 mb-4">
        <Text className="text-white text-base font-bold mb-2">Pattern insights</Text>
        <Text className="text-slate-400 text-sm">
          Complete a few workouts to unlock personalised insights.
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-brand-slate rounded-3xl p-5 mb-4">
      <Text className="text-white text-base font-bold mb-4">Pattern insights</Text>
      <View className="gap-3">
        {insights.map((ins) => (
          <View key={ins.type} className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-xl bg-brand-navy items-center justify-center">
              <Text className="text-lg">{ins.icon}</Text>
            </View>
            <Text className="text-slate-300 text-sm flex-1">{ins.message}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function StreakHistorySection({ streak }: { streak: Streak }) {
  const records = [...streak.history].reverse().slice(0, 5);

  return (
    <View className="bg-brand-slate rounded-3xl p-5 mb-4">
      <Text className="text-white text-base font-bold mb-4">Streak history</Text>
      {records.length === 0 ? (
        <Text className="text-slate-400 text-sm">
          No past streaks yet — keep going and this will fill up.
        </Text>
      ) : (
        <View className="gap-2">
          {records.map((rec, i) => (
            <View
              key={i}
              className="flex-row items-center justify-between py-2 border-b border-brand-navy"
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">🔥</Text>
                <Text className="text-white font-semibold">{rec.length} days</Text>
              </View>
              {rec.endDate ? (
                <Text className="text-slate-400 text-xs">ended {shortDate(rec.endDate)}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function WeeklyReviewCTA() {
  return (
    <TouchableOpacity
      onPress={() => router.push('/weekly-review')}
      activeOpacity={0.85}
      className="bg-brand-slate rounded-3xl p-5 mb-4"
    >
      <View className="flex-row items-center gap-4">
        <View className="w-12 h-12 bg-orange-500/20 rounded-2xl items-center justify-center">
          <Text className="text-2xl">🤖</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-base">Weekly AI review</Text>
          <Text className="text-slate-400 text-sm mt-0.5">
            Get a personalised summary of your week
          </Text>
        </View>
        <Text className="text-slate-500 text-lg">›</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const sessions = useWorkoutStore((s) => s.sessions);
  const streak = useStreakStore((s) => s.streak);
  const profile = useUserStore((s) => s.profile);

  const completedSessions = sessions.filter((s) => s.completed);
  const totalMinutes = completedSessions.reduce((a, s) => a + s.durationMin, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalCal = completedSessions.reduce((a, s) => a + s.caloriesBurned, 0);

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="pt-4 pb-6">
          <Text className="text-white text-2xl font-bold">Progress</Text>
          <Text className="text-slate-400 text-sm mt-1">
            {profile?.name?.trim().split(' ')[0] ?? 'Your'}'s stats
          </Text>
        </View>

        {/* Summary stats 2×2 */}
        <View className="flex-row gap-3 mb-3">
          <StatCard icon="🔥" value={String(streak.current)} label="Current streak" />
          <StatCard icon="🏆" value={String(streak.longest)} label="Longest streak" />
        </View>
        <View className="flex-row gap-3 mb-4">
          <StatCard icon="💪" value={String(completedSessions.length)} label="Total workouts" />
          <StatCard icon="⏱" value={totalHours} label="Total hours" />
        </View>

        <ActivityCalendar sessions={completedSessions} />
        <WeeklyChart sessions={completedSessions} />
        <InsightsSection sessions={completedSessions} streak={streak} />
        <StreakHistorySection streak={streak} />
        <WeeklyReviewCTA />
      </ScrollView>
    </SafeAreaView>
  );
}

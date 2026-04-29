import { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/useUserStore';
import { useStreakStore } from '@/store/useStreakStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useLLMCacheStore } from '@/store/useLLMCacheStore';
import { useProgressionStore, computeBlock } from '@/store/useProgressionStore';
import { StreakWidget } from '@/components/home/StreakWidget';
import { ProteinRing } from '@/components/home/ProteinRing';
import { WorkoutCard } from '@/components/home/WorkoutCard';
import { BenchmarkBadge } from '@/components/home/BenchmarkBadge';
import BlockUnlockBanner from '@/components/home/BlockUnlockBanner';
import { MOTIVATION_MESSAGES, getRandomMotivation } from '@/data/motivationCache';
import { GROQ_DAILY_CALL_LIMIT, TTL_MOTIVATION } from '@/utils/constants';
import { todayString } from '@/utils/streak';
import type { Goal } from '@/types/models';
import type { Block } from '@/store/useProgressionStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function shortDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

function daysSince(lastDate: string | null): number {
  if (!lastDate) return -1;
  const today = new Date();
  const last = new Date(lastDate + 'T12:00:00');
  return Math.floor((today.getTime() - last.getTime()) / 86400000);
}

function contextString(name: string, goal: Goal, daysSinceWorkout: number, streakCurrent: number, streakLongest: number): string {
  const situation =
    daysSinceWorkout === 0 ? `I worked out today (${streakCurrent}-day streak).`
    : daysSinceWorkout === 1 ? `I missed yesterday. My streak is ${streakCurrent} days.`
    : daysSinceWorkout >= 2 ? `I haven't worked out in ${daysSinceWorkout} days. My current streak is ${streakCurrent}.`
    : `I'm just getting started.`;

  const goalLabel: Record<Goal, string> = {
    lose_weight: 'lose weight',
    build_muscle: 'build muscle',
    stay_active: 'stay active',
    stress_relief: 'manage stress',
  };

  return `My name is ${name}. My fitness goal is to ${goalLabel[goal]}. ${situation} My best streak was ${streakLongest} days. It's ${timeOfDay()}.`;
}

function fallbackForContext(daysSinceWorkout: number, goal: Goal): string {
  if (daysSinceWorkout <= 0) {
    const pool = MOTIVATION_MESSAGES.slice(60, 90);
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (daysSinceWorkout === 1) return MOTIVATION_MESSAGES[Math.floor(Math.random() * 10)];
  if (daysSinceWorkout >= 2) return MOTIVATION_MESSAGES[10 + Math.floor(Math.random() * 10)];
  if (goal === 'stress_relief') return MOTIVATION_MESSAGES[51];
  return getRandomMotivation();
}

const CURATED = [
  { label: '⚡ Quick hit',  message: "Start. That's the whole plan." },
  { label: '🧠 Mindset',   message: "You are someone who works out. Today just needs a reminder of that." },
  { label: '😓 Low energy', message: "You don't need energy to start. You get energy by starting." },
  { label: '✈️ Travelling', message: "Travel breaks routine, not progress. A short workout in a new place is still a workout." },
  { label: '😤 Stressed',  message: "You can't control what's stressing you out. You can control whether you move your body today." },
  { label: '💪 Streak',    message: "Losing a streak is painful. But the identity you built doing the streak — that's still yours." },
  { label: '🌅 Morning',   message: "Starting the day with movement changes the whole shape of the day. Give it 10 minutes." },
];

async function fetchMotivationMessage(
  context: string,
  cacheKey: string,
  cacheGet: (k: string) => string | null,
  cacheSet: (k: string, v: string, ttl: number) => void,
  isGroqBudgetAvailable: (limit: number) => boolean,
  incrementGroqCalls: () => void,
): Promise<{ text: string; fromCache: boolean; fromFallback: boolean }> {
  const cached = cacheGet(cacheKey);
  if (cached) return { text: cached, fromCache: true, fromFallback: false };

  if (!isGroqBudgetAvailable(GROQ_DAILY_CALL_LIMIT)) return { text: '', fromCache: false, fromFallback: true };

  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) return { text: '', fromCache: false, fromFallback: true };

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a supportive fitness coach. Write one motivational message — direct, warm, not cheesy. Maximum 3 sentences. No hashtags or emojis.' },
          { role: 'user', content: context },
        ],
        max_tokens: 120,
        temperature: 0.85,
      }),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content?.trim() ?? '';
    if (!text) throw new Error('empty');
    incrementGroqCalls();
    cacheSet(cacheKey, text, TTL_MOTIVATION);
    return { text, fromCache: false, fromFallback: false };
  } catch {
    return { text: '', fromCache: false, fromFallback: true };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DailyMessageCard({ message, loading, fromCache, fromFallback, onRefresh, canRefresh }: {
  message: string | null;
  loading: boolean;
  fromCache: boolean;
  fromFallback: boolean;
  onRefresh(): void;
  canRefresh: boolean;
}) {
  return (
    <View className="bg-brand-slate rounded-3xl p-6 mb-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
          Today's message
        </Text>
        {fromCache && (
          <View className="bg-blue-500/20 rounded-lg px-2 py-0.5">
            <Text className="text-blue-300 text-xs">cached</Text>
          </View>
        )}
        {fromFallback && (
          <View className="bg-slate-600/40 rounded-lg px-2 py-0.5">
            <Text className="text-slate-400 text-xs">offline</Text>
          </View>
        )}
      </View>
      <Text className="text-brand-orange text-5xl font-bold leading-none mb-2" style={{ opacity: 0.4 }}>"</Text>
      {loading ? (
        <View className="items-center py-8">
          <ActivityIndicator color="#f97316" />
          <Text className="text-slate-400 text-sm mt-3">Personalising your message…</Text>
        </View>
      ) : (
        <Text className="text-white text-lg leading-8 font-medium mb-6">{message ?? ''}</Text>
      )}
      {canRefresh && !loading && (
        <TouchableOpacity onPress={onRefresh} activeOpacity={0.7} className="flex-row items-center gap-2">
          <Text className="text-brand-orange text-sm font-semibold">↺ New message</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StreakStatusCard({ streakCurrent, workedOutToday, hasInsurance, daysSinceWorkout }: {
  streakCurrent: number;
  workedOutToday: boolean;
  hasInsurance: boolean;
  daysSinceWorkout: number;
}) {
  if (workedOutToday) {
    return (
      <View className="bg-green-500/15 border border-green-500/30 rounded-2xl p-4 mb-4 flex-row items-center gap-3">
        <Text className="text-2xl">✅</Text>
        <View>
          <Text className="text-green-400 font-bold">You showed up today</Text>
          <Text className="text-slate-400 text-sm mt-0.5">
            {streakCurrent > 0 ? `${streakCurrent}-day streak and counting 🔥` : 'Day 1 — the hardest one is done'}
          </Text>
        </View>
      </View>
    );
  }

  if (streakCurrent > 0 && daysSinceWorkout <= 1) {
    return (
      <View className={`rounded-2xl p-4 mb-4 flex-row items-center gap-3 ${hasInsurance ? 'bg-blue-500/15 border border-blue-500/30' : 'bg-orange-500/15 border border-orange-500/30'}`}>
        <Text className="text-2xl">{hasInsurance ? '🛡️' : '⚠️'}</Text>
        <View className="flex-1">
          <Text className={`font-bold ${hasInsurance ? 'text-blue-300' : 'text-orange-400'}`}>
            {hasInsurance ? `${streakCurrent}-day streak is protected` : `${streakCurrent}-day streak at risk`}
          </Text>
          <Text className="text-slate-400 text-sm mt-0.5">
            {hasInsurance ? 'Insurance covers today if you miss' : 'Work out today to keep it alive'}
          </Text>
        </View>
      </View>
    );
  }

  if (daysSinceWorkout >= 2) {
    return (
      <View className="bg-brand-slate rounded-2xl p-4 mb-4 flex-row items-center gap-3">
        <Text className="text-2xl">🌱</Text>
        <View>
          <Text className="text-white font-bold">Fresh start available</Text>
          <Text className="text-slate-400 text-sm mt-0.5">{daysSinceWorkout} days since your last session — today is day 1</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-brand-slate rounded-2xl p-4 mb-4 flex-row items-center gap-3">
      <Text className="text-2xl">🚀</Text>
      <View>
        <Text className="text-white font-bold">Start your first streak</Text>
        <Text className="text-slate-400 text-sm mt-0.5">Every streak starts with a single workout</Text>
      </View>
    </View>
  );
}

function QuickStartSection({ workedOutToday }: { workedOutToday: boolean }) {
  if (workedOutToday) return null;
  const options = [
    { id: 'travel-one-minute', label: '1-Min Micro', sub: 'Streak saver', emoji: '⚡' },
    { id: 'travel-morning-5min', label: '5-Min Boost', sub: 'Quick energy', emoji: '🚀' },
    { id: 'home-mobility', label: 'Mobility', sub: '20 min · easy', emoji: '🧘' },
  ];
  return (
    <View className="mb-4">
      <Text className="text-white text-base font-bold mb-3">Just start somewhere</Text>
      <View className="flex-row gap-3">
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            onPress={() => router.push(`/workout/${opt.id}` as any)}
            activeOpacity={0.8}
            className="flex-1 bg-brand-slate rounded-2xl p-3.5 items-center"
          >
            <Text className="text-2xl mb-1.5">{opt.emoji}</Text>
            <Text className="text-white text-xs font-bold text-center">{opt.label}</Text>
            <Text className="text-slate-500 text-xs text-center mt-0.5">{opt.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function InspirationRow() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <View className="mb-4">
      <Text className="text-white text-base font-bold mb-3">Browse inspiration</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 4 }}>
        {CURATED.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setExpanded(expanded === i ? null : i)}
            activeOpacity={0.8}
            className="bg-brand-slate rounded-2xl p-4 mr-3"
            style={{ width: 200 }}
          >
            <Text className="text-xs font-semibold text-brand-orange mb-2">{item.label}</Text>
            <Text className="text-slate-300 text-sm leading-5" numberOfLines={expanded === i ? undefined : 3}>
              {item.message}
            </Text>
            {expanded !== i && <Text className="text-slate-500 text-xs mt-1">tap to expand</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const profile = useUserStore((s) => s.profile);
  const streak = useStreakStore((s) => s.streak);
  const checkStreak = useStreakStore((s) => s.checkStreak);
  const sessions = useWorkoutStore((s) => s.sessions);
  const hasTodaySession = useWorkoutStore((s) => s.hasTodaySession);
  const resetDailyLogIfNewDay = useNutritionStore((s) => s.resetDailyLogIfNewDay);
  const { get: cacheGet, set: cacheSet, isGroqBudgetAvailable, incrementGroqCalls } = useLLMCacheStore();
  const { hasSeenUnlock, markUnlockSeen } = useProgressionStore();

  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [fromFallback, setFromFallback] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const workedOutToday = hasTodaySession();
  const days = daysSince(streak.lastWorkoutDate);
  const hasInsurance = streak.streakInsuranceCount > 0;
  const goal = profile?.goal ?? 'stay_active';
  const name = profile?.name?.trim().split(' ')[0] ?? 'there';
  const block = computeBlock(sessions.length, streak.longest);
  const showDiscoveryCard = block > 1 && !hasSeenUnlock(block);

  const context = contextString(name, goal, days, streak.current, streak.longest);
  const cacheKey = `mot:${goal}:${Math.max(days, 0)}:${todayString()}:${refreshCount}`;

  async function loadMessage() {
    setLoading(true);
    const result = await fetchMotivationMessage(context, cacheKey, cacheGet, cacheSet, isGroqBudgetAvailable, incrementGroqCalls);
    if (result.fromFallback || !result.text) {
      setMessage(fallbackForContext(days, goal));
      setFromCache(false);
      setFromFallback(true);
    } else {
      setMessage(result.text);
      setFromCache(result.fromCache);
      setFromFallback(false);
    }
    setLoading(false);
  }

  useEffect(() => { loadMessage(); }, [refreshCount]);

  async function onRefresh() {
    setRefreshing(true);
    checkStreak();
    resetDailyLogIfNewDay();
    setTimeout(() => setRefreshing(false), 500);
  }

  function handleDismissCard() {
    markUnlockSeen(block as Block);
  }

  const canRefresh = isGroqBudgetAvailable(GROQ_DAILY_CALL_LIMIT - 2);
  const contentMaxWidth = isDesktop ? 680 : undefined;

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
      >
        <View style={{ maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: 20, paddingBottom: 32 }}>

          {/* Header */}
          <View className="pt-4 pb-5 flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-slate-400 text-sm">{shortDate()}</Text>
              <Text className="text-white text-2xl font-bold mt-1">{greeting()}, {name} 👋</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/settings')} hitSlop={12} className="mt-1" activeOpacity={0.7}>
              <Ionicons name="settings-outline" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Contextual feature discovery — appears once at each milestone, never blocks access */}
          {showDiscoveryCard && <BlockUnlockBanner block={block as Block} onDismiss={handleDismissCard} />}

          {/* 1 — Motivation hero (always first) */}
          <DailyMessageCard
            message={message}
            loading={loading}
            fromCache={fromCache}
            fromFallback={fromFallback}
            onRefresh={() => setRefreshCount((c) => c + 1)}
            canRefresh={canRefresh}
          />

          {/* 2 — Streak status */}
          <StreakStatusCard
            streakCurrent={streak.current}
            workedOutToday={workedOutToday}
            hasInsurance={hasInsurance}
            daysSinceWorkout={days}
          />

          {/* 3 — Streak widget + workout card */}
          <StreakWidget />
          <WorkoutCard />

          {/* 4 — Quick starts (if not worked out today) */}
          <QuickStartSection workedOutToday={workedOutToday} />

          {/* 5 — Protein ring (block 2+) */}
          {block >= 2 && <ProteinRing />}

          {/* 6 — Benchmark badge (block 4+) */}
          {block >= 4 && <BenchmarkBadge />}

          {/* 7 — Inspiration browse */}
          <InspirationRow />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

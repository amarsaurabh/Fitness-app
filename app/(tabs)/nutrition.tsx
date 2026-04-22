import { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useUserStore } from '@/store/useUserStore';
import { useLLMCacheStore } from '@/store/useLLMCacheStore';
import { getCulturalFoods, FOOD_CULTURE_LABELS, FOOD_CULTURE_EMOJI } from '@/data/culturalFoods';
import { getMealSuggestions } from '@/services/llm/groqService';
import type { CulturalFood, FridgeItem } from '@/types/models';

// ─── Protein Ring ────────────────────────────────────────────────────────────

const RING = 140;
const STROKE = 12;
const RADIUS = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function ProteinProgress() {
  const todayProteinG = useNutritionStore((s) => s.todayProteinG);
  const logProtein = useNutritionStore((s) => s.logProtein);
  const dailyProteinGoal = useUserStore((s) => s.dailyProteinGoal);

  const logged = todayProteinG();
  const goal = dailyProteinGoal();
  const progress = Math.min(goal > 0 ? logged / goal : 0, 1);
  const offset = CIRC * (1 - progress);
  const pct = Math.round(progress * 100);
  const remaining = Math.max(goal - Math.round(logged), 0);

  const color = progress >= 0.8 ? '#22c55e' : progress >= 0.4 ? '#f97316' : '#ef4444';

  return (
    <View className="bg-brand-slate rounded-3xl p-5 mb-4">
      <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">
        Today's protein
      </Text>

      <View className="flex-row items-center gap-6 mb-5">
        {/* Ring */}
        <View style={{ width: RING, height: RING }}>
          <Svg width={RING} height={RING}>
            <Circle
              cx={RING / 2} cy={RING / 2} r={RADIUS}
              stroke="#334155" strokeWidth={STROKE} fill="none"
            />
            <Circle
              cx={RING / 2} cy={RING / 2} r={RADIUS}
              stroke={color} strokeWidth={STROKE} fill="none"
              strokeDasharray={`${CIRC} ${CIRC}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING / 2}, ${RING / 2}`}
            />
          </Svg>
          <View
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text className="text-white text-2xl font-bold">{Math.round(logged)}g</Text>
            <Text className="text-slate-500 text-xs">of {goal}g</Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-1">
          <Text className="text-white text-4xl font-bold">{pct}%</Text>
          <Text className="text-slate-400 text-sm mt-1">of daily goal</Text>
          <View className="mt-3 h-px bg-brand-navy" />
          <Text className="text-slate-400 text-sm mt-3">
            {remaining > 0 ? `${remaining}g to go` : 'Goal reached! 🎉'}
          </Text>
        </View>
      </View>

      {/* Quick log */}
      <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">
        Quick log
      </Text>
      <View className="flex-row gap-2">
        {[10, 20, 30, 50].map((g) => (
          <TouchableOpacity
            key={g}
            onPress={() => logProtein(g)}
            activeOpacity={0.8}
            className="flex-1 bg-brand-navy rounded-xl py-3 items-center"
          >
            <Text className="text-brand-orange font-bold text-sm">+{g}g</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Calorie Progress ────────────────────────────────────────────────────────

function CalorieProgress() {
  const todayCaloriesKcal = useNutritionStore((s) => s.todayCaloriesKcal);
  const logCalories = useNutritionStore((s) => s.logCalories);
  const dailyCalorieGoal = useUserStore((s) => s.dailyCalorieGoal);

  const logged = todayCaloriesKcal();
  const goal = dailyCalorieGoal();
  const progress = Math.min(goal > 0 ? logged / goal : 0, 1);
  const remaining = Math.max(goal - Math.round(logged), 0);
  const pct = Math.round(progress * 100);

  const barColor = progress >= 1 ? '#22c55e' : progress >= 0.5 ? '#f97316' : '#ef4444';

  return (
    <View className="bg-brand-slate rounded-3xl p-5 mb-4">
      <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">
        Today's calories
      </Text>

      <View className="flex-row items-end justify-between mb-3">
        <Text className="text-white text-4xl font-bold">{Math.round(logged)}</Text>
        <Text className="text-slate-400 text-sm mb-1">of {goal} kcal · {pct}%</Text>
      </View>

      <View className="h-2.5 bg-brand-navy rounded-full mb-2 overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${progress * 100}%`, backgroundColor: barColor }}
        />
      </View>

      <Text className="text-slate-400 text-xs mb-5">
        {remaining > 0 ? `${remaining} kcal remaining` : 'Daily goal reached! 🎉'}
      </Text>

      <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">
        Quick log
      </Text>
      <View className="flex-row gap-2">
        {[200, 400, 600, 750].map((k) => (
          <TouchableOpacity
            key={k}
            onPress={() => logCalories(k)}
            activeOpacity={0.8}
            className="flex-1 bg-brand-navy rounded-xl py-3 items-center"
          >
            <Text className="text-brand-orange font-bold text-sm">+{k}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Cultural Food Grid ───────────────────────────────────────────────────────

function FoodChip({
  food,
  onLog,
  justLogged,
}: {
  food: CulturalFood;
  onLog: () => void;
  justLogged: boolean;
}) {
  const proteinPerServing = Math.round((food.proteinPer100g * food.servingG) / 100);

  return (
    <TouchableOpacity
      onPress={onLog}
      activeOpacity={0.8}
      className={`rounded-2xl p-3.5 mr-3 w-36 ${justLogged ? 'bg-green-500/20 border border-green-500/40' : 'bg-brand-slate'}`}
    >
      <Text className="text-white text-sm font-semibold leading-5 mb-1" numberOfLines={2}>
        {food.name}
      </Text>
      <Text className="text-brand-orange text-xs font-bold">{proteinPerServing}g protein</Text>
      <Text className="text-slate-500 text-xs mt-0.5">{food.servingG}g serving</Text>
      {justLogged && (
        <Text className="text-green-400 text-xs font-bold mt-1">✓ Logged!</Text>
      )}
    </TouchableOpacity>
  );
}

function CulturalFoodsSection() {
  const profile = useUserStore((s) => s.profile);
  const logProtein = useNutritionStore((s) => s.logProtein);
  const [loggedFoods, setLoggedFoods] = useState<Set<string>>(new Set());

  const culture = profile?.foodCulture ?? 'global';
  const foods = getCulturalFoods(culture);
  const label = FOOD_CULTURE_LABELS[culture];
  const emoji = FOOD_CULTURE_EMOJI[culture];

  function handleLog(food: CulturalFood) {
    const grams = Math.round((food.proteinPer100g * food.servingG) / 100);
    logProtein(grams);
    setLoggedFoods((prev) => new Set([...prev, food.name]));
    setTimeout(() => {
      setLoggedFoods((prev) => {
        const next = new Set(prev);
        next.delete(food.name);
        return next;
      });
    }, 2000);
  }

  return (
    <View className="mb-4">
      <Text className="text-white text-base font-bold px-0 mb-3">
        {emoji} {label} protein sources
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 4 }}
      >
        {foods.map((food) => (
          <FoodChip
            key={food.name}
            food={food}
            onLog={() => handleLog(food)}
            justLogged={loggedFoods.has(food.name)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Fridge Manager + AI Suggestions ─────────────────────────────────────────

function parseMealText(text: string): React.ReactNode[] {
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

function FridgeSection() {
  const { fridgeItems, addFridgeItem, removeFridgeItem } = useNutritionStore();
  const profile = useUserStore((s) => s.profile);
  const dailyProteinGoal = useUserStore((s) => s.dailyProteinGoal);
  const { get: cacheGet, set: cacheSet, isGroqBudgetAvailable, incrementGroqCalls } =
    useLLMCacheStore();

  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [fromFallback, setFromFallback] = useState(false);

  function handleAdd() {
    const name = input.trim();
    if (!name) return;
    const item: FridgeItem = {
      id: String(Date.now()),
      name,
      category: 'other',
      proteinPer100g: 0,
    };
    addFridgeItem(item);
    setInput('');
    setSuggestions(null);
  }

  async function handleGetSuggestions() {
    if (fridgeItems.length === 0) return;
    setLoading(true);
    setSuggestions(null);
    try {
      const result = await getMealSuggestions(
        fridgeItems.map((i) => i.name),
        profile?.foodCulture ?? 'global',
        dailyProteinGoal(),
        cacheGet,
        cacheSet,
        isGroqBudgetAvailable,
        incrementGroqCalls,
      );
      setSuggestions(result.text);
      setFromCache(result.fromCache);
      setFromFallback(result.fromFallback);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="mb-4">
      {/* Fridge card */}
      <View className="bg-brand-slate rounded-3xl p-5 mb-3">
        <Text className="text-white text-base font-bold mb-1">🧊 Your fridge</Text>
        <Text className="text-slate-400 text-xs mb-4">
          Add ingredients — we'll suggest meals around your culture
        </Text>

        {/* Input */}
        <View className="flex-row gap-2 mb-4">
          <TextInput
            className="flex-1 bg-brand-navy text-white rounded-xl px-4 py-3 text-sm"
            placeholder="e.g. eggs, chicken, tofu…"
            placeholderTextColor="#475569"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={handleAdd}
            disabled={!input.trim()}
            className={`rounded-xl px-4 py-3 items-center justify-center ${input.trim() ? 'bg-brand-orange' : 'bg-brand-navy'}`}
            activeOpacity={0.8}
          >
            <Text className={`font-bold text-sm ${input.trim() ? 'text-white' : 'text-slate-600'}`}>
              Add
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fridge items */}
        {fridgeItems.length > 0 ? (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {fridgeItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  removeFridgeItem(item.id);
                  setSuggestions(null);
                }}
                className="flex-row items-center gap-1.5 bg-brand-navy rounded-xl px-3 py-1.5"
                activeOpacity={0.7}
              >
                <Text className="text-slate-300 text-sm">{item.name}</Text>
                <Text className="text-slate-500 text-xs">×</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text className="text-slate-600 text-sm mb-4">
            No items yet — add what you have at home
          </Text>
        )}

        {/* AI button */}
        <TouchableOpacity
          onPress={handleGetSuggestions}
          disabled={fridgeItems.length === 0 || loading}
          activeOpacity={0.85}
          className={`rounded-2xl py-4 items-center flex-row justify-center gap-2 ${
            fridgeItems.length > 0 ? 'bg-brand-orange' : 'bg-brand-navy'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-lg">🤖</Text>
          )}
          <Text
            className={`font-bold text-base ${fridgeItems.length > 0 ? 'text-white' : 'text-slate-600'}`}
          >
            {loading ? 'Thinking…' : 'Get AI meal ideas'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Suggestions card */}
      {suggestions && (
        <View className="bg-brand-slate rounded-3xl p-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-base font-bold">Meal ideas for you</Text>
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
          {parseMealText(suggestions)}
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NutritionScreen() {
  const profile = useUserStore((s) => s.profile);
  const firstName = profile?.name?.trim().split(' ')[0] ?? 'there';

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="pt-4 pb-6">
          <Text className="text-white text-2xl font-bold">Nutrition</Text>
          <Text className="text-slate-400 text-sm mt-1">
            {firstName}'s protein tracker
          </Text>
        </View>

        <ProteinProgress />
        <CalorieProgress />
        <CulturalFoodsSection />
        <FridgeSection />
      </ScrollView>
    </SafeAreaView>
  );
}

import type { FoodCulture } from '@/types/models';
import { FOOD_CULTURE_LABELS } from '@/data/culturalFoods';
import { GROQ_DAILY_CALL_LIMIT, TTL_FRIDGE_MEALS } from '@/utils/constants';
import { buildFridgeCacheKey } from '@/utils/hash';

// Static fallbacks — used when budget is exhausted or API unavailable
const FALLBACK: Record<FoodCulture, string> = {
  'south-asian':
    '**Dal & Soya Bowl** — ~35g protein\nCook dal, stir in soya chunks, add turmeric. Ready in 15 mins.\n\n**Paneer Scramble** — ~28g protein\nCrumble paneer, stir-fry with onion and tomato, add eggs for extra.\n\n**Chickpea Chaat** — ~22g protein\nCanned chickpeas with yogurt, chaat masala, cucumber. No cooking needed.',
  'east-asian':
    '**Tofu & Edamame Bowl** — ~25g protein\nPan-fry tofu until golden, serve over rice with edamame and soy sauce.\n\n**Salmon Miso Bowl** — ~35g protein\nGrill salmon, serve with miso soup and steamed vegetables.\n\n**Natto Rice** — ~20g protein\nServe natto over warm rice with soy sauce and spring onion.',
  'latin':
    '**Black Bean & Egg Skillet** — ~28g protein\nSauté black beans with eggs, cumin, and salsa. Ready in 10 mins.\n\n**Quinoa Chicken Bowl** — ~45g protein\nCooked quinoa topped with grilled chicken, beans, avocado, lime.\n\n**Shrimp Tacos** — ~35g protein\nSeason shrimp with cumin, pan-fry, serve in tortillas with salsa.',
  'west-african':
    '**Suya Chicken Bowl** — ~40g protein\nMarinate chicken in suya spice, grill or pan-fry, serve with beans.\n\n**Egusi & Black-Eyed Peas** — ~30g protein\nSimmer egusi seeds with black-eyed peas and smoked fish.\n\n**Grilled Fish with Beans** — ~45g protein\nSeason tilapia with pepper spice, grill, serve with ewa agoyin.',
  'mediterranean':
    '**Greek Protein Plate** — ~40g protein\nGrilled chicken, hummus, feta, cucumber, tomato, pita bread.\n\n**Salmon & Lentil Bowl** — ~45g protein\nPan-sear salmon, serve over cooked lentils with olive oil and herbs.\n\n**Sardine Toast** — ~32g protein\nSardines on wholegrain toast with eggs and olive oil.',
  'middle-eastern':
    '**Shawarma Bowl** — ~40g protein\nSpiced chicken pan-cooked, served with hummus and labneh.\n\n**Ful Medames with Eggs** — ~30g protein\nHeat fava beans with cumin and olive oil, top with soft-boiled eggs.\n\n**Kofta & Tahini Plate** — ~35g protein\nLamb kofta with tahini sauce, parsley, flatbread.',
  'european':
    '**Chicken & Cottage Cheese Bowl** — ~50g protein\nGrilled chicken breast with cottage cheese, cucumber, and herbs.\n\n**Salmon & Quark Plate** — ~45g protein\nPan-sear salmon, serve with quark dip and rye crispbread.\n\n**High-Protein Scramble** — ~35g protein\n4 eggs scrambled with lean beef mince, spinach, Greek yogurt on the side.',
  'global':
    '**Chicken & Lentil Bowl** — ~45g protein\nGrilled chicken over lentils with olive oil, herbs, lemon juice.\n\n**Tuna & Chickpea Salad** — ~38g protein\nCanned tuna and chickpeas with olive oil, lemon, cucumber. 5 mins.\n\n**Egg & Yogurt Plate** — ~30g protein\nSoft-boiled eggs with Greek yogurt, cucumber sticks, edamame.',
};

export interface MealSuggestionsResult {
  text: string;
  fromCache: boolean;
  fromFallback: boolean;
}

export async function getMealSuggestions(
  fridgeItems: string[],
  foodCulture: FoodCulture,
  proteinGoal: number,
  cacheGet: (key: string) => string | null,
  cacheSet: (key: string, response: string, ttlMs: number) => void,
  isGroqBudgetAvailable: (limit: number) => boolean,
  incrementGroqCalls: () => void,
): Promise<MealSuggestionsResult> {
  const cacheKey = buildFridgeCacheKey(fridgeItems, foodCulture);

  const cached = cacheGet(cacheKey);
  if (cached) {
    return { text: cached, fromCache: true, fromFallback: false };
  }

  if (!isGroqBudgetAvailable(GROQ_DAILY_CALL_LIMIT)) {
    return { text: FALLBACK[foodCulture], fromCache: false, fromFallback: true };
  }

  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) {
    return { text: FALLBACK[foodCulture], fromCache: false, fromFallback: true };
  }

  try {
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
            content: `You are a concise nutrition assistant specialising in ${FOOD_CULTURE_LABELS[foodCulture]} cuisine.`,
          },
          {
            role: 'user',
            content: `I have these ingredients: ${fridgeItems.join(', ')}.
My daily protein goal is ${proteinGoal}g.

Suggest 3 quick high-protein meals using some of these ingredients.
Use this exact format for each:

**[Meal Name]** — ~Xg protein
[1–2 sentence cooking instruction]

Keep it brief. Favour ${FOOD_CULTURE_LABELS[foodCulture]} flavours.`,
          },
        ],
        max_tokens: 450,
        temperature: 0.7,
      }),
    });

    if (!res.ok) throw new Error(`Groq error ${res.status}`);

    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? '';
    incrementGroqCalls();
    cacheSet(cacheKey, text, TTL_FRIDGE_MEALS);
    return { text, fromCache: false, fromFallback: false };
  } catch {
    return { text: FALLBACK[foodCulture], fromCache: false, fromFallback: true };
  }
}

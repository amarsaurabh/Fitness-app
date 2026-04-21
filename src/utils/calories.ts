/**
 * MET-based calorie burn: kcal = MET × weight(kg) × duration(hours)
 * Accurate to ±25% — always display as an estimate.
 */
export function estimateCalories(
  met: number,
  weightKg: number,
  durationMin: number,
): number {
  return Math.round(met * weightKg * (durationMin / 60));
}

/**
 * Basal Metabolic Rate — Mifflin-St Jeor equation
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  isMale: boolean,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return isMale ? base + 5 : base - 161;
}

/**
 * Total Daily Energy Expenditure
 */
export function calculateTDEE(bmr: number, activityMultiplier: number): number {
  return Math.round(bmr * activityMultiplier);
}

/**
 * Daily protein goal in grams based on weight and goal multiplier
 */
export function calculateDailyProtein(
  weightKg: number,
  multiplier: number,
): number {
  return Math.round(weightKg * multiplier);
}

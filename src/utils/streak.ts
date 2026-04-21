import type { Streak } from '@/types/models';
import { MAX_STREAK_INSURANCE, STREAK_INSURANCE_RESET_DAY } from './constants';

export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function isStreakAlive(lastWorkoutDate: string | null): boolean {
  if (!lastWorkoutDate) return false;
  const today = todayString();
  const yesterday = yesterdayString();
  return lastWorkoutDate === today || lastWorkoutDate === yesterday;
}

export function shouldGrantInsurance(streak: Streak): boolean {
  const currentWeek = getISOWeek(new Date());
  return (
    streak.streakInsuranceCount < MAX_STREAK_INSURANCE &&
    streak.insuranceLastResetWeek === currentWeek
  );
}

export function applyInsurance(streak: Streak): Streak {
  if (streak.streakInsuranceCount <= 0) return streak;
  return {
    ...streak,
    streakInsuranceCount: streak.streakInsuranceCount - 1,
    lastWorkoutDate: yesterdayString(), // treat yesterday as worked out
  };
}

export function resetWeeklyInsurance(streak: Streak): Streak {
  const today = new Date();
  if (today.getDay() !== STREAK_INSURANCE_RESET_DAY) return streak;
  const currentWeek = getISOWeek(today);
  if (streak.insuranceLastResetWeek === currentWeek) return streak;
  return {
    ...streak,
    streakInsuranceCount: MAX_STREAK_INSURANCE,
    insuranceLastResetWeek: currentWeek,
  };
}

export function recordWorkoutToStreak(streak: Streak): Streak {
  const today = todayString();
  if (streak.lastWorkoutDate === today) return streak; // already recorded today

  const alive = isStreakAlive(streak.lastWorkoutDate);
  const newCurrent = alive ? streak.current + 1 : 1;
  const newLongest = Math.max(newCurrent, streak.longest);

  // If streak was broken before this workout, archive the old run
  const history = [...streak.history];
  if (!alive && streak.current > 0 && streak.lastWorkoutDate) {
    history.push({
      startDate: '', // we don't track start precisely — just length
      endDate: streak.lastWorkoutDate,
      length: streak.current,
    });
  }

  return {
    ...streak,
    current: newCurrent,
    longest: newLongest,
    lastWorkoutDate: today,
    history,
  };
}

export function checkAndBreakStreak(streak: Streak): Streak {
  if (!streak.lastWorkoutDate) return streak;
  if (isStreakAlive(streak.lastWorkoutDate)) return streak;

  // Try insurance first
  if (streak.streakInsuranceCount > 0) {
    return applyInsurance(streak);
  }

  // Streak broken
  const history = [...streak.history];
  if (streak.current > 0) {
    history.push({
      startDate: '',
      endDate: streak.lastWorkoutDate,
      length: streak.current,
    });
  }

  return {
    ...streak,
    current: 0,
    history,
  };
}

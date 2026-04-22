import type { WorkoutSession } from '@/types/models';
import {
  DIFFICULTY_ADJUST_WINDOW,
  DIFFICULTY_RAISE_WINDOW,
  DIFFICULTY_LOW_THRESHOLD,
  DIFFICULTY_HIGH_THRESHOLD,
} from './constants';
import { getWorkoutById } from '@/data/workouts';

function sessionCompletionRate(session: WorkoutSession): number {
  const workout = getWorkoutById(session.workoutId);
  if (!workout || workout.exerciseIds.length === 0) return 1;
  return session.exercisesCompleted.length / workout.exerciseIds.length;
}

export function computeNewDifficultyBias(
  sessions: WorkoutSession[],
  currentBias: -1 | 0 | 1,
): -1 | 0 | 1 {
  const completed = sessions.filter((s) => s.completed);
  if (completed.length === 0) return currentBias;

  // Lower difficulty if recent completion rate is poor
  const recentLow = completed.slice(0, DIFFICULTY_ADJUST_WINDOW);
  if (recentLow.length >= DIFFICULTY_ADJUST_WINDOW) {
    const avg = recentLow.reduce((a, s) => a + sessionCompletionRate(s), 0) / recentLow.length;
    if (avg < DIFFICULTY_LOW_THRESHOLD && currentBias > -1) {
      return (currentBias - 1) as -1 | 0 | 1;
    }
  }

  // Raise difficulty if recent completion rate is excellent
  const recentHigh = completed.slice(0, DIFFICULTY_RAISE_WINDOW);
  if (recentHigh.length >= DIFFICULTY_RAISE_WINDOW) {
    const avg = recentHigh.reduce((a, s) => a + sessionCompletionRate(s), 0) / recentHigh.length;
    if (avg > DIFFICULTY_HIGH_THRESHOLD && currentBias < 1) {
      return (currentBias + 1) as -1 | 0 | 1;
    }
  }

  return currentBias;
}

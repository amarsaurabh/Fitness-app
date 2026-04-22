import type { UserProfile } from '@/types/models';
import {
  scheduleNotification,
  cancelAllNotifications,
  requestPermissions,
  NOTIF_IDS,
} from './notificationService';

export async function applyNotificationSettings(profile: UserProfile): Promise<void> {
  if (!profile.notificationsEnabled) {
    await cancelAllNotifications();
    return;
  }

  const granted = await requestPermissions();
  if (!granted) return;

  const [hStr, mStr] = profile.proteinReminderTime.split(':');
  const hour = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10);
  if (isNaN(hour) || isNaN(minute)) return;

  // Daily protein reminder at user-specified time
  await scheduleNotification(
    NOTIF_IDS.PROTEIN_DAILY,
    '🥗 Protein check-in',
    'Log your protein to hit your daily goal.',
    { hour, minute, repeats: true },
  );

  // Evening streak saver at 8pm
  await scheduleNotification(
    NOTIF_IDS.STREAK_REMINDER('daily'),
    '🔥 Keep your streak alive!',
    "Haven't worked out yet? A quick 20-minute session counts.",
    { hour: 20, minute: 0, repeats: true },
  );

  // Sunday weekly review at 7pm (weekday 1 = Sunday in Expo)
  await scheduleNotification(
    NOTIF_IDS.WEEKLY_REVIEW,
    '📊 Weekly review ready',
    'See your fitness summary and AI action points for next week.',
    { weekday: 1, hour: 19, minute: 0, repeats: true },
  );
}

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export function setNotificationHandler() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleNotification(
  identifier: string,
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput,
): Promise<string> {
  if (Platform.OS === 'web') return identifier;
  await cancelNotification(identifier);
  return Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body, sound: false },
    trigger,
  });
}

export async function cancelNotification(identifier: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Notification identifiers
export const NOTIF_IDS = {
  STREAK_REMINDER: (date: string) => `streak-reminder-${date}`,
  PROTEIN_DAILY: 'protein-reminder-daily',
  WEEKLY_REVIEW: 'weekly-review-sunday',
} as const;

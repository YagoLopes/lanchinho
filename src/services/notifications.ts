import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DiaSemana, Dieta, Refeicao } from '../types/diet';
import { dayKeyToWeekday, parseTime, splitNotificationIds } from '@utils/time';

const MEAL_CATEGORY = 'meal-reminder';
const ALL_DAYS: DiaSemana[] = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerNotificationCategories = async () => {
  await Notifications.setNotificationCategoryAsync(MEAL_CATEGORY, [
    {
      identifier: 'MARK_DONE',
      buttonTitle: 'Comi agora',
    },
    {
      identifier: 'SNOOZE_10',
      buttonTitle: 'Soneca 10 min',
    },
  ]);
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  const settings = await Notifications.getPermissionsAsync();
  const alreadyGranted =
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('lanchinho-default', {
      name: 'Lanchinho',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#EA580C',
    });
  }

  if (alreadyGranted) {
    return true;
  }

  const { granted } = await Notifications.requestPermissionsAsync({
    ios: {
      allowBadge: false,
      allowSound: true,
      allowAlert: true,
    },
  });

  return granted;
};

export const cancelMealNotification = async (notificationId?: string) => {
  const ids = splitNotificationIds(notificationId);
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id))
  );
};

export const scheduleMealNotifications = async (
  dieta: Dieta,
  meal: Refeicao
) => {
  const { hour, minute } = parseTime(meal.horario);
  const days = meal.repetirEm.length ? meal.repetirEm : ALL_DAYS;
  const ids: string[] = [];

  for (const dayKey of days) {
    const weekday = dayKeyToWeekday(dayKey);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: meal.nome,
        body: `Hora do seu lanchinho em ${dieta.nome}`,
        data: {
          mealId: meal.id,
          dietId: dieta.id,
        },
        categoryIdentifier: MEAL_CATEGORY,
      },
      trigger: {
        weekday,
        hour,
        minute,
        repeats: true,
        channelId: Platform.OS === 'android' ? 'lanchinho-default' : undefined,
      },
    });
    ids.push(id);
  }

  return ids.join('|');
};

export const rescheduleMealNotification = async (
  dieta: Dieta,
  meal: Refeicao
) => {
  await cancelMealNotification(meal.notificationId);
  if (!meal.alarmeAtivo) return undefined;
  return scheduleMealNotifications(dieta, meal);
};

export const scheduleDietNotifications = async (dieta: Dieta) => {
  const tasks = dieta.dias.flatMap((dia) =>
    dia.refeicoes
      .filter((meal) => meal.alarmeAtivo)
      .map(async (meal) => ({
        mealId: meal.id,
        notificationId: await scheduleMealNotifications(dieta, meal),
      }))
  );
  const results = await Promise.all(tasks);
  return results.reduce<Record<string, string | undefined>>((acc, item) => {
    acc[item.mealId] = item.notificationId;
    return acc;
  }, {});
};

export const cancelDietNotifications = async (dieta: Dieta) => {
  const ids = new Set<string>();
  dieta.dias.forEach((dia) => {
    dia.refeicoes.forEach((meal) =>
      splitNotificationIds(meal.notificationId).forEach((id) => ids.add(id))
    );
  });
  await Promise.all(
    Array.from(ids).map((id) =>
      Notifications.cancelScheduledNotificationAsync(id)
    )
  );
};

export const rescheduleAllForActiveDiet = async (dieta: Dieta) => {
  await cancelDietNotifications(dieta);
  return scheduleDietNotifications(dieta);
};

export const scheduleSnoozeNotification = async (
  meal: Refeicao,
  minutes: number
) => {
  const trigger = new Date(Date.now() + minutes * 60 * 1000);
  return Notifications.scheduleNotificationAsync({
    content: {
      title: meal.nome,
      body: `Soneca de ${minutes} minutos concluida.`,
      data: { mealId: meal.id },
      categoryIdentifier: MEAL_CATEGORY,
    },
    trigger: {
      date: trigger,
      channelId: Platform.OS === 'android' ? 'lanchinho-default' : undefined,
    },
  });
};

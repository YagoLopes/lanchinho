import dayjs from 'dayjs';
import { DiaPlano, DiaSemana, Dieta, Refeicao } from '@types/diet';

type DayMeta = {
  key: DiaSemana;
  label: string;
  short: string;
  weekday: number; // expo weekday (1=sunday)
};

const DAY_KEY_ORDER: DiaSemana[] = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

export const DAYS_OF_WEEK: DayMeta[] = [
  { key: 'DOM', label: 'Domingo', short: 'Dom', weekday: 1 },
  { key: 'SEG', label: 'Segunda', short: 'Seg', weekday: 2 },
  { key: 'TER', label: 'Terca', short: 'Ter', weekday: 3 },
  { key: 'QUA', label: 'Quarta', short: 'Qua', weekday: 4 },
  { key: 'QUI', label: 'Quinta', short: 'Qui', weekday: 5 },
  { key: 'SEX', label: 'Sexta', short: 'Sex', weekday: 6 },
  { key: 'SAB', label: 'Sabado', short: 'Sab', weekday: 7 }
];

export const dayKeyToWeekday = (key: DiaSemana) => DAYS_OF_WEEK.find((day) => day.key === key)?.weekday ?? 1;

export const getDayLabel = (key: DiaSemana) => DAYS_OF_WEEK.find((day) => day.key === key)?.label ?? key;

export const parseTime = (value: string) => {
  const [hourStr = '0', minuteStr = '0'] = value.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  return { hour, minute };
};

export const isValidTime = (value: string) => {
  if (!/^[0-2]\d:[0-5]\d$/.test(value)) return false;
  const { hour, minute } = parseTime(value);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

export const formatHourMinute = (value: string) => {
  if (!isValidTime(value)) return value;
  const { hour, minute } = parseTime(value);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

export const getNextTriggerDate = (dayKey: DiaSemana, time: string, from = dayjs()) => {
  const { hour, minute } = parseTime(time);
  const triggerWeekday = dayKeyToWeekday(dayKey);
  const fromWeekday = from.day() === 0 ? 1 : from.day() + 1; // convert js sunday=0 to expo 1..7

  let target = from.hour(hour).minute(minute).second(0);
  if (fromWeekday !== triggerWeekday || !target.isAfter(from)) {
    let delta = triggerWeekday - fromWeekday;
    if (delta <= 0) delta += 7;
    target = target.add(delta, 'day');
  }

  return target.toDate();
};

export const getCurrentDayKey = (): DiaSemana => {
  const jsDay = dayjs().day();
  return DAY_KEY_ORDER[jsDay] ?? 'SEG';
};

export const getDateISO = (date = new Date()) => dayjs(date).format('YYYY-MM-DD');

export const sortMealsByTime = (meals: Refeicao[]) =>
  [...meals].sort((a, b) => (a.horario < b.horario ? -1 : a.horario > b.horario ? 1 : 0));

export const getMealsForDay = (dieta: Dieta | null, dayKey: DiaSemana): Refeicao[] => {
  if (!dieta) return [];
  const dayPlan = dieta.dias.find((dia) => dia.dia === dayKey);
  if (!dayPlan) return [];
  return sortMealsByTime(dayPlan.refeicoes);
};

export const flattenMeals = (dias: DiaPlano[]): Refeicao[] => {
  const map = new Map<string, Refeicao>();
  dias.forEach((dia) => {
    dia.refeicoes.forEach((meal) => {
      const existing = map.get(meal.id);
      if (existing) {
        existing.repetirEm = Array.from(new Set([...existing.repetirEm, dia.dia]));
        existing.notificationId = mergeNotificationIds(existing.notificationId, meal.notificationId);
      } else {
        map.set(meal.id, { ...meal, repetirEm: [...meal.repetirEm] });
      }
    });
  });
  return Array.from(map.values());
};

export const buildDayPlans = (meals: Refeicao[]): DiaPlano[] =>
  DAYS_OF_WEEK.map((day) => ({
    dia: day.key,
    refeicoes: meals
      .filter((meal) => meal.repetirEm.includes(day.key))
      .map((meal) => ({ ...meal })),
  }));

export const mergeNotificationIds = (current?: string, next?: string) => {
  const toArray = (value?: string) => (value ? value.split('|').filter(Boolean) : []);
  const unique = new Set([...toArray(current), ...toArray(next)]);
  return unique.size ? Array.from(unique).join('|') : undefined;
};

export const splitNotificationIds = (value?: string) => (value ? value.split('|').filter(Boolean) : []);

export const getMealStatus = (meal: Refeicao, isDone: boolean) => {
  if (isDone) return 'done' as const;
  const now = dayjs();
  const { hour, minute } = parseTime(meal.horario);
  const mealTime = dayjs().hour(hour).minute(minute);
  return mealTime.isBefore(now) ? ('late' as const) : ('upcoming' as const);
};

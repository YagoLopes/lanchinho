import { useEffect, useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MealItem } from '@components/MealItem';
import { useThemeColors } from '@hooks/useTheme';
import { useDietStore } from '@store/dietStore';
import { getMealStatus, getMealsForDay, getDateISO, getCurrentDayKey } from '@utils/time';
import { scheduleSnoozeNotification } from '@services/notifications';

const TodayScreen = () => {
  const colors = useThemeColors();
  const activeDietId = useDietStore((state) => state.activeDietId);
  const dietas = useDietStore((state) => state.dietas);
  const config = useDietStore((state) => state.config);
  const historico = useDietStore((state) => state.historico);
  const ensureDailyHistory = useDietStore((state) => state.ensureDailyHistory);
  const toggleMealDone = useDietStore((state) => state.toggleMealDone);
  const toggleMealAlarm = useDietStore((state) => state.toggleMealAlarm);

  const activeDiet = useMemo(() => dietas.find((diet) => diet.id === activeDietId) ?? null, [dietas, activeDietId]);

  const todayKey = getCurrentDayKey();
  const todayISO = getDateISO();
  const meals = useMemo(() => getMealsForDay(activeDiet, todayKey), [activeDiet, todayKey]);

  const snoozePresets = useMemo(() => {
    const base = new Set<number>([config.defaultSnoozeMinutes, 5, 10, 15]);
    return Array.from(base).sort((a, b) => a - b);
  }, [config.defaultSnoozeMinutes]);

  useEffect(() => {
    if (!activeDiet || !meals.length) return;
    ensureDailyHistory(todayISO, meals.map((meal) => meal.id));
  }, [ensureDailyHistory, activeDiet, meals, todayISO]);

  if (!activeDiet) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma dieta ativa</Text>
        <Text style={[styles.emptySubtitle, { color: colors.muted }]}>Ative uma dieta para ver suas refeicoes do dia.</Text>
      </SafeAreaView>
    );
  }

  const handleSnooze = async (mealId: string, minutes: number) => {
    const meal = meals.find((item) => item.id === mealId);
    if (!meal) return;
    await scheduleSnoozeNotification(meal, minutes);
    Toast.show({ type: 'info', text1: `Soneca de ${minutes} minutos ativada.` });
  };

  const handleToggleAlarm = (mealId: string, value: boolean) => {
    toggleMealAlarm(activeDiet.id, mealId, value);
  };

  const handleToggleDone = async (mealId: string) => {
    const done = await toggleMealDone(mealId, todayISO);
    Toast.show({ type: done ? 'success' : 'info', text1: done ? 'Refeicao concluida.' : 'Refeicao desmarcada.' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} accessibilityLabel="Logo do Lanchinho" />
        <Text style={[styles.title, { color: colors.text }]}>Lanchinho</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Plano atual: {activeDiet.nome}</Text>

        {meals.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sem refeicoes hoje</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>Adicione refeicoes para este dia no editor.</Text>
          </View>
        ) : (
          meals.map((meal) => {
            const historyEntry = historico.find(
              (item) => item.dataISO === todayISO && item.refeicaoId === meal.id,
            );
            const status = getMealStatus(meal, historyEntry?.feita ?? false);
            return (
              <View key={meal.id} style={styles.mealItemWrapper}>
                <MealItem
                  meal={meal}
                  status={status}
                  isDone={historyEntry?.feita ?? false}
                  onToggleDone={() => handleToggleDone(meal.id)}
                  onToggleAlarm={(value) => handleToggleAlarm(meal.id, value)}
                  onSnooze={(minutes) => handleSnooze(meal.id, minutes)}
                  snoozeOptions={snoozePresets}
                  defaultSnooze={config.defaultSnoozeMinutes}
                />
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 120,
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 120,
    marginBottom: 12,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  emptyBox: {
    marginTop: 80,
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  mealItemWrapper: {
    width: '100%',
  },
});

export default TodayScreen;

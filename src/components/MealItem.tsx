import { FC } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Refeicao } from '@types/diet';
import { useThemeColors } from '@hooks/useTheme';

export type MealStatus = 'done' | 'late' | 'upcoming';

interface MealItemProps {
  meal: Refeicao;
  status: MealStatus;
  isDone: boolean;
  onToggleDone: () => void;
  onToggleAlarm: (value: boolean) => void;
  onSnooze: (minutes: number) => void;
  snoozeOptions: number[];
  defaultSnooze: number;
}

export const MealItem: FC<MealItemProps> = ({
  meal,
  status,
  isDone,
  onToggleDone,
  onToggleAlarm,
  onSnooze,
  snoozeOptions,
  defaultSnooze,
}) => {
  const colors = useThemeColors();
  const borderColor =
    status === 'done' ? colors.success : status === 'late' ? colors.danger : colors.border;

  return (
    <View style={[styles.container, { borderColor, backgroundColor: colors.card }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={[styles.title, { color: colors.text }]}>{meal.nome}</Text>
          <Text style={[styles.time, { color: status === 'late' ? colors.danger : colors.muted }]}>
            {meal.horario}
          </Text>
        </View>
        <Switch value={meal.alarmeAtivo} onValueChange={onToggleAlarm} />
      </View>

      {meal.macros && (
        <Text style={[styles.macros, { color: colors.muted }]}>
          {meal.macros.kcal ? `${meal.macros.kcal} kcal` : ''}
          {meal.macros.protein ? ` • P:${meal.macros.protein}g` : ''}
          {meal.macros.carbs ? ` • C:${meal.macros.carbs}g` : ''}
          {meal.macros.fat ? ` • G:${meal.macros.fat}g` : ''}
        </Text>
      )}

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onToggleDone}
          style={[styles.primaryButton, { backgroundColor: isDone ? colors.success : colors.primary }]}
        >
          <Text style={styles.primaryButtonText}>{isDone ? 'Comida' : 'Marcar como comida'}</Text>
        </Pressable>

        <View style={styles.snoozeGroup}>
          {snoozeOptions.map((minutes) => (
            <Pressable
              key={minutes}
              accessibilityRole="button"
              onPress={() => onSnooze(minutes)}
              style={[
                styles.snoozeButton,
                {
                  borderColor: colors.border,
                  backgroundColor: minutes === defaultSnooze ? colors.primary : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.snoozeText,
                  { color: minutes === defaultSnooze ? '#FFFFFF' : colors.muted },
                ]}
              >
                {minutes}m
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  time: {
    fontSize: 14,
    fontWeight: '500',
  },
  macros: {
    marginTop: 8,
    fontSize: 13,
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  snoozeGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  snoozeButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  snoozeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

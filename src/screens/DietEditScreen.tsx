import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '@navigation/AppNavigator';
import { useThemeColors } from '@hooks/useTheme';
import { useDietStore } from '@store/dietStore';
import { DAYS_OF_WEEK, buildDayPlans, flattenMeals, formatHourMinute, isValidTime } from '@utils/time';
import { generateId } from '@utils/id';
import { Dieta, Macros, Objetivo, Refeicao } from '@types/diet';

const objetivoOptions: { value: Objetivo; label: string }[] = [
  { value: 'BULKING', label: 'Bulking' },
  { value: 'CUT', label: 'Cut' },
  { value: 'MANUTENCAO', label: 'Manutencao' },
  { value: 'CUSTOM', label: 'Custom' },
];

type DayKey = typeof DAYS_OF_WEEK[number]['key'];

type MealForm = {
  id: string;
  nome: string;
  horario: string;
  macros: {
    kcal: string;
    protein: string;
    carbs: string;
    fat: string;
  };
  alarmeAtivo: boolean;
  repetirEm: DayKey[];
  notificationId?: string;
};

type Props = NativeStackScreenProps<RootStackParamList, 'DietEdit'>;

const createEmptyMeal = (): MealForm => ({
  id: generateId(),
  nome: '',
  horario: '07:30',
  macros: { kcal: '', protein: '', carbs: '', fat: '' },
  alarmeAtivo: true,
  repetirEm: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
});

const DietEditScreen = ({ route, navigation }: Props) => {
  const colors = useThemeColors();
  const { dietId } = route.params ?? {};
  const diets = useDietStore((state) => state.dietas);
  const saveDiet = useDietStore((state) => state.saveDiet);

  const editingDiet = useMemo(() => diets.find((diet) => diet.id === dietId), [dietId, diets]);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [objetivo, setObjetivo] = useState<Objetivo>('CUSTOM');
  const [meals, setMeals] = useState<MealForm[]>([createEmptyMeal()]);

  useEffect(() => {
    if (editingDiet) {
      setNome(editingDiet.nome);
      setDescricao(editingDiet.descricao ?? '');
      setObjetivo(editingDiet.objetivo);
      const flattened = flattenMeals(editingDiet.dias);
      setMeals(
        flattened.map((meal) => ({
          id: meal.id,
          nome: meal.nome,
          horario: meal.horario,
          macros: {
            kcal: meal.macros?.kcal?.toString() ?? '',
            protein: meal.macros?.protein?.toString() ?? '',
            carbs: meal.macros?.carbs?.toString() ?? '',
            fat: meal.macros?.fat?.toString() ?? '',
          },
          alarmeAtivo: meal.alarmeAtivo,
          repetirEm: [...meal.repetirEm],
          notificationId: meal.notificationId,
        })),
      );
    } else {
      setNome('');
      setDescricao('');
      setObjetivo('CUSTOM');
      setMeals([createEmptyMeal()]);
    }
  }, [editingDiet]);

  const updateMealField = (id: string, field: keyof MealForm, value: any) => {
    setMeals((current) =>
      current.map((meal) => (meal.id === id ? { ...meal, [field]: value } : meal)),
    );
  };

  const updateMacroField = (id: string, field: keyof MealForm['macros'], value: string) => {
    setMeals((current) =>
      current.map((meal) =>
        meal.id === id
          ? {
              ...meal,
              macros: {
                ...meal.macros,
                [field]: value,
              },
            }
          : meal,
      ),
    );
  };

  const toggleDay = (mealId: string, dayKey: DayKey) => {
    setMeals((current) =>
      current.map((meal) => {
        if (meal.id !== mealId) return meal;
        const hasDay = meal.repetirEm.includes(dayKey);
        const nextDays = hasDay
          ? meal.repetirEm.filter((day) => day !== dayKey)
          : [...meal.repetirEm, dayKey];
        return { ...meal, repetirEm: nextDays };
      }),
    );
  };

  const addMeal = () => {
    setMeals((current) => [...current, createEmptyMeal()]);
  };

  const removeMeal = (mealId: string) => {
    setMeals((current) => current.filter((meal) => meal.id !== mealId));
  };

  const buildDietPayload = (): Dieta | null => {
    if (!nome.trim()) {
      Toast.show({ type: 'error', text1: 'Informe o nome da dieta.' });
      return null;
    }
    if (!meals.length) {
      Toast.show({ type: 'error', text1: 'Adicione ao menos uma refeicao.' });
      return null;
    }

    for (const meal of meals) {
      if (!meal.nome.trim()) {
        Toast.show({ type: 'error', text1: 'Informe o nome de todas as refeicoes.' });
        return null;
      }
      if (!isValidTime(meal.horario)) {
        Toast.show({ type: 'error', text1: `Horario invalido em ${meal.nome}. Use HH:mm.` });
        return null;
      }
      if (!meal.repetirEm.length) {
        Toast.show({ type: 'error', text1: `Selecione os dias da refeicao ${meal.nome}.` });
        return null;
      }
    }

    const refeicoes: Refeicao[] = meals.map((meal) => {
      const macros: Macros = {};
      if (meal.macros.kcal) macros.kcal = Number(meal.macros.kcal);
      if (meal.macros.protein) macros.protein = Number(meal.macros.protein);
      if (meal.macros.carbs) macros.carbs = Number(meal.macros.carbs);
      if (meal.macros.fat) macros.fat = Number(meal.macros.fat);

      return {
        id: meal.id,
        nome: meal.nome.trim(),
        horario: formatHourMinute(meal.horario),
        macros: Object.keys(macros).length ? macros : undefined,
        alarmeAtivo: meal.alarmeAtivo,
        repetirEm: [...meal.repetirEm],
        notificationId: meal.notificationId,
      };
    });

    return {
      id: editingDiet?.id ?? generateId(),
      nome: nome.trim(),
      objetivo,
      descricao: descricao.trim() || undefined,
      dias: buildDayPlans(refeicoes),
      ativa: editingDiet?.ativa ?? false,
    };
  };

  const save = async () => {
    const payload = buildDietPayload();
    if (!payload) return;
    await saveDiet(payload, { setActive: payload.ativa });
    Toast.show({ type: 'success', text1: 'Dieta salva com sucesso.' });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.label, { color: colors.muted }]}>Nome</Text>
        <TextInput
          value={nome}
          onChangeText={setNome}
          placeholder="Nome da dieta"
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
        />

        <Text style={[styles.label, { color: colors.muted }]}>Objetivo</Text>
        <View style={styles.row}>
          {objetivoOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setObjetivo(option.value)}
              style={[
                styles.chip,
                {
                  borderColor: colors.border,
                  backgroundColor: objetivo === option.value ? colors.primary : colors.card,
                },
              ]}
            >
              <Text
                style={{
                  color: objetivo === option.value ? '#FFFFFF' : colors.text,
                  fontWeight: '600',
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.muted }]}>Descricao</Text>
        <TextInput
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Opcional"
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            styles.multiline,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
          ]}
          multiline
        />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Refeicoes</Text>
          <Pressable accessibilityRole="button" onPress={addMeal}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Adicionar</Text>
          </Pressable>
        </View>

        {meals.map((meal) => (
          <View key={meal.id} style={[styles.mealCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <View style={styles.mealHeader}>
              <TextInput
                value={meal.nome}
                onChangeText={(value) => updateMealField(meal.id, 'nome', value)}
                placeholder="Nome da refeicao"
                placeholderTextColor={colors.muted}
                style={[styles.mealTitleInput, { color: colors.text, borderColor: colors.border }]}
              />
              <Pressable accessibilityRole="button" onPress={() => removeMeal(meal.id)}>
                <Text style={{ color: colors.danger }}>Remover</Text>
              </Pressable>
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={[styles.label, { color: colors.muted }]}>Horario</Text>
                <TextInput
                  value={meal.horario}
                  onChangeText={(value) => updateMealField(meal.id, 'horario', value)}
                  placeholder="HH:mm"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={[styles.label, { color: colors.muted }]}>Alarme</Text>
                <View style={styles.switchWrapper}>
                  <Switch
                    value={meal.alarmeAtivo}
                    onValueChange={(value) => updateMealField(meal.id, 'alarmeAtivo', value)}
                  />
                </View>
              </View>
            </View>

            <Text style={[styles.label, { color: colors.muted, marginTop: 12 }]}>Macros</Text>
            <View style={styles.macroRow}>
              {(['kcal', 'protein', 'carbs', 'fat'] as const).map((field) => (
                <View key={field} style={styles.macroItem}>
                  <Text style={[styles.macroLabel, { color: colors.muted }]}>{field.toUpperCase()}</Text>
                  <TextInput
                    value={meal.macros[field]}
                    onChangeText={(value) => updateMacroField(meal.id, field, value.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  />
                </View>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.muted, marginTop: 12 }]}>Dias</Text>
            <View style={styles.row}>
              {DAYS_OF_WEEK.map((day) => (
                <Pressable
                  key={day.key}
                  onPress={() => toggleDay(meal.id, day.key)}
                  style={[
                    styles.dayChip,
                    {
                      borderColor: colors.border,
                      backgroundColor: meal.repetirEm.includes(day.key) ? colors.primary : colors.background,
                    },
                  ]}
                >
                  <Text style={{ color: meal.repetirEm.includes(day.key) ? '#FFFFFF' : colors.text }}>
                    {day.short}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Pressable accessibilityRole="button" onPress={save} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.saveButtonText}>Salvar dieta</Text>
        </Pressable>
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
    paddingBottom: 120,
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  sectionHeader: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  mealCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  mealTitleInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  rowItem: {
    flex: 1,
  },
  switchWrapper: {
    marginTop: 8,
  },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroItem: {
    width: '22%',
  },
  macroLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DietEditScreen;

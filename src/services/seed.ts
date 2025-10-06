import { Dieta, Macros, Refeicao } from '@types/diet';
import { buildDayPlans } from '@utils/time';

const DAILY_DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'] as const;

type MealInput = {
  id: string;
  nome: string;
  horario: string;
  macros: Macros;
};

const createMeals = (meals: MealInput[]): Refeicao[] =>
  meals.map((meal) => ({
    ...meal,
    alarmeAtivo: true,
    repetirEm: [...DAILY_DAYS],
  }));

export const seedDiets = (): Dieta[] => [
  {
    id: 'seed-bulking',
    nome: 'Bulking Essencial',
    objetivo: 'BULKING',
    descricao: 'Plano focado em superavit calorico controlado.',
    ativa: true,
    dias: buildDayPlans(
      createMeals([
        { id: 'seed-bulk-1', nome: 'Cafe reforcado', horario: '07:30', macros: { kcal: 600, protein: 35, carbs: 60, fat: 20 } },
        { id: 'seed-bulk-2', nome: 'Lanche da manha', horario: '10:30', macros: { kcal: 300, protein: 20, carbs: 35, fat: 10 } },
        { id: 'seed-bulk-3', nome: 'Almoco', horario: '13:00', macros: { kcal: 800, protein: 45, carbs: 80, fat: 25 } },
        { id: 'seed-bulk-4', nome: 'Lanche da tarde', horario: '16:00', macros: { kcal: 350, protein: 20, carbs: 40, fat: 12 } },
        { id: 'seed-bulk-5', nome: 'Jantar', horario: '19:30', macros: { kcal: 700, protein: 40, carbs: 60, fat: 20 } },
        { id: 'seed-bulk-6', nome: 'Ceia', horario: '22:00', macros: { kcal: 450, protein: 30, carbs: 30, fat: 15 } },
      ])
    ),
  },
  {
    id: 'seed-cut',
    nome: 'Cut Inteligente',
    objetivo: 'CUT',
    descricao: 'Corte com alta saciedade e proteinas.',
    dias: buildDayPlans(
      createMeals([
        { id: 'seed-cut-1', nome: 'Cafe proteico', horario: '07:30', macros: { kcal: 350, protein: 30, carbs: 25, fat: 10 } },
        { id: 'seed-cut-2', nome: 'Snack leve', horario: '10:30', macros: { kcal: 200, protein: 15, carbs: 20, fat: 7 } },
        { id: 'seed-cut-3', nome: 'Almoco leve', horario: '13:00', macros: { kcal: 550, protein: 40, carbs: 45, fat: 15 } },
        { id: 'seed-cut-4', nome: 'Lanche verde', horario: '16:00', macros: { kcal: 180, protein: 12, carbs: 15, fat: 6 } },
        { id: 'seed-cut-5', nome: 'Jantar magro', horario: '19:30', macros: { kcal: 500, protein: 45, carbs: 35, fat: 15 } },
      ])
    ),
  },
  {
    id: 'seed-manutencao',
    nome: 'Manutencao Equilibrada',
    objetivo: 'MANUTENCAO',
    descricao: 'Plano balanceado para manter o peso.',
    dias: buildDayPlans(
      createMeals([
        { id: 'seed-main-1', nome: 'Cafe completo', horario: '07:30', macros: { kcal: 450, protein: 25, carbs: 50, fat: 15 } },
        { id: 'seed-main-2', nome: 'Frutas + iogurte', horario: '10:30', macros: { kcal: 250, protein: 12, carbs: 35, fat: 8 } },
        { id: 'seed-main-3', nome: 'Almoco tradicional', horario: '13:00', macros: { kcal: 650, protein: 35, carbs: 70, fat: 20 } },
        { id: 'seed-main-4', nome: 'Lanche rapido', horario: '16:00', macros: { kcal: 250, protein: 15, carbs: 30, fat: 8 } },
        { id: 'seed-main-5', nome: 'Jantar leve', horario: '19:30', macros: { kcal: 600, protein: 30, carbs: 55, fat: 18 } },
      ])
    ),
  },
];

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { AppConfig, Dieta, ExportPayload, HistoricoItem } from '../types/diet';
import {
  loadPersistedData,
  persistConfig,
  persistDietas,
  persistHistorico,
} from '@services/storage';
import {
  cancelDietNotifications,
  cancelMealNotification,
  registerNotificationCategories,
  requestNotificationPermissions,
  rescheduleAllForActiveDiet,
  rescheduleMealNotification,
} from '@services/notifications';
import { seedDiets } from '@services/seed';
import {
  ExportInput,
  createExportPayload,
  exportToFile,
  loadExportPayload,
  mergeExportPayload,
  pickImportFile,
} from '@services/exportImport';

const defaultConfig: AppConfig = {
  theme: 'system',
  defaultSnoozeMinutes: 5,
  notificationsEnabled: false,
};

type DietStore = {
  dietas: Dieta[];
  historico: HistoricoItem[];
  config: AppConfig;
  hydrated: boolean;
  activeDietId?: string;
  hydrate: () => Promise<void>;
  saveDiet: (diet: Dieta, options?: { setActive?: boolean }) => Promise<void>;
  deleteDiet: (dietId: string) => Promise<void>;
  duplicateDiet: (dietId: string) => Promise<Dieta | null>;
  setActiveDiet: (dietId: string) => Promise<void>;
  toggleMealAlarm: (
    dietId: string,
    mealId: string,
    active: boolean
  ) => Promise<void>;
  ensureDailyHistory: (dateISO: string, mealIds: string[]) => Promise<void>;
  markMeal: (mealId: string, dateISO: string, feita: boolean) => Promise<void>;
  toggleMealDone: (mealId: string, dateISO: string) => Promise<boolean>;
  setConfig: (partial: Partial<AppConfig>) => Promise<void>;
  exportData: () => Promise<string>;
  importData: () => Promise<void>;
  applyImportedPayload: (payload: ExportPayload) => Promise<void>;
};

const updateDietNotificationIds = (
  diet: Dieta,
  mapping: Record<string, string | undefined>
) => {
  diet.dias.forEach((dia) => {
    dia.refeicoes.forEach((meal) => {
      if (mapping[meal.id] !== undefined) {
        meal.notificationId = mapping[meal.id];
      }
    });
  });
};

export const useDietStore = create<DietStore>()(
  immer((set, get) => ({
    dietas: [],
    historico: [],
    config: defaultConfig,
    hydrated: false,
    activeDietId: undefined,

    hydrate: async () => {
      if (get().hydrated) return;
      await registerNotificationCategories();

      const { dietas, historico, config } = await loadPersistedData();
      const hasData = dietas.length > 0;
      const initialDiets = hasData ? dietas : seedDiets();
      const active = initialDiets.find((d) => d.ativa) ?? initialDiets[0];

      set((state) => {
        state.dietas = initialDiets.map((diet) => ({
          ...diet,
          dias: diet.dias.map((dia) => ({
            ...dia,
            refeicoes: dia.refeicoes.map((meal) => ({ ...meal })),
          })),
          ativa: diet.id === active?.id,
        }));
        state.historico = historico;
        state.config = { ...defaultConfig, ...config };
        state.hydrated = true;
        state.activeDietId = active?.id;
      });

      if (!hasData) {
        await persistDietas(get().dietas);
      }

      if (get().config.notificationsEnabled && active) {
        const refreshed = get().dietas.find((diet) => diet.id === active.id);
        if (refreshed) {
          const mapping = await rescheduleAllForActiveDiet(refreshed);
          set((state) => {
            const target = state.dietas.find(
              (diet) => diet.id === refreshed.id
            );
            if (target) updateDietNotificationIds(target, mapping);
          });
          await persistDietas(get().dietas);
        }
      }
    },

    saveDiet: async (diet, options) => {
      const shouldSetActive = options?.setActive || diet.ativa;
      const exists = get().dietas.some((d) => d.id === diet.id);
      set((state) => {
        if (exists) {
          const index = state.dietas.findIndex((d) => d.id === diet.id);
          if (index >= 0) {
            state.dietas[index] = {
              ...diet,
              dias: diet.dias.map((dia) => ({
                ...dia,
                refeicoes: dia.refeicoes.map((meal) => ({ ...meal })),
              })),
            };
          }
        } else {
          state.dietas.push({
            ...diet,
            dias: diet.dias.map((dia) => ({
              ...dia,
              refeicoes: dia.refeicoes.map((meal) => ({ ...meal })),
            })),
          });
        }

        if (shouldSetActive || (!state.activeDietId && state.dietas.length)) {
          state.activeDietId = diet.id;
          state.dietas.forEach((item) => {
            item.ativa = item.id === diet.id;
          });
        } else if (state.activeDietId === diet.id && !shouldSetActive) {
          state.dietas.forEach((item) => {
            item.ativa = item.id === diet.id;
          });
        }
      });

      await persistDietas(get().dietas);

      const updated = get().dietas.find((d) => d.id === diet.id);
      if (!updated) return;

      if (get().config.notificationsEnabled && updated.ativa) {
        const mapping = await rescheduleAllForActiveDiet(updated);
        set((state) => {
          const target = state.dietas.find((d) => d.id === updated.id);
          if (target) updateDietNotificationIds(target, mapping);
        });
        await persistDietas(get().dietas);
      }
    },

    deleteDiet: async (dietId) => {
      const wasActive = get().activeDietId === dietId;
      set((state) => {
        state.dietas = state.dietas.filter((diet) => diet.id !== dietId);
        if (wasActive) {
          const fallback = state.dietas[0];
          state.activeDietId = fallback?.id;
          state.dietas.forEach((diet) => {
            diet.ativa = fallback ? diet.id === fallback.id : false;
          });
        }
      });
      await persistDietas(get().dietas);

      if (wasActive && get().config.notificationsEnabled) {
        const fallback = get().dietas.find(
          (diet) => diet.id === get().activeDietId
        );
        if (fallback) {
          const mapping = await rescheduleAllForActiveDiet(fallback);
          set((state) => {
            const target = state.dietas.find((diet) => diet.id === fallback.id);
            if (target) updateDietNotificationIds(target, mapping);
          });
          await persistDietas(get().dietas);
        }
      }
    },

    duplicateDiet: async (dietId) => {
      const original = get().dietas.find((diet) => diet.id === dietId);
      if (!original) return null;
      const clone: Dieta = {
        ...original,
        id: `${original.id}-copy-${Date.now()}`,
        nome: `${original.nome} (copia)`,
        ativa: false,
        dias: original.dias.map((dia) => ({
          ...dia,
          refeicoes: dia.refeicoes.map((meal) => ({
            ...meal,
            notificationId: undefined,
          })),
        })),
      };
      set((state) => {
        state.dietas.push(clone);
      });
      await persistDietas(get().dietas);
      return clone;
    },

    setActiveDiet: async (dietId) => {
      const target = get().dietas.find((diet) => diet.id === dietId);
      if (!target) return;

      set((state) => {
        state.activeDietId = dietId;
        state.dietas.forEach((diet) => {
          diet.ativa = diet.id === dietId;
        });
      });
      await persistDietas(get().dietas);

      if (get().config.notificationsEnabled) {
        const mapping = await rescheduleAllForActiveDiet(target);
        set((state) => {
          const active = state.dietas.find((diet) => diet.id === dietId);
          if (active) updateDietNotificationIds(active, mapping);
        });
        await persistDietas(get().dietas);
      }
    },

    toggleMealAlarm: async (dietId, mealId, active) => {
      const targetDiet = get().dietas.find((diet) => diet.id === dietId);
      if (!targetDiet) return;
      let previousNotificationId: string | undefined;
      set((state) => {
        const diet = state.dietas.find((d) => d.id === dietId);
        diet?.dias.forEach((dia) => {
          dia.refeicoes.forEach((meal) => {
            if (meal.id === mealId) {
              if (!active) {
                previousNotificationId = meal.notificationId;
              }
              meal.alarmeAtivo = active;
              if (!active) {
                meal.notificationId = undefined;
              }
            }
          });
        });
      });
      await persistDietas(get().dietas);

      if (!active) {
        if (previousNotificationId) {
          await cancelMealNotification(previousNotificationId);
        }
        return;
      }

      if (!get().config.notificationsEnabled || !targetDiet.ativa) return;

      const updatedDiet = get().dietas.find((d) => d.id === dietId);
      const sourceMeal = updatedDiet?.dias
        .flatMap((dia) => dia.refeicoes)
        .find((m) => m.id === mealId);
      if (!updatedDiet || !sourceMeal) return;

      const notificationId = await rescheduleMealNotification(
        updatedDiet,
        sourceMeal
      );
      set((state) => {
        const diet = state.dietas.find((d) => d.id === dietId);
        diet?.dias.forEach((dia) => {
          dia.refeicoes.forEach((meal) => {
            if (meal.id === mealId) {
              meal.notificationId = notificationId;
            }
          });
        });
      });
      await persistDietas(get().dietas);
    },

    ensureDailyHistory: async (dateISO, mealIds) => {
      set((state) => {
        mealIds.forEach((mealId) => {
          const exists = state.historico.some(
            (item) => item.dataISO === dateISO && item.refeicaoId === mealId
          );
          if (!exists) {
            state.historico.push({
              id: `${dateISO}-${mealId}`,
              dataISO: dateISO,
              refeicaoId: mealId,
              feita: false,
            });
          }
        });
      });
      await persistHistorico(get().historico);
    },

    markMeal: async (mealId, dateISO, feita) => {
      set((state) => {
        const entry = state.historico.find(
          (item) => item.dataISO === dateISO && item.refeicaoId === mealId
        );
        if (entry) {
          entry.feita = feita;
        } else {
          state.historico.push({
            id: `${dateISO}-${mealId}`,
            dataISO: dateISO,
            refeicaoId: mealId,
            feita,
          });
        }
      });
      await persistHistorico(get().historico);
    },

    toggleMealDone: async (mealId, dateISO) => {
      let updatedStatus = false;
      set((state) => {
        const entry = state.historico.find(
          (item) => item.dataISO === dateISO && item.refeicaoId === mealId
        );
        if (entry) {
          entry.feita = !entry.feita;
          updatedStatus = entry.feita;
        } else {
          state.historico.push({
            id: `${dateISO}-${mealId}`,
            dataISO: dateISO,
            refeicaoId: mealId,
            feita: true,
          });
          updatedStatus = true;
        }
      });
      await persistHistorico(get().historico);
      return updatedStatus;
    },

    setConfig: async (partial) => {
      const before = get().config;
      const next = { ...before, ...partial };
      set((state) => {
        state.config = next;
      });
      await persistConfig(next);

      if (partial.notificationsEnabled === undefined) return;

      const activeDiet = get().dietas.find(
        (diet) => diet.id === get().activeDietId
      );
      if (!activeDiet) return;

      if (partial.notificationsEnabled) {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          set((state) => {
            state.config.notificationsEnabled = false;
          });
          await persistConfig(get().config);
          return;
        }
        const mapping = await rescheduleAllForActiveDiet(activeDiet);
        set((state) => {
          const target = state.dietas.find((diet) => diet.id === activeDiet.id);
          if (target) updateDietNotificationIds(target, mapping);
        });
        await persistDietas(get().dietas);
      } else {
        await cancelDietNotifications(activeDiet);
        set((state) => {
          const target = state.dietas.find((diet) => diet.id === activeDiet.id);
          target?.dias.forEach((dia) => {
            dia.refeicoes.forEach((meal) => {
              meal.notificationId = undefined;
            });
          });
        });
        await persistDietas(get().dietas);
      }
    },

    exportData: async () => {
      const payload = createExportPayload({
        dietas: get().dietas,
        historico: get().historico,
        config: get().config,
      });
      return exportToFile(payload);
    },

    importData: async () => {
      const uri = await pickImportFile();
      if (!uri) return;
      const payload = await loadExportPayload(uri);
      await get().applyImportedPayload(payload);
    },

    applyImportedPayload: async (payload) => {
      const current: ExportInput = {
        dietas: get().dietas,
        historico: get().historico,
        config: get().config,
      };
      const merged = mergeExportPayload(current, payload);
      set((state) => {
        state.dietas = merged.dietas.map((diet) => ({
          ...diet,
          dias: diet.dias.map((dia) => ({
            ...dia,
            refeicoes: dia.refeicoes.map((meal) => ({ ...meal })),
          })),
        }));
        state.historico = merged.historico;
        state.config = merged.config;
        const activeId =
          state.dietas.find((diet) => diet.ativa)?.id ?? state.dietas[0]?.id;
        state.activeDietId = activeId;
        state.dietas.forEach((diet) => {
          diet.ativa = diet.id === activeId;
        });
      });
      await persistDietas(get().dietas);
      await persistHistorico(get().historico);
      await persistConfig(get().config);

      if (get().config.notificationsEnabled) {
        const active = get().dietas.find(
          (diet) => diet.id === get().activeDietId
        );
        if (active) {
          const mapping = await rescheduleAllForActiveDiet(active);
          set((state) => {
            const target = state.dietas.find((diet) => diet.id === active.id);
            if (target) updateDietNotificationIds(target, mapping);
          });
          await persistDietas(get().dietas);
        }
      }
    },
  }))
);

export const selectActiveDiet = () => {
  const state = useDietStore.getState();
  return state.dietas.find((diet) => diet.id === state.activeDietId) ?? null;
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig, Dieta, HistoricoItem } from '../types/diet';

type EntityWithId = { id: string };

const DIETS_KEY = '@lanchinho/dietas';
const HISTORY_KEY = '@lanchinho/historico';
const CONFIG_KEY = '@lanchinho/config';

type StorageKey = typeof DIETS_KEY | typeof HISTORY_KEY | typeof CONFIG_KEY;

export const storageKeys = {
  diets: DIETS_KEY,
  history: HISTORY_KEY,
  config: CONFIG_KEY,
};

export async function getItem<T>(key: StorageKey, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[storage] Failed to parse key ${key}:`, error);
    return fallback;
  }
}

export async function setItem<T>(key: StorageKey, value: T) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[storage] Failed to persist key ${key}:`, error);
  }
}

export const mergeById = <T extends EntityWithId>(
  existing: T[],
  incoming: T[]
) => {
  const map = new Map<string, T>();
  existing.forEach((item) => map.set(item.id, item));
  incoming.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
};

export const loadPersistedData = async () => {
  const [dietas, historico, config] = await Promise.all([
    getItem<Dieta[]>(DIETS_KEY, []),
    getItem<HistoricoItem[]>(HISTORY_KEY, []),
    getItem<AppConfig>(CONFIG_KEY, {
      theme: 'system',
      defaultSnoozeMinutes: 5,
      notificationsEnabled: false,
    }),
  ]);
  return { dietas, historico, config };
};

export const persistDietas = (dietas: Dieta[]) => setItem(DIETS_KEY, dietas);
export const persistHistorico = (historico: HistoricoItem[]) =>
  setItem(HISTORY_KEY, historico);
export const persistConfig = (config: AppConfig) => setItem(CONFIG_KEY, config);

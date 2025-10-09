import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { AppConfig, Dieta, ExportPayload, HistoricoItem } from '../types/diet';
import { mergeById } from './storage';

const EXPORT_PREFIX = 'lanchinho-export';

export type ExportInput = {
  dietas: Dieta[];
  historico: HistoricoItem[];
  config: AppConfig;
};

export const createExportPayload = ({
  dietas,
  historico,
  config,
}: ExportInput): ExportPayload => ({
  dietas,
  historico,
  config,
  exportedAt: new Date().toISOString(),
});

export const exportToFile = async (payload: ExportPayload) => {
  const timestamp = payload.exportedAt.replace(/[:.]/g, '-');
  const fileName = `${EXPORT_PREFIX}-${timestamp}.json`;
  const fileUri = `${FileSystem.documentDirectory ?? ''}${fileName}`;
  await FileSystem.writeAsStringAsync(
    fileUri,
    JSON.stringify(payload, null, 2)
  );
  return fileUri;
};

export const pickImportFile = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.length) {
    return null;
  }
  return result.assets[0].uri;
};

export const loadExportPayload = async (
  uri: string
): Promise<ExportPayload> => {
  const content = await FileSystem.readAsStringAsync(uri);
  return JSON.parse(content) as ExportPayload;
};

export const mergeExportPayload = (
  current: ExportInput,
  incoming: ExportPayload
): ExportInput => ({
  config: { ...current.config, ...incoming.config },
  dietas: mergeById(current.dietas, incoming.dietas),
  historico: mergeById(current.historico, incoming.historico),
});

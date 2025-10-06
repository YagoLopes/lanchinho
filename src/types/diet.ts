export type Objetivo = 'BULKING' | 'CUT' | 'MANUTENCAO' | 'CUSTOM';

export type Macros = {
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export type DiaSemana = 'DOM' | 'SEG' | 'TER' | 'QUA' | 'QUI' | 'SEX' | 'SAB';

export type Refeicao = {
  id: string;
  nome: string;
  horario: string; // HH:mm
  macros?: Macros;
  alarmeAtivo: boolean;
  repetirEm: DiaSemana[];
  notificationId?: string;
};

export type DiaPlano = {
  dia: DiaSemana;
  refeicoes: Refeicao[];
};

export type Dieta = {
  id: string;
  nome: string;
  objetivo: Objetivo;
  descricao?: string;
  dias: DiaPlano[];
  ativa?: boolean;
};

export type HistoricoItem = {
  id: string;
  dataISO: string;
  refeicaoId: string;
  feita: boolean;
};

export type TemaPreferencia = 'light' | 'dark' | 'system';

export type AppConfig = {
  theme: TemaPreferencia;
  defaultSnoozeMinutes: number;
  notificationsEnabled: boolean;
};

export type ExportPayload = {
  dietas: Dieta[];
  historico: HistoricoItem[];
  config: AppConfig;
  exportedAt: string;
};

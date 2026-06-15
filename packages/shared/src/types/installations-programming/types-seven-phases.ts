import type { BaseContent, TechnicianUser } from '../../types';
import type { FileReference } from '../../file-validation';

// ── Type Aliases ────────────────────────────────────────────────────

export type InstallationType =
  | 'POS'
  | 'CPA'
  | 'balanças'
  | 'CCTV'
  | 'Alarmes'
  | 'Botões de chamada e relógios';

export type PhaseStatus = 'not_started' | 'in_progress' | 'completed' | 'unlocked';

export type InstallationStatus = 'in_progress' | 'complete';

// ── Phase Interfaces ────────────────────────────────────────────────

/** Phase 1 — Setup (fields are at top level of InstallationSevenPhasesData) */
export interface Phase1SetupData {}

/** Phase 2 — Receção do Material */
export interface Phase2RececaoData {
  equipamentoCliente: string; // textarea for equipment description
  equipmentConditionOk: boolean | null; // null = not yet answered
  // Conditional fields (shown when equipmentConditionOk === false)
  verificacaoCabo: boolean;
  verificacaoFechadura: boolean;
  verificacaoChaves: boolean;
  verificacaoTestes: boolean;
  observacoes: string;
}

/** Phase 3 — Programação / Preparação */
export interface Phase3ProgramacaoData {
  software: string;
  identificacaoReferencia: string;
  numeroLicenca: string;
  verificacaoInicioProgramacao: boolean;
  testeFinalEquipamentos: boolean;
  notasProgramacao: string; // multiline text area (supports line breaks)
}

/** Phase 4 — Preparação Instalação */
export interface Phase4PreparacaoData {
  materialAdicional: string;
  checklist: EquipmentChecklist;
}

/** Phase 5 — Instalação no Cliente */
export interface Phase5InstalacaoData {
  nrFatura: string;
  nrGuiaTransporte: string;
  dataInstalacao: string; // ISO date
  tecnicoInstalacao: string;
  horaInicial: string; // HH:MM
  horaFinal: string; // HH:MM
  // Training
  dataFormacao: string; // ISO date
  formacaoHoraInicial: string; // HH:MM
  formacaoHoraFinal: string; // HH:MM
  quemRecebeuFormacao: string;
}

/** Phase 6 — Testes */
export interface Phase6TestesData {
  anydeskConfigurado: boolean | null; // null = not yet answered
  anydeskCodigo: string; // required when anydeskConfigurado === true
  anydeskMotivo: string; // required when anydeskConfigurado === false
  vectronConnectConfigurado: boolean | null;
  vectronConnectCodigo: string;
  vectronConnectMotivo: string;
}

/** Phase 7 — Finalização */
export interface Phase7FinalizacaoData {
  dumpLido: boolean;
  copiaSeguranca: boolean;
  fotosInstalacao: FileReference[];
}

// ── Equipment Checklist ─────────────────────────────────────────────

/** Standard category — items are boolean checkboxes */
export interface ChecklistCategory {
  items: Record<string, boolean>;
}

/** CPA has an additional text area for mini PC details */
export interface CpaChecklistCategory extends ChecklistCategory {
  miniPcDetails: string; // placeholder: "Marca, Modelo, n.º série, materiais"
}

export interface EquipmentChecklist {
  pos: ChecklistCategory;
  impressora: ChecklistCategory;
  gavetaMetalica: ChecklistCategory;
  cpa: CpaChecklistCategory;
  acessorios: ChecklistCategory;
}

// ── Main Data Interface ─────────────────────────────────────────────

export interface InstallationSevenPhasesData {
  // Relation
  clientId: string; // resolved via relations system

  // Metadata
  technician: TechnicianUser; // auto-assigned from auth context
  installationType: InstallationType;

  // Equipment (Phase 1)
  equipmentMarca: string;
  equipmentModelo: string;
  equipmentNumeroSerie: string;
  equipmentFornecedor: string;

  // Phase data
  phase1: Phase1SetupData;
  phase2: Phase2RececaoData;
  phase3: Phase3ProgramacaoData;
  phase4: Phase4PreparacaoData;
  phase5: Phase5InstalacaoData;
  phase6: Phase6TestesData;
  phase7: Phase7FinalizacaoData;

  // Workflow state
  phaseStatuses: PhaseStatus[]; // length 7, index 0 = phase 1
  currentPhase: number; // 1-7, the active phase
  status: InstallationStatus;
}

// ── Content Interface ───────────────────────────────────────────────

export interface InstallationSevenPhases extends BaseContent {
  contentType: 'installations-programming'; // keeps same content type slug for backward compat
  data: InstallationSevenPhasesData;
}

// ── Constants ───────────────────────────────────────────────────────

/** 7 phase names in Portuguese (1-indexed display, 0-indexed array) */
export const PHASE_NAMES_SEVEN = [
  'Setup',
  'Receção do Material',
  'Programação / Preparação',
  'Preparação Instalação',
  'Instalação no Cliente',
  'Testes',
  'Finalização',
] as const;

/** Checklist item keys per category */
export const CHECKLIST_ITEMS_SEVEN = {
  pos: ['caboPower', 'transformador', 'caboRede', 'displayCliente', 'impressora', 'autocolantes'],
  impressora: ['rolo', 'caboPower', 'transformador', 'caboLigacaoPOS', 'fichaAdaptadorRS232', 'autocolantes'],
  gavetaMetalica: ['chaves', 'autocolantes'],
  cpa: ['base', 'parafusos', 'transformador', 'caboComunicacaoMoedasNotas', 'caboRede', 'caboSerie'],
  acessorios: ['bobineCabo', 'fichasRede', 'adaptadoresImpressora', 'monitorInterior', 'soprador', 'alcool', 'pincel', 'panos', 'bracadeiras', 'mangueira', 'malaFerramentas', 'autocolantes'],
} as const;

/** Portuguese labels for each checklist item, keyed by category then item key */
export const CHECKLIST_LABELS_SEVEN = {
  pos: {
    caboPower: 'Cabo Power',
    transformador: 'Transformador',
    caboRede: 'Cabo Rede',
    displayCliente: 'Display cliente',
    impressora: 'Impressora',
    autocolantes: 'Autocolantes',
  },
  impressora: {
    rolo: 'Rolo',
    caboPower: 'Cabo Power',
    transformador: 'Transformador',
    caboLigacaoPOS: 'Cabo Ligação POS',
    fichaAdaptadorRS232: 'Ficha Adaptador RS232',
    autocolantes: 'Autocolantes',
  },
  gavetaMetalica: {
    chaves: 'Chaves',
    autocolantes: 'Autocolantes',
  },
  cpa: {
    base: 'Base',
    parafusos: 'Parafusos',
    transformador: 'Transformador',
    caboComunicacaoMoedasNotas: 'Cabo Comunicação entre Moedas e Notas',
    caboRede: 'Cabo Rede',
    caboSerie: 'Cabo Série',
  },
  acessorios: {
    bobineCabo: 'Bobine de Cabo',
    fichasRede: 'Fichas de Rede',
    adaptadoresImpressora: 'Adaptadores de impressora',
    monitorInterior: 'Monitor interior',
    soprador: 'Soprador',
    alcool: 'Álcool',
    pincel: 'Pincel',
    panos: 'Panos',
    bracadeiras: 'Braçadeiras',
    mangueira: 'Mangueira',
    malaFerramentas: 'Mala de Ferramentas',
    autocolantes: 'Autocolantes',
  },
} as const;

/** Portuguese labels for each checklist category */
export const CHECKLIST_CATEGORY_LABELS_SEVEN = {
  pos: 'POS',
  impressora: 'Impressora',
  gavetaMetalica: 'Gaveta Metálica',
  cpa: 'CPA',
  acessorios: 'Acessórios',
} as const;

/** All available installation types */
export const INSTALLATION_TYPES: readonly InstallationType[] = [
  'POS',
  'CPA',
  'balanças',
  'CCTV',
  'Alarmes',
  'Botões de chamada e relógios',
] as const;

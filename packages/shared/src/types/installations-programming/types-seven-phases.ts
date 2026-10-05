import type { BaseContent, TechnicianUser } from '../../types';
import type { FileReference } from '../../file-validation';
import type { SoftwareSelection } from './software-config';

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
  equipamentoCliente: boolean | null;
  equipamentoClienteDescricao: string;
  verificacaoCabo: boolean;
  verificacaoTransformador: boolean;
  verificacaoFechadura: boolean;
  verificacaoChaves: boolean;
  verificacaoTestesEquipamento: boolean;
  observacoes: string;
}

/** Phase 3 checklist category — same toggle+items shape as Phase 4 */
export interface Phase3ChecklistCategory {
  enabled: boolean;
  items: Record<string, boolean>;
}

/** Phase 3 — Programação / Preparação */
export interface Phase3ProgramacaoData {
  software: SoftwareSelection | null;
  identificacaoReferencia: string;
  numeroLicenca: string;
  /** Replaces the old verificacaoInicioProgramacao boolean */
  programacaoChecklist: {
    programacao: Phase3ChecklistCategory;
    leituraX: Phase3ChecklistCategory;
    leituraZ: Phase3ChecklistCategory;
    teclas: Phase3ChecklistCategory;
  };
  testeFinalEquipamentos: boolean;
  notasProgramacao: string;
}

/** Phase 4 — Preparação Instalação */
export interface Phase4PreparacaoData {
  checklist: {
    pos: ToggleableChecklistCategory;
    impressora: ToggleableChecklistCategory;
    gavetaMetalica: ToggleableChecklistCategory;
    cpa: ToggleableCpaChecklistCategory;
    acessorios: ToggleableChecklistCategory;
    balancas: ToggleableChecklistCategory;
    cctv: ToggleableCctvChecklistCategory;
    routerSwitch: ToggleableChecklistCategory;
  };
  equipamentoAdicional: boolean;
  equipamentoAdicionalMotivo: string;
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
  /** Base64 PNG — required to close the phase */
  assinaturaCliente: string;
}

/** Phase 6 — Testes */
export interface Phase6TestesData {
  anydeskConfigurado: boolean | null;
  anydeskCodigo: string;
  anydeskMotivo: string;
  vectronConnectConfigurado: boolean | null;
  vectronConnectCodigo: string;
  vectronConnectMotivo: string;
  falhasDetectadas: boolean | null;
  falhasDescricao: string;
}

/** Phase 7 — Finalização */
export interface Phase7FinalizacaoData {
  dumpLido: boolean;
  copiaSeguranca: boolean;
  fotosInstalacao: FileReference[];
}

// ── Toggleable Checklist Categories ─────────────────────────────────

/** Standard category — parent toggle + items are boolean checkboxes */
export interface ToggleableChecklistCategory {
  enabled: boolean;
  items: Record<string, boolean>;
}

/** CPA has an additional text area for mini PC details */
export interface ToggleableCpaChecklistCategory extends ToggleableChecklistCategory {
  miniPcDetails: string;
}

/** CCTV has an additional number field for camera quantity */
export interface ToggleableCctvChecklistCategory extends ToggleableChecklistCategory {
  camarasQuantidade: number;
}

// ── Installation Entry ───────────────────────────────────────────────

/** A single installation item with type and equipment details */
export interface InstallationEntry {
  tipo: InstallationType;
  marca: string;
  modelo: string;
  numeroSerie: string;
  fornecedor: string;
}

// ── Main Data Interface ─────────────────────────────────────────────

export interface InstallationSevenPhasesData {
  // Relation
  clientId: string; // resolved via relations system

  // Metadata
  technician: TechnicianUser; // auto-assigned from auth context

  // Installations (Phase 1) — repeatable entries
  installationEntries: InstallationEntry[];

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
  pos: ['caboPower', 'transformador', 'caboRede', 'displayCliente', 'autocolantes'],
  impressora: ['rolo', 'caboPower', 'transformador', 'caboLigacaoPOS', 'fichaAdaptadorRS232', 'autocolantes'],
  gavetaMetalica: ['chaves', 'autocolantes'],
  cpa: ['base', 'parafusos', 'transformador', 'caboComunicacaoMoedasNotas', 'caboRede', 'caboSerie'],
  acessorios: ['bobineCabo', 'fichasRede', 'adaptadoresImpressora', 'monitorInterior', 'soprador', 'alcool', 'pincel', 'panos', 'bracadeiras', 'mangueira', 'malaFerramentas', 'autocolantes'],
  balancas: ['caboPower', 'transformador', 'folhaPrimeiraVerificacao', 'autocolante'],
  cctv: ['dvr', 'camaras', 'transformador', 'caboPower', 'fichas', 'placaLicenca', 'autocolantes'],
  routerSwitch: ['router', 'switch', 'caboPower', 'transformador', 'caboRede', 'autocolante'],
} as const;

/** Portuguese labels for each checklist item, keyed by category then item key */
export const CHECKLIST_LABELS_SEVEN = {
  pos: {
    caboPower: 'Cabo Power',
    transformador: 'Transformador',
    caboRede: 'Cabo Rede',
    displayCliente: 'Display cliente',
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
  balancas: {
    caboPower: 'Cabo Power',
    transformador: 'Transformador',
    folhaPrimeiraVerificacao: 'Folha 1ª Verificação',
    autocolante: 'Autocolante',
  },
  cctv: {
    dvr: 'DVR',
    camaras: 'Câmaras',
    transformador: 'Transformador',
    caboPower: 'Cabo Power',
    fichas: 'Fichas',
    placaLicenca: 'Placa Licença',
    autocolantes: 'Autocolantes',
  },
  routerSwitch: {
    router: 'Router',
    switch: 'Switch',
    caboPower: 'Cabo Power',
    transformador: 'Transformador',
    caboRede: 'Cabo Rede',
    autocolante: 'Autocolante',
  },
} as const;

/** Portuguese labels for each checklist category */
export const CHECKLIST_CATEGORY_LABELS_SEVEN = {
  pos: 'POS',
  impressora: 'Impressora',
  gavetaMetalica: 'Gaveta Metálica',
  cpa: 'CPA',
  acessorios: 'Acessórios',
  balancas: 'Balanças',
  cctv: 'CCTV',
  routerSwitch: 'Router / Switch',
} as const;


// ── Phase 3 Checklist Constants ──────────────────────────────────────

/** Item keys for each Phase 3 checklist group */
export const PHASE3_CHECKLIST_ITEMS = {
  programacao: [
    'plus',
    'departamentos',
    'cabecalho',
    'rede',
    'vectronConnect',
    'anydesk',
    'ligacaoCPA',
    'ligacaoGaveta',
    'ligacaoImpressoraMonitor',
    'ligacaoFaturadora',
    'ligacaoDisplayClientes',
    'ligacaoLeitorCartoes',
    'ligacaoFechadura',
    'configuracaoTurnos',
  ],
  leituraX: [
    'plus1',
    'plus2',
    'departamentos',
    'operadores',
    'transacoesCivas',
    'teclaSoConsultaDiaria',
    'leituraGerenteNormal',
    'leituraSupervisor',
  ],
  leituraZ: [
    'plus1',
    'plus2',
    'departamentos',
    'operadores',
    'transacoesCivas',
    'teclaSoConsultaDiaria',
    'leituraGerenteNormal',
    'leituraSupervisor',
  ],
  teclas: [
    'leiturasGuardadas',
    'apagarLeiturasGuardadas',
  ],
} as const;

/** Portuguese labels for each Phase 3 checklist item */
export const PHASE3_CHECKLIST_LABELS = {
  programacao: {
    plus: 'PLUS',
    departamentos: 'Departamentos',
    cabecalho: 'Cabeçalho',
    rede: 'Rede',
    vectronConnect: 'Vectron Connect',
    anydesk: 'Anydesk',
    ligacaoCPA: 'Ligação a CPA',
    ligacaoGaveta: 'Ligação a Gaveta',
    ligacaoImpressoraMonitor: 'Ligação Impressora ou Monitor de pedidos',
    ligacaoFaturadora: 'Ligação a Faturadora',
    ligacaoDisplayClientes: 'Ligação Display Clientes',
    ligacaoLeitorCartoes: 'Ligação a leitor de Cartões',
    ligacaoFechadura: 'Ligação a fechadura de chaves de operador',
    configuracaoTurnos: 'Configuração dos vários Turnos',
  },
  leituraX: {
    plus1: 'Plus 1',
    plus2: 'Plus 2',
    departamentos: 'Departamentos',
    operadores: 'Operadores',
    transacoesCivas: 'Transações C/ivas',
    teclaSoConsultaDiaria: 'Tecla SÓ Consulta diária',
    leituraGerenteNormal: 'Leitura Gerente normal',
    leituraSupervisor: 'Leitura Supervisor',
  },
  leituraZ: {
    plus1: 'Plus 1',
    plus2: 'Plus 2',
    departamentos: 'Departamentos',
    operadores: 'Operadores',
    transacoesCivas: 'Transações C/ivas',
    teclaSoConsultaDiaria: 'Tecla SÓ Consulta diária',
    leituraGerenteNormal: 'Leitura Gerente normal',
    leituraSupervisor: 'Leitura Supervisor',
  },
  teclas: {
    leiturasGuardadas: 'Leituras Guardadas',
    apagarLeiturasGuardadas: 'Apagar leituras guardadas',
  },
} as const;

/** Portuguese labels for each Phase 3 checklist group */
export const PHASE3_CHECKLIST_GROUP_LABELS = {
  programacao: 'Programação',
  leituraX: 'Programação Leitura X',
  leituraZ: 'Programação Leitura Z',
  teclas: 'Teclas',
} as const;

/**
 * Items that are visually indented under a parent item (flat storage, visual indent).
 * Key = child item key, value = parent item key it belongs under.
 */
export const PHASE3_CHECKLIST_INDENT: Partial<Record<string, string>> = {
  leituraGerenteNormal: 'teclaSoConsultaDiaria',
  leituraSupervisor: 'teclaSoConsultaDiaria',
};

/** All available installation types */
export const INSTALLATION_TYPES: readonly InstallationType[] = [
  'POS',
  'CPA',
  'balanças',
  'CCTV',
  'Alarmes',
  'Botões de chamada e relógios',
] as const;

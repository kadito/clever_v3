import type {
  InstallationSevenPhasesData,
  InstallationType,
  InstallationEntry,
  Phase2RececaoData,
  Phase3ProgramacaoData,
  Phase4PreparacaoData,
  Phase5InstalacaoData,
  Phase6TestesData,
  Phase7FinalizacaoData,
  PhaseStatus,
  ToggleableChecklistCategory,
  ToggleableCpaChecklistCategory,
} from './types-seven-phases';
import type { SoftwareSelection } from './software-config';
import type { TechnicianUser } from '../../types';
import type {
  Phase1Data,
  Phase2Data,
  Phase3Data,
  Phase4Data,
  Phase5Data,
} from './types';
import { CHECKLIST_ITEMS_SEVEN } from './types-seven-phases';

// ── Legacy Format Detection ─────────────────────────────────────────

/**
 * Type representing the legacy 5-phase installation data format.
 * Used for type narrowing when detecting old records.
 */
interface LegacyInstallationData {
  technician: TechnicianUser;
  clientId: string;
  phase1: Phase1Data;
  phase2: Phase2Data;
  phase3: Phase3Data;
  phase4: Phase4Data;
  phase5: Phase5Data;
  completedPhases: number[];
  isCompleted: boolean;
}

/**
 * Type representing the old 7-phase format (before this refactor).
 * Has `installationType` as string instead of `installationTypes` as array.
 * Phase2 has old fields (equipmentConditionOk, verificacaoTestes), Phase3
 * has software as string, Phase4 has materialAdicional + flat checklist,
 * Phase6 lacks falhasDetectadas.
 */
interface OldSevenPhaseData {
  clientId: string;
  technician: TechnicianUser;
  installationType: string;
  equipmentMarca: string;
  equipmentModelo: string;
  equipmentNumeroSerie: string;
  equipmentFornecedor: string;
  phase1: Record<string, unknown>;
  phase2: {
    equipamentoCliente?: string;
    equipmentConditionOk?: boolean | null;
    verificacaoCabo?: boolean;
    verificacaoFechadura?: boolean;
    verificacaoChaves?: boolean;
    verificacaoTestes?: boolean;
    observacoes?: string;
  };
  phase3: {
    software?: string;
    identificacaoReferencia?: string;
    numeroLicenca?: string;
    verificacaoInicioProgramacao?: boolean;
    testeFinalEquipamentos?: boolean;
    notasProgramacao?: string;
  };
  phase4: {
    materialAdicional?: string;
    checklist?: Record<string, { items: Record<string, boolean>; miniPcDetails?: string }>;
  };
  phase5: Phase5InstalacaoData;
  phase6: {
    anydeskConfigurado?: boolean | null;
    anydeskCodigo?: string;
    anydeskMotivo?: string;
    vectronConnectConfigurado?: boolean | null;
    vectronConnectCodigo?: string;
    vectronConnectMotivo?: string;
  };
  phase7: Phase7FinalizacaoData;
  phaseStatuses: PhaseStatus[];
  currentPhase: number;
  status: 'in_progress' | 'complete';
}

/**
 * Detects whether the input data is in the legacy 5-phase format.
 * Legacy format is identified by the presence of a `completedPhases` array
 * and the absence of a `phaseStatuses` array.
 */
function isLegacyFormat(data: unknown): data is LegacyInstallationData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const record = data as Record<string, unknown>;
  return Array.isArray(record.completedPhases) && !record.phaseStatuses;
}

/**
 * Detects whether the input data is in the old 7-phase format (pre-refactor).
 * Identified by having `installationType` as a string (not an array) and
 * having `phaseStatuses` (distinguishing from legacy 5-phase).
 */
function isOldSevenPhaseFormat(data: unknown): data is OldSevenPhaseData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const record = data as Record<string, unknown>;
  return (
    typeof record.installationType === 'string' &&
    !Array.isArray(record.installationTypes) &&
    Array.isArray(record.phaseStatuses)
  );
}

// ── Phase Mapping Functions ─────────────────────────────────────────

/**
 * Maps legacy Phase 1 (Programação) → new Phase 3 (Programação / Preparação).
 * Legacy phase1 has: tipoProgramacao, numeroSerie, numeroEquipamento, leiturasGuardadas, testeFinal
 * Converts software string → SoftwareSelection object with only brand filled.
 */
function mapLegacyPhase1ToPhase3(legacyPhase1: Phase1Data | undefined): Phase3ProgramacaoData {
  if (!legacyPhase1) {
    return {
      software: null,
      identificacaoReferencia: '',
      numeroLicenca: '',
      verificacaoInicioProgramacao: false,
      testeFinalEquipamentos: false,
      notasProgramacao: '',
    };
  }

  const softwareValue = legacyPhase1.tipoProgramacao || '';
  const software: SoftwareSelection | null = softwareValue
    ? { brand: softwareValue }
    : null;

  return {
    software,
    identificacaoReferencia: legacyPhase1.numeroEquipamento || '',
    numeroLicenca: legacyPhase1.numeroSerie || '',
    verificacaoInicioProgramacao: Boolean(legacyPhase1.leiturasGuardadas),
    testeFinalEquipamentos: legacyPhase1.testeFinal ?? false,
    notasProgramacao: '',
  };
}

/**
 * Maps legacy Phase 2 checklist → new Phase 4 with toggleable categories.
 * Legacy phase2 has: checklist (Record<string, Record<string, boolean>>)
 * Sets `enabled: true` on all categories (preserves old behavior where all were visible).
 */
function mapLegacyChecklistToPhase4(legacyPhase2: Phase2Data | undefined, materialAdicional?: string): Phase4PreparacaoData {
  if (!legacyPhase2 || !legacyPhase2.checklist) {
    return createDefaultPhase4();
  }

  const legacy = legacyPhase2.checklist;

  return {
    checklist: {
      pos: {
        enabled: true,
        items: mapChecklistItems('pos', legacy.pos),
      },
      impressora: {
        enabled: true,
        items: mapChecklistItems('impressora', legacy.displayCliente),
      },
      gavetaMetalica: {
        enabled: true,
        items: mapChecklistItems('gavetaMetalica', legacy.gavetaMetalica),
      },
      cpa: {
        enabled: true,
        items: mapChecklistItems('cpa', legacy.cpa),
        miniPcDetails: '',
      },
      acessorios: {
        enabled: true,
        items: mapChecklistItems('acessorios', legacy.acessorios),
      },
    },
    equipamentoAdicional: true,
    equipamentoAdicionalMotivo: materialAdicional || '',
  };
}

/**
 * Maps legacy Phase 2 (Receção) → new Phase 2 (Receção do Material).
 * Old format had: equipmentConditionOk, equipamentoCliente as string,
 * verificacaoCabo, verificacaoFechadura, verificacaoChaves, verificacaoTestes, observacoes.
 * New format has: equipamentoCliente as boolean|null, equipamentoClienteDescricao,
 * verificacaoCabo, verificacaoTransformador (new), verificacaoFechadura,
 * verificacaoChaves, verificacaoTestesEquipamento (renamed), observacoes.
 */
function mapOldPhase2ToNew(oldPhase2: OldSevenPhaseData['phase2']): Phase2RececaoData {
  return {
    equipamentoCliente: null, // not answered in old format
    equipamentoClienteDescricao: '',
    verificacaoCabo: oldPhase2.verificacaoCabo ?? false,
    verificacaoTransformador: false, // didn't exist before
    verificacaoFechadura: oldPhase2.verificacaoFechadura ?? false,
    verificacaoChaves: oldPhase2.verificacaoChaves ?? false,
    verificacaoTestesEquipamento: oldPhase2.verificacaoTestes ?? false, // renamed
    observacoes: oldPhase2.observacoes || '',
  };
}

/**
 * Maps old Phase 3 software string → SoftwareSelection object.
 * Best-effort: only brand is filled, sub-fields remain empty.
 */
function mapOldPhase3ToNew(oldPhase3: OldSevenPhaseData['phase3']): Phase3ProgramacaoData {
  const softwareValue = oldPhase3.software || '';
  const software: SoftwareSelection | null = softwareValue
    ? { brand: softwareValue }
    : null;

  return {
    software,
    identificacaoReferencia: oldPhase3.identificacaoReferencia || '',
    numeroLicenca: oldPhase3.numeroLicenca || '',
    verificacaoInicioProgramacao: oldPhase3.verificacaoInicioProgramacao ?? false,
    testeFinalEquipamentos: oldPhase3.testeFinalEquipamentos ?? false,
    notasProgramacao: oldPhase3.notasProgramacao || '',
  };
}

/**
 * Maps old Phase 4 (flat checklist + materialAdicional) → new Phase 4 (toggleable categories).
 * Sets `enabled: true` on all categories (preserves old behavior).
 * Maps `materialAdicional` → `equipamentoAdicionalMotivo`, sets `equipamentoAdicional: true`.
 */
function mapOldPhase4ToNew(oldPhase4: OldSevenPhaseData['phase4']): Phase4PreparacaoData {
  const checklist = oldPhase4.checklist;

  const mapCategory = (categoryKey: keyof typeof CHECKLIST_ITEMS_SEVEN, legacyItems?: Record<string, boolean>): ToggleableChecklistCategory => ({
    enabled: true,
    items: legacyItems ? mapChecklistItems(categoryKey, legacyItems) : initChecklistItems(categoryKey),
  });

  const mapCpaCategory = (legacyItems?: Record<string, boolean>, miniPcDetails?: string): ToggleableCpaChecklistCategory => ({
    enabled: true,
    items: legacyItems ? mapChecklistItems('cpa', legacyItems) : initChecklistItems('cpa'),
    miniPcDetails: miniPcDetails || '',
  });

  return {
    checklist: {
      pos: mapCategory('pos', checklist?.pos?.items),
      impressora: mapCategory('impressora', checklist?.impressora?.items),
      gavetaMetalica: mapCategory('gavetaMetalica', checklist?.gavetaMetalica?.items),
      cpa: mapCpaCategory(checklist?.cpa?.items, checklist?.cpa?.miniPcDetails),
      acessorios: mapCategory('acessorios', checklist?.acessorios?.items),
    },
    equipamentoAdicional: true,
    equipamentoAdicionalMotivo: oldPhase4.materialAdicional || '',
  };
}

/**
 * Maps old Phase 6 (no falhasDetectadas) → new Phase 6 (with falhasDetectadas).
 * Adds `falhasDetectadas: null` and `falhasDescricao: ''`.
 */
function mapOldPhase6ToNew(oldPhase6: OldSevenPhaseData['phase6']): Phase6TestesData {
  return {
    anydeskConfigurado: oldPhase6.anydeskConfigurado ?? null,
    anydeskCodigo: oldPhase6.anydeskCodigo || '',
    anydeskMotivo: oldPhase6.anydeskMotivo || '',
    vectronConnectConfigurado: oldPhase6.vectronConnectConfigurado ?? null,
    vectronConnectCodigo: oldPhase6.vectronConnectCodigo || '',
    vectronConnectMotivo: oldPhase6.vectronConnectMotivo || '',
    falhasDetectadas: null,
    falhasDescricao: '',
  };
}

/**
 * Maps legacy Phase 3 (Instalação no Cliente) → new Phase 5 (Instalação no Cliente).
 * Legacy phase3 has: nrFatura, nrGuiaTransportes, dates, times, training info
 */
function mapLegacyPhase3ToPhase5(legacyPhase3: Phase3Data | undefined): Phase5InstalacaoData {
  if (!legacyPhase3) {
    return {
      nrFatura: '',
      nrGuiaTransporte: '',
      dataInstalacao: '',
      tecnicoInstalacao: '',
      horaInicial: '',
      horaFinal: '',
      dataFormacao: '',
      formacaoHoraInicial: '',
      formacaoHoraFinal: '',
      quemRecebeuFormacao: '',
    };
  }

  return {
    nrFatura: legacyPhase3.nrFatura || '',
    nrGuiaTransporte: legacyPhase3.nrGuiaTransportes || '',
    dataInstalacao: legacyPhase3.dataInstalacao || '',
    tecnicoInstalacao: legacyPhase3.tecnicoFormacao || '',
    horaInicial: legacyPhase3.horaInicialInstalacao || '',
    horaFinal: legacyPhase3.horaFinalInstalacao || '',
    dataFormacao: legacyPhase3.dataFormacao || '',
    formacaoHoraInicial: legacyPhase3.horaInicialFormacao || '',
    formacaoHoraFinal: legacyPhase3.horaFinalFormacao || '',
    quemRecebeuFormacao: legacyPhase3.quemRecebeuFormacao || '',
  };
}

/**
 * Maps legacy Phase 4 (Testes) → new Phase 6 (Testes).
 * Legacy phase4 has: anydeskTestado, anydeskCodigo, vectronConnectTestado, etc.
 * Adds `falhasDetectadas: null` and `falhasDescricao: ''` (didn't exist before).
 */
function mapLegacyPhase4ToPhase6(legacyPhase4: Phase4Data | undefined): Phase6TestesData {
  if (!legacyPhase4) {
    return {
      anydeskConfigurado: null,
      anydeskCodigo: '',
      anydeskMotivo: '',
      vectronConnectConfigurado: null,
      vectronConnectCodigo: '',
      vectronConnectMotivo: '',
      falhasDetectadas: null,
      falhasDescricao: '',
    };
  }

  return {
    anydeskConfigurado: legacyPhase4.anydeskTestado ?? null,
    anydeskCodigo: legacyPhase4.anydeskCodigo || '',
    anydeskMotivo: legacyPhase4.anydeskMotivo || '',
    vectronConnectConfigurado: legacyPhase4.vectronConnectTestado ?? null,
    vectronConnectCodigo: legacyPhase4.vectronConnectCodigo || '',
    vectronConnectMotivo: legacyPhase4.vectronConnectMotivo || '',
    falhasDetectadas: null,
    falhasDescricao: '',
  };
}

/**
 * Maps legacy Phase 5 (Finalização) → new Phase 7 (Finalização).
 * Legacy phase5 has: dumpLido, copiaSeguranca, fotoInstalacao, fotoURL
 */
function mapLegacyPhase5ToPhase7(legacyPhase5: Phase5Data | undefined): Phase7FinalizacaoData {
  if (!legacyPhase5) {
    return {
      dumpLido: false,
      copiaSeguranca: false,
      fotosInstalacao: [],
    };
  }

  return {
    dumpLido: legacyPhase5.dumpLido ?? false,
    copiaSeguranca: legacyPhase5.copiaSeguranca ?? false,
    fotosInstalacao: legacyPhase5.fotoURL ? [legacyPhase5.fotoURL] : [],
  };
}

// ── Phase Status Derivation ─────────────────────────────────────────

/**
 * Derives the 7-phase phaseStatuses array from the legacy completedPhases array.
 *
 * Legacy mapping:
 *   legacy phase 1 → new phase 3
 *   legacy phase 2 → new phase 4
 *   legacy phase 3 → new phase 5
 *   legacy phase 4 → new phase 6
 *   legacy phase 5 → new phase 7
 *   new phases 1 and 2 have no legacy equivalent → mark as 'completed' (data was implicitly handled)
 *
 * Logic: If a legacy phase N was completed, its corresponding new phase is 'completed'.
 * New phases 1 & 2 are marked 'completed' since the legacy system didn't have them
 * (data was collected implicitly or not required).
 */
function deriveLegacyPhaseStatuses(completedPhases: number[]): PhaseStatus[] {
  const completedSet = new Set(completedPhases);

  // New phases 1 and 2 are always marked completed for legacy records
  // (they had no equivalent in the old system)
  const phase1Status: PhaseStatus = 'completed';
  const phase2Status: PhaseStatus = 'completed';

  // Legacy phase 1 → new phase 3
  const phase3Status: PhaseStatus = completedSet.has(1) ? 'completed' : 'not_started';
  // Legacy phase 2 → new phase 4
  const phase4Status: PhaseStatus = completedSet.has(2) ? 'completed' : 'not_started';
  // Legacy phase 3 → new phase 5
  const phase5Status: PhaseStatus = completedSet.has(3) ? 'completed' : 'not_started';
  // Legacy phase 4 → new phase 6
  const phase6Status: PhaseStatus = completedSet.has(4) ? 'completed' : 'not_started';
  // Legacy phase 5 → new phase 7
  const phase7Status: PhaseStatus = completedSet.has(5) ? 'completed' : 'not_started';

  // Mark the first non-completed phase as 'in_progress'
  const statuses: PhaseStatus[] = [
    phase1Status,
    phase2Status,
    phase3Status,
    phase4Status,
    phase5Status,
    phase6Status,
    phase7Status,
  ];

  const firstNotStartedIdx = statuses.findIndex((s) => s === 'not_started');
  if (firstNotStartedIdx !== -1) {
    statuses[firstNotStartedIdx] = 'in_progress';
  }

  return statuses;
}

/**
 * Derives the current active phase from legacy data.
 * Maps the legacy completedPhases to the new 7-phase system and finds
 * the first non-completed phase.
 */
function deriveLegacyCurrentPhase(completedPhases: number[]): number {
  const statuses = deriveLegacyPhaseStatuses(completedPhases);
  const idx = statuses.findIndex((s) => s !== 'completed');
  return idx === -1 ? 7 : idx + 1;
}

// ── Checklist Helpers ───────────────────────────────────────────────

/**
 * Creates a default Phase4PreparacaoData with all categories enabled and items false.
 */
function createDefaultPhase4(): Phase4PreparacaoData {
  return {
    checklist: {
      pos: { enabled: true, items: initChecklistItems('pos') },
      impressora: { enabled: true, items: initChecklistItems('impressora') },
      gavetaMetalica: { enabled: true, items: initChecklistItems('gavetaMetalica') },
      cpa: { enabled: true, items: initChecklistItems('cpa'), miniPcDetails: '' },
      acessorios: { enabled: true, items: initChecklistItems('acessorios') },
    },
    equipamentoAdicional: true,
    equipamentoAdicionalMotivo: '',
  };
}

/**
 * Initializes all checklist items for a category to false.
 */
function initChecklistItems(category: keyof typeof CHECKLIST_ITEMS_SEVEN): Record<string, boolean> {
  const items: Record<string, boolean> = {};
  for (const key of CHECKLIST_ITEMS_SEVEN[category]) {
    items[key] = false;
  }
  return items;
}

/**
 * Maps legacy checklist boolean values to the new checklist format.
 * Only carries over items that exist in both the legacy data and new schema.
 */
function mapChecklistItems(
  newCategory: keyof typeof CHECKLIST_ITEMS_SEVEN,
  legacyItems: Record<string, boolean> | undefined,
): Record<string, boolean> {
  const result = initChecklistItems(newCategory);

  if (!legacyItems) {
    return result;
  }

  // Carry over matching keys from legacy data
  for (const key of Object.keys(result)) {
    if (key in legacyItems) {
      result[key] = legacyItems[key] ?? false;
    }
  }

  return result;
}

// ── Main Adapter Function ───────────────────────────────────────────

/**
 * Adapts old installation data to the current 7-phase format at read time.
 *
 * Handles two legacy formats:
 *
 * 1. **Legacy 5-phase format** — identified by `completedPhases` array + no `phaseStatuses`.
 *    Mapping:
 *    - Legacy phase 1 (Programação) → New phase 3 (Programação / Preparação)
 *    - Legacy phase 2 (Material Instalado) → New phase 4 (Preparação Instalação checklist)
 *    - Legacy phase 3 (Instalação no Cliente) → New phase 5 (Instalação no Cliente)
 *    - Legacy phase 4 (Testes) → New phase 6 (Testes)
 *    - Legacy phase 5 (Finalização) → New phase 7 (Finalização)
 *    - New phases 1 (Setup) and 2 (Receção) have no legacy equivalent
 *
 * 2. **Old 7-phase format** (pre-refactor) — identified by `installationType` as string +
 *    `phaseStatuses` present + no `installationTypes` array.
 *    Transformations:
 *    - `installationType: string` → `installationTypes: [value]`
 *    - Old Phase2 fields → new Phase2RececaoData structure
 *    - `software: string` → `{ brand: software }` (SoftwareSelection)
 *    - Old Phase4 (materialAdicional + flat checklist) → toggleable categories
 *    - Old Phase6 (no falhasDetectadas) → adds `falhasDetectadas: null`, `falhasDescricao: ''`
 *
 * If data is already in the current format, it is returned unchanged.
 */
export function adaptLegacyData(data: unknown): InstallationSevenPhasesData {
  // Case 1: Legacy 5-phase format
  if (isLegacyFormat(data)) {
    return adaptFromFivePhaseFormat(data);
  }

  // Case 2: Old 7-phase format (pre-refactor)
  if (isOldSevenPhaseFormat(data)) {
    return adaptFromOldSevenPhaseFormat(data);
  }

  // Already in current format
  return data as InstallationSevenPhasesData;
}

/**
 * Adapts legacy 5-phase data to current 7-phase format.
 */
function adaptFromFivePhaseFormat(data: LegacyInstallationData): InstallationSevenPhasesData {
  const phaseStatuses = deriveLegacyPhaseStatuses(data.completedPhases);
  const currentPhase = deriveLegacyCurrentPhase(data.completedPhases);

  return {
    // Relation
    clientId: data.clientId || '',

    // Metadata
    technician: data.technician,
    installationEntries: [],

    // Phase data
    phase1: {},
    phase2: {
      equipamentoCliente: null,
      equipamentoClienteDescricao: '',
      verificacaoCabo: false,
      verificacaoTransformador: false,
      verificacaoFechadura: false,
      verificacaoChaves: false,
      verificacaoTestesEquipamento: false,
      observacoes: '',
    },
    phase3: mapLegacyPhase1ToPhase3(data.phase1),
    phase4: mapLegacyChecklistToPhase4(data.phase2),
    phase5: mapLegacyPhase3ToPhase5(data.phase3),
    phase6: mapLegacyPhase4ToPhase6(data.phase4),
    phase7: mapLegacyPhase5ToPhase7(data.phase5),

    // Workflow state
    phaseStatuses,
    currentPhase,
    status: data.isCompleted ? 'complete' : 'in_progress',
  };
}

/**
 * Adapts old 7-phase data (pre-refactor) to current format.
 * Detects old field names and maps them to new structures.
 */
function adaptFromOldSevenPhaseFormat(data: OldSevenPhaseData): InstallationSevenPhasesData {
  // Convert single installationType + equipment fields into an installationEntries array
  const installationEntries: InstallationEntry[] = data.installationType
    ? [{ tipo: data.installationType as InstallationType, marca: data.equipmentMarca || '', modelo: data.equipmentModelo || '', numeroSerie: data.equipmentNumeroSerie || '', fornecedor: data.equipmentFornecedor || '' }]
    : [];

  return {
    // Relation
    clientId: data.clientId || '',

    // Metadata
    technician: data.technician,
    installationEntries,

    // Phase data
    phase1: {},
    phase2: mapOldPhase2ToNew(data.phase2),
    phase3: mapOldPhase3ToNew(data.phase3),
    phase4: mapOldPhase4ToNew(data.phase4),
    phase5: data.phase5,
    phase6: mapOldPhase6ToNew(data.phase6),
    phase7: data.phase7,

    // Workflow state — preserved
    phaseStatuses: data.phaseStatuses,
    currentPhase: data.currentPhase,
    status: data.status,
  };
}

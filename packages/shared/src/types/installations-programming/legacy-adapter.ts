import type {
  InstallationSevenPhasesData,
  Phase3ProgramacaoData,
  Phase4PreparacaoData,
  Phase5InstalacaoData,
  Phase6TestesData,
  Phase7FinalizacaoData,
  PhaseStatus,
  EquipmentChecklist,
} from './types-seven-phases';
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

// ── Phase Mapping Functions ─────────────────────────────────────────

/**
 * Maps legacy Phase 1 (Programação) → new Phase 3 (Programação / Preparação).
 * Legacy phase1 has: tipoProgramacao, numeroSerie, numeroEquipamento, leiturasGuardadas, testeFinal
 */
function mapLegacyPhase1ToPhase3(legacyPhase1: Phase1Data | undefined): Phase3ProgramacaoData {
  if (!legacyPhase1) {
    return {
      software: '',
      identificacaoReferencia: '',
      numeroLicenca: '',
      verificacaoInicioProgramacao: false,
      testeFinalEquipamentos: false,
      notasProgramacao: '',
    };
  }

  return {
    software: legacyPhase1.tipoProgramacao || '',
    identificacaoReferencia: legacyPhase1.numeroEquipamento || '',
    numeroLicenca: legacyPhase1.numeroSerie || '',
    verificacaoInicioProgramacao: Boolean(legacyPhase1.leiturasGuardadas),
    testeFinalEquipamentos: legacyPhase1.testeFinal ?? false,
    notasProgramacao: '',
  };
}

/**
 * Maps legacy Phase 2 checklist → new Phase 4 EquipmentChecklist.
 * Legacy phase2 has: checklist (Record<string, Record<string, boolean>>)
 */
function mapLegacyChecklist(legacyPhase2: Phase2Data | undefined): EquipmentChecklist {
  const defaultChecklist = createDefaultChecklist();

  if (!legacyPhase2 || !legacyPhase2.checklist) {
    return defaultChecklist;
  }

  const legacy = legacyPhase2.checklist;

  return {
    pos: {
      items: mapChecklistItems('pos', legacy.pos),
    },
    impressora: {
      items: mapChecklistItems('impressora', legacy.displayCliente),
    },
    gavetaMetalica: {
      items: mapChecklistItems('gavetaMetalica', legacy.gavetaMetalica),
    },
    cpa: {
      items: mapChecklistItems('cpa', legacy.cpa),
      miniPcDetails: '',
    },
    acessorios: {
      items: mapChecklistItems('acessorios', legacy.acessorios),
    },
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
    };
  }

  return {
    anydeskConfigurado: legacyPhase4.anydeskTestado ?? null,
    anydeskCodigo: legacyPhase4.anydeskCodigo || '',
    anydeskMotivo: legacyPhase4.anydeskMotivo || '',
    vectronConnectConfigurado: legacyPhase4.vectronConnectTestado ?? null,
    vectronConnectCodigo: legacyPhase4.vectronConnectCodigo || '',
    vectronConnectMotivo: legacyPhase4.vectronConnectMotivo || '',
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
 * Creates a default EquipmentChecklist with all items set to false.
 */
function createDefaultChecklist(): EquipmentChecklist {
  return {
    pos: { items: initChecklistItems('pos') },
    impressora: { items: initChecklistItems('impressora') },
    gavetaMetalica: { items: initChecklistItems('gavetaMetalica') },
    cpa: { items: initChecklistItems('cpa'), miniPcDetails: '' },
    acessorios: { items: initChecklistItems('acessorios') },
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
 * Adapts legacy 5-phase installation data to the new 7-phase format at read time.
 *
 * Detection: A record is considered legacy if it has a `completedPhases` array
 * and no `phaseStatuses` array.
 *
 * Mapping:
 *   - Legacy phase 1 (Programação) → New phase 3 (Programação / Preparação)
 *   - Legacy phase 2 (Material Instalado) → New phase 4 (Preparação Instalação checklist)
 *   - Legacy phase 3 (Instalação no Cliente) → New phase 5 (Instalação no Cliente)
 *   - Legacy phase 4 (Testes) → New phase 6 (Testes)
 *   - Legacy phase 5 (Finalização) → New phase 7 (Finalização)
 *   - New phases 1 (Setup) and 2 (Receção) have no legacy equivalent
 *
 * If data is already in the new format, it is returned unchanged.
 */
export function adaptLegacyData(data: unknown): InstallationSevenPhasesData {
  if (!isLegacyFormat(data)) {
    return data as InstallationSevenPhasesData;
  }

  const phaseStatuses = deriveLegacyPhaseStatuses(data.completedPhases);
  const currentPhase = deriveLegacyCurrentPhase(data.completedPhases);

  return {
    // Relation
    clientId: data.clientId || '',

    // Metadata
    technician: data.technician,
    installationType: '' as InstallationSevenPhasesData['installationType'],

    // Equipment (Phase 1) — legacy didn't have these at top level
    equipmentMarca: '',
    equipmentModelo: '',
    equipmentNumeroSerie: '',
    equipmentFornecedor: '',

    // Phase data
    phase1: {},
    phase2: {
      equipamentoCliente: '',
      equipmentConditionOk: null,
      verificacaoCabo: false,
      verificacaoFechadura: false,
      verificacaoChaves: false,
      verificacaoTestes: false,
      observacoes: '',
    },
    phase3: mapLegacyPhase1ToPhase3(data.phase1),
    phase4: {
      materialAdicional: '',
      checklist: mapLegacyChecklist(data.phase2),
    } satisfies Phase4PreparacaoData,
    phase5: mapLegacyPhase3ToPhase5(data.phase3),
    phase6: mapLegacyPhase4ToPhase6(data.phase4),
    phase7: mapLegacyPhase5ToPhase7(data.phase5),

    // Workflow state
    phaseStatuses,
    currentPhase,
    status: data.isCompleted ? 'complete' : 'in_progress',
  };
}

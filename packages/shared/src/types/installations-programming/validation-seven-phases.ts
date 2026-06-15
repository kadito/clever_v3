import type {
  InstallationSevenPhasesData,
  InstallationStatus,
  PhaseStatus,
  ChecklistCategory,
  CpaChecklistCategory,
} from './types-seven-phases';

// ── Phase Completion Validation ─────────────────────────────────────

/**
 * Validates whether a given phase has all mandatory fields filled.
 * Returns true if the phase can be marked as completed.
 */
export function validatePhaseCompletion(
  phaseNumber: number,
  data: InstallationSevenPhasesData,
): boolean {
  switch (phaseNumber) {
    case 1:
      return validatePhase1(data);
    case 2:
      return validatePhase2(data);
    case 3:
      return validatePhase3(data);
    case 4:
      return validatePhase4(data);
    case 5:
      return validatePhase5(data);
    case 6:
      return validatePhase6(data);
    case 7:
      return validatePhase7(data);
    default:
      return false;
  }
}

// ── Derived State ───────────────────────────────────────────────────

/**
 * Derives the current active phase (1-indexed) from the phase statuses array.
 * Returns the first non-completed phase, or 7 if all are completed.
 */
export function deriveCurrentPhase(phaseStatuses: PhaseStatus[]): number {
  const idx = phaseStatuses.findIndex((s) => s !== 'completed');
  return idx === -1 ? 7 : idx + 1;
}

/**
 * Derives the overall installation status from the phase statuses array.
 * Returns 'complete' only when all 7 phases are completed.
 */
export function deriveInstallationStatus(phaseStatuses: PhaseStatus[]): InstallationStatus {
  return phaseStatuses.every((s) => s === 'completed') ? 'complete' : 'in_progress';
}

// ── Private Phase Validators ────────────────────────────────────────

/** Phase 1: clientId non-empty + installationType set + equipmentMarca non-empty */
function validatePhase1(data: InstallationSevenPhasesData): boolean {
  return (
    data.clientId.trim().length > 0 &&
    data.installationType.trim().length > 0 &&
    data.equipmentMarca.trim().length > 0
  );
}

/** Phase 2: equipmentConditionOk answered. If false → at least one verification field non-empty */
function validatePhase2(data: InstallationSevenPhasesData): boolean {
  const phase2 = data.phase2;

  // Must be answered (not null)
  if (phase2.equipmentConditionOk === null) {
    return false;
  }

  // If condition is OK, phase is valid
  if (phase2.equipmentConditionOk === true) {
    return true;
  }

  // If condition is NOT OK, at least one verification field must be checked
  return (
    phase2.verificacaoCabo === true ||
    phase2.verificacaoFechadura === true ||
    phase2.verificacaoChaves === true ||
    phase2.verificacaoTestes === true
  );
}

/** Phase 3: software non-empty + verificacaoInicioProgramacao = true + testeFinalEquipamentos = true */
function validatePhase3(data: InstallationSevenPhasesData): boolean {
  const phase3 = data.phase3;
  return (
    phase3.software.trim().length > 0 &&
    phase3.verificacaoInicioProgramacao === true &&
    phase3.testeFinalEquipamentos === true
  );
}

/** Phase 4: All checklist categories have at least one item checked */
function validatePhase4(data: InstallationSevenPhasesData): boolean {
  const checklist = data.phase4.checklist;
  return (
    hasAtLeastOneChecked(checklist.pos) &&
    hasAtLeastOneChecked(checklist.impressora) &&
    hasAtLeastOneChecked(checklist.gavetaMetalica) &&
    hasAtLeastOneChecked(checklist.cpa) &&
    hasAtLeastOneChecked(checklist.acessorios)
  );
}

/** Phase 5: dataInstalacao non-empty + horaInicial non-empty + horaFinal non-empty */
function validatePhase5(data: InstallationSevenPhasesData): boolean {
  const phase5 = data.phase5;
  return (
    phase5.dataInstalacao.trim().length > 0 &&
    phase5.horaInicial.trim().length > 0 &&
    phase5.horaFinal.trim().length > 0
  );
}

/** Phase 6: anydeskConfigurado answered + vectronConnectConfigurado answered. If true → code required. If false → motivo required */
function validatePhase6(data: InstallationSevenPhasesData): boolean {
  const phase6 = data.phase6;

  // Both must be answered (not null)
  if (phase6.anydeskConfigurado === null || phase6.vectronConnectConfigurado === null) {
    return false;
  }

  // Anydesk: if configured → code required, if not → motivo required
  const anydeskValid = phase6.anydeskConfigurado
    ? phase6.anydeskCodigo.trim().length > 0
    : phase6.anydeskMotivo.trim().length > 0;

  // Vectron Connect: if configured → code required, if not → motivo required
  const vectronValid = phase6.vectronConnectConfigurado
    ? phase6.vectronConnectCodigo.trim().length > 0
    : phase6.vectronConnectMotivo.trim().length > 0;

  return anydeskValid && vectronValid;
}

/** Phase 7: dumpLido = true + copiaSeguranca = true */
function validatePhase7(data: InstallationSevenPhasesData): boolean {
  const phase7 = data.phase7;
  return phase7.dumpLido === true && phase7.copiaSeguranca === true;
}

// ── Helpers ─────────────────────────────────────────────────────────

/** Checks if at least one item in a checklist category is checked (true) */
function hasAtLeastOneChecked(category: ChecklistCategory | CpaChecklistCategory): boolean {
  return Object.values(category.items).some((checked) => checked === true);
}

// ── Field-Level Validation Errors ───────────────────────────────────

/**
 * Returns a list of field names that are invalid for the given phase.
 * Used by the frontend to highlight fields with errors.
 */
export function getPhaseValidationErrors(
  phaseNumber: number,
  data: InstallationSevenPhasesData,
): string[] {
  switch (phaseNumber) {
    case 1:
      return getPhase1Errors(data);
    case 2:
      return getPhase2Errors(data);
    case 3:
      return getPhase3Errors(data);
    case 4:
      return getPhase4Errors(data);
    case 5:
      return getPhase5Errors(data);
    case 6:
      return getPhase6Errors(data);
    case 7:
      return getPhase7Errors(data);
    default:
      return [];
  }
}

function getPhase1Errors(data: InstallationSevenPhasesData): string[] {
  const errors: string[] = [];
  if (!data.clientId.trim()) errors.push('clientId');
  if (!data.installationType.trim()) errors.push('installationType');
  if (!data.equipmentMarca.trim()) errors.push('equipmentMarca');
  return errors;
}

function getPhase2Errors(data: InstallationSevenPhasesData): string[] {
  const errors: string[] = [];
  const phase2 = data.phase2;

  if (phase2.equipmentConditionOk === null) {
    errors.push('equipmentConditionOk');
  } else if (phase2.equipmentConditionOk === false) {
    const anyChecked =
      phase2.verificacaoCabo || phase2.verificacaoFechadura ||
      phase2.verificacaoChaves || phase2.verificacaoTestes;
    if (!anyChecked) {
      errors.push('verificacaoCabo', 'verificacaoFechadura', 'verificacaoChaves', 'verificacaoTestes');
    }
  }

  return errors;
}

function getPhase3Errors(data: InstallationSevenPhasesData): string[] {
  const errors: string[] = [];
  const phase3 = data.phase3;
  if (!phase3.software.trim()) errors.push('software');
  if (!phase3.verificacaoInicioProgramacao) errors.push('verificacaoInicioProgramacao');
  if (!phase3.testeFinalEquipamentos) errors.push('testeFinalEquipamentos');
  return errors;
}

function getPhase4Errors(data: InstallationSevenPhasesData): string[] {
  const errors: string[] = [];
  const checklist = data.phase4.checklist;
  if (!hasAtLeastOneChecked(checklist.pos)) errors.push('checklist.pos');
  if (!hasAtLeastOneChecked(checklist.impressora)) errors.push('checklist.impressora');
  if (!hasAtLeastOneChecked(checklist.gavetaMetalica)) errors.push('checklist.gavetaMetalica');
  if (!hasAtLeastOneChecked(checklist.cpa)) errors.push('checklist.cpa');
  if (!hasAtLeastOneChecked(checklist.acessorios)) errors.push('checklist.acessorios');
  return errors;
}

function getPhase5Errors(data: InstallationSevenPhasesData): string[] {
  const errors: string[] = [];
  const phase5 = data.phase5;
  if (!phase5.dataInstalacao.trim()) errors.push('dataInstalacao');
  if (!phase5.horaInicial.trim()) errors.push('horaInicial');
  if (!phase5.horaFinal.trim()) errors.push('horaFinal');
  return errors;
}

function getPhase6Errors(data: InstallationSevenPhasesData): string[] {
  const errors: string[] = [];
  const phase6 = data.phase6;

  if (phase6.anydeskConfigurado === null) {
    errors.push('anydeskConfigurado');
  } else if (phase6.anydeskConfigurado && !phase6.anydeskCodigo.trim()) {
    errors.push('anydeskCodigo');
  } else if (!phase6.anydeskConfigurado && !phase6.anydeskMotivo.trim()) {
    errors.push('anydeskMotivo');
  }

  if (phase6.vectronConnectConfigurado === null) {
    errors.push('vectronConnectConfigurado');
  } else if (phase6.vectronConnectConfigurado && !phase6.vectronConnectCodigo.trim()) {
    errors.push('vectronConnectCodigo');
  } else if (!phase6.vectronConnectConfigurado && !phase6.vectronConnectMotivo.trim()) {
    errors.push('vectronConnectMotivo');
  }

  return errors;
}

function getPhase7Errors(data: InstallationSevenPhasesData): string[] {
  const errors: string[] = [];
  const phase7 = data.phase7;
  if (!phase7.dumpLido) errors.push('dumpLido');
  if (!phase7.copiaSeguranca) errors.push('copiaSeguranca');
  return errors;
}

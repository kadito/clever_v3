import type {
  InstallationSevenPhasesData,
  InstallationStatus,
  PhaseStatus,
  ToggleableChecklistCategory,
  ToggleableCpaChecklistCategory,
} from './types-seven-phases';
import { validateSoftwareSelection } from './software-config';

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

/** Phase 1: clientId non-empty + at least one installation entry with tipo filled */
function validatePhase1(data: InstallationSevenPhasesData): boolean {
  return (
    data.clientId.trim().length > 0 &&
    data.installationEntries.length >= 1 &&
    data.installationEntries.every((entry) => entry.tipo.trim().length > 0)
  );
}

/**
 * Phase 2: equipamentoCliente does NOT block phase progression.
 * Only blocks when equipamentoCliente === true AND equipamentoClienteDescricao is empty.
 * Verification items are ALL optional — never block phase progression.
 */
function validatePhase2(data: InstallationSevenPhasesData): boolean {
  const phase2 = data.phase2;

  // If equipamentoCliente is true, description must be non-empty
  if (phase2.equipamentoCliente === true && phase2.equipamentoClienteDescricao.trim().length === 0) {
    return false;
  }

  // Otherwise always passes (verifications are optional, null equipamentoCliente does not block)
  return true;
}

/** Phase 3: software non-null + valid selection + verificacaoInicioProgramacao + testeFinalEquipamentos */
function validatePhase3(data: InstallationSevenPhasesData): boolean {
  const phase3 = data.phase3;
  return (
    phase3.software !== null &&
    validateSoftwareSelection(phase3.software) === true &&
    phase3.verificacaoInicioProgramacao === true &&
    phase3.testeFinalEquipamentos === true
  );
}

/**
 * Phase 4:
 * - Disabled categories (enabled === false) are IGNORED in validation
 * - Enabled categories must have at least one item checked
 * - If equipamentoAdicional === false → equipamentoAdicionalMotivo must be non-empty
 */
function validatePhase4(data: InstallationSevenPhasesData): boolean {
  const checklist = data.phase4.checklist;

  // Validate enabled categories — each must have at least one item checked
  const categories: (ToggleableChecklistCategory | ToggleableCpaChecklistCategory)[] = [
    checklist.pos,
    checklist.impressora,
    checklist.gavetaMetalica,
    checklist.cpa,
    checklist.acessorios,
  ];

  for (const category of categories) {
    if (category.enabled && !hasAtLeastOneChecked(category)) {
      return false;
    }
  }

  // Equipamento adicional: if false, motivo must be provided
  if (data.phase4.equipamentoAdicional === false && data.phase4.equipamentoAdicionalMotivo.trim().length === 0) {
    return false;
  }

  return true;
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

/**
 * Phase 6:
 * - falhasDetectadas must be answered (not null)
 * - If falhasDetectadas === true → falhasDescricao must be non-empty
 * - Existing anydesk/vectron logic unchanged
 */
function validatePhase6(data: InstallationSevenPhasesData): boolean {
  const phase6 = data.phase6;

  // Both anydesk and vectron must be answered (not null)
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

  // Falhas detectadas must be answered
  if (phase6.falhasDetectadas === null) {
    return false;
  }

  // If falhas detected, description required
  if (phase6.falhasDetectadas === true && phase6.falhasDescricao.trim().length === 0) {
    return false;
  }

  return anydeskValid && vectronValid;
}

/** Phase 7: dumpLido = true + copiaSeguranca = true */
function validatePhase7(data: InstallationSevenPhasesData): boolean {
  const phase7 = data.phase7;
  return phase7.dumpLido === true && phase7.copiaSeguranca === true;
}

// ── Helpers ─────────────────────────────────────────────────────────

/** Checks if at least one item in a checklist category is checked (true) */
function hasAtLeastOneChecked(category: ToggleableChecklistCategory | ToggleableCpaChecklistCategory): boolean {
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
  if (data.installationEntries.length === 0) errors.push('installationEntries');
  return errors;
}

function getPhase2Errors(data: InstallationSevenPhasesData): string[] {
  const errors: string[] = [];
  const phase2 = data.phase2;

  // Only error: equipamentoCliente is true but description is empty
  if (phase2.equipamentoCliente === true && !phase2.equipamentoClienteDescricao.trim()) {
    errors.push('equipamentoClienteDescricao');
  }

  return errors;
}

function getPhase3Errors(data: InstallationSevenPhasesData): string[] {
  const errors: string[] = [];
  const phase3 = data.phase3;
  if (phase3.software === null || !validateSoftwareSelection(phase3.software)) {
    errors.push('software');
  }
  if (!phase3.verificacaoInicioProgramacao) errors.push('verificacaoInicioProgramacao');
  if (!phase3.testeFinalEquipamentos) errors.push('testeFinalEquipamentos');
  return errors;
}

function getPhase4Errors(data: InstallationSevenPhasesData): string[] {
  const errors: string[] = [];
  const checklist = data.phase4.checklist;

  // Only validate enabled categories
  if (checklist.pos.enabled && !hasAtLeastOneChecked(checklist.pos)) errors.push('checklist.pos');
  if (checklist.impressora.enabled && !hasAtLeastOneChecked(checklist.impressora)) errors.push('checklist.impressora');
  if (checklist.gavetaMetalica.enabled && !hasAtLeastOneChecked(checklist.gavetaMetalica)) errors.push('checklist.gavetaMetalica');
  if (checklist.cpa.enabled && !hasAtLeastOneChecked(checklist.cpa)) errors.push('checklist.cpa');
  if (checklist.acessorios.enabled && !hasAtLeastOneChecked(checklist.acessorios)) errors.push('checklist.acessorios');

  // Equipamento adicional
  if (data.phase4.equipamentoAdicional === false && !data.phase4.equipamentoAdicionalMotivo.trim()) {
    errors.push('equipamentoAdicionalMotivo');
  }

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

  // Anydesk validation (unchanged logic)
  if (phase6.anydeskConfigurado === null) {
    errors.push('anydeskConfigurado');
  } else if (phase6.anydeskConfigurado && !phase6.anydeskCodigo.trim()) {
    errors.push('anydeskCodigo');
  } else if (!phase6.anydeskConfigurado && !phase6.anydeskMotivo.trim()) {
    errors.push('anydeskMotivo');
  }

  // Vectron Connect validation (unchanged logic)
  if (phase6.vectronConnectConfigurado === null) {
    errors.push('vectronConnectConfigurado');
  } else if (phase6.vectronConnectConfigurado && !phase6.vectronConnectCodigo.trim()) {
    errors.push('vectronConnectCodigo');
  } else if (!phase6.vectronConnectConfigurado && !phase6.vectronConnectMotivo.trim()) {
    errors.push('vectronConnectMotivo');
  }

  // Falhas detectadas validation
  if (phase6.falhasDetectadas === null) {
    errors.push('falhasDetectadas');
  } else if (phase6.falhasDetectadas === true && !phase6.falhasDescricao.trim()) {
    errors.push('falhasDescricao');
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

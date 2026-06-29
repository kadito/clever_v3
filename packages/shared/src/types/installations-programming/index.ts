// Export all types
export type {
  MaterialInstaladoData,
  Phase1Data,
  Phase2Data,
  Phase3Data,
  Phase4Data,
  Phase5Data,
  InstallationsProgrammingData,
  InstallationsProgramming,
  InstallationsProgrammingCreationData,
  InstallationsProgrammingUpdateData,
  InstallationsProgrammingDisplayData,
} from './types';

// Export constants
export {
  CHECKLIST_CATEGORIES,
  CHECKLIST_LABELS,
  CHECKLIST_CATEGORY_LABELS,
  PHASE_NAMES,
} from './types';

// Export validation
export { calculateCompletedPhases, calculateIsCompleted } from './validation';

// ── Seven Phases ────────────────────────────────────────────────────

// Export seven-phase types
export type {
  InstallationType,
  InstallationEntry,
  PhaseStatus,
  InstallationStatus,
  Phase1SetupData,
  Phase2RececaoData,
  Phase3ProgramacaoData,
  Phase4PreparacaoData,
  Phase5InstalacaoData,
  Phase6TestesData,
  Phase7FinalizacaoData,
  ToggleableChecklistCategory,
  ToggleableCpaChecklistCategory,
  InstallationSevenPhasesData,
  InstallationSevenPhases,
} from './types-seven-phases';

// Export seven-phase constants
export {
  PHASE_NAMES_SEVEN,
  CHECKLIST_ITEMS_SEVEN,
  CHECKLIST_LABELS_SEVEN,
  CHECKLIST_CATEGORY_LABELS_SEVEN,
  INSTALLATION_TYPES,
} from './types-seven-phases';

// Export seven-phase validation
export {
  validatePhaseCompletion,
  deriveCurrentPhase,
  deriveInstallationStatus,
  getPhaseValidationErrors,
} from './validation-seven-phases';

// Export legacy adapter
export { adaptLegacyData } from './legacy-adapter';

// Export software hierarchy config
export type { SoftwareHierarchy, SoftwareSelection } from './software-config';
export { SOFTWARE_HIERARCHY, validateSoftwareSelection } from './software-config';
